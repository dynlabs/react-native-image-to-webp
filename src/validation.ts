import { PRESETS } from './presets';
import type { ConvertOptions } from './types';
import type { ErrorCode } from './errors';

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

  if (options.outputPath !== undefined) {
    if (typeof options.outputPath !== 'string' || options.outputPath === '') {
      return {
        code: 'INVALID_INPUT',
        message: 'outputPath must be a non-empty string',
      };
    }
  }

  if (options.preset !== undefined && !(options.preset in PRESETS)) {
    return {
      code: 'INVALID_INPUT',
      message: `preset must be one of: ${Object.keys(PRESETS).join(', ')}`,
    };
  }

  if (options.maxLongEdge !== undefined) {
    // 0 is allowed and means "do not resize"
    if (
      typeof options.maxLongEdge !== 'number' ||
      !Number.isFinite(options.maxLongEdge) ||
      options.maxLongEdge < 0
    ) {
      return {
        code: 'INVALID_INPUT',
        message:
          'maxLongEdge must be a non-negative number (0 disables resizing)',
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

  if (options.threadLevel !== undefined) {
    if (options.threadLevel !== 0 && options.threadLevel !== 1) {
      return {
        code: 'INVALID_INPUT',
        message: 'threadLevel must be 0 or 1',
      };
    }
  }

  if (
    options.onProgress !== undefined &&
    typeof options.onProgress !== 'function'
  ) {
    return {
      code: 'INVALID_INPUT',
      message: 'onProgress must be a function',
    };
  }

  return null;
}
