# Maestro E2E Tests - Quick Start Guide

## Installation

Install Maestro CLI:

```bash
# macOS/Linux
curl -Ls "https://get.maestro.mobile.dev" | bash

# Windows (PowerShell)
powershell -Command "iwr -useb https://get.maestro.mobile.dev | iex"
```

## Quick Commands

### Run All Tests

```bash
# Android
yarn test:e2e:android
# or
maestro test .maestro/flows/android/

# iOS
yarn test:e2e:ios
# or
maestro test .maestro/flows/ios/
```

### Run Specific Test

```bash
# Android
maestro test .maestro/flows/android/01-basic-conversion.yaml

# iOS
maestro test .maestro/flows/ios/01-basic-conversion.yaml
```

### Run Tests on Specific Device

```bash
# List devices
adb devices  # Android
xcrun simctl list devices  # iOS

# Run on specific device
maestro test .maestro/flows/android/ --device <device-id>
maestro test .maestro/flows/ios/ --device <device-id>
```

## Test Flows Overview

### Android Flows
1. **01-basic-conversion.yaml** - Basic image selection and conversion
2. **02-all-presets.yaml** - Test all conversion presets
3. **03-max-long-edge.yaml** - Test image resizing
4. **04-manual-path.yaml** - Test manual path input
5. **05-error-handling.yaml** - Test error scenarios
6. **06-camera-permission.yaml** - Test camera flow

### iOS Flows
1. **01-basic-conversion.yaml** - Basic image selection and conversion
2. **02-all-presets.yaml** - Test all conversion presets
3. **03-max-long-edge.yaml** - Test image resizing
4. **04-manual-path.yaml** - Test manual path input (file:// URI)
5. **05-error-handling.yaml** - Test error scenarios
6. **06-camera-permission.yaml** - Test camera flow

## Prerequisites

1. **Build and install the example app**:
   ```bash
   cd example
   yarn android  # or yarn ios
   ```

2. **Ensure device/emulator is running**:
   - Android: `adb devices` should show a device
   - iOS: Simulator should be booted

3. **Grant permissions** (first run only):
   - Photo library access
   - Camera access (for camera tests)

## Troubleshooting

### Tests fail with permission errors
- Manually grant permissions in device settings
- Or uninstall/reinstall the app

### Image selection fails
- Ensure device has images in photo library
- For Android emulator: Add images via drag-and-drop
- For iOS simulator: Add images via Photos app

### Camera tests fail
- Expected on emulators/simulators without camera
- Tests handle this gracefully

### Flaky tests
- Increase timeout values in test files
- Add more wait commands
- Check device performance

## CI/CD

Tests run automatically on:
- Push to `main` or `develop` branches
- Pull requests to `main` or `develop`
- Manual workflow dispatch

See `.github/workflows/e2e-android.yml` and `.github/workflows/e2e-ios.yml` for details.
