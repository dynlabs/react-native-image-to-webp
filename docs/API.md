# API Reference

Complete TypeScript API documentation for `@dynlabs/react-native-image-to-webp`.

## Installation

```bash
npm install @dynlabs/react-native-image-to-webp
# or
yarn add @dynlabs/react-native-image-to-webp
```

## Requirements

- React Native >= 0.76
- New Architecture (TurboModules) enabled
- iOS 13.0+ / Android API 24+

## Basic Usage

Zero configuration — a single call is production-ready:

```typescript
import { convertImageToWebP } from '@dynlabs/react-native-image-to-webp';

const result = await convertImageToWebP({ inputPath: asset.uri });

console.log(`Output: ${result.outputPath}`);
console.log(
  `Saved ${result.savedPercent.toFixed(1)}% in ${result.durationMs}ms`
);
console.log(`Dimensions: ${result.width}×${result.height}`);
```

## API

### `convertImageToWebP(options: ConvertOptions): Promise<ConvertResult>`

Converts an image file to WebP format.

#### Parameters

##### `options: ConvertOptions`

```typescript
type ConvertOptions = {
  inputPath: string; // Required: path or URI of the source image
  outputPath?: string; // Optional: default is a unique file in the app cache dir
  preset?: ConvertPreset; // Optional: preset name (default: 'balanced')
  maxLongEdge?: number; // Optional: resize limit; 0 disables; default from preset
  quality?: number; // Optional: quality 0-100 (overrides preset)
  method?: number; // Optional: compression method 0-6 (overrides preset)
  lossless?: boolean; // Optional: lossless encoding (overrides preset)
  stripMetadata?: boolean; // Optional: strip metadata (default: true)
  threadLevel?: number; // Optional: libwebp thread_level, 0 or 1 (overrides preset)
  exact?: boolean; // Optional: preserve RGB in transparent areas (overrides preset)
  debug?: boolean; // Optional: log a timing breakdown for this call
  onProgress?: (progress: ConversionProgress) => void; // Optional: progress callback
};

type ConversionProgress = {
  percent: number; // 0-100
  phase: 'decode' | 'encode' | 'done';
};
```

**Fields**:

- **`inputPath`** (required): Path or URI of the source image. Supported forms:
  - Plain file paths (`/data/user/0/.../photo.jpg`)
  - `file://` URIs
  - `content://` URIs on Android (image pickers, camera, Storage Access Framework)
  - `ph://` photo-library URIs on iOS (requires photo-library access)
