# Architecture Decision Records

This document records key architectural and design decisions made for `@dynlabs/react-native-image-to-webp`.

## New Architecture Only

**Decision**: Support React Native New Architecture (TurboModules + Codegen) only, no legacy bridge.

**Rationale**:

- New Architecture is the future of React Native
- TurboModules provide better performance and type safety
- Codegen eliminates manual bridge code
  **Consequences**:
- Requires React Native >= 0.68+ with New Architecture enabled
- Clearer documentation needed for setup
- No compatibility with older React Native versions

## File-Based API

**Decision**: Use file paths for input/output instead of base64 strings or buffers.

**Rationale**:

- More memory-efficient for large images
- Avoids base64 encoding overhead
- Aligns with native file I/O patterns
- Easier to integrate with file systems

**Consequences**:

- Users must manage file paths
- Platform-specific path handling considerations (content:// URIs on Android)

## maxLongEdge Resize Parameter

**Decision**: Single `maxLongEdge` parameter that preserves aspect ratio.

**Rationale**:

- Simpler API than separate width/height
- Preserves aspect ratio automatically
- Common use case: "make image fit within X pixels"

**Consequences**:

- Cannot specify exact dimensions
- Users must calculate maxLongEdge if they need specific dimensions

## Native Image Decoders

**Decision**: Use platform-native decoders (ImageIO on iOS, ImageDecoder/BitmapFactory on Android) instead of a cross-platform library.

**Rationale**:

- Best performance and format support per platform
- Leverages platform optimizations
- Smaller binary size (no additional dependencies)

**Consequences**:

- Platform-specific code paths
- Format support varies by platform (documented in API.md)

## libwebp Advanced API

**Decision**: Use libwebp's advanced API (WebPConfig, WebPPicture, WebPMemoryWriter) instead of simple encoding functions.

**Rationale**:

- Fine-grained control over encoding parameters
- Support for presets, threading, metadata control
- Better performance with WebPConfigPreset

**Consequences**:

- More complex implementation
- Requires understanding of libwebp API

## Presets System

**Decision**: Provide preset configurations (balanced, small, fast, lossless, document) with sensible defaults.

**Rationale**:

- Simplifies common use cases
- Users don't need to understand quality/method tradeoffs
- Override options available for advanced users

**Consequences**:

- More code to maintain preset definitions
- Need to document when to use each preset

## Resize Before Encode

**Decision**: Resize images before WebP encoding, not after.

**Rationale**:

- Much faster encoding with smaller images
- Lower memory usage
- Better quality (resize before lossy compression)

**Consequences**:

- Cannot recover original resolution from WebP output
- Users must keep originals if needed

## EXIF Orientation Handling

**Decision**: Apply EXIF orientation by baking rotation into pixel data, not preserving metadata.

**Rationale**:

- WebP format doesn't have universal EXIF support
- Ensures correct display regardless of viewer
- Simpler output format

**Consequences**:

- Orientation metadata lost in output
- Cannot "undo" orientation later

## Background Threading

**Decision**: Run all heavy operations (decode, resize, encode) on background threads.

**Rationale**:

- Prevents blocking UI/JS thread
- Better user experience
- Required for large images

**Consequences**:

- Async API (Promise-based)
- Need to handle errors asynchronously

## Error Codes

**Decision**: Use stable string error codes (INVALID_INPUT, FILE_NOT_FOUND, etc.) instead of numeric codes.

**Rationale**:

- More readable and debuggable
- Stable across versions
- Easier to handle programmatically

**Consequences**:

- String comparison instead of enum (TypeScript types help)

## Metadata Stripping Default

**Decision**: Strip metadata by default (`stripMetadata: true`).

**Rationale**:

- Privacy: removes EXIF location data, camera info
- Smaller file sizes
- Most users don't need metadata

**Consequences**:

- Users must explicitly set `stripMetadata: false` to preserve metadata
- Some metadata (like orientation) is applied to pixels anyway

## C++ Shared Code

**Decision**: Use C++ for WebP encoding logic shared between iOS and Android.

**Rationale**:

- Code reuse between platforms
- libwebp is C library, natural fit
- Performance benefits of C++

**Consequences**:

- JNI bridge needed on Android
- ObjC++ needed on iOS
- More complex build setup
