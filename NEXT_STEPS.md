# Next Steps: Completing libwebp Integration

This guide walks you through completing the libwebp integration to make the library fully functional.

## Step 1: Vendor libwebp Sources

### Option A: Using the Script (Recommended)

**On macOS/Linux:**
```bash
chmod +x scripts/vendor-libwebp.sh
./scripts/vendor-libwebp.sh
```

**On Windows (PowerShell):**
```powershell
.\scripts\vendor-libwebp.ps1
```

### Option B: Manual

```bash
cd cpp
git clone https://github.com/webmproject/libwebp.git vendor/libwebp
cd vendor/libwebp
git checkout v1.6.0
cd ../../..
```

## Step 2: Update C++ Implementation

1. **Uncomment libwebp includes** in `cpp/ImageToWebP.cpp`:
   ```cpp
   #include "webp/encode.h"
   #include "webp/mux.h"
   ```

2. **Uncomment the implementation** in `cpp/ImageToWebP.cpp` (the full implementation is already there, just commented out)

## Step 3: Update Android Build (CMakeLists.txt)

Update `android/src/main/cpp/CMakeLists.txt`:

```cmake
# Add libwebp include directory
include_directories(
  ${CMAKE_CURRENT_SOURCE_DIR}/../../../cpp
  ${CMAKE_CURRENT_SOURCE_DIR}/../../../cpp/vendor/libwebp/src
)

# Add libwebp source files
file(GLOB_RECURSE WEBP_SOURCES
  "${CMAKE_CURRENT_SOURCE_DIR}/../../../cpp/vendor/libwebp/src/enc/*.c"
  "${CMAKE_CURRENT_SOURCE_DIR}/../../../cpp/vendor/libwebp/src/dec/*.c"
  "${CMAKE_CURRENT_SOURCE_DIR}/../../../cpp/vendor/libwebp/src/dsp/*.c"
  "${CMAKE_CURRENT_SOURCE_DIR}/../../../cpp/vendor/libwebp/src/utils/*.c"
  "${CMAKE_CURRENT_SOURCE_DIR}/../../../cpp/vendor/libwebp/src/webp/*.c"
)

# Add to sources
set(SOURCES
  ImageToWebPJNI.cpp
  ../../../cpp/ImageToWebP.cpp
  ${WEBP_SOURCES}
)
```

## Step 4: Update iOS Build (Podspec)

Update `ReactNativeImageToWebp.podspec`:

```ruby
s.source_files = "ios/**/*.{h,m,mm,swift,cpp}", 
                 "cpp/**/*.{h,cpp}",
                 "cpp/vendor/libwebp/src/**/*.{c,h}"
```

## Step 5: Test the Integration

1. **Clean builds:**
   ```bash
   # iOS
   cd example/ios && pod install && cd ../..
   yarn example clean
   
   # Android
   cd example/android && ./gradlew clean && cd ../..
   ```

2. **Build example app:**
   ```bash
   yarn example:ios
   # or
   yarn example:android
   ```

3. **Test conversion** in the example app with a sample image

## Step 6: Verify Everything Works

- [ ] libwebp sources are in `cpp/vendor/libwebp/`
- [ ] C++ implementation is uncommented
- [ ] Android CMakeLists.txt includes libwebp sources
- [ ] iOS podspec includes libwebp sources
- [ ] Example app builds successfully
- [ ] Image conversion works end-to-end

## Troubleshooting

### Build Errors

**"webp/encode.h: No such file"**
- Check that libwebp is vendored correctly
- Verify include paths in CMakeLists.txt and podspec

**"Undefined symbols"**
- Ensure all libwebp source files are included in the build
- Check that WEBP_SOURCES includes all necessary directories

**iOS: "Module not found"**
- Run `pod install` in example/ios
- Clean build folder in Xcode

**Android: CMake errors**
- Ensure CMake version >= 3.22.1
- Check that all libwebp .c files are being compiled

### Runtime Errors

**"ENCODE_FAILED"**
- Check that input image is valid
- Verify RGBA buffer is correct size (width * height * 4)
- Check file permissions for output path

## Additional Notes

- The implementation uses libwebp's advanced API for maximum control
- Thread level support requires libwebp built with threading enabled
- Lossless mode uses ARGB format for better quality
- All memory is properly managed (WebPPictureFree, WebPMemoryWriterClear)

## After Integration

Once libwebp is integrated and tested:

1. Update `CHANGELOG.md` with the completion
2. Run full test suite
3. Update documentation if needed
4. Consider adding unit tests for the C++ layer
