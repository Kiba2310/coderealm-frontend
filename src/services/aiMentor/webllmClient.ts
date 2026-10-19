import { CreateWebWorkerMLCEngine, prebuiltAppConfig } from '@mlc-ai/web-llm';
import { selectModel } from './models.ts';
import { MAX_OUTPUT_TOKENS } from './prompt.ts';
import { withTimeout } from './capabilities.ts';
import type { EngineOptions, MentorEngine, MentorMessage } from './types.ts';

export async function openWebLLMEngine(options: EngineOptions): Promise<MentorEngine> {
  options.signal.throwIfAborted();
  const model = selectModel(prebuiltAppConfig.model_list, options.capabilities, options.modelId, options.profile);
  const worker = new Worker(new URL('./webllm.worker.ts', import.meta.url), { type: 'module' });
  let closed = false;
  let rejectFailure: (reason: Error) => void = () => {};
  const failure = new Promise<never>((_, reject) => { rejectFailure = reject; });
  // Keep idle Worker failure from becoming an unhandled rejection between calls.
  void failure.catch(() => {});
  const crash = () => {
    rejectFailure(new Error('Az AI háttérfolyamata megszakadt.'));
    options.onFatal();
    terminate();
  };
  const abort = () => terminate();
  const terminate = () => {
    if (closed) return;
    closed = true;
    worker.removeEventListener('error', crash);
    worker.removeEventListener('messageerror', crash);
    options.signal.removeEventListener('abort', abort);
    worker.terminate();
    rejectFailure(new Error('Az AI háttérfolyamata leállt.'));
  };
  worker.addEventListener('error', crash);
  worker.addEventListener('messageerror', crash);
  options.signal.addEventListener('abort', abort, { once: true });

  try {
    // prebuiltAppConfig retains WebLLM's supported Cache API backend. No custom cache.
    const engine = await withTimeout(Promise.race([
      CreateWebWorkerMLCEngine(worker, model.model_id, {
        appConfig: prebuiltAppConfig,
        logLevel: 'SILENT',
        initProgressCallback: report => {
          if (closed) return;
          const progress = Number.isFinite(report.progress) ? report.progress : 0;
          const downloading = /fetch|download|loading.*cache/i.test(report.text);
          options.onProgress(progress, downloading ? 'AI modell letöltése vagy betöltése a gyorsítótárból...' : 'AI modell inicializálása...');
        },
      }, { context_window_size: 4096 }),
      failure,
    ]), 10 * 60_000);
    options.signal.throwIfAborted();
    return {
      modelId: model.model_id,
      async *stream(messages: MentorMessage[]) {
        const chunks = await Promise.race([
          engine.chat.completions.create({ messages, stream: true, temperature: 0.3, max_tokens: MAX_OUTPUT_TOKENS }),
          failure,
        ]);
        const iterator = chunks[Symbol.asyncIterator]();
        try {
          while (!closed) {
            const next = await Promise.race([iterator.next(), failure]);
            if (next.done) return;
            yield next.value.choices[0]?.delta.content || '';
          }
        } finally {
          if (!closed && iterator.return) {
            await withTimeout(Promise.race([iterator.return(), failure]), 2_000);
          }
        }
      },
      interrupt: () => { if (!closed) engine.interruptGenerate(); },
      unload: () => closed ? Promise.resolve() : Promise.race([engine.unload(), failure]),
      terminate,
    };
  } catch (error) {
    terminate();
    throw error;
  }
}
