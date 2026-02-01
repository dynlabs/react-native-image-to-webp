# libwebp Setup Guide

This library uses [libwebp](https://github.com/webmproject/libwebp) (>= 1.6.0) for WebP encoding.

## Quick Setup

**You only need to vendor libwebp sources - everything else is already configured!**

### Option 1: Use the Script (Recommended)

**Windows (PowerShell):**
```powershell
.\scripts\vendor-libwebp.ps1
```

**macOS/Linux:**
```bash
chmod +x scripts/vendor-libwebp.sh
./scripts/vendor-libwebp.sh
```

**Or via yarn:**
```bash
yarn vendor:libwebp
```

### Option 2: Manual Setup

```bash
cd cpp
git clone https://github.com/webmproject/libwebp.git vendor/libwebp
cd vendor/libwebp
git checkout v1.6.0
cd ../../..
```

## What Happens Next

Once libwebp is vendored:

1. **Build files auto-detect libwebp** - Both iOS (`ReactNativeImageToWebp.podspec`) and Android (`CMakeLists.txt`) automatically detect and include libwebp sources if they exist at `cpp/vendor/libwebp/src`

2. **C++ code is ready** - The implementation in `cpp/ImageToWebP.cpp` is already complete and will compile once libwebp is present (it's behind `#ifdef WEBP_AVAILABLE`)

3. **Build flags are set** - Release flags (`-O3 -DNDEBUG`) and `WEBP_AVAILABLE` macro are automatically configured

## Verification

After vendoring, verify libwebp is detected:

- **iOS**: Run `pod install` in `example/ios` - you should see libwebp sources included
- **Android**: Build will show "libwebp found, including sources" message

## Current Status

✅ Build files configured (auto-detect libwebp)  
✅ C++ implementation ready (behind `#ifdef WEBP_AVAILABLE`)  
✅ Compiler flags configured  
⏳ **You need to:** Vendor libwebp sources (run the script above)

## Implementation Details

The `cpp/ImageToWebP.cpp` file uses libwebp's advanced API:

1. `WebPConfigInit()` and `WebPConfigPreset()` for configuration
2. `WebPPictureInit()` and `WebPPictureImportRGBA()` for image data
3. `WebPMemoryWriter` for output buffering
4. `WebPEncode()` for encoding
5. Proper cleanup of all libwebp structures

See libwebp documentation: https://developers.google.com/speed/webp/docs/api
