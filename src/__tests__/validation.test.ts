import { validateOptions } from '../validation';

describe('validateOptions', () => {
  it('accepts a minimal valid config', () => {
    expect(validateOptions({ inputPath: '/a.jpg' })).toBeNull();
  });

  it('accepts a fully specified config', () => {
    expect(
      validateOptions({
        inputPath: 'content://media/external/images/1',
        outputPath: '/out.webp',
        preset: 'small',
        maxLongEdge: 1024,
        quality: 50,
        method: 6,
        lossless: true,
        stripMetadata: false,
        threadLevel: 0,
        exact: true,
        onProgress: () => {},
      })
    ).toBeNull();
  });

  it('rejects a missing inputPath', () => {
    expect(validateOptions({ inputPath: '' })).toMatchObject({
      code: 'INVALID_INPUT',
    });
    expect(
      validateOptions({ inputPath: 42 as unknown as string })
    ).toMatchObject({ code: 'INVALID_INPUT' });
  });

  it('rejects an empty outputPath', () => {
    expect(
      validateOptions({ inputPath: '/a.jpg', outputPath: '' })
    ).toMatchObject({ code: 'INVALID_INPUT' });
  });

  it('rejects an unknown preset', () => {
    expect(
      validateOptions({
        inputPath: '/a.jpg',
        preset: 'tiny' as never,
      })
    ).toMatchObject({ code: 'INVALID_INPUT' });
  });

  it('allows maxLongEdge 0 (disables resizing) but rejects negatives', () => {
    expect(validateOptions({ inputPath: '/a.jpg', maxLongEdge: 0 })).toBeNull();
    expect(
      validateOptions({ inputPath: '/a.jpg', maxLongEdge: -1 })
    ).toMatchObject({ code: 'INVALID_INPUT' });
    expect(
      validateOptions({ inputPath: '/a.jpg', maxLongEdge: NaN })
    ).toMatchObject({ code: 'INVALID_INPUT' });
  });

  it('rejects out-of-range quality and method', () => {
    expect(
      validateOptions({ inputPath: '/a.jpg', quality: 101 })
    ).toMatchObject({ code: 'INVALID_INPUT' });
    expect(validateOptions({ inputPath: '/a.jpg', quality: -1 })).toMatchObject(
      { code: 'INVALID_INPUT' }
    );
    expect(validateOptions({ inputPath: '/a.jpg', method: 7 })).toMatchObject({
      code: 'INVALID_INPUT',
    });
  });

  it('rejects invalid threadLevel and onProgress', () => {
    expect(
      validateOptions({ inputPath: '/a.jpg', threadLevel: 2 })
    ).toMatchObject({ code: 'INVALID_INPUT' });
    expect(
      validateOptions({
        inputPath: '/a.jpg',
        onProgress: 'nope' as never,
      })
    ).toMatchObject({ code: 'INVALID_INPUT' });
  });
});
