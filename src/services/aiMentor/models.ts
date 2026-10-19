import type { AICapabilities, ModelProfile } from './types.ts';

interface ModelCandidate {
  model_id: string;
  required_features?: readonly string[];
  buffer_size_required_bytes?: number;
}

// Candidates verified in the official v0.2.86 config. Selection still checks the
// installed prebuiltAppConfig.model_list at runtime; these IDs are never assumed.
const compactModels = [
  'Qwen2.5-Coder-0.5B-Instruct-q4f16_1-MLC',
  'Qwen2.5-Coder-0.5B-Instruct-q4f32_1-MLC',
  'SmolLM2-360M-Instruct-q4f16_1-MLC',
  'SmolLM2-360M-Instruct-q4f32_1-MLC',
];
const preferredModels = [
  'Qwen2.5-1.5B-Instruct-q4f16_1-MLC',
  'Qwen2.5-1.5B-Instruct-q4f32_1-MLC',
  'Llama-3.2-1B-Instruct-q4f16_1-MLC',
  'Llama-3.2-1B-Instruct-q4f32_1-MLC',
  ...compactModels,
];

export function selectModel<T extends ModelCandidate>(
  models: readonly T[], capabilities: AICapabilities, configuredId?: string,
  profile: ModelProfile = 'standard',
): T {
  const compatible = (model: T) => {
    const features = [...(model.required_features || [])];
    if (model.model_id.includes('f16')) features.push('shader-f16');
    const required = model.buffer_size_required_bytes || 0;
    return features.every(feature => capabilities.features?.includes(feature)) &&
      (!required || !!capabilities.limits &&
        capabilities.limits.maxStorageBufferBindingSize >= required &&
        capabilities.limits.maxBufferSize >= required);
  };
  const candidates = profile === 'compact' ? compactModels : preferredModels;
  for (const id of configuredId ? [configuredId] : candidates) {
    const candidate = models.find(model => model.model_id === id);
    if (candidate && compatible(candidate)) return candidate;
  }
  throw new Error('A kiválasztott modell nem található vagy nem kompatibilis ezzel a GPU-val.');
}
