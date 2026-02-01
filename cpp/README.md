# C++ Shared Code

This directory contains shared C++ code for WebP encoding using libwebp.

## libwebp Vendor Setup

To set up libwebp:

1. Download libwebp source (>= 1.6.0) from https://github.com/webmproject/libwebp
2. Extract to `cpp/vendor/libwebp/`
3. The build systems (CMake for Android, CocoaPods for iOS) will compile libwebp as a static library

## Structure

- `ImageToWebP.h` / `ImageToWebP.cpp`: C++ wrapper around libwebp encoding API
- `vendor/libwebp/`: Vendored libwebp source (to be added)

## Build Integration

- **Android**: CMakeLists.txt includes libwebp sources and links statically
- **iOS**: Podspec includes libwebp sources and compiles with the module
