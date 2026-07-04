export const ERROR_CODES = {
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

const KNOWN_CODES = Object.keys(ERROR_CODES) as ErrorCode[];

/**
 * Map an error rejected by the native module to an ImageToWebPError.
 * Native modules reject with a proper error code (available as `error.code`
 * on the rejection), so match on that first; fall back to scanning the
 * message for older native builds.
 */
export function mapNativeError(
  error: unknown,
  inputPath: string
): ImageToWebPError | null {
  if (!(error instanceof Error)) {
    return null;
  }

  const nativeCode = (error as { code?: unknown }).code;
  const code =
    typeof nativeCode === 'string' &&
    KNOWN_CODES.includes(nativeCode as ErrorCode)
      ? (nativeCode as ErrorCode)
      : KNOWN_CODES.find((c) => error.message.includes(c));

  if (!code) {
    return null;
  }

  const message =
    code === 'FILE_NOT_FOUND' && !error.message.includes(inputPath)
      ? `File not found: ${inputPath}`
      : error.message;

  return new ImageToWebPError(code, message);
}
