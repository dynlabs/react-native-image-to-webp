import type {
  ConvertOptions,
  ConvertPreset,
} from './NativeReactNativeImageToWebp';

interface PresetConfig {
  quality?: number;
  method?: number;
  lossless?: boolean;
  stripMetadata?: boolean;
  threadLevel?: number;
  exact?: boolean;
}

const PRESETS: Record<ConvertPreset, PresetConfig> = {
  balanced: {
    quality: 80,
    method: 3,
    lossless: false,
    stripMetadata: true,
    threadLevel: 1,
  },
  small: {
    quality: 74,
    method: 5,
    lossless: false,
    stripMetadata: true,
    threadLevel: 1,
  },
  fast: {
    quality: 78,
    method: 1,
    lossless: false,
    stripMetadata: true,
    threadLevel: 1,
  },
  lossless: {
    lossless: true,
    method: 4,
    stripMetadata: true,
  },
  document: {
    quality: 82,
    method: 4,
    lossless: false,
    stripMetadata: true,
    exact: true, // Will be set conditionally if alpha present
  },
};

export function applyPreset(options: ConvertOptions): ConvertOptions {
  const preset: ConvertPreset = options.preset || 'balanced';
  const presetConfig = PRESETS[preset];

  const result: ConvertOptions = {
    ...options,
  };

  // Apply preset values only if not explicitly overridden
  if (result.quality === undefined && presetConfig.quality !== undefined) {
    result.quality = presetConfig.quality;
  }
  if (result.method === undefined && presetConfig.method !== undefined) {
    result.method = presetConfig.method;
  }
  if (result.lossless === undefined && presetConfig.lossless !== undefined) {
    result.lossless = presetConfig.lossless;
  }
  if (
    result.stripMetadata === undefined &&
    presetConfig.stripMetadata !== undefined
  ) {
    result.stripMetadata = presetConfig.stripMetadata;
  }

  // Note: threadLevel and exact are handled natively, not passed through JS API
  // They are documented here for reference but applied in native code

  return result;
}
