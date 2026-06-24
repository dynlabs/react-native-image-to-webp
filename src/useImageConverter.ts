import { useReducer, useCallback, useRef, useEffect } from 'react';
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
   * Trigger a conversion. Pass an `AbortSignal` to cancel it.
   * Calling `convert()` a second time before the first finishes
   * discards the first result — only the latest call updates state.
   */
  convert: (
    options: ConvertOptions,
    signal?: AbortSignal
  ) => Promise<ConvertResult>;
  /**
   * Reset state back to idle, clearing any result or error.
   */
  reset: () => void;
}

/**
 * A hook that provides a simplified interface for converting images to WebP.
 *
 * State updates are guarded against two common bugs:
 * - **Stale results**: if `convert()` is called again before the previous
 *   call resolves, the first result is silently discarded.
 * - **Post-unmount updates**: dispatches that fire after the component unmounts
 *   are no-ops.
 *
 * @example
 * ```ts
 * const { convert, isConverting, result, error } = useImageConverter();
 *
 * const handleConvert = async () => {
 *   const controller = new AbortController();
 *   const res = await convert({ inputPath: '...' }, controller.signal);
 *   console.log(res.outputPath);
 * };
 * ```
 */
export function useImageConverter(): UseImageConverterResult {
  const [state, dispatch] = useReducer(converterReducer, INITIAL_STATE);

  // Tracks whether the component is still mounted. Safe to read synchronously
  // inside async callbacks because refs persist across re-renders.
  const isMountedRef = useRef(true);
  useEffect(
    () => () => {
      isMountedRef.current = false;
    },
    []
  );

  // Incremented on each `convert()` call. If a newer call starts before an
  // older one resolves, the older result is dropped.
  const generationRef = useRef(0);

  const convert = useCallback(
    async (
      options: ConvertOptions,
      signal?: AbortSignal
    ): Promise<ConvertResult> => {
      const generation = ++generationRef.current;

      dispatch({ type: 'START' });
      try {
        const res = await convertImageToWebP(options, signal);
        if (isMountedRef.current && generationRef.current === generation) {
          dispatch({ type: 'SUCCESS', result: res });
        }
        return res;
      } catch (err) {
        const e = err instanceof Error ? err : new Error(String(err));
        if (isMountedRef.current && generationRef.current === generation) {
          dispatch({ type: 'ERROR', error: e });
        }
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
