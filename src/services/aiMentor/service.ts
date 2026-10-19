import { detectAICapabilities, withTimeout } from './capabilities.ts';
import { fallbackHint } from './fallback.ts';
import { buildMentorMessages } from './prompt.ts';
import { guardResponse, streamableText } from './responseGuard.ts';
import type { AICapabilities, AIMentorService, EngineOptions, MentorContext, MentorEngine, MentorSnapshot, ModelProfile } from './types.ts';

interface Dependencies {
  detect?: () => Promise<AICapabilities>;
  openEngine?: (options: EngineOptions) => Promise<MentorEngine>;
  modelId?: string;
  compactModelId?: string;
  cancellationTimeoutMs?: number;
  generationTimeoutMs?: number;
}

export class MentorService implements AIMentorService {
  private snapshot: MentorSnapshot = {
    status: 'idle', message: 'Az AI kikapcsolva. A helyi tippek már használhatók.', progress: 0, response: '',
  };
  private listeners = new Set<() => void>();
  private engine?: MentorEngine;
  private controller?: AbortController;
  private initialization?: Promise<void>;
  private generation?: Promise<string>;
  private disposal?: Promise<void>;
  private active?: { cancelled: boolean };
  private dependencies: Dependencies;

  constructor(dependencies: Dependencies = {}) { this.dependencies = dependencies; }

  getSnapshot = (): MentorSnapshot => this.snapshot;
  subscribe = (listener: () => void): (() => void) => {
    this.listeners.add(listener);
    return () => { this.listeners.delete(listener); };
  };
  isReady = (): boolean => !!this.engine;

  private update(patch: Partial<MentorSnapshot>): void {
    this.snapshot = { ...this.snapshot, ...patch };
    for (const listener of this.listeners) listener();
  }

  initialize = (profile: ModelProfile = 'standard'): Promise<void> => {
    if (profile !== 'standard' && profile !== 'compact') return Promise.reject(new Error('Érvénytelen modellmód.'));
    if (this.disposal) return this.disposal.then(() => this.initialize(profile));
    if (this.initialization) {
      return this.snapshot.modelProfile === profile ? this.initialization
        : Promise.reject(new Error('Egy modell betöltése már folyamatban van.'));
    }
    if (this.engine) {
      return this.snapshot.modelProfile === profile ? Promise.resolve()
        : Promise.reject(new Error('Másik modell bekapcsolásához előbb az AI kikapcsolása szükséges.'));
    }
    const controller = new AbortController();
    this.controller = controller;
    this.update({ status: 'checking', message: 'GPU kompatibilitás ellenőrzése...',
      modelProfile: profile, progress: 0, error: undefined });
    const pending = this.load(controller, profile).finally(() => {
      if (this.initialization === pending) this.initialization = undefined;
    });
    this.initialization = pending;
    return pending;
  };

  private async load(controller: AbortController, profile: ModelProfile): Promise<void> {
    const current = () => !controller.signal.aborted && this.controller === controller;
    try {
      const capabilities = await (this.dependencies.detect || detectAICapabilities)();
      if (!current()) return;
      if (!capabilities.adapterAvailable || !capabilities.secureContext) {
        this.update({ capabilities, status: 'unsupported', message: 'Az AI nem támogatott ezen az eszközön.',
          error: capabilities.reason, progress: 0 });
        return;
      }
      this.update({ capabilities, status: 'loading', message: 'AI modell inicializálása...' });
      // Importing the service or requesting fallback hints never loads WebLLM.
      const open = this.dependencies.openEngine || (await import('./webllmClient.ts')).openWebLLMEngine;
      if (!current()) return;
      const engine = await open({
        capabilities, profile,
        modelId: profile === 'compact' ? this.dependencies.compactModelId : this.dependencies.modelId,
        signal: controller.signal,
        onProgress: (progress, message) => {
          if (current()) this.update({ progress: Math.min(1, Math.max(0, progress)), message });
        },
        onFatal: () => {
          if (!current()) return;
          if (this.active) this.active.cancelled = true;
          this.engine?.terminate();
          this.engine = undefined;
          controller.abort();
          this.update({ status: 'error', response: '', source: undefined,
            message: 'Az AI kapcsolata megszakadt. A helyi tippek használhatók.',
            error: 'Indítsd újra az AI mentort, vagy használj helyi tippet.' });
        },
      });
      if (!current()) { engine.terminate(); return; }
      this.engine = engine;
      this.update({ status: 'ready', modelId: engine.modelId, progress: 1,
        message: 'AI mentor készen áll.', error: undefined });
    } catch {
      if (!current()) return;
      controller.abort();
      const message = profile === 'standard'
        ? 'Az AI modell betöltése nem sikerült. Ellenőrizd a hálózatot és a szabad memóriát, vagy próbáld a kisebb modellt. Helyi tipp is kérhető.'
        : 'A kisebb AI modell betöltése nem sikerült. Ellenőrizd a hálózatot és a szabad memóriát, vagy kérj helyi tippet.';
      this.update({ status: 'error', message, error: message, progress: 0 });
      throw new Error(message);
    }
  }

