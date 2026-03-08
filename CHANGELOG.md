# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

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
