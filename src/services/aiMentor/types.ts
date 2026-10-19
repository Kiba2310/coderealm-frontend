export type MentorLanguage = 'python' | 'javascript' | 'csharp';
export type HintLevel = 1 | 2 | 3 | 4;
export type ModelProfile = 'standard' | 'compact';

/** Only public exercise data belongs here. Never spread an API exercise object. */
export interface MentorContext {
  language: MentorLanguage;
  exerciseTitle: string;
  exerciseDescription: string;
  studentCode: string;
  errorMessage?: string;
  /** Student-visible failures only; never hidden-test output. */
  failedTests?: readonly string[];
  concepts?: readonly string[];
  /** Authored public hints; never excerpts of reference solutions. */
  publicHints?: readonly string[];
  hintLevel: HintLevel;
}

export interface AICapabilities {
  webgpuSupported: boolean;
  adapterAvailable: boolean;
  secureContext: boolean;
  reason?: string;
  features?: readonly string[];
  limits?: { maxBufferSize: number; maxStorageBufferBindingSize: number };
}

export type MentorStatus = 'idle' | 'checking' | 'loading' | 'ready' | 'generating'
  | 'stopping' | 'unsupported' | 'error' | 'disposing';

export interface MentorSnapshot {
  status: MentorStatus;
  message: string;
  progress: number;
  response: string;
  source?: 'ai' | 'fallback';
  error?: string;
  modelId?: string;
  modelProfile?: ModelProfile;
  capabilities?: AICapabilities;
}

export interface MentorMessage { role: 'system' | 'user'; content: string }

/** Small port around WebLLM, allowing tests to substitute an engine without GPU work. */
export interface MentorEngine {
  modelId: string;
  stream(messages: MentorMessage[]): AsyncIterable<string>;
  interrupt(): void;
  unload(): Promise<void>;
  terminate(): void;
}

export interface EngineOptions {
  modelId?: string;
  profile: ModelProfile;
  capabilities: AICapabilities;
  signal: AbortSignal;
  onProgress(progress: number, message: string): void;
  onFatal(): void;
}

export interface AIMentorService {
  initialize(profile?: ModelProfile): Promise<void>;
  isReady(): boolean;
  generateHint(context: MentorContext): Promise<string>;
  cancelGeneration(): Promise<void>;
  clearResponse(): Promise<void>;
  dispose(): Promise<void>;
  getSnapshot(): MentorSnapshot;
  subscribe(listener: () => void): () => void;
}
