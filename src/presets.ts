import type { ConvertPreset } from './NativeReactNativeImageToWebp';

export interface PresetConfig {
  quality?: number;
  method?: number;
  lossless: boolean;
  stripMetadata: boolean;
  threadLevel: number;
  exact: boolean;
  /**
   * Default resize applied when the caller does not pass `maxLongEdge`.
   * `undefined` means "keep original dimensions".
   */
  maxLongEdge?: number;
}

export const PRESETS: Record<ConvertPreset, PresetConfig> = {
  balanced: {
    quality: 80,
    method: 3,
    lossless: false,
    stripMetadata: true,
    threadLevel: 1,
    exact: false,
    maxLongEdge: 2048,
  },
  small: {
    quality: 74,
    method: 5,
    lossless: false,
    stripMetadata: true,
    threadLevel: 1,
    exact: false,
    maxLongEdge: 2048,
  },
  fast: {
    quality: 78,
    method: 1,
    lossless: false,
    stripMetadata: true,
    threadLevel: 1,
    exact: false,
    maxLongEdge: 2048,
  },
  lossless: {
    quality: 100,
    method: 4,
    lossless: true,
    stripMetadata: true,
    threadLevel: 1,
    exact: true,
  },
  document: {
    quality: 82,
    method: 4,
    lossless: false,
    stripMetadata: true,
    threadLevel: 1,
    exact: true,
  },
};

export interface ResolvableOptions {
  preset?: ConvertPreset;
  maxLongEdge?: number;
  quality?: number;
  method?: number;
  lossless?: boolean;
  stripMetadata?: boolean;
  threadLevel?: number;
  exact?: boolean;
}

/**
 * Merge a preset with explicit options. Explicit values always win; the
 * preset only fills in what the caller left undefined. This is the single
 * source of truth for defaults — native layers use exactly what they receive.
 *
 * Passing `maxLongEdge: 0` disables resizing even when the preset defines a
 * default.
 */
export function resolveOptions<T extends ResolvableOptions>(
  options: T
): T & Required<ResolvableOptions> {
  const preset: ConvertPreset = options.preset ?? 'balanced';
  const config = PRESETS[preset];

  const maxLongEdge = options.maxLongEdge ?? config.maxLongEdge ?? 0;

  return {
    ...options,
    preset,
    maxLongEdge,
    quality: options.quality ?? config.quality ?? 80,
    method: options.method ?? config.method ?? 3,
    lossless: options.lossless ?? config.lossless,
    stripMetadata: options.stripMetadata ?? config.stripMetadata,
    threadLevel: options.threadLevel ?? config.threadLevel,
    exact: options.exact ?? config.exact,
  };
}
