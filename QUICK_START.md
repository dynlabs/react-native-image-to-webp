# Quick Start Guide

Get the library up and running in 5 minutes.

## 1. Vendor libwebp

**macOS/Linux:**
```bash
chmod +x scripts/vendor-libwebp.sh && ./scripts/vendor-libwebp.sh
```

**Windows:**
```powershell
.\scripts\vendor-libwebp.ps1
```

**Manual:**
```bash
cd cpp
git clone https://github.com/webmproject/libwebp.git vendor/libwebp
cd vendor/libwebp && git checkout v1.6.0 && cd ../../..
```

## 2. Verify Integration

The build files are already configured to automatically detect and include libwebp. The C++ code will compile with libwebp support once the sources are in place.

## 3. Install Dependencies

```bash
yarn install
```

## 4. Build Example App

**iOS:**
```bash
cd example/ios && pod install && cd ../..
yarn example:ios
```

**Android:**
```bash
yarn example:android
```

## 5. Test

1. Open the example app
2. Enter a path to an image file
3. Select a preset and click "Convert"
4. Check the output WebP file

## Troubleshooting

**"libwebp not found" warning:**
- Ensure libwebp is cloned to `cpp/vendor/libwebp/`
- Check that `cpp/vendor/libwebp/src/webp/encode.h` exists

**Build errors:**
- Clean build: `yarn clean`
- iOS: Delete `example/ios/Pods` and run `pod install`
- Android: `cd example/android && ./gradlew clean`

**Conversion fails:**
- Verify input image path is correct
- Check file permissions
- Ensure output directory exists

## Next Steps

- Read [API.md](docs/API.md) for full API documentation
- Check [PERFORMANCE.md](docs/PERFORMANCE.md) for optimization tips
- See [CONTRIBUTING.md](docs/CONTRIBUTING.md) for development setup
