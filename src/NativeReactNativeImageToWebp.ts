import {
  TurboModuleRegistry,
  type TurboModule,
  type CodegenTypes,
} from 'react-native';

export type ConvertPreset =
  | 'balanced'
  | 'small'
  | 'fast'
  | 'lossless'
  | 'document';

/**
 * Options passed across the bridge. All defaults are resolved on the JS side
 * (see presets.ts) so the native layers never guess preset values.
 */
export interface NativeConvertOptions {
  inputPath: string;
  outputPath?: string;
  /** Diagnostic only — native must not read this; JS resolves all defaults. */
  preset?: string;
  maxLongEdge?: number;
  quality?: number;
  method?: number;
  lossless?: boolean;
  stripMetadata?: boolean;
  threadLevel?: number;
  exact?: boolean;
  /** Correlates progress events with a specific conversion. */
  conversionId?: number;
  /** When true, native emits onConversionProgress events for this conversion. */
  emitProgress?: boolean;
  /** When true, native logs a timing breakdown (logcat / os_log). */
  debug?: boolean;
}

export interface NativeConvertResult {
  outputPath: string;
  width: number;
  height: number;
  sizeBytes: number;
  originalWidth: number;
  originalHeight: number;
  originalSizeBytes: number;
  durationMs: number;
}

export interface ConversionProgressEvent {
  conversionId: number;
  /** Overall progress, 0-100. */
  progress: number;
  /** Current phase: 'decode' | 'encode' | 'done'. */
  phase: string;
}

export interface Spec extends TurboModule {
  convertImageToWebP(
    options: NativeConvertOptions
  ): Promise<NativeConvertResult>;
  readonly onConversionProgress: CodegenTypes.EventEmitter<ConversionProgressEvent>;
}

export default TurboModuleRegistry.getEnforcing<Spec>('ReactNativeImageToWebp');
