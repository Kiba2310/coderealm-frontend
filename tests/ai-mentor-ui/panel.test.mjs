import assert from 'node:assert/strict';
import { after, test } from 'node:test';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { createServer } from 'vite';
import { MentorService } from '../../src/services/aiMentor/service.ts';

// Reuse the installed Vite TSX compiler; no extra test runner or model download.
const server = await createServer({ server: { middlewareMode: true }, appType: 'custom' });
after(() => server.close());
const { default: AIMentorPanel } = await server.ssrLoadModule('/src/components/Editor/AIMentorPanel.tsx');
const context = { language: 'python', exerciseTitle: 'Összegzés', exerciseDescription: 'Add össze!', studentCode: 'n = 0' };
const capabilities = { webgpuSupported: true, adapterAvailable: true, secureContext: true };
const render = service => renderToStaticMarkup(React.createElement(AIMentorPanel, { exerciseId: 'lesson-1', context, service }));
const button = (html, label) => (html.match(/<button\b[\s\S]*?<\/button>/g) || []).find(markup => markup.includes(label));

test('activation is optional and fallback help remains enabled without WebGPU', async () => {
  const service = new MentorService({ detect: async () => ({ ...capabilities, webgpuSupported: false, adapterAvailable: false }) });
  assert.match(render(service), /AI mentor bekapcsolása/);
  assert.match(render(service), /Kisebb modell bekapcsolása/);
  assert.doesNotMatch(button(render(service), 'Segítséget kérek'), /disabled/);
  await service.initialize();
  await service.generateHint({ ...context, hintLevel: 1 });
  const html = render(service);
  assert.match(html, /Az AI nem támogatott/);
  assert.match(html, /Helyi, előre meghatározott tipp/);
  assert.doesNotMatch(button(html, 'Segítséget kérek'), /disabled/);
});

test('checking/loading states show progress and prevent duplicate generation', async () => {
  let finish;
  const gate = new Promise(resolve => { finish = resolve; });
  const engine = { modelId: 'mock', async *stream() {}, interrupt() {}, async unload() {}, terminate() {} };
  const service = new MentorService({ detect: async () => capabilities, openEngine: async options => {
    options.onProgress(0.42, 'AI modell letöltése...'); await gate; return engine;
  } });
  const activation = service.initialize();
  assert.match(render(service), /GPU kompatibilitás ellenőrzése/);
  await new Promise(resolve => setImmediate(resolve));
  const html = render(service);
  assert.match(html, /AI modell letöltése/);
  assert.match(html, /42%/);
  assert.match(button(html, 'Segítséget kérek'), /disabled/);
  finish();
  await activation;
  assert.match(render(service), /AI mentor készen áll/);
  await service.dispose();
});

test('generating state offers cancellation and renders text as text, never HTML', async () => {
  let finish;
  const gate = new Promise(resolve => { finish = resolve; });
  const service = new MentorService({ detect: async () => capabilities, openEngine: async () => ({
    modelId: 'mock', async *stream() { yield '<script>example</script> Mi a bemenet?'; await gate; },
    interrupt() { finish(); }, async unload() {}, terminate() {},
  }) });
  await service.initialize();
  const generation = service.generateHint({ ...context, hintLevel: 2 });
  await new Promise(resolve => setImmediate(resolve));
  const html = render(service);
  assert.match(html, /Válasz leállítása/);
  assert.match(button(html, 'Segítséget kérek'), /disabled/);
  assert.match(html, /&lt;script&gt;/);
  assert.doesNotMatch(html, /<script>/);
  await service.cancelGeneration();
  await generation;
  assert.doesNotMatch(button(render(service), 'Segítséget kérek'), /disabled/);
  await service.dispose();
});

test('initialization failure displays Hungarian recovery guidance and preserves fallback', async () => {
  const service = new MentorService({ detect: async () => capabilities,
    openEngine: async () => { throw Error('GPU allocation failed'); } });
  await assert.rejects(service.initialize());
  const html = render(service);
  assert.match(html, /betöltése nem sikerült/);
  assert.doesNotMatch(html, /GPU allocation failed/);
  assert.doesNotMatch(button(html, 'Segítséget kérek'), /disabled/);
  assert.match(html, /1 – Fogalmi irány/);
});

test('compact activation is visible and changing the loaded model requires switching it off', async () => {
  const service = new MentorService({ detect: async () => capabilities, openEngine: async () => ({
    modelId: 'mock-compact', async *stream() {}, interrupt() {}, async unload() {}, terminate() {},
  }) });
  await service.initialize('compact');
  const html = render(service);
  assert.match(html, /Kisebb memóriaigényű AI modell aktív/);
  assert.ok(button(html, 'AI mentor kikapcsolása'));
  assert.equal(button(html, 'Kisebb modell bekapcsolása'), undefined);
  await service.dispose();
  assert.ok(button(render(service), 'Kisebb modell bekapcsolása'));
});
