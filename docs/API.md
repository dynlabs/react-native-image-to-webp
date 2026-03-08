# API Reference

Complete TypeScript API documentation for `@dynlabs/react-native-image-to-webp`.

## Installation

```bash
npm install @dynlabs/react-native-image-to-webp
# or
yarn add @dynlabs/react-native-image-to-webp
```

## Requirements

- React Native >= 0.68
- New Architecture (TurboModules) enabled
- iOS 11.0+ / Android API 24+

## Basic Usage

```typescript
import { convertImageToWebP } from '@dynlabs/react-native-image-to-webp';

const result = await convertImageToWebP({
  inputPath: '/path/to/image.jpg',
  preset: 'balanced',
  maxLongEdge: 2048,
});

console.log(`Output: ${result.outputPath}`);
console.log(`Size: ${result.sizeBytes} bytes`);
console.log(`Dimensions: ${result.width}×${result.height}`);
```

## API

### `convertImageToWebP(options: ConvertOptions): Promise<ConvertResult>`

Converts an image file to WebP format.

#### Parameters

##### `options: ConvertOptions`

```typescript
type ConvertOptions = {
  inputPath: string; // Required: Path to input image file
  outputPath?: string; // Optional: Output path (default: inputPath with .webp extension)
  preset?: ConvertPreset; // Optional: Preset name (default: 'balanced')
  maxLongEdge?: number; // Optional: Maximum dimension for resize (preserves aspect ratio)
  quality?: number; // Optional: Quality 0-100 (overrides preset)
  method?: number; // Optional: Compression method 0-6 (overrides preset)
  lossless?: boolean; // Optional: Use lossless encoding (overrides preset)
  stripMetadata?: boolean; // Optional: Strip EXIF metadata (default: true)
};
```

**Fields**:

