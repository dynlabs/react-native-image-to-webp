# @dynlabs/react-native-image-to-webp

A production-ready React Native library for converting images to WebP format with presets, resizing, and high-performance native implementations.

## Features

- 🚀 **TurboModule** (New Architecture only) for optimal performance
- 🎨 **5 Presets**: balanced, small, fast, lossless, document
- 📐 **Smart Resizing**: Preserve aspect ratio with `maxLongEdge`
- 🔒 **Privacy-First**: Strips EXIF metadata by default
- ⚡ **High Performance**: Native decoders + libwebp encoding, all off main thread
- 📱 **iOS & Android**: Platform-optimized implementations
- 🛡️ **Type-Safe**: Full TypeScript support with strict types

## Requirements

- React Native >= 0.68
- **New Architecture (TurboModules) enabled**
- iOS 11.0+ / Android API 24+

## Installation

```bash
npm install @dynlabs/react-native-image-to-webp
# or
yarn add @dynlabs/react-native-image-to-webp
```

### iOS

```bash
cd ios && pod install && cd ..
```

### Android

No additional setup required. The library uses CMake for native builds.

## Quick Start

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

#### Options

| Parameter       | Type            | Required | Default        | Description                               |
| --------------- | --------------- | -------- | -------------- | ----------------------------------------- |
| `inputPath`     | `string`        | ✅       | -              | Path to input image file                  |
| `outputPath`    | `string`        | ❌       | Auto-derived   | Output WebP file path                     |
| `preset`        | `ConvertPreset` | ❌       | `'balanced'`   | Preset configuration                      |
| `maxLongEdge`   | `number`        | ❌       | -              | Max dimension (preserves aspect ratio)    |
| `quality`       | `number`        | ❌       | Preset default | Quality 0-100 (overrides preset)          |
| `method`        | `number`        | ❌       | Preset default | Compression method 0-6 (overrides preset) |
| `lossless`      | `boolean`       | ❌       | Preset default | Use lossless encoding (overrides preset)  |
| `stripMetadata` | `boolean`       | ❌       | `true`         | Strip EXIF metadata                       |

#### Result

```typescript
{
  outputPath: string; // Path to created WebP file
  width: number; // Image width in pixels
  height: number; // Image height in pixels
  sizeBytes: number; // Output file size in bytes
}
```

## Presets

| Preset     | Quality | Method | Use Case                                                |
| ---------- | ------- | ------ | ------------------------------------------------------- |
| `balanced` | 80      | 3      | **Default**. General-purpose, good quality/size balance |
| `small`    | 74      | 5      | Optimized for smaller file sizes                        |
| `fast`     | 78      | 1      | Faster encoding, slightly larger files                  |
| `lossless` | -       | 4      | Perfect quality, larger files                           |
| `document` | 82      | 4      | Documents, images with text/transparency                |

### Examples

```typescript
// Balanced (default)
await convertImageToWebP({
  inputPath: '/path/to/image.jpg',
  preset: 'balanced',
});

// Small file size
await convertImageToWebP({
  inputPath: '/path/to/image.jpg',
  preset: 'small',
  maxLongEdge: 1024,
});

// Lossless
await convertImageToWebP({
  inputPath: '/path/to/image.jpg',
  preset: 'lossless',
});

// Custom quality
await convertImageToWebP({
  inputPath: '/path/to/image.jpg',
  quality: 90,
  method: 4,
  maxLongEdge: 2048,
});
```

## Resizing

Use `maxLongEdge` to resize images while preserving aspect ratio:

```typescript
// Resize so longest edge is max 2048px
await convertImageToWebP({
  inputPath: '/path/to/large-image.jpg',
  maxLongEdge: 2048, // If image is 4000×3000, becomes 2048×1536
});
```

**Recommendation**: Always use `maxLongEdge` for better performance and smaller files. Common values:

- **Thumbnails**: 512
- **Mobile display**: 1024
- **Retina display**: 2048 (recommended default)
- **High-res**: 3072

## Error Handling

```typescript
import {
  convertImageToWebP,
  ImageToWebPError,
  ERROR_CODES,
} from '@dynlabs/react-native-image-to-webp';

try {
  const result = await convertImageToWebP({ inputPath: '/path/to/image.jpg' });
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
      // ... other error codes
    }
  }
}
```

### Error Codes

- `INVALID_INPUT`: Invalid parameters
- `FILE_NOT_FOUND`: Input file doesn't exist
- `DECODE_FAILED`: Failed to decode input image
- `ENCODE_FAILED`: Failed to encode WebP
- `IO_ERROR`: File I/O error
- `UNSUPPORTED_FORMAT`: Unsupported image format

## Supported Formats

### iOS

- JPEG, PNG, HEIC/HEIF, TIFF, GIF (first frame), WebP

### Android

- JPEG, PNG, WebP, HEIF (API 28+), GIF (first frame)

## Performance

- All processing runs **off the main thread** (background queue/executor)
- Uses platform-native decoders (ImageIO on iOS, ImageDecoder/BitmapFactory on Android)
- Resize before encoding for best performance
- Typical encoding time: 0.5-2s for 2000×1500 images (varies by device/preset)

See [PERFORMANCE.md](docs/PERFORMANCE.md) for detailed performance guidance.

## Architecture

This library uses React Native's **New Architecture (TurboModules)**:

- Type-safe Codegen interfaces
- Native implementations for iOS (ObjC++) and Android (Kotlin + JNI)
- Shared C++ code using libwebp for encoding
- Background threading for non-blocking operations

See [ARCHITECTURE.md](docs/ARCHITECTURE.md) for details.

## Documentation

- [API Reference](docs/API.md) - Complete API documentation
- [Architecture](docs/ARCHITECTURE.md) - Technical architecture details
- [Performance Guide](docs/PERFORMANCE.md) - Performance optimization tips
- [Contributing](docs/CONTRIBUTING.md) - Development setup and guidelines
- [Release Process](docs/RELEASE.md) - Versioning and release workflow
- [Security](docs/SECURITY.md) - Security policy and considerations

## Example App

See the [example app](example/) for a complete usage example.

```bash
# Run example on iOS
yarn example:ios

# Run example on Android
yarn example:android
```

## Contributing

See [CONTRIBUTING.md](docs/CONTRIBUTING.md) for development setup and guidelines.

## License

MIT

## Related

- [libwebp](https://github.com/webmproject/libwebp) - WebP encoding library
- [React Native New Architecture](https://reactnative.dev/docs/the-new-architecture/landing-page) - TurboModules documentation

---

Made with ❤️ for the React Native community
