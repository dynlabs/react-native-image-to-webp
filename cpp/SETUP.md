# libwebp Setup Guide

This library uses [libwebp](https://github.com/webmproject/libwebp) (>= 1.6.0) for WebP encoding.

## Vendor libwebp Sources

To complete the setup, you need to vendor libwebp sources:

1. **Download libwebp**:

   ```bash
   cd cpp
   git clone https://github.com/webmproject/libwebp.git vendor/libwebp
   cd vendor/libwebp
   git checkout v1.6.0  # or latest stable version
   ```

2. **Update Build Files**:

   **iOS** (`ReactNativeImageToWebp.podspec`):

   ```ruby
   s.source_files += "cpp/vendor/libwebp/src/**/*.{c,h}"
   ```

   **Android** (`android/src/main/cpp/CMakeLists.txt`):

   ```cmake
   # Add libwebp sources
   file(GLOB_RECURSE WEBP_SOURCES
     "${CMAKE_CURRENT_SOURCE_DIR}/../../../cpp/vendor/libwebp/src/enc/*.c"
     "${CMAKE_CURRENT_SOURCE_DIR}/../../../cpp/vendor/libwebp/src/dec/*.c"
     "${CMAKE_CURRENT_SOURCE_DIR}/../../../cpp/vendor/libwebp/src/dsp/*.c"
     "${CMAKE_CURRENT_SOURCE_DIR}/../../../cpp/vendor/libwebp/src/utils/*.c"
     "${CMAKE_CURRENT_SOURCE_DIR}/../../../cpp/vendor/libwebp/src/webp/*.c"
   )

   set(SOURCES ${SOURCES} ${WEBP_SOURCES})

   # Add include directories
   include_directories(
     ${CMAKE_CURRENT_SOURCE_DIR}/../../../cpp/vendor/libwebp/src
   )
   ```

3. **Update C++ Implementation** (`cpp/ImageToWebP.cpp`):

   ```cpp
   #include "webp/encode.h"
   #include "webp/mux.h"

   // Implement encodeWebP() using libwebp API
   ```

## Implementation Notes

The `cpp/ImageToWebP.cpp` file currently has a placeholder implementation. You need to implement `encodeWebP()` using libwebp's advanced API:

1. Initialize `WebPConfig` with `WebPConfigInit()` and `WebPConfigPreset()`
2. Set config options (quality, method, lossless, etc.)
3. Create `WebPPicture` and import RGBA data with `WebPPictureImportRGBA()`
4. Use `WebPMemoryWriter` for output buffering
5. Call `WebPEncode()` to encode
6. Write encoded data to file
7. Clean up all libwebp structures

See libwebp documentation: https://developers.google.com/speed/webp/docs/api

## Build Flags

Both iOS and Android use release flags:

- `-O3`: Maximum optimization
- `-DNDEBUG`: Disable debug assertions

These are already configured in the build files.
