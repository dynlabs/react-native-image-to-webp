import { useReducer, useCallback } from 'react';
import {
  convertImageToWebP,
  type ConvertOptions,
  type ConvertResult,
  ImageToWebPError,
} from './index';

type ConverterState =
  | { status: 'idle'; result: null; error: null }
  | { status: 'converting'; result: null; error: null }
  | { status: 'success'; result: ConvertResult; error: null }
  | { status: 'error'; result: null; error: ImageToWebPError | Error };

type ConverterAction =
  | { type: 'START' }
  | { type: 'SUCCESS'; result: ConvertResult }
  | { type: 'ERROR'; error: ImageToWebPError | Error }
  | { type: 'RESET' };

const INITIAL_STATE: ConverterState = {
  status: 'idle',
  result: null,
  error: null,
};

function converterReducer(
  _state: ConverterState,
  action: ConverterAction
): ConverterState {
  switch (action.type) {
    case 'START':
      return { status: 'converting', result: null, error: null };
    case 'SUCCESS':
      return { status: 'success', result: action.result, error: null };
    case 'ERROR':
      return { status: 'error', result: null, error: action.error };
    case 'RESET':
      return INITIAL_STATE;
  }
}

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
  const [state, dispatch] = useReducer(converterReducer, INITIAL_STATE);

  const convert = useCallback(
    async (options: ConvertOptions): Promise<ConvertResult> => {
      dispatch({ type: 'START' });
      try {
        const res = await convertImageToWebP(options);
        dispatch({ type: 'SUCCESS', result: res });
        return res;
      } catch (err) {
        const e = err instanceof Error ? err : new Error(String(err));
        dispatch({ type: 'ERROR', error: e });
        throw e;
      }
    },
    []
  );

  const reset = useCallback(() => {
    dispatch({ type: 'RESET' });
  }, []);

  return {
    isConverting: state.status === 'converting',
    result: state.result,
    error: state.error,
    convert,
    reset,
  };
}
