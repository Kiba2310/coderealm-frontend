import assert from 'node:assert/strict';
import { test } from 'node:test';
import { detectAICapabilities } from '../../src/services/aiMentor/capabilities.ts';
import { buildMentorMessages, MAX_PROMPT_BYTES } from '../../src/services/aiMentor/prompt.ts';
import { fallbackHint } from '../../src/services/aiMentor/fallback.ts';
import { guardResponse, streamableText } from '../../src/services/aiMentor/responseGuard.ts';
import { selectModel } from '../../src/services/aiMentor/models.ts';
import { lessonMentorContext, mentorLanguage } from '../../src/services/aiMentor/lessonContext.ts';

const context = { language: 'python', exerciseTitle: 'Összegzés',
  exerciseDescription: 'Add össze a számokat!', studentCode: 'total = 0', hintLevel: 1 };

test('unsupported WebGPU and insecure contexts do not request an adapter', async () => {
  assert.equal((await detectAICapabilities({ secureContext: true })).webgpuSupported, false);
  let requested = false;
  const result = await detectAICapabilities({ secureContext: false, gpu: {
    requestAdapter: async () => { requested = true; return null; },
  } });
  assert.equal(result.adapterAvailable, false);
  assert.equal(requested, false);
});

test('unavailable and failing adapters return structured reasons', async () => {
  for (const requestAdapter of [async () => null, async () => { throw Error('driver'); }]) {
    const result = await detectAICapabilities({ secureContext: true, gpu: { requestAdapter } });
    assert.equal(result.webgpuSupported, true);
    assert.equal(result.adapterAvailable, false);
    assert.ok(result.reason);
  }
});

test('successful capability probe exposes limits without creating a GPU device', async () => {
  const result = await detectAICapabilities({ secureContext: true, gpu: { requestAdapter: async () => ({
    features: new Set(['shader-f16']),
    limits: { maxBufferSize: 1_000_000_000, maxStorageBufferBindingSize: 134_217_728 },
  }) } });
  assert.equal(result.adapterAvailable, true);
  assert.deepEqual(result.features, ['shader-f16']);
  assert.equal(result.limits.maxStorageBufferBindingSize, 134_217_728);
});

test('fallback prioritizes authored public hints, then observed failures, then language guidance', () => {
  assert.equal(fallbackHint({ ...context, publicHints: ['Gondold végig a bemenetet.'] }), 'Gondold végig a bemenetet.');
  assert.match(fallbackHint({ ...context, errorMessage: 'SyntaxError' }), /hibaüzenet/i);
  assert.match(fallbackHint({ ...context, failedTests: ['Nyilvános példa'] }), /teszt/i);
  for (const language of ['python', 'javascript', 'csharp']) {
    assert.ok(fallbackHint({ ...context, language }).length > 20);
  }
  assert.match(fallbackHint({ ...context, studentCode: '', exerciseDescription: '' }), /bemenet|kimenet/i);
});

test('all four levels produce distinct hints and select corresponding public hints', () => {
  assert.equal(new Set([1, 2, 3, 4].map(hintLevel => fallbackHint({ ...context, hintLevel }))).size, 4);
  assert.equal(fallbackHint({ ...context, hintLevel: 2, publicHints: ['egy', 'kettő'] }), 'kettő');
  assert.match(buildMentorMessages({ ...context, hintLevel: 4 })[1].content, /"hintLevel":4/);
});

test('prompts whitelist and bound public data, including Unicode and JSON escaping', () => {
  for (const text of ['á'.repeat(30_000), '🧑'.repeat(30_000), '\n"\\'.repeat(30_000)]) {
    const messages = buildMentorMessages({ ...context, studentCode: text, exerciseDescription: text,
      hiddenTests: ['PRIVATE_TEST'], referenceSolution: 'PRIVATE_SOLUTION', credentials: 'PRIVATE_KEY' });
    const serialized = JSON.stringify(messages);
    assert.ok(new TextEncoder().encode(serialized).length <= MAX_PROMPT_BYTES);
    assert.doesNotMatch(serialized, /PRIVATE_TEST|PRIVATE_SOLUTION|PRIVATE_KEY/);
    assert.match(messages[0].content, /magyar/i);
    assert.match(messages[0].content, /nem megbízható/i);
  }
});

test('common embedded credentials are redacted from the prompt', () => {
  assert.doesNotMatch(JSON.stringify(buildMentorMessages({ ...context,
    studentCode: 'api_key = "SENSITIVE_KEY"\npassword = "SENSITIVE_PASSWORD"',
  })), /SENSITIVE_KEY|SENSITIVE_PASSWORD/);
});

test('every prompt field stays bounded even with heavily escaped untrusted text', () => {
  const text = '\u0000'.repeat(10_000);
  const messages = buildMentorMessages({ ...context, exerciseTitle: text, exerciseDescription: text,
    studentCode: text, errorMessage: text, concepts: [text, text, text], failedTests: [text, text] });
  assert.ok(new TextEncoder().encode(JSON.stringify(messages)).length <= MAX_PROMPT_BYTES);
});

