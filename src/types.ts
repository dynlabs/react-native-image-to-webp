import type {
  ConvertPreset,
  NativeConvertResult,
} from './NativeReactNativeImageToWebp';

export type ConversionPhase = 'decode' | 'encode' | 'done';

export interface ConversionProgress {
  /** Overall progress, 0-100. */
  percent: number;
  phase: ConversionPhase;
}

export interface ConvertOptions {
  /**
   * Path or URI of the source image. Supports plain file paths, `file://`
   * URIs, `content://` URIs (Android) and `ph://` photo-library URIs (iOS).
   */
  inputPath: string;
  /**
   * Destination path for the WebP file. Defaults to a uniquely named file in
   * the app cache directory, which is writable on both platforms and never
   * overwrites existing files.
   */
  outputPath?: string;
  /** Quality/size trade-off preset. Default: 'balanced'. */
  preset?: ConvertPreset;
  /**
   * Resize so the longer edge is at most this value (aspect ratio is
   * preserved). Defaults to the preset value (2048 for 'balanced', 'small'
   * and 'fast'; no resize for 'lossless' and 'document'). Pass 0 to disable
   * resizing explicitly.
   */
  maxLongEdge?: number;
  /** Quality 0-100. Overrides the preset value. */
  quality?: number;
  /** Compression method 0-6 (higher = smaller but slower). Overrides preset. */
  method?: number;
  /** Use lossless encoding. Overrides the preset value. */
  lossless?: boolean;
  /**
   * Strip metadata from the output (default: true). When false, EXIF data
   * from JPEG inputs is carried over into the WebP file.
   */
  stripMetadata?: boolean;
  /** libwebp thread_level (0 or 1). Overrides the preset value. */
  threadLevel?: number;
  /** Preserve RGB values in fully transparent areas. Overrides preset. */
  exact?: boolean;
  /** Log a timing breakdown for this conversion (see also setDebugLogging). */
  debug?: boolean;
  /** Called with conversion progress (0-100). */
  onProgress?: (progress: ConversionProgress) => void;
}

export interface ConvertResult extends NativeConvertResult {
  /** Bytes saved compared to the source file (can be negative). */
  savedBytes: number;
  /** Percentage saved compared to the source file, e.g. 48.7. */
  savedPercent: number;
}
