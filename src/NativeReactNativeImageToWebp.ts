import { TurboModuleRegistry, type TurboModule } from 'react-native';

export type ConvertPreset =
  | 'balanced'
  | 'small'
  | 'fast'
  | 'lossless'
  | 'document';

/**
 * libwebp encoding effort: 0 = fastest, 6 = best compression.
 * Higher values trade CPU time for smaller files.
 */
export type EncodeMethod = 0 | 1 | 2 | 3 | 4 | 5 | 6;

export interface ConvertOptions {
  /**
   * Source image path. Accepts raw paths, `file://` URIs,
   * `content://` URIs (Android scoped storage / Photo Picker),
   * and `ph://` PhotoKit asset identifiers (iOS CameraRoll).
   */
  inputPath: string;
  /**
   * Destination path for the WebP file.
   * Defaults to the same directory as the input (or the app cache/temp dir
   * for `content://`/`ph://` URIs) with a `.webp` extension.
   */
  outputPath?: string;
  /** Encoding preset. Defaults to `'balanced'`. */
  preset?: ConvertPreset;
  /**
   * Constrain the longest edge of the output to this pixel count,
   * preserving aspect ratio. No resizing when omitted.
   */
  maxLongEdge?: number;
  /**
   * Compression quality 0–100 (ignored in lossless mode).
   * Defaults to 80.
   */
  quality?: number;
  /**
   * Encoding effort 0–6. Higher values compress better but are slower.
   * Defaults to 3.
   */
  method?: EncodeMethod;
  /** Produce a lossless WebP. Overrides `quality`. */
  lossless?: boolean;
  /** Strip EXIF, GPS, and ICC profile metadata. Defaults to `true`. */
  stripMetadata?: boolean;
}

export interface ConvertResult {
  /** Absolute path to the generated WebP file. */
  outputPath: string;
  /** Output image width in pixels (after any resizing). */
  width: number;
  /** Output image height in pixels (after any resizing). */
  height: number;
  /** Size of the output file in bytes. */
  sizeBytes: number;
}

export interface Spec extends TurboModule {
  convertImageToWebP(options: ConvertOptions): Promise<ConvertResult>;
}

export default TurboModuleRegistry.getEnforcing<Spec>('ReactNativeImageToWebp');
