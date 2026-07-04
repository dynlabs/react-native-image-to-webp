import { useState, useCallback, useRef, useEffect } from 'react';
import { convertImageToWebP } from './index';
import { ImageToWebPError } from './errors';
import type {
  ConversionProgress,
  ConvertOptions,
  ConvertResult,
} from './types';

export interface UseImageConverterResult {
  /**
   * Whether a conversion is currently in progress.
   */
  isConverting: boolean;
  /**
   * Progress of the current conversion (0-100 with the active phase), or
   * null when idle.
   */
  progress: ConversionProgress | null;
  /**
   * The result of the last successful conversion.
   */
  result: ConvertResult | null;
  /**
   * Any error that occurred during the last conversion attempt.
   */
  error: ImageToWebPError | Error | null;
  /**
   * Function to trigger a conversion.
   */
  convert: (options: ConvertOptions) => Promise<ConvertResult>;
  /**
   * Resets the state of the hook.
   */
  reset: () => void;
}

/**
 * A hook that provides a simplified interface for converting images to WebP,
 * including live progress for the running conversion.
 *
 * @example
 * ```ts
 * const { convert, isConverting, progress, result, error } = useImageConverter();
 *
 * const handleConvert = async () => {
 *   const res = await convert({ inputPath: asset.uri });
 *   console.log(res.outputPath, `saved ${res.savedPercent.toFixed(1)}%`);
 * };
 * ```
 */
export function useImageConverter(): UseImageConverterResult {
  const [isConverting, setIsConverting] = useState<boolean>(false);
  const [progress, setProgress] = useState<ConversionProgress | null>(null);
  const [result, setResult] = useState<ConvertResult | null>(null);
  const [error, setError] = useState<ImageToWebPError | Error | null>(null);
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  const convert = useCallback(
    async (options: ConvertOptions): Promise<ConvertResult> => {
      setIsConverting(true);
      setProgress({ percent: 0, phase: 'decode' });
      setError(null);
      try {
        const res = await convertImageToWebP({
          ...options,
          onProgress: (p) => {
            if (mountedRef.current) {
              setProgress(p);
            }
            options.onProgress?.(p);
          },
        });
        if (mountedRef.current) {
          setResult(res);
        }
        return res;
      } catch (err) {
        const e = err instanceof Error ? err : new Error(String(err));
        if (mountedRef.current) {
          setError(e);
        }
        throw e;
      } finally {
        if (mountedRef.current) {
          setIsConverting(false);
          setProgress(null);
        }
      }
    },
    []
  );

  const reset = useCallback(() => {
    setIsConverting(false);
    setProgress(null);
    setResult(null);
    setError(null);
  }, []);

  return {
    isConverting,
    progress,
    result,
    error,
    convert,
    reset,
  };
}