  generateHint = (context: MentorContext): Promise<string> => {
    if (this.generation || this.initialization || this.disposal) {
      return Promise.reject(new Error('Egy AI művelet már folyamatban van.'));
    }
    if (![1, 2, 3, 4].includes(context.hintLevel) || !['python', 'javascript', 'csharp'].includes(context.language)) {
      return Promise.reject(new Error('Érvénytelen nyelv vagy segítségszint.'));
    }
    if (!this.engine) {
      const response = fallbackHint(context);
      this.update({ response, source: 'fallback' });
      return Promise.resolve(response);
    }
    const active = { cancelled: false };
    const engine = this.engine;
    this.active = active;
    this.update({ status: 'generating', message: 'A mentor gondolkodik...', response: '', source: 'ai', error: undefined });
    const pending = this.generate(engine, context, active).finally(() => {
      if (this.generation === pending) this.generation = undefined;
      if (this.active === active) this.active = undefined;
    });
    this.generation = pending;
    return pending;
  };

  private async generate(engine: MentorEngine, context: MentorContext, active: { cancelled: boolean }): Promise<string> {
    const current = () => this.active === active && !active.cancelled;
    const fallback = fallbackHint(context);
    const collect = async () => {
      let text = '';
      for await (const delta of engine.stream(buildMentorMessages(context))) {
        if (!current()) return '';
        text += delta;
        if (text.trim() && !guardResponse(text).allowed) {
          engine.interrupt();
          this.update({ response: fallback, source: 'fallback' });
          return fallback;
        }
        const visible = streamableText(text);
        if (visible) this.update({ response: visible });
      }
      if (!current()) return '';
      const valid = guardResponse(text).allowed;
      const response = valid ? text.trim() : fallback;
      this.update({ response, source: valid ? 'ai' : 'fallback' });
      return response;
    };
    try {
      const result = await withTimeout(collect(), this.dependencies.generationTimeoutMs ?? 120_000);
      if (current()) this.update({ status: 'ready', message: 'AI mentor készen áll.' });
      return result;
    } catch {
      if (!current()) {
        if (this.active === active && this.snapshot.status === 'error') {
          this.update({ response: fallback, source: 'fallback' });
          return fallback;
        }
        return '';
      }
      engine.terminate();
      this.engine = undefined;
      this.controller?.abort();
      this.update({ status: 'error', response: fallback, source: 'fallback',
        message: 'Az AI válasza nem készült el. Helyi tippet mutatunk.',
        error: 'Próbáld újra bekapcsolni az AI mentort. Kevés memória esetén zárj be más lapokat.' });
      return fallback;
    }
  }

  cancelGeneration = async (): Promise<void> => {
    const active = this.active;
    const generation = this.generation;
    if (!active || !generation) return;
    active.cancelled = true;
    this.update({ status: 'stopping', message: 'Válasz leállítása...' });
    try {
      this.engine?.interrupt();
      await withTimeout(generation, this.dependencies.cancellationTimeoutMs ?? 2_000);
    } catch {
      this.engine?.terminate();
      this.engine = undefined;
      this.controller?.abort();
      if (this.generation === generation) this.generation = undefined;
      if (this.active === active) this.active = undefined;
    }
    if (!this.disposal && this.snapshot.status === 'stopping') {
      this.update({ status: this.engine ? 'ready' : 'idle', response: '', source: undefined,
        message: this.engine ? 'A válasz leállítva. Új tippet kérhetsz.' : 'A válasz leállítva. Az AI újra bekapcsolható.' });
    }
  };

  clearResponse = async (): Promise<void> => {
    await this.cancelGeneration();
    this.update({ response: '', source: undefined });
  };

  dispose = (): Promise<void> => {
    if (this.disposal) return this.disposal;
    const controller = this.controller;
    // Abort an in-flight load immediately; a ready engine gets graceful unload first.
    if (!this.engine) controller?.abort();
    if (this.active) this.active.cancelled = true;
    const engine = this.engine;
    this.engine = undefined;
    this.update({ status: 'disposing', message: 'AI mentor kikapcsolása...' });
    const pending = (async () => {
      try {
        engine?.interrupt();
        if (engine) await withTimeout(engine.unload(), 2_000);
      } catch {
        // Worker termination below also releases resources if graceful unload fails.
      } finally {
        engine?.terminate();
        controller?.abort();
        this.generation = undefined;
        this.active = undefined;
        this.initialization = undefined;
        this.update({ status: 'idle', message: 'Az AI kikapcsolva. A helyi tippek használhatók.',
          progress: 0, response: '', error: undefined, source: undefined, modelId: undefined, modelProfile: undefined });
      }
    })().finally(() => { if (this.disposal === pending) this.disposal = undefined; });
    this.disposal = pending;
    return pending;
  };
}
