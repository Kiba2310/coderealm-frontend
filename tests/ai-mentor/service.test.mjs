import assert from 'node:assert/strict';
import { test } from 'node:test';
import { MentorService } from '../../src/services/aiMentor/service.ts';

const context = { language: 'python', exerciseTitle: 'Összegzés',
  exerciseDescription: 'Add össze a számokat!', studentCode: 'total = 0', hintLevel: 1 };
const caps = { webgpuSupported: true, adapterAvailable: true, secureContext: true, features: [] };
function deferred() {
  let resolve;
  const promise = new Promise(r => { resolve = r; });
  return { promise, resolve };
}
function setup(overrides = {}) {
  const calls = { initialized: 0, interrupted: 0, terminated: 0, unloaded: 0, messages: null };
  const engine = {
    modelId: 'mock-model',
    async *stream(messages) { calls.messages = messages; yield 'Gondold végig a bemenetet. '; yield 'Milyen kimenetet vársz?'; },
    interrupt() { calls.interrupted++; },
    terminate() { calls.terminated++; },
    async unload() { calls.unloaded++; },
    ...overrides.engine,
  };
  const service = new MentorService({
    detect: overrides.detect || (async () => caps),
    openEngine: async options => {
      calls.initialized++;
      options.onProgress(0.4, 'AI modell letöltése...');
      if (overrides.openEngine) return overrides.openEngine(options, engine);
      return engine;
    },
    cancellationTimeoutMs: 30,
    generationTimeoutMs: 500,
  });
  return { service, engine, calls };
}

test('unsupported devices receive fallback without loading WebLLM', async () => {
  const { service, calls } = setup({ detect: async () => ({ ...caps, webgpuSupported: false, adapterAvailable: false }) });
  await service.initialize();
  assert.equal(service.getSnapshot().status, 'unsupported');
  assert.equal(calls.initialized, 0);
  assert.ok(await service.generateHint(context));
  assert.equal(service.getSnapshot().source, 'fallback');
});

test('initialization succeeds once and shares duplicate initialization attempts', async () => {
  const gate = deferred();
  const { service, calls } = setup({ openEngine: async (_, engine) => { await gate.promise; return engine; } });
  const states = [];
  service.subscribe(() => states.push(service.getSnapshot().status));
  const first = service.initialize();
  const second = service.initialize();
  assert.equal(first, second);
  gate.resolve();
  await Promise.all([first, second]);
  await service.initialize();
  assert.equal(calls.initialized, 1);
  assert.equal(service.isReady(), true);
  assert.deepEqual(states, ['checking', 'loading', 'loading', 'ready']);
  await service.dispose();
});

test('initialization failure reports an error and keeps fallback available', async () => {
  const { service } = setup({ openEngine: async () => { throw Error('out of memory'); } });
  await assert.rejects(service.initialize());
  assert.equal(service.getSnapshot().status, 'error');
  assert.equal(service.isReady(), false);
  assert.ok(await service.generateHint(context));
  assert.equal(service.getSnapshot().source, 'fallback');
});

test('hints stream with actual context and return to ready', async () => {
  const { service, calls } = setup();
  await service.initialize();
  const responses = [];
  service.subscribe(() => responses.push(service.getSnapshot().response));
  const result = await service.generateHint({ ...context, hintLevel: 3 });
  assert.match(result, /Milyen kimenetet/);
  assert.ok(responses.some(text => text === 'Gondold végig a bemenetet.'));
  assert.equal(service.getSnapshot().status, 'ready');
  assert.match(calls.messages[1].content, /"hintLevel":3/);
  await service.dispose();
});

test('generation failure terminates the broken engine and returns fallback', async () => {
  const { service, calls } = setup({ engine: { async *stream() { throw Error('GPU lost'); } } });
  await service.initialize();
  assert.ok(await service.generateHint(context));
  assert.equal(service.getSnapshot().source, 'fallback');
  assert.equal(service.getSnapshot().status, 'error');
  assert.equal(calls.terminated, 1);
});

test('conflicting requests are rejected and cancellation waits for the active request', async () => {
  const gate = deferred();
  const { service, calls } = setup({ engine: {
    async *stream() { yield 'Első mondat. '; await gate.promise; yield 'Elavult válasz.'; },
  } });
  await service.initialize();
  const generation = service.generateHint(context);
  await assert.rejects(service.generateHint(context), /folyamatban/);
  const cancellation = service.cancelGeneration();
  assert.equal(service.getSnapshot().status, 'stopping');
  gate.resolve();
  await Promise.all([generation, cancellation]);
  assert.equal(calls.interrupted, 1);
  assert.equal(service.getSnapshot().status, 'ready');
  assert.equal(service.getSnapshot().response, '');
  await service.dispose();
});

test('stuck cancellation terminates the Worker and permits reinitialization', async () => {
  const gate = deferred();
  const { service, calls } = setup({ engine: { async *stream() { await gate.promise; yield 'Elavult.'; } } });
  await service.initialize();
  const generation = service.generateHint(context);
  await service.cancelGeneration();
  assert.equal(calls.terminated, 1);
  assert.equal(service.isReady(), false);
  gate.resolve();
  await generation;
  assert.equal(service.getSnapshot().response, '');
  await service.initialize();
  assert.equal(service.isReady(), true);
  await service.dispose();
});

test('obvious full-solution output is never published and becomes a fallback hint', async () => {
  const { service } = setup({ engine: { async *stream() { yield '```python\ndef solve():\n return 42\n```'; } } });
  await service.initialize();
  const seen = [];
  service.subscribe(() => seen.push(service.getSnapshot().response));
  await service.generateHint(context);
  assert.equal(service.getSnapshot().source, 'fallback');
  assert.ok(seen.every(text => !text.includes('def solve')));
  await service.dispose();
});

