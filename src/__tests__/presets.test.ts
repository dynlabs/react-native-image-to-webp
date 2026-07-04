import { PRESETS, resolveOptions } from '../presets';

describe('resolveOptions', () => {
  it('defaults to the balanced preset with a 2048px resize', () => {
    const resolved = resolveOptions({});
    expect(resolved).toMatchObject({
      preset: 'balanced',
      quality: 80,
      method: 3,
      lossless: false,
      stripMetadata: true,
      threadLevel: 1,
      exact: false,
      maxLongEdge: 2048,
    });
  });

  it('applies the requested preset', () => {
    expect(resolveOptions({ preset: 'small' })).toMatchObject({
      quality: 74,
      method: 5,
      maxLongEdge: 2048,
    });
    expect(resolveOptions({ preset: 'lossless' })).toMatchObject({
      lossless: true,
      exact: true,
      maxLongEdge: 0, // lossless keeps original dimensions
    });
    expect(resolveOptions({ preset: 'document' })).toMatchObject({
      quality: 82,
      exact: true,
      maxLongEdge: 0,
    });
  });

  it('lets explicit values override the preset', () => {
    const resolved = resolveOptions({
      preset: 'small',
      quality: 90,
      method: 2,
      maxLongEdge: 512,
      stripMetadata: false,
      threadLevel: 0,
      lossless: true,
      exact: true,
    });
    expect(resolved).toMatchObject({
      quality: 90,
      method: 2,
      maxLongEdge: 512,
      stripMetadata: false,
      threadLevel: 0,
      lossless: true,
      exact: true,
    });
  });

  it('honors maxLongEdge 0 as "do not resize"', () => {
    expect(
      resolveOptions({ preset: 'balanced', maxLongEdge: 0 })
    ).toMatchObject({ maxLongEdge: 0 });
  });

  it('preserves unrelated fields', () => {
    const resolved = resolveOptions({
      preset: 'balanced' as const,
      inputPath: '/a.jpg',
      outputPath: '/b.webp',
    });
    expect(resolved.inputPath).toBe('/a.jpg');
    expect(resolved.outputPath).toBe('/b.webp');
  });

  it('defines every preset completely', () => {
    for (const [name, config] of Object.entries(PRESETS)) {
      expect(typeof config.lossless).toBe('boolean');
      expect(typeof config.stripMetadata).toBe('boolean');
      expect(typeof config.threadLevel).toBe('number');
      expect(typeof config.exact).toBe('boolean');
      if (!config.lossless) {
        expect(config.quality).toBeGreaterThanOrEqual(0);
        expect(config.quality).toBeLessThanOrEqual(100);
      }
      expect(name).toBeTruthy();
    }
  });
});
