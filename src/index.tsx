import NativeReactNativeImageToWebp, {
  type ConvertOptions,
  type ConvertResult,
  type ConvertPreset,
} from './NativeReactNativeImageToWebp';
import { validateOptions } from './validation';
import { applyPreset } from './presets';

export type { ConvertOptions, ConvertResult, ConvertPreset };

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
  // Validate input
  const validationError = validateOptions(options);
  if (validationError) {
    throw new ImageToWebPError(validationError.code, validationError.message);
  }

  // Apply preset defaults
  const finalOptions = applyPreset(options);
  
  // Ensure preset is included in options for native module to use in filename
  if (!finalOptions.preset && options.preset) {
    finalOptions.preset = options.preset;
  } else if (!finalOptions.preset) {
    finalOptions.preset = 'balanced'; // Default preset
  }

  try {
    return await NativeReactNativeImageToWebp.convertImageToWebP(finalOptions);
  } catch (error) {
    // Map native errors to our error types
    if (error instanceof Error) {
      const message = error.message;
      if (message.includes('FILE_NOT_FOUND')) {
        throw new ImageToWebPError(
          ERROR_CODES.FILE_NOT_FOUND,
          `File not found: ${options.inputPath}`
        );
      }
      if (message.includes('DECODE_FAILED')) {
        throw new ImageToWebPError(
          ERROR_CODES.DECODE_FAILED,
          `Failed to decode image: ${message}`
        );
      }
      if (message.includes('ENCODE_FAILED')) {
        throw new ImageToWebPError(
          ERROR_CODES.ENCODE_FAILED,
          `Failed to encode WebP: ${message}`
        );
      }
      if (message.includes('IO_ERROR')) {
        throw new ImageToWebPError(
          ERROR_CODES.IO_ERROR,
          `I/O error: ${message}`
        );
      }
      if (message.includes('UNSUPPORTED_FORMAT')) {
        throw new ImageToWebPError(
          ERROR_CODES.UNSUPPORTED_FORMAT,
          `Unsupported image format: ${message}`
        );
      }
      if (message.includes('INVALID_INPUT')) {
        throw new ImageToWebPError(
          ERROR_CODES.INVALID_INPUT,
          `Invalid input: ${message}`
        );
      }
    }
    throw error;
  }
}

export { ERROR_CODES };