test('guard rejects complete functions and fenced solutions but allows conceptual hints', () => {
  for (const text of ['```python\ndef solve():\n return 42\n```', 'function solve() { return 42; }',
    'public static int Solve() { return 42; }', 'def solve():\n    return 42', '']) {
    assert.equal(guardResponse(text).allowed, false, text);
  }
  assert.equal(guardResponse('Milyen kezdőértékkel indul az összegző változód?').allowed, true);
  assert.equal(streamableText('Ellenőrizd a bemenetet. Egy befejezetlen rész'), 'Ellenőrizd a bemenetet.');
  assert.equal(streamableText('```py'), '');
});

test('model selection checks the official list, override, features, and buffer limits', () => {
  const qwen = { model_id: 'Qwen2.5-1.5B-Instruct-q4f32_1-MLC' };
  const llama = { model_id: 'Llama-3.2-1B-Instruct-q4f32_1-MLC' };
  const caps = { webgpuSupported: true, adapterAvailable: true, secureContext: true, features: [] };
  assert.equal(selectModel([llama, qwen], caps).model_id, qwen.model_id);
  assert.equal(selectModel([llama], caps).model_id, llama.model_id);
  assert.throws(() => selectModel([qwen], caps, 'invented-model'));
  assert.throws(() => selectModel([], caps));
  assert.throws(() => selectModel([{ model_id: 'custom-f16', required_features: ['shader-f16'] }], caps, 'custom-f16'));
  assert.throws(() => selectModel([{ ...qwen, buffer_size_required_bytes: 256 }],
    { ...caps, limits: { maxBufferSize: 512, maxStorageBufferBindingSize: 128 } }));
});

test('actual lesson projection excludes solution and hidden tests and drops stale run failures', () => {
  const lesson = { title: 'Publikus lecke', description: 'Leírás', language: 'c#',
    solution_code: 'PRIVATE_SOLUTION', test_code: 'PRIVATE_TEST' };
  const projected = lessonMentorContext(lesson, 'current', { code: 'old', message: 'STALE_ERROR' });
  assert.equal(projected.language, 'csharp');
  assert.equal(projected.errorMessage, undefined);
  assert.doesNotMatch(JSON.stringify(projected), /PRIVATE_|STALE_ERROR/);
  assert.equal(lessonMentorContext(lesson, 'current', { code: 'current', message: 'Compile error' }).errorMessage, 'Compile error');
  assert.equal(mentorLanguage('go'), undefined);
  assert.equal(mentorLanguage('python3'), 'python');
  assert.equal(mentorLanguage('js'), 'javascript');
});

test('an adapter with shader-f16 prefers the lower-memory standard variant', () => {
  const f16 = { model_id: 'Qwen2.5-1.5B-Instruct-q4f16_1-MLC' };
  const f32 = { model_id: 'Qwen2.5-1.5B-Instruct-q4f32_1-MLC' };
  const capabilities = { webgpuSupported: true, adapterAvailable: true, secureContext: true, features: ['shader-f16'] };
  assert.equal(selectModel([f32, f16], capabilities).model_id, f16.model_id);
  assert.equal(selectModel([f16, f32], { ...capabilities, features: [] }).model_id, f32.model_id);
});

test('compact mode selects a supported 0.5B model without assuming dedicated GPU memory', () => {
  const standard = { model_id: 'Qwen2.5-1.5B-Instruct-q4f32_1-MLC' };
  const compact = { model_id: 'Qwen2.5-Coder-0.5B-Instruct-q4f32_1-MLC' };
  const capabilities = { webgpuSupported: true, adapterAvailable: true, secureContext: true, features: [],
    limits: { maxBufferSize: 268_435_456, maxStorageBufferBindingSize: 134_217_728 } };
  assert.equal(selectModel([standard, compact], capabilities, undefined, 'compact').model_id, compact.model_id);
  // These limits describe individual buffers, not total RAM/VRAM or GPU type.
  assert.equal(selectModel([standard], capabilities).model_id, standard.model_id);
});

test('compact mode also honors shader features and validates its explicit override', () => {
  const compact = { model_id: 'Qwen2.5-Coder-0.5B-Instruct-q4f16_1-MLC' };
  const tiny = { model_id: 'SmolLM2-360M-Instruct-q4f32_1-MLC' };
  const capabilities = { webgpuSupported: true, adapterAvailable: true, secureContext: true, features: [] };
  assert.equal(selectModel([compact, tiny], capabilities, undefined, 'compact').model_id, tiny.model_id);
  assert.equal(selectModel([compact, tiny], { ...capabilities, features: ['shader-f16'] }, undefined, 'compact').model_id, compact.model_id);
  assert.throws(() => selectModel([compact], capabilities, 'not-an-official-model', 'compact'));
});
