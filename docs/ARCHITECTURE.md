# Architecture

This document describes the architecture of `@dynlabs/react-native-image-to-webp`, including the repository layout, data flow, and platform-specific implementation details.

## Repository Layout

```
react-native-image-to-webp/
├── src/                          # TypeScript source
│   ├── index.tsx                 # Public API entry point
│   ├── NativeReactNativeImageToWebp.ts  # Codegen spec
│   ├── validation.ts             # Input validation
│   └── presets.ts                # Preset configurations
├── ios/                          # iOS native implementation
│   ├── ReactNativeImageToWebp.h
│   └── ReactNativeImageToWebp.mm # ObjC++ implementation
├── android/                      # Android native implementation
│   ├── src/main/java/.../ReactNativeImageToWebpModule.kt
│   └── src/main/cpp/             # JNI bridge
│       ├── ImageToWebPJNI.cpp
│       └── CMakeLists.txt
├── cpp/                          # Shared C++ code
│   ├── ImageToWebP.h
│   ├── ImageToWebP.cpp           # WebP encoding wrapper
│   └── vendor/libwebp/           # Vendored libwebp sources (>= 1.6.0)
└── example/                      # Example React Native app
```

## Data Flow

### High-Level Flow

```
JavaScript API
    ↓
TypeScript Wrapper (validation + presets)
    ↓
TurboModule Bridge (Codegen)
    ↓
Native Module (iOS/Android)
    ↓
Platform Image Decoder (ImageIO / ImageDecoder)
    ↓
EXIF Orientation Application
    ↓
Resize (if maxLongEdge specified)
    ↓
RGBA Buffer Conversion
    ↓
C++ libwebp Encoder
    ↓
WebP File Output
    ↓
Result Metadata Return
```

### Detailed Flow

1. **JavaScript Layer** (`src/index.tsx`)
   - User calls `convertImageToWebP(options)`
   - Input validation occurs
   - Preset defaults are applied
   - Options are passed to TurboModule

2. **TurboModule Bridge** (`src/NativeReactNativeImageToWebp.ts`)
   - Codegen-generated TypeScript interface
   - Bridges to native module via React Native's TurboModule system
   - Returns Promise with result

3. **Native Module Layer**

   **iOS** (`ios/ReactNativeImageToWebp.mm`):
   - Runs on background queue (dispatch queue)
   - Uses `CGImageSource` to decode image
   - Applies EXIF orientation via CoreGraphics transforms
   - Resizes using CoreGraphics if `maxLongEdge` specified
   - Converts to RGBA buffer
   - Calls C++ `encodeWebP()` function
   - Writes output file
   - Returns metadata

   **Android** (`android/.../ReactNativeImageToWebpModule.kt`):
   - Runs on dedicated executor thread
   - Uses `ImageDecoder` (API 28+) or `BitmapFactory` (fallback)
   - Applies EXIF orientation (via ExifInterface)
   - Resizes using `inSampleSize` + `Bitmap.createScaledBitmap()`
   - Converts bitmap to RGBA byte array
   - Calls JNI bridge to C++ `encodeWebP()`
   - Writes output file
   - Returns metadata

4. **C++ Encoding Layer** (`cpp/ImageToWebP.cpp`)
   - Receives RGBA buffer, dimensions, and encoding options
   - Uses libwebp advanced API:
     - `WebPConfigInit()` and `WebPConfigPreset()`
     - `WebPPictureInit()` and `WebPPictureImportRGBA()`
     - `WebPEncode()` with `WebPMemoryWriter`
   - Writes encoded WebP data to file
   - Returns success status and metadata

## Platform-Specific Details

### iOS

- **Image Decoding**: `CGImageSource` (ImageIO framework)
- **Orientation**: CoreGraphics transforms baked into pixels
- **Resizing**: CoreGraphics bitmap context with high-quality interpolation
- **Threading**: Background `dispatch_queue` (DISPATCH_QUEUE_PRIORITY_DEFAULT)
- **Build**: CocoaPods podspec compiles C++ and links libwebp statically

### Android

- **Image Decoding**: `ImageDecoder` (API 28+) or `BitmapFactory` (fallback)
- **Orientation**: `ExifInterface` for EXIF data (TODO: full implementation)
- **Resizing**: `inSampleSize` for approximate downsampling, then `Bitmap.createScaledBitmap()` for final size
- **Threading**: Single-threaded executor service
- **Build**: CMake builds native library, Gradle links via JNI

## libwebp Integration

### Vendor Location

libwebp sources are vendored at `cpp/vendor/libwebp/` (version >= 1.6.0).

### Build Integration

**iOS**:
- Podspec includes libwebp source files
- Compiled as part of the module with release flags (`-O3 -DNDEBUG`)
- Linked statically into the module

**Android**:
- CMakeLists.txt includes libwebp sources
- Compiled as static library or directly into the shared library
- Linked via CMake `target_link_libraries`

### API Usage

The C++ wrapper (`cpp/ImageToWebP.cpp`) uses libwebp's advanced API:

- `WebPConfigInit()` / `WebPConfigPreset()` for configuration
- `WebPPicture` for image data
- `WebPMemoryWriter` for output buffering
- `WebPEncode()` for encoding

This provides fine-grained control over quality, method, lossless mode, and threading.

## Threading Model

All heavy work (decoding, resizing, encoding) runs **off the main thread**:

- **iOS**: Background `dispatch_queue`
- **Android**: Dedicated `ExecutorService` thread

This ensures the UI/JS thread is never blocked during conversion operations.

## Memory Management

- **iOS**: Uses `@autoreleasepool` for automatic memory management
- **Android**: Explicit `bitmap.recycle()` calls
- **C++**: Manual memory management with RAII patterns where possible
- **libwebp**: All structures freed after encoding completes

## Error Handling

Errors are propagated through the stack:

1. Native errors mapped to error codes (FILE_NOT_FOUND, DECODE_FAILED, etc.)
2. Wrapped in `ImageToWebPError` at JavaScript layer
3. Promise rejection with structured error information
