import {
  convertImageToWebP,
  type ConvertOptions,
  type ConvertResult,
  ImageToWebPError,
} from './index';

/** Tagged result for a single image in a batch. */
export type BatchResultEntry =
  | { ok: true; value: ConvertResult }
  | { ok: false; error: ImageToWebPError | Error };

export interface BatchConvertOptions {
  /** Images to convert. Results are returned in the same order. */
  images: ConvertOptions[];
  /**
   * Maximum simultaneous native conversions. Defaults to 3.
   * Higher values increase throughput but raise peak memory usage.
   */
  concurrency?: number;
  /**
   * Cancel the batch. In-flight conversions reject as `AbortError`;
   * not-yet-started ones are skipped immediately.
   */
  signal?: AbortSignal;
  /**
   * Called after each image finishes (success or failure).
   * Useful for driving a progress bar.
   */
  onProgress?: (completed: number, total: number) => void;
}

export interface BatchConvertResult {
  /** Per-image outcome in input order. Use `r.ok` to branch. */
  results: BatchResultEntry[];
  successCount: number;
  failureCount: number;
}

/**
 * Convert multiple images to WebP with bounded concurrency.
 *
 * Unlike `convertImageToWebP`, a single failure does **not** reject the
 * whole batch — each image gets its own tagged result slot.
 *
 * @example
 * ```ts
 * const { results, successCount } = await convertImageToWebPBatch({
 *   images: [
 *     { inputPath: '/a.jpg', preset: 'balanced' },
 *     { inputPath: '/b.jpg', preset: 'small' },
 *   ],
 *   concurrency: 2,
 *   onProgress: (done, total) => setProgress(done / total),
 * });
 *
 * results.forEach((r, i) => {
 *   if (r.ok) console.log(i, r.value.outputPath);
 *   else console.error(i, r.error.message);
 * });
 * ```
 */
export async function convertImageToWebPBatch(
  batchOptions: BatchConvertOptions
): Promise<BatchConvertResult> {
  const { images, concurrency = 3, signal, onProgress } = batchOptions;

  if (signal?.aborted) {
    throw makeAbortError(signal);
  }

  const total = images.length;
  if (total === 0) {
    return { results: [], successCount: 0, failureCount: 0 };
  }

  const results: BatchResultEntry[] = new Array(total);
  let completed = 0;
  let nextIndex = 0;

  // Each worker pulls the next unclaimed index and processes it. Because JS is
  // single-threaded, the `nextIndex++` increment is race-free across workers.
  async function worker(): Promise<void> {
    while (nextIndex < total) {
      const i = nextIndex++;
      try {
        const value = await convertImageToWebP(images[i]!, signal);
        results[i] = { ok: true, value };
      } catch (err) {
        results[i] = {
          ok: false,
          error: err instanceof Error ? err : new Error(String(err)),
        };
      }
      completed++;
      onProgress?.(completed, total);
    }
  }

  await Promise.all(
    Array.from({ length: Math.min(concurrency, total) }, worker)
  );

  const successCount = results.filter((r) => r.ok).length;
  return { results, successCount, failureCount: total - successCount };
}

function makeAbortError(signal: AbortSignal): Error {
  const reason = (signal as AbortSignal & { reason?: unknown }).reason;
  if (reason instanceof Error) return reason;
  const err = new Error('Batch conversion aborted');
  err.name = 'AbortError';
  return err;
}
