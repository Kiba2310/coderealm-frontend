import { WebWorkerMLCEngineHandler } from '@mlc-ai/web-llm';

// Official integration: inference and GPU work stay inside this dedicated Worker.
// https://webllm.mlc.ai/docs/user/advanced_usage.html#using-web-workers
const handler = new WebWorkerMLCEngineHandler();
self.onmessage = (event: MessageEvent) => { handler.onmessage(event); };