- **`inputPath`** (required): File system path to the input image. Must exist and be readable.
- **`outputPath`** (optional): Path for the output WebP file. If omitted, derived from `inputPath` by replacing extension with `.webp`.
- **`preset`** (optional): Preset configuration. See [Presets](#presets) below. Default: `'balanced'`.
- **`maxLongEdge`** (optional): If provided, resizes the image so the longer edge (width or height) is at most this value. Aspect ratio is preserved. If omitted, original size is kept.
- **`quality`** (optional): Quality setting 0-100. Higher = better quality, larger files. Overrides preset value if provided.
- **`method`** (optional): Compression method 0-6. Higher = better compression, slower encoding. Overrides preset value if provided.
- **`lossless`** (optional): Use lossless encoding. Overrides preset value if provided.
- **`stripMetadata`** (optional): Strip EXIF metadata from output. Default: `true`. Set to `false` to preserve metadata (note: WebP format has limited metadata support).

#### Returns

```typescript
type ConvertResult = {
  outputPath: string; // Path to the created WebP file
  width: number; // Image width in pixels
  height: number; // Image height in pixels
  sizeBytes: number; // Output file size in bytes
};
```

#### Throws

`ImageToWebPError` with one of these error codes:

- **`INVALID_INPUT`**: Invalid input parameters (e.g., invalid `maxLongEdge`, `quality`, or `method` values)
- **`FILE_NOT_FOUND`**: Input file does not exist or cannot be read
- **`DECODE_FAILED`**: Failed to decode the input image
- **`ENCODE_FAILED`**: Failed to encode WebP
- **`IO_ERROR`**: File I/O error (e.g., cannot write output file)
- **`UNSUPPORTED_FORMAT`**: Input image format is not supported

#### Example

```typescript
import {
  convertImageToWebP,
  ImageToWebPError,
  ERROR_CODES,
} from '@dynlabs/react-native-image-to-webp';

try {
  const result = await convertImageToWebP({
    inputPath: '/path/to/photo.jpg',
    preset: 'balanced',
    maxLongEdge: 2048,
  });
  console.log('Success:', result);
} catch (error) {
  if (error instanceof ImageToWebPError) {
    if (error.code === ERROR_CODES.FILE_NOT_FOUND) {
      console.error('File not found');
    } else {
      console.error('Conversion failed:', error.code, error.message);
    }
  }
}
```

## Presets

Presets provide sensible defaults for common use cases. You can override individual parameters.

### `balanced` (default)

Good balance of quality and file size. Recommended for most images.

```typescript
{
  quality: 80,
  method: 3,
  lossless: false,
  stripMetadata: true,
}
```

**Use for**: General-purpose image conversion, photos, most use cases.

### `small`

Optimized for smaller file sizes. Slightly lower quality, higher compression.

```typescript
{
  quality: 74,
  method: 5,
  lossless: false,
  stripMetadata: true,
}
```

**Use for**: When file size is critical, thumbnails, bandwidth-constrained scenarios.

### `fast`

Optimized for faster encoding. Lower compression method, slightly lower quality.

```typescript
{
  quality: 78,
  method: 1,
  lossless: false,
  stripMetadata: true,
}
```

**Use for**: Batch processing, when encoding speed matters more than file size.

### `lossless`

Lossless encoding. Perfect quality, larger files.

```typescript
{
  lossless: true,
  method: 4,
  stripMetadata: true,
}
```

**Use for**: Graphics with sharp edges, documents, when quality is critical.

### `document`

Optimized for document images. Higher quality, handles alpha channel.

```typescript
{
  quality: 82,
  method: 4,
  lossless: false,
  stripMetadata: true,
  exact: true,  // Applied if alpha channel present
}
```

**Use for**: Scanned documents, images with text, images with transparency.

## Examples

### Basic Conversion

```typescript
const result = await convertImageToWebP({
  inputPath: '/path/to/image.jpg',
});
// Output: /path/to/image.webp
```

### With Resize

```typescript
const result = await convertImageToWebP({
  inputPath: '/path/to/large-image.jpg',
  maxLongEdge: 2048, // Resize to max 2048px on longest edge
});
```

### Custom Output Path

```typescript
const result = await convertImageToWebP({
  inputPath: '/path/to/image.jpg',
  outputPath: '/path/to/output/custom.webp',
});
```

### Using Presets

```typescript
// Small file size
await convertImageToWebP({
  inputPath: '/path/to/image.jpg',
  preset: 'small',
});

// Fast encoding
await convertImageToWebP({
  inputPath: '/path/to/image.jpg',
  preset: 'fast',
});

// Lossless
await convertImageToWebP({
  inputPath: '/path/to/image.jpg',
  preset: 'lossless',
});
```

### Overriding Preset Values

```typescript
await convertImageToWebP({
  inputPath: '/path/to/image.jpg',
  preset: 'balanced',
  quality: 90, // Override preset quality
  maxLongEdge: 1024, // Add resize
});
```

### Custom Quality and Method

```typescript
await convertImageToWebP({
  inputPath: '/path/to/image.jpg',
  quality: 85,
  method: 4,
  maxLongEdge: 2048,
});
```

## Supported Input Formats

### iOS

- JPEG
- PNG
- HEIC/HEIF
- TIFF
- GIF (first frame)
- WebP (re-encoding)

### Android

- JPEG
- PNG
- WebP
- HEIF (API 28+)
- GIF (first frame)

**Note**: Format support depends on the platform's native decoders. Unsupported formats will throw `UNSUPPORTED_FORMAT`.

## Platform-Specific Notes

### iOS

- Uses `CGImageSource` (ImageIO) for decoding
- EXIF orientation is applied to pixel data (baked in)
- Background queue execution

### Android

- Uses `ImageDecoder` (API 28+) or `BitmapFactory` (fallback)
- EXIF orientation support (via ExifInterface)
- Single-threaded executor for background processing
- File paths: Supports `file://` URIs. `content://` URIs may have limitations (document in issues if encountered)

## Error Handling

```typescript
import {
  convertImageToWebP,
  ImageToWebPError,
  ERROR_CODES,
} from '@dynlabs/react-native-image-to-webp';

try {
  const result = await convertImageToWebP({ inputPath: '/invalid/path.jpg' });
} catch (error) {
  if (error instanceof ImageToWebPError) {
    switch (error.code) {
      case ERROR_CODES.FILE_NOT_FOUND:
        console.error('File not found');
        break;
      case ERROR_CODES.DECODE_FAILED:
        console.error('Failed to decode image');
        break;
      case ERROR_CODES.ENCODE_FAILED:
        console.error('Failed to encode WebP');
        break;
      default:
        console.error('Error:', error.code, error.message);
    }
  } else {
    console.error('Unexpected error:', error);
  }
}
```

## TypeScript Types

All types are exported:

```typescript
import type {
  ConvertOptions,
  ConvertResult,
  ConvertPreset,
} from '@dynlabs/react-native-image-to-webp';
```
