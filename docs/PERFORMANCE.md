# Performance Guide

This document explains performance considerations and optimization strategies for `@dynlabs/react-native-image-to-webp`.

## Performance Levers

### 1. Resize Before Encoding

**Critical**: Always use `maxLongEdge` to resize images before encoding.

**Why it matters**:
- Encoding time scales roughly with pixel count (width × height)
- A 4000×3000 image has 12M pixels
- A 2000×1500 image has 3M pixels (4× faster)
- Memory usage also scales with pixel count

**Recommendation**: Use `maxLongEdge: 2048` for most use cases. This provides:
- Good quality for display (retina displays are typically 2×, so 2048px = 1024dp)
- Fast encoding (reasonable pixel count)
- Reasonable file sizes

### 2. Quality vs Method Tradeoffs

**Quality** (0-100):
- Higher quality = larger files, slower encoding
- Lower quality = smaller files, faster encoding
- **Sweet spot**: 75-85 for most images
- Use presets: `balanced` (80), `small` (74), `fast` (78)

**Method** (0-6):
- Higher method = better compression, slower encoding
- Lower method = faster encoding, larger files
- **Sweet spot**: 3-4 for balanced performance
- Presets: `balanced` (3), `small` (5), `fast` (1)

**Recommendation**: Use presets unless you have specific requirements.

### 3. Lossless vs Lossy

**Lossless**:
- Perfect quality, but larger files
- Slower encoding
- Use for: documents, graphics with sharp edges, when quality is critical

**Lossy**:
- Smaller files, faster encoding
- Imperceptible quality loss at quality 80+
- Use for: photos, most images

**Recommendation**: Use lossy (`lossless: false`) for photos, lossless for graphics/documents.

### 4. Memory Considerations

**Memory usage peaks during**:
1. Image decoding (full-resolution bitmap in memory)
2. Resizing (temporary buffers)
3. WebP encoding (RGBA buffer + encoding workspace)

**To avoid OOM**:
- **Resize early**: Use `maxLongEdge` to limit decoded image size
- **Process in background**: Already handled by the library
- **Release bitmaps promptly**: Handled automatically

**Large image handling**:
- For very large images (>10MP), consider preprocessing with a smaller `maxLongEdge`
- The library uses platform-native decoders that can sample during decode (Android `inSampleSize`, iOS can decode at reduced resolution)

## Recommended maxLongEdge Values

| Use Case | maxLongEdge | Notes |
|----------|-------------|-------|
| Thumbnails | 512 | Small, fast |
| Mobile display | 1024 | Good for most mobile screens |
| Retina display | 2048 | **Recommended default** |
| High-res display | 3072 | For 4K displays |
| Original size | Omit | No resize |

## Troubleshooting Slow Encodes

### Issue: Encoding takes >5 seconds

**Possible causes**:
1. **Image too large**: Use `maxLongEdge` to resize
2. **Method too high**: Use `method: 1-3` for faster encoding
3. **Lossless mode**: Use lossy (`lossless: false`) unless needed

**Solutions**:
```typescript
// Fast encoding
await convertImageToWebP({
  inputPath: '/path/to/image.jpg',
  preset: 'fast',  // method: 1, quality: 78
  maxLongEdge: 2048,
});

// Or customize
await convertImageToWebP({
  inputPath: '/path/to/image.jpg',
  method: 1,  // Fastest
  quality: 75,
  maxLongEdge: 1024,  // Smaller = faster
});
```

### Issue: High memory usage / OOM

**Solutions**:
- Reduce `maxLongEdge` (e.g., 1024 instead of 4096)
- Process images sequentially, not in parallel
- Ensure bitmaps are released (handled automatically, but avoid holding references)

### Issue: Large output files

**Solutions**:
- Reduce `quality` (try 70-75)
- Increase `method` (try 4-5)
- Use `preset: 'small'` (quality: 74, method: 5)
- Ensure `maxLongEdge` is set (smaller images = smaller files)

## Performance Benchmarks

Approximate encoding times (on modern devices, 2000×1500 image):

| Preset | Time | File Size (approx) |
|--------|------|-------------------|
| fast | ~0.5s | Medium |
| balanced | ~1.0s | Medium |
| small | ~1.5s | Small |
| lossless | ~2.0s | Large |

*Note: Actual times vary by device, image content, and size.*

## Best Practices

1. **Always set `maxLongEdge`**: Prevents encoding unnecessarily large images
2. **Use presets**: They're tuned for common use cases
3. **Process sequentially**: Avoid parallel conversions of large images
4. **Cache results**: WebP files are idempotent, cache the output
5. **Batch processing**: Process multiple images one at a time, not simultaneously

## Platform-Specific Notes

### iOS
- Uses CoreGraphics for resizing (high quality)
- ImageIO handles format detection efficiently
- Background queue prevents UI blocking

### Android
- Uses `inSampleSize` for efficient downsampling during decode
- Falls back to `BitmapFactory` on older Android versions
- Single executor thread prevents resource contention
