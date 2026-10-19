import type { AICapabilities } from './types.ts';

interface GPUProbe {
  requestAdapter(): Promise<{
    features: Iterable<string>;
    limits: { maxBufferSize: number; maxStorageBufferBindingSize: number };
  } | null>;
}

export interface CapabilityEnvironment { secureContext: boolean; gpu?: GPUProbe }

export async function withTimeout<T>(work: Promise<T>, milliseconds: number): Promise<T> {
  let timer: ReturnType<typeof setTimeout> | undefined;
  try {
    return await Promise.race([work, new Promise<never>((_, reject) => {
      timer = setTimeout(() => reject(new Error('A művelet időtúllépés miatt leállt.')), milliseconds);
    })]);
  } finally {
    clearTimeout(timer);
  }
}

/** Probes an adapter only; creates no device, Worker, engine, or model download. */
export async function detectAICapabilities(
  environment: CapabilityEnvironment = {
    secureContext: globalThis.isSecureContext === true,
    gpu: typeof navigator === 'undefined' ? undefined :
      (navigator as Navigator & { gpu?: GPUProbe }).gpu,
  },
): Promise<AICapabilities> {
  const result: AICapabilities = {
    secureContext: environment.secureContext,
    webgpuSupported: !!environment.gpu,
    adapterAvailable: false,
  };
  if (!environment.secureContext) {
    return { ...result, reason: 'Az AI használatához HTTPS vagy localhost szükséges.' };
  }
  if (!environment.gpu) {
    return { ...result, reason: 'Ez a böngésző nem biztosít WebGPU-t. A helyi tippek továbbra is használhatók.' };
  }
  try {
    const adapter = await withTimeout(environment.gpu.requestAdapter(), 10_000);
    if (!adapter) return { ...result, reason: 'Nem érhető el használható GPU-adapter.' };
    return {
      ...result, adapterAvailable: true,
      features: Array.from(adapter.features),
      limits: {
        maxBufferSize: adapter.limits.maxBufferSize,
        maxStorageBufferBindingSize: adapter.limits.maxStorageBufferBindingSize,
      },
    };
  } catch {
    return { ...result, reason: 'A GPU ellenőrzése sikertelen. Próbáld újra, vagy használd a helyi tippeket.' };
  }
}
