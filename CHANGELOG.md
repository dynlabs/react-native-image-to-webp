# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.0.0] - 2026-03-08

### Added

- Initial release with TurboModule support
- Image to WebP conversion with presets (`balanced`, `small`, `fast`, `lossless`)
- Resize support via `maxLongEdge`
- iOS and Android native implementations using `libwebp`
- `useImageConverter` React hook for easy integration
- EXIF metadata stripping by default
- Accurate output dimensions and file size reporting
