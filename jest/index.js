/**
 * Jest mock for @dynlabs/react-native-image-to-webp.
 *
 * TurboModules are not available in Jest, so mock the whole package in your
 * jest setup file:
 *
 *   jest.mock('@dynlabs/react-native-image-to-webp', () =>
 *     require('@dynlabs/react-native-image-to-webp/jest')
 *   );
 *
 * `convertImageToWebP` is a jest.fn resolving a realistic result (and firing
 * `onProgress` when provided), so assertions and `mockResolvedValueOnce`-style
 * overrides work out of the box.
 */

const React = require('react');

// Fall back to plain functions when loaded outside a Jest environment
const mockFn =
  typeof jest !== 'undefined'
    ? jest.fn.bind(jest)
    : (impl) => impl || (() => {});

const ERROR_CODES = {
  INVALID_INPUT: 'INVALID_INPUT',
  FILE_NOT_FOUND: 'FILE_NOT_FOUND',
  DECODE_FAILED: 'DECODE_FAILED',
  ENCODE_FAILED: 'ENCODE_FAILED',
  IO_ERROR: 'IO_ERROR',
  UNSUPPORTED_FORMAT: 'UNSUPPORTED_FORMAT',
};

class ImageToWebPError extends Error {
  constructor(code, message) {
    super(message);
    this.name = 'ImageToWebPError';
    this.code = code;
  }
}

const PRESETS = {
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

function buildMockResult(options = {}) {
  const inputPath = options.inputPath || '/mock/input.jpg';
  const base =
    inputPath
      .split('/')
      .pop()
      .replace(/\.[^.]*$/, '') || 'image';
  const originalSizeBytes = 409600;
  const sizeBytes = 102400;
  return {
    outputPath: options.outputPath || `/mock/cache/webp/${base}-mock.webp`,
    width: 1024,
    height: 768,
    sizeBytes,
    originalWidth: 2048,
    originalHeight: 1536,
    originalSizeBytes,
    durationMs: 5,
    savedBytes: originalSizeBytes - sizeBytes,
    savedPercent: ((originalSizeBytes - sizeBytes) / originalSizeBytes) * 100,
  };
}

const convertImageToWebP = mockFn(async (options) => {
  if (!options || typeof options.inputPath !== 'string' || !options.inputPath) {
    throw new ImageToWebPError(
      ERROR_CODES.INVALID_INPUT,
      'inputPath is required and must be a string'
    );
  }
  if (typeof options.onProgress === 'function') {
    options.onProgress({ percent: 0, phase: 'decode' });
    options.onProgress({ percent: 50, phase: 'encode' });
    options.onProgress({ percent: 100, phase: 'done' });
  }
  return buildMockResult(options);
});

const setDebugLogging = mockFn();

function useImageConverter() {
  const [isConverting, setIsConverting] = React.useState(false);
  const [progress, setProgress] = React.useState(null);
  const [result, setResult] = React.useState(null);
  const [error, setError] = React.useState(null);

  const convert = React.useCallback(async (options) => {
    setIsConverting(true);
    setError(null);
    try {
      const res = await convertImageToWebP({
        ...options,
        onProgress: (p) => {
          setProgress(p);
          if (options && options.onProgress) {
            options.onProgress(p);
          }
        },
      });
      setResult(res);
      return res;
    } catch (err) {
      const e = err instanceof Error ? err : new Error(String(err));
      setError(e);
      throw e;
    } finally {
      setIsConverting(false);
      setProgress(null);
    }
  }, []);

  const reset = React.useCallback(() => {
    setIsConverting(false);
    setProgress(null);
    setResult(null);
    setError(null);
  }, []);

  return { isConverting, progress, result, error, convert, reset };
}

module.exports = {
  convertImageToWebP,
  setDebugLogging,
  useImageConverter,
  ImageToWebPError,
  ERROR_CODES,
  PRESETS,
  /** Build a result shaped like a real conversion, for custom mock returns. */
  buildMockResult,
};
