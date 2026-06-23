import NativeReactNativeImageToWebp, {
  type ConvertOptions,
  type ConvertResult,
  type ConvertPreset,
} from './NativeReactNativeImageToWebp';
import { validateOptions } from './validation';
import { applyPreset } from './presets';

export type { ConvertOptions, ConvertResult, ConvertPreset };
export { useImageConverter } from './useImageConverter';
export type { UseImageConverterResult } from './useImageConverter';

const ERROR_CODES = {
  INVALID_INPUT: 'INVALID_INPUT',
  FILE_NOT_FOUND: 'FILE_NOT_FOUND',
  DECODE_FAILED: 'DECODE_FAILED',
  ENCODE_FAILED: 'ENCODE_FAILED',
  IO_ERROR: 'IO_ERROR',
  UNSUPPORTED_FORMAT: 'UNSUPPORTED_FORMAT',
} as const;

export type ErrorCode = (typeof ERROR_CODES)[keyof typeof ERROR_CODES];

export class ImageToWebPError extends Error {
  code: ErrorCode;

  constructor(code: ErrorCode, message: string) {
    super(message);
    this.name = 'ImageToWebPError';
    this.code = code;
    Object.setPrototypeOf(this, ImageToWebPError.prototype);
  }
}

type ErrorEntry = [
  pattern: string,
  code: ErrorCode,
  getMessage: (nativeMsg: string, inputPath: string) => string
];

const NATIVE_ERROR_MAP: ErrorEntry[] = [
  [
    'FILE_NOT_FOUND',
    ERROR_CODES.FILE_NOT_FOUND,
    (_, path) => `File not found: ${path}`,
  ],
  [
    'DECODE_FAILED',
    ERROR_CODES.DECODE_FAILED,
    (msg) => `Failed to decode image: ${msg}`,
  ],
  [
    'ENCODE_FAILED',
    ERROR_CODES.ENCODE_FAILED,
    (msg) => `Failed to encode WebP: ${msg}`,
  ],
  ['IO_ERROR', ERROR_CODES.IO_ERROR, (msg) => `I/O error: ${msg}`],
  [
    'UNSUPPORTED_FORMAT',
    ERROR_CODES.UNSUPPORTED_FORMAT,
    (msg) => `Unsupported image format: ${msg}`,
  ],
  [
    'INVALID_INPUT',
    ERROR_CODES.INVALID_INPUT,
    (msg) => `Invalid input: ${msg}`,
  ],
];

/**
 * URI schemes that must reach the native layer untouched. These are resolved
 * natively — `content://` / `android.resource://` via Android's ContentResolver,
 * and `ph://` / `assets-library://` via iOS PhotoKit — so they cannot be turned
 * into a raw filesystem path here.
 */
const PASSTHROUGH_SCHEME =
  /^(content|android\.resource|ph|assets-library):\/\//;

/**
 * Normalize an input path for the native layer.
 *
 * Modern React Native image sources (`react-native-image-picker`,
 * `expo-image-picker`, CameraRoll, the Android 13+ system Photo Picker) return
 * URIs rather than raw paths. `content://`/`ph://` URIs are passed through so
 * native can resolve them; `file://` URIs are percent-decoded into the raw
 * filesystem path the native decoders expect.
 */
function normalizeInputPath(inputPath: string): string {
  if (PASSTHROUGH_SCHEME.test(inputPath)) {
    return inputPath;
  }
  if (inputPath.startsWith('file://')) {
    const withoutScheme = inputPath.replace(/^file:\/\//, '');
    try {
      return decodeURIComponent(withoutScheme);
    } catch {
      return withoutScheme;
    }
  }
  return inputPath;
}

function mapNativeError(error: Error, inputPath: string): ImageToWebPError {
  for (const [pattern, code, getMessage] of NATIVE_ERROR_MAP) {
    if (error.message.includes(pattern)) {
      return new ImageToWebPError(code, getMessage(error.message, inputPath));
    }
  }
  return new ImageToWebPError(ERROR_CODES.IO_ERROR, error.message);
}

/**
 * Convert an image file to WebP format.
 *
 * @param options - Conversion options
 * @returns Promise resolving to conversion result with output path and metadata
 * @throws {ImageToWebPError} If conversion fails
 *
 * @example
 * ```ts
 * const result = await convertImageToWebP({
 *   inputPath: '/path/to/image.jpg',
 *   preset: 'balanced',
 *   maxLongEdge: 2048,
 * });
 * console.log(`Output: ${result.outputPath}, Size: ${result.sizeBytes} bytes`);
 * ```
 */
export async function convertImageToWebP(
  options: ConvertOptions
): Promise<ConvertResult> {
  const validationError = validateOptions(options);
  if (validationError) {
    throw new ImageToWebPError(validationError.code, validationError.message);
  }

  const normalizedInputPath = normalizeInputPath(options.inputPath);

  const finalOptions = applyPreset({
    ...options,
    inputPath: normalizedInputPath,
    preset: options.preset ?? 'balanced',
  });

  try {
    return await NativeReactNativeImageToWebp.convertImageToWebP(finalOptions);
  } catch (error) {
    if (error instanceof Error) {
      throw mapNativeError(error, options.inputPath);
    }
    throw error;
  }
}

export { ERROR_CODES };
