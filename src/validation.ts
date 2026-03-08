import type { ConvertOptions } from './NativeReactNativeImageToWebp';
import type { ErrorCode } from './index';

interface ValidationError {
  code: ErrorCode;
  message: string;
}

export function validateOptions(
  options: ConvertOptions
): ValidationError | null {
  if (!options.inputPath || typeof options.inputPath !== 'string') {
    return {
      code: 'INVALID_INPUT',
      message: 'inputPath is required and must be a string',
    };
  }

  if (options.maxLongEdge !== undefined) {
    if (typeof options.maxLongEdge !== 'number' || options.maxLongEdge <= 0) {
      return {
        code: 'INVALID_INPUT',
        message: 'maxLongEdge must be a positive number',
      };
    }
  }

  if (options.quality !== undefined) {
    if (
      typeof options.quality !== 'number' ||
      options.quality < 0 ||
      options.quality > 100
    ) {
      return {
        code: 'INVALID_INPUT',
        message: 'quality must be a number between 0 and 100',
      };
    }
  }

  if (options.method !== undefined) {
    if (
      typeof options.method !== 'number' ||
      options.method < 0 ||
      options.method > 6
    ) {
      return {
        code: 'INVALID_INPUT',
        message: 'method must be a number between 0 and 6',
      };
    }
  }

  return null;
}