test('dispose aborts initialization and ignores late progress or engine completion', async () => {
  const gate = deferred();
  let report;
  const { service, calls } = setup({ openEngine: async (options, engine) => {
    report = options.onProgress; await gate.promise; return engine;
  } });
  const initialization = service.initialize();
  await new Promise(resolve => setImmediate(resolve));
  const disposal = service.dispose();
  gate.resolve();
  await Promise.all([initialization, disposal]);
  report(0.8, 'Elavult állapot');
  assert.equal(service.getSnapshot().status, 'idle');
  assert.equal(calls.terminated, 1);
  assert.equal(service.isReady(), false);
});

test('clearResponse removes the previous exercise hint while keeping the model loaded', async () => {
  const { service, calls } = setup();
  await service.initialize();
  await service.generateHint(context);
  await service.clearResponse();
  assert.equal(service.getSnapshot().response, '');
  assert.equal(service.isReady(), true);
  assert.equal(calls.initialized, 1);
  await service.dispose();
  assert.equal(calls.unloaded, 1);
  assert.equal(calls.terminated, 1);
});

test('a Worker crash during generation releases the engine and shows fallback', async () => {
  const gate = deferred();
  let crash;
  const { service, calls } = setup({
    openEngine: async (options, engine) => { crash = options.onFatal; return engine; },
    engine: { async *stream() { await gate.promise; throw Error('Worker died'); } },
  });
  await service.initialize();
  const generation = service.generateHint(context);
  crash();
  gate.resolve();
  assert.ok(await generation);
  assert.equal(calls.terminated, 1);
  assert.equal(service.getSnapshot().status, 'error');
  assert.equal(service.getSnapshot().source, 'fallback');
});

test('a generation timeout recovers with fallback and without leaving the request locked', async () => {
  const gate = deferred();
  const { engine, calls } = setup();
  engine.stream = async function* () { await gate.promise; yield 'Elavult.'; };
  const service = new MentorService({ detect: async () => caps, openEngine: async () => engine, generationTimeoutMs: 10 });
  await service.initialize();
  assert.ok(await service.generateHint(context));
  assert.equal(service.getSnapshot().status, 'error');
  assert.equal(calls.terminated, 1);
  gate.resolve();
  assert.ok(await service.generateHint({ ...context, hintLevel: 4 }));
  assert.equal(service.getSnapshot().source, 'fallback');
});

test('an idle service never initializes a model or probes GPU for fallback hints', async () => {
  let probes = 0;
  const { service, calls } = setup({ detect: async () => { probes++; return caps; } });
  await service.generateHint(context);
  assert.equal(probes, 0);
  assert.equal(calls.initialized, 0);
  assert.equal(service.getSnapshot().status, 'idle');
});

test('a loaded engine unloads before its lifetime signal is aborted', async () => {
  let signal;
  let unloaded = false;
  const { service } = setup({
    openEngine: async (options, engine) => { signal = options.signal; return engine; },
    engine: { async unload() { assert.equal(signal.aborted, false); unloaded = true; } },
  });
  await service.initialize();
  await service.dispose();
  assert.equal(unloaded, true);
  assert.equal(signal.aborted, true);
});

test('a synchronous interrupt error still clears the active request and releases resources', async () => {
  const gate = deferred();
  const { service, calls } = setup({ engine: {
    async *stream() { await gate.promise; yield 'Elavult.'; },
    interrupt() { throw Error('Worker unavailable'); },
  } });
  await service.initialize();
  const generation = service.generateHint(context);
  await service.cancelGeneration();
  gate.resolve();
  await generation;
  assert.equal(calls.terminated, 1);
  assert.equal(service.getSnapshot().status, 'idle');
});

test('compact activation propagates its profile and uses its own configured model', async () => {
  let received;
  const { engine } = setup();
  const service = new MentorService({ detect: async () => caps,
    modelId: 'configured-standard', compactModelId: 'configured-compact',
    openEngine: async options => { received = options; return engine; } });
  await service.initialize('compact');
  assert.equal(received.profile, 'compact');
  assert.equal(received.modelId, 'configured-compact');
  assert.equal(service.getSnapshot().modelProfile, 'compact');
  await service.dispose();
});

test('conflicting profile loads are rejected and switching requires explicit unload', async () => {
  const gate = deferred();
  const { service, calls } = setup({ openEngine: async (_, engine) => { await gate.promise; return engine; } });
  const initial = service.initialize('standard');
  await assert.rejects(service.initialize('compact'), /folyamatban/);
  assert.equal(calls.initialized, 1);
  gate.resolve();
  await initial;
  await assert.rejects(service.initialize('compact'), /kikapcsol/i);
  await service.dispose();
  await service.initialize('compact');
  assert.equal(calls.initialized, 2);
  assert.equal(service.getSnapshot().modelProfile, 'compact');
  await service.dispose();
});

test('memory failure does not silently download a second model and compact mode can be retried', async () => {
  const attempts = [];
  const { service, engine } = setup({ openEngine: async options => {
    attempts.push(options.profile);
    if (options.profile === 'standard') throw Error('out of memory');
    return engine;
  } });
  await assert.rejects(service.initialize('standard'));
  assert.deepEqual(attempts, ['standard']);
  assert.ok(await service.generateHint(context));
  await service.initialize('compact');
  assert.deepEqual(attempts, ['standard', 'compact']);
  assert.equal(service.isReady(), true);
  await service.dispose();
});
