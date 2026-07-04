import type {
  ConversionProgressEvent,
  NativeConvertOptions,
  NativeConvertResult,
} from '../NativeReactNativeImageToWebp';

const NATIVE_RESULT: NativeConvertResult = {
  outputPath: '/cache/webp/photo-1.webp',
  width: 2048,
  height: 1365,
  sizeBytes: 500_000,
  originalWidth: 4017,
  originalHeight: 2683,
  originalSizeBytes: 2_000_000,
  durationMs: 42,
};

const mockConvert = jest.fn(
  async (_options: NativeConvertOptions): Promise<NativeConvertResult> =>
    NATIVE_RESULT
);
const mockRemove = jest.fn();
const mockSubscribe = jest.fn(
  (_listener: (e: ConversionProgressEvent) => void) => ({
    remove: mockRemove,
  })
);

jest.mock('../NativeReactNativeImageToWebp', () => ({
  __esModule: true,
  default: {
    convertImageToWebP: (options: NativeConvertOptions) => mockConvert(options),
    onConversionProgress: (listener: (e: ConversionProgressEvent) => void) =>
      mockSubscribe(listener),
  },
}));

import { convertImageToWebP, ImageToWebPError } from '../index';

beforeEach(() => {
  jest.clearAllMocks();
  mockConvert.mockResolvedValue(NATIVE_RESULT);
});

describe('convertImageToWebP', () => {
  it('sends fully resolved balanced-preset defaults to native', async () => {
    await convertImageToWebP({ inputPath: '/photo.jpg' });
    expect(mockConvert).toHaveBeenCalledWith(
      expect.objectContaining({
        inputPath: '/photo.jpg',
        preset: 'balanced',
        quality: 80,
        method: 3,
        lossless: false,
        stripMetadata: true,
        threadLevel: 1,
        exact: false,
        maxLongEdge: 2048,
      })
    );
  });

  it('lets explicit options override the preset', async () => {
    await convertImageToWebP({
      inputPath: '/photo.jpg',
      preset: 'small',
      quality: 60,
      maxLongEdge: 0,
    });
    expect(mockConvert).toHaveBeenCalledWith(
      expect.objectContaining({ preset: 'small', quality: 60, maxLongEdge: 0 })
    );
  });

  it('strips file:// prefixes but passes content:// and ph:// through', async () => {
    await convertImageToWebP({ inputPath: 'file:///tmp/a%20b.jpg' });
    expect(mockConvert).toHaveBeenLastCalledWith(
      expect.objectContaining({ inputPath: '/tmp/a b.jpg' })
    );

    await convertImageToWebP({
      inputPath: 'content://media/external/images/9',
    });
    expect(mockConvert).toHaveBeenLastCalledWith(
      expect.objectContaining({
        inputPath: 'content://media/external/images/9',
      })
    );

    await convertImageToWebP({ inputPath: 'ph://ED7AC36B/L0/001' });
    expect(mockConvert).toHaveBeenLastCalledWith(
      expect.objectContaining({ inputPath: 'ph://ED7AC36B/L0/001' })
    );
  });

  it('computes savedBytes and savedPercent from the native result', async () => {
    const result = await convertImageToWebP({ inputPath: '/photo.jpg' });
    expect(result.savedBytes).toBe(1_500_000);
    expect(result.savedPercent).toBeCloseTo(75);
    expect(result.durationMs).toBe(42);
  });

  it('rejects invalid options without calling native', async () => {
    await expect(
      convertImageToWebP({ inputPath: '/a.jpg', quality: 200 })
    ).rejects.toMatchObject({
      name: 'ImageToWebPError',
      code: 'INVALID_INPUT',
    });
    expect(mockConvert).not.toHaveBeenCalled();
  });

  it('maps native rejections using the error code property', async () => {
    const nativeError = Object.assign(new Error('boom'), {
      code: 'DECODE_FAILED',
    });
    mockConvert.mockRejectedValueOnce(nativeError);

    await expect(
      convertImageToWebP({ inputPath: '/photo.jpg' })
    ).rejects.toMatchObject({
      name: 'ImageToWebPError',
      code: 'DECODE_FAILED',
    });
  });

  it('falls back to matching error codes in the message', async () => {
    mockConvert.mockRejectedValueOnce(new Error('ENCODE_FAILED: bad config'));
    await expect(
      convertImageToWebP({ inputPath: '/photo.jpg' })
    ).rejects.toBeInstanceOf(ImageToWebPError);
  });

  it('rethrows unrecognized errors untouched', async () => {
    const weird = new Error('something else entirely');
    mockConvert.mockRejectedValueOnce(weird);
    await expect(convertImageToWebP({ inputPath: '/photo.jpg' })).rejects.toBe(
      weird
    );
  });

  describe('progress', () => {
    it('does not subscribe when no onProgress is given', async () => {
      await convertImageToWebP({ inputPath: '/photo.jpg' });
      expect(mockSubscribe).not.toHaveBeenCalled();
      expect(mockConvert).toHaveBeenCalledWith(
        expect.not.objectContaining({ emitProgress: true })
      );
    });

    it('subscribes, forwards matching events and unsubscribes', async () => {
      const onProgress = jest.fn();
      let emit: ((e: ConversionProgressEvent) => void) | undefined;
      mockSubscribe.mockImplementationOnce((listener) => {
        emit = listener;
        return { remove: mockRemove };
      });
      mockConvert.mockImplementationOnce(async (options) => {
        emit?.({
          conversionId: options.conversionId ?? -1,
          progress: 40,
          phase: 'encode',
        });
        emit?.({ conversionId: -999, progress: 90, phase: 'encode' }); // other conversion
        return NATIVE_RESULT;
      });

      await convertImageToWebP({ inputPath: '/photo.jpg', onProgress });

      expect(mockConvert).toHaveBeenCalledWith(
        expect.objectContaining({
          emitProgress: true,
          conversionId: expect.any(Number),
        })
      );
      expect(onProgress).toHaveBeenCalledTimes(1);
      expect(onProgress).toHaveBeenCalledWith({ percent: 40, phase: 'encode' });
      expect(mockRemove).toHaveBeenCalledTimes(1);
    });

    it('unsubscribes even when the conversion fails', async () => {
      mockConvert.mockRejectedValueOnce(
        Object.assign(new Error('fail'), { code: 'IO_ERROR' })
      );
      await expect(
        convertImageToWebP({ inputPath: '/photo.jpg', onProgress: jest.fn() })
      ).rejects.toMatchObject({ code: 'IO_ERROR' });
      expect(mockRemove).toHaveBeenCalledTimes(1);
    });
  });
});
