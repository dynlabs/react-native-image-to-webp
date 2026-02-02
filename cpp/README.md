# C++ Shared Code

This directory contains shared C++ code for WebP encoding using libwebp.

## libwebp Dependency

libwebp is automatically managed:

- **iOS**: Installed via CocoaPods dependency (`libwebp ~> 1.6`)
- **Android**: Downloaded automatically via CMake FetchContent during build

No manual setup required.

## Structure

- `ImageToWebP.h` / `ImageToWebP.cpp`: C++ wrapper around libwebp encoding API

## Build Integration

- **Android**: CMakeLists.txt uses FetchContent to download and compile libwebp sources
- **iOS**: Podspec declares CocoaPods dependency, compiled with the module
