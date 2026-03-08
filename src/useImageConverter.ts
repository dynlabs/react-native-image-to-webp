import { useState, useCallback } from 'react';
import {
  convertImageToWebP,
  type ConvertOptions,
  type ConvertResult,
  ImageToWebPError,
} from './index';

export interface UseImageConverterResult {
  /**
   * Whether a conversion is currently in progress.
   */
  isConverting: boolean;
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
   * 
   * @param options - Conversion options. If not provided, will use the options passed to the hook.
   */
  convert: (options: ConvertOptions) => Promise<ConvertResult>;
  /**
   * Resets the state of the hook.
   */
  reset: () => void;
}

/**
 * A hook that provides a simplified interface for converting images to WebP.
 * 
 * @example
 * ```ts
 * const { convert, isConverting, result, error } = useImageConverter();
 * 
 * const handleConvert = async () => {
 *   const res = await convert({ inputPath: '...' });
 *   console.log(res.outputPath);
 * };
 * ```
 */
export function useImageConverter(): UseImageConverterResult {
  const [isConverting, setIsConverting] = useState<boolean>(false);
  const [result, setResult] = useState<ConvertResult | null>(null);
  const [error, setError] = useState<ImageToWebPError | Error | null>(null);

  const convert = useCallback(async (options: ConvertOptions): Promise<ConvertResult> => {
    setIsConverting(true);
    setError(null);
    try {
      const res = await convertImageToWebP(options);
      setResult(res);
      return res;
    } catch (err) {
      const e = err instanceof Error ? err : new Error(String(err));
      setError(e);
      throw e;
    } finally {
      setIsConverting(false);
    }
  }, []);

  const reset = useCallback(() => {
    setIsConverting(false);
    setResult(null);
    setError(null);
  }, []);

  return {
    isConverting,
    result,
    error,
    convert,
    reset,
  };
}