- **`outputPath`** (optional): Destination for the WebP file. If omitted, a uniquely named file is created in the app cache directory (`<cache>/webp/<name>-<unique>.webp`), which is always writable and never overwrites existing files.
- **`preset`** (optional): Preset configuration. See [Presets](#presets). Default: `'balanced'`.
- **`maxLongEdge`** (optional): Resizes so the longer edge is at most this value; aspect ratio is preserved. Defaults to the preset value (2048 for `balanced`/`small`/`fast`, no resize for `lossless`/`document`). Pass `0` to keep original dimensions.
- **`quality`** (optional): Quality 0-100. Higher = better quality, larger files.
- **`method`** (optional): Compression method 0-6. Higher = better compression, slower encoding.
- **`lossless`** (optional): Use lossless encoding.
- **`stripMetadata`** (optional): Strip metadata from the output. Default: `true`. When `false`, EXIF from JPEG sources is embedded in the WebP container (with the orientation tag neutralized, since rotation is baked into the pixels).
- **`threadLevel`** (optional): libwebp `thread_level` (0 or 1). Presets default to 1 (multi-threaded encoding).
- **`exact`** (optional): Preserve RGB values in fully transparent areas.
- **`debug`** (optional): Log the effective options and a native decode/encode timing breakdown for this call. See also [`setDebugLogging`](#setdebugloggingenabled-boolean-void).
- **`onProgress`** (optional): Called with overall progress (0-100) and the current phase while the conversion runs.

#### Returns

```typescript
type ConvertResult = {
  outputPath: string; // Path to the created WebP file
  width: number; // Output width in pixels
  height: number; // Output height in pixels
  sizeBytes: number; // Output file size in bytes
  originalWidth: number; // Source width in pixels
  originalHeight: number; // Source height in pixels
  originalSizeBytes: number; // Source file size in bytes
  savedBytes: number; // originalSizeBytes - sizeBytes (can be negative)
  savedPercent: number; // Percentage saved, e.g. 48.7
  durationMs: number; // Total conversion time, measured natively
};
```

#### Throws

`ImageToWebPError` with one of these error codes:

- **`INVALID_INPUT`**: Invalid input parameters (e.g., invalid `maxLongEdge`, `quality`, or `method` values)
- **`FILE_NOT_FOUND`**: Input file does not exist or cannot be read
- **`DECODE_FAILED`**: Failed to decode the input image
- **`ENCODE_FAILED`**: Failed to encode WebP
- **`IO_ERROR`**: File I/O error (e.g., cannot write output file)
- **`UNSUPPORTED_FORMAT`**: Reserved. Unsupported formats currently surface as `DECODE_FAILED`

### `useImageConverter(): UseImageConverterResult`

React hook wrapping `convertImageToWebP` with state management:

```typescript
const { convert, isConverting, progress, result, error, reset } =
  useImageConverter();
```

- **`convert(options)`**: runs a conversion; resolves/throws like `convertImageToWebP`
- **`isConverting`**: whether a conversion is in flight
- **`progress`**: `{ percent, phase }` of the running conversion, or `null` when idle
- **`result`**: last successful `ConvertResult`
- **`error`**: last error, or `null`
- **`reset()`**: clears all state

### `setDebugLogging(enabled: boolean): void`

Globally enables verbose logging for every conversion: effective options and the final result on the JS console, plus a native decode/encode timing breakdown in logcat (`ImageToWebP` tag) / os_log. Equivalent to passing `debug: true` on each call.

## Presets

Presets provide sensible defaults for common use cases. You can override individual parameters. Since v1.1.0 every preset resolves **all** encoder options on the JS side (single source of truth), including the default resize.

| Preset       | quality | method | lossless | exact | maxLongEdge | Use for                                     |
| ------------ | ------- | ------ | -------- | ----- | ----------- | ------------------------------------------- |
| `balanced` ✓ | 80      | 3      | no       | no    | 2048        | General-purpose, photos, most use cases     |
| `small`      | 74      | 5      | no       | no    | 2048        | Bandwidth-critical uploads, thumbnails      |
| `fast`       | 78      | 1      | no       | no    | 2048        | Batch processing, speed over size           |
| `lossless`   | 100     | 4      | yes      | yes   | original    | Graphics with sharp edges, pixel-perfection |
| `document`   | 82      | 4      | no       | yes   | original    | Scans, screenshots, text, transparency      |

All presets strip metadata and use `threadLevel: 1` by default.

## Progress Observation

```typescript
await convertImageToWebP({
  inputPath: asset.uri,
  onProgress: ({ percent, phase }) => {
    // phase: 'decode' -> 'encode' -> 'done'
    setProgressBar(percent);
  },
});
```

Progress events are emitted natively (libwebp's encoder progress hook), correlated per conversion, and automatically unsubscribed when the conversion settles.

## Examples

### Zero-config conversion

```typescript
const result = await convertImageToWebP({ inputPath: asset.uri });
// balanced preset, resized to 2048px long edge,
// written to <cache>/webp/<name>-<unique>.webp
```

### From an image picker (Android content:// / iOS ph://)

```typescript
const response = await launchImageLibrary({ mediaType: 'photo' });
const result = await convertImageToWebP({
  inputPath: response.assets[0].uri, // content://... or ph://... just work
});
```

### Keep original dimensions

```typescript
await convertImageToWebP({ inputPath, maxLongEdge: 0 });
```

### Custom output path

```typescript
await convertImageToWebP({
  inputPath: '/path/to/image.jpg',
  outputPath: '/path/to/output/custom.webp',
});
```

### Overriding preset values

```typescript
await convertImageToWebP({
  inputPath: '/path/to/image.jpg',
  preset: 'balanced',
  quality: 90, // Override preset quality
  maxLongEdge: 1024, // Override preset resize
});
```

### Preserve EXIF metadata (JPEG sources)

```typescript
await convertImageToWebP({
  inputPath: '/path/to/photo.jpg',
  stripMetadata: false,
});
```

## Testing with Jest

TurboModules are unavailable in Jest. Add this to your Jest setup file:

```js
jest.mock('@dynlabs/react-native-image-to-webp', () =>
  require('@dynlabs/react-native-image-to-webp/jest')
);
```

The mock exports the full public API: `convertImageToWebP` is a `jest.fn()`
resolving realistic results (and firing `onProgress`), `useImageConverter`
works with real React state, and `buildMockResult(options)` helps craft
custom resolved values:

```typescript
import {
  convertImageToWebP,
  buildMockResult,
} from '@dynlabs/react-native-image-to-webp';

(convertImageToWebP as jest.Mock).mockResolvedValueOnce({
  ...buildMockResult(),
  sizeBytes: 1,
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

**Note**: Format support depends on the platform's native decoders. Unsupported formats throw `DECODE_FAILED`.

## Platform-Specific Notes

### iOS

- Uses `CGImageSource` (ImageIO); images are decoded directly at the target size (`CGImageSourceCreateThumbnailAtIndex`) — far less memory for large photos
- EXIF orientation is applied to pixel data (baked in)
- `ph://` assets are loaded via `PHImageManager` (photo-library permission required)
- Runs on a concurrent background queue

### Android

- Uses `ImageDecoder` (API 28+, decodes at target size, handles orientation) or `BitmapFactory` + `ExifInterface` (API 24-27)
- `content://` URIs are resolved through the `ContentResolver`
- Pixel extraction uses a single `copyPixelsToBuffer` bulk copy (no per-pixel loops)
- Conversions run on a small thread pool, so batches convert in parallel

## Error Handling

Errors carry a stable `code` (also available on the `ImageToWebPError` class):

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
  ConversionProgress,
  ConversionPhase,
  ErrorCode,
  UseImageConverterResult,
} from '@dynlabs/react-native-image-to-webp';
```
