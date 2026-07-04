import NativeReactNativeImageToWebp, {
  type ConvertPreset,
  type NativeConvertOptions,
  type NativeConvertResult,
} from './NativeReactNativeImageToWebp';
import { validateOptions } from './validation';
import { resolveOptions } from './presets';
import { ERROR_CODES, ImageToWebPError, mapNativeError } from './errors';
import type {
  ConversionPhase,
  ConversionProgress,
  ConvertOptions,
  ConvertResult,
} from './types';

export type {
  ConvertPreset,
  ConvertOptions,
  ConvertResult,
  ConversionPhase,
  ConversionProgress,
  NativeConvertResult,
};
export type { ErrorCode } from './errors';
export { ERROR_CODES, ImageToWebPError };
export { PRESETS } from './presets';
export { useImageConverter } from './useImageConverter';
export type { UseImageConverterResult } from './useImageConverter';

let debugLogging = false;
let nextConversionId = 1;

/**
 * Enable verbose logging for every conversion: effective options, a native
 * timing breakdown (decode/encode/write) and the final result are logged to
 * the JS console and to logcat / os_log. Can also be enabled per call with
 * `debug: true`.
 */
export function setDebugLogging(enabled: boolean): void {
  debugLogging = enabled;
}

function normalizeInputPath(inputPath: string): string {
  // file:// URIs become plain paths; content:// (Android) and ph:// (iOS)
  // are resolved natively and must be passed through untouched.
  if (inputPath.startsWith('file://')) {
    return decodeURIComponent(inputPath.replace(/^file:\/\//, ''));
  }
  return inputPath;
}

/**
 * Convert an image file to WebP format.
 *
 * Works with zero configuration: `convertImageToWebP({ inputPath })` applies
 * the 'balanced' preset, resizes to a display-friendly 2048px long edge and
 * writes to a unique file in the app cache directory.
 *
 * @param options - Conversion options
 * @returns Promise resolving to the conversion result with output path,
 *   dimensions, sizes and timing
 * @throws {ImageToWebPError} If conversion fails
 *
 * @example
 * ```ts
 * const result = await convertImageToWebP({
 *   inputPath: asset.uri, // file://, content:// and ph:// URIs all work
 *   preset: 'balanced',
 *   onProgress: ({ percent }) => console.log(`${percent}%`),
 * });
 * console.log(`Saved ${result.savedPercent.toFixed(1)}% in ${result.durationMs}ms`);
 * ```
 */
export async function convertImageToWebP(
  options: ConvertOptions
): Promise<ConvertResult> {
  const validationError = validateOptions(options);
  if (validationError) {
    throw new ImageToWebPError(validationError.code, validationError.message);
  }

  const { onProgress, ...rest } = options;
  const debug = options.debug ?? debugLogging;

  const resolved = resolveOptions({
    ...rest,
    inputPath: normalizeInputPath(options.inputPath),
    debug,
  });

  const nativeOptions: NativeConvertOptions = resolved;

  let subscription: { remove: () => void } | undefined;
  if (onProgress) {
    const conversionId = nextConversionId++;
    nativeOptions.conversionId = conversionId;
    nativeOptions.emitProgress = true;
    subscription = NativeReactNativeImageToWebp.onConversionProgress(
      (event) => {
        if (event.conversionId === conversionId) {
          onProgress({
            percent: event.progress,
            phase: event.phase as ConversionPhase,
          });
        }
      }
    );
  }

  if (debug) {
    console.log('[ImageToWebP] converting with options:', nativeOptions);
  }

  try {
    const nativeResult: NativeConvertResult =
      await NativeReactNativeImageToWebp.convertImageToWebP(nativeOptions);

    const savedBytes = nativeResult.originalSizeBytes - nativeResult.sizeBytes;
    const result: ConvertResult = {
      ...nativeResult,
      savedBytes,
      savedPercent:
        nativeResult.originalSizeBytes > 0
          ? (savedBytes / nativeResult.originalSizeBytes) * 100
          : 0,
    };

    if (debug) {
      console.log(
        `[ImageToWebP] done in ${result.durationMs}ms: ` +
          `${result.originalWidth}x${result.originalHeight} (${result.originalSizeBytes} B) -> ` +
          `${result.width}x${result.height} (${result.sizeBytes} B, ` +
          `saved ${result.savedPercent.toFixed(1)}%) at ${result.outputPath}`
      );
    }

    return result;
  } catch (error) {
    const mapped = mapNativeError(error, options.inputPath);
    if (debug) {
      console.log('[ImageToWebP] conversion failed:', mapped ?? error);
    }
    throw mapped ?? error;
  } finally {
    subscription?.remove();
  }
}
