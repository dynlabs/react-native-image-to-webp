# Maestro E2E Tests

This directory contains end-to-end tests for the React Native Image to WebP example app using [Maestro](https://maestro.mobile.dev/).

## Prerequisites

1. Install Maestro:
   ```bash
   # macOS/Linux
   curl -Ls "https://get.maestro.mobile.dev" | bash
   
   # Windows (PowerShell)
   powershell -Command "iwr -useb https://get.maestro.mobile.dev | iex"
   ```

2. Ensure the example app is built and installed on your device/emulator:
   ```bash
   # Android
   cd example
   yarn android
   
   # iOS
   cd example
   yarn ios
   ```

## Test Structure

```
.maestro/
├── config.yaml              # Maestro configuration
├── flows/
│   ├── android/            # Android-specific test flows
│   │   ├── 01-basic-conversion.yaml
│   │   ├── 02-all-presets.yaml
│   │   ├── 03-max-long-edge.yaml
│   │   ├── 04-manual-path.yaml
│   │   ├── 05-error-handling.yaml
│   │   └── 06-camera-permission.yaml
│   └── ios/                # iOS-specific test flows
│       ├── 01-basic-conversion.yaml
│       ├── 02-all-presets.yaml
│       ├── 03-max-long-edge.yaml
│       ├── 04-manual-path.yaml
│       ├── 05-error-handling.yaml
│       └── 06-camera-permission.yaml
└── README.md               # This file
```

## Test Coverage

### Android Tests

1. **01-basic-conversion.yaml**: Basic image selection and conversion with default preset
2. **02-all-presets.yaml**: Test all conversion presets (balanced, small, fast, lossless, document)
3. **03-max-long-edge.yaml**: Test image resizing with maxLongEdge option
4. **04-manual-path.yaml**: Test manual path input functionality with test images
5. **05-error-handling.yaml**: Test error scenarios (invalid path, missing image, validation errors)
6. **06-camera-permission.yaml**: Test camera permission flow and photo capture
7. **07-convert-1080p.yaml**: Convert 1080p test image (1920×1080) using manual path
8. **08-convert-2k.yaml**: Convert 2K test image (2560×1440) using manual path
9. **09-convert-4k.yaml**: Convert 4K test image (3840×2160) using manual path
10. **10-convert-all-resolutions.yaml**: Convert all test images with different presets
11. **11-convert-with-resize.yaml**: Test conversion with maxLongEdge resize using test images
12. **12-verify-image-likeness.yaml**: Verify original and converted images are displayed side-by-side for visual comparison

### iOS Tests

1. **01-basic-conversion.yaml**: Basic image selection and conversion with default preset
2. **02-all-presets.yaml**: Test all conversion presets (balanced, small, fast, lossless, document)
3. **03-max-long-edge.yaml**: Test image resizing with maxLongEdge option
4. **04-manual-path.yaml**: Test manual path input functionality (file:// URI format)
5. **05-error-handling.yaml**: Test error scenarios (invalid path, missing image, validation errors)
6. **06-camera-permission.yaml**: Test camera permission flow and photo capture

## Running Tests

### Run All Tests

```bash
# From project root
# Android
maestro test .maestro/flows/android/

# iOS
maestro test .maestro/flows/ios/
```

### Run Specific Test

```bash
# Android
maestro test .maestro/flows/android/01-basic-conversion.yaml

# iOS
maestro test .maestro/flows/ios/01-basic-conversion.yaml
```

### Run Tests with Device/Emulator Selection

```bash
# Android - List devices
adb devices

# Android - Run on specific device
maestro test .maestro/flows/android/ --device <device-id>

# iOS - List simulators
xcrun simctl list devices

# iOS - Run on specific simulator
maestro test .maestro/flows/ios/ --device <device-id>
```

### Run Tests in Cloud (Maestro Cloud)

```bash
# Requires Maestro Cloud account
maestro cloud .maestro/flows/android/
maestro cloud .maestro/flows/ios/
```

## Test Environment Setup

### Android

- Ensure Android emulator or physical device is running
- App must be installed: `dynlabs.reactnativeimagetowebp.example`
- Grant photo library and camera permissions when prompted
- For manual path tests, ensure test images exist at specified paths

### iOS

- Ensure iOS simulator or physical device is running
- App must be installed: `dynlabs.reactnativeimagetowebp.example`
- Grant photo library and camera permissions when prompted
- For manual path tests, use `file://` URI format

## Troubleshooting

### Permission Issues

If tests fail due to permissions:
1. Manually grant permissions in device settings
2. Or uninstall and reinstall the app to trigger permission prompts

### Image Selection Issues

- Ensure device/emulator has images in the photo library
- For Android emulator, you can add images via drag-and-drop or ADB push
- For iOS simulator, add images via Photos app in simulator

### Camera Tests

- Camera tests may fail on emulators/simulators without camera support
- Tests are designed to handle both success and failure cases gracefully

### Flaky Tests

If tests are flaky:
- Increase timeout values in test files
- Add more `waitForAnimationToEnd` commands
- Use `assertVisible` with longer timeouts

## CI/CD Integration

### GitHub Actions Example

```yaml
name: E2E Tests

on: [push, pull_request]

jobs:
  android-e2e:
    runs-on: macos-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
      - name: Setup Maestro
        run: curl -Ls "https://get.maestro.mobile.dev" | bash
      - name: Build Android
        run: cd example && yarn android
      - name: Run Maestro Tests
        run: maestro test .maestro/flows/android/

  ios-e2e:
    runs-on: macos-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
      - name: Setup Maestro
        run: curl -Ls "https://get.maestro.mobile.dev" | bash
      - name: Build iOS
        run: cd example && yarn ios
      - name: Run Maestro Tests
        run: maestro test .maestro/flows/ios/
```

## Additional Resources

- [Maestro Documentation](https://maestro.mobile.dev/)
- [Maestro GitHub](https://github.com/mobile-dev-inc/maestro)
- [Maestro Cloud](https://cloud.mobile.dev/)
