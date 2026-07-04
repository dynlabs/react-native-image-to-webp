# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [2.0.0] - 2026-07-04

See [MIGRATION.md](MIGRATION.md) for a step-by-step upgrade guide.

### Breaking Changes

- **Default output location**: when `outputPath` is omitted, output goes to a uniquely named file in the app cache directory instead of `<input dir>/<name>.webp` (which was often read-only and could overwrite files). Pass `outputPath` explicitly to keep the old location
- **Default resize**: `balanced`, `small` and `fast` presets now resize to a 2048px long edge by default. Pass `maxLongEdge: 0` to keep original dimensions
- **Unsupported formats** now reject with `DECODE_FAILED`; `UNSUPPORTED_FORMAT` is reserved and no longer emitted
- **`lossless` preset** now also sets `exact: true` (preserves RGB in transparent areas)
- **Alpha correctness**: semi-transparent pixels are no longer encoded premultiplied, so outputs are not byte-identical to 1.x for images with alpha
- **Requires React Native >= 0.76** (codegen event emitters); a full native rebuild is required (`pod install`, Gradle sync) — this release is not OTA-updatable

### Added

- **Zero-config inputs**: `content://` URIs (Android) and `ph://` photo-library URIs (iOS) are now resolved natively, so image-picker results work directly
- **Progress events**: `onProgress` callback (backed by libwebp's native progress hook) and a `progress` value on `useImageConverter`
- **Richer results**: `originalWidth`, `originalHeight`, `originalSizeBytes`, `savedBytes`, `savedPercent` and `durationMs` on every `ConvertResult`
- **Debug logging**: `setDebugLogging(true)` or per-call `debug: true` logs effective options and a native decode/encode timing breakdown
- **EXIF preservation**: `stripMetadata: false` now embeds JPEG EXIF into the WebP container (orientation tag neutralized) on both platforms
- **Jest mock**: `@dynlabs/react-native-image-to-webp/jest` for painless app testing
- Unit tests for validation, preset resolution and the conversion pipeline
- `threadLevel` and `exact` exposed as (advanced) options; `document` preset documented
- Migration guide (MIGRATION.md) for upgrading from 1.x

### Changed

- Preset defaults are now resolved entirely on the JS side (single source of truth); native layers no longer guess
- Android: conversions run on a small thread pool instead of a single-thread executor, so batches convert in parallel
- Android: pixel extraction uses one `copyPixelsToBuffer` bulk copy instead of a per-pixel Kotlin loop
- Android: `ImageDecoder` decodes directly at the target size (API 28+)
- iOS: images are decoded downsampled via `CGImageSourceCreateThumbnailAtIndex` (much lower memory for large photos), with EXIF orientation applied by ImageIO
- Native error codes are mapped via the rejection `code` instead of message sniffing
- Improved encoder error messages (human-readable libwebp error descriptions)

### Fixed

- Android: EXIF orientation is now applied on API 24-27 (previously a no-op, portrait photos came out rotated)
- Android: `stripMetadata` is no longer silently ignored
- Alpha images are no longer encoded with premultiplied colors (previously darkened semi-transparent pixels on both platforms)
- `file://` URIs with percent-encoded characters are decoded correctly

## [1.0.1] - 2026-03-08

### Fixed

- Fixed invalid `.podspec` source Git URL (was `.git`, now points to the correct GitHub URL)

### Changed

- Expanded `keywords` in `package.json` for better npm and search engine discoverability
- Improved `description` in `package.json` to be more specific and keyword-rich
- Filled in `author` field in `package.json`
- Removed stray character from README

## [1.0.0] - 2026-03-08

### Added

- Initial release with TurboModule support
- Image to WebP conversion with presets (`balanced`, `small`, `fast`, `lossless`)
- Resize support via `maxLongEdge`
- iOS and Android native implementations using `libwebp`
- `useImageConverter` React hook for easy integration
- EXIF metadata stripping by default
- Accurate output dimensions and file size reporting
