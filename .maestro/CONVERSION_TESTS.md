# Image Conversion Tests

This document describes the Maestro E2E tests that verify the actual image conversion functionality using test images.

## Test Images

Test images are available at `/sdcard/Download/test-images/`:
- **test-1080p.jpg** - 1920×1080 (Full HD) - ~53 KB
- **test-2k.jpg** - 2560×1440 (QHD) - ~107 KB  
- **test-4k.jpg** - 3840×2160 (UHD) - ~170 KB

## Conversion Tests

### 07-convert-1080p.yaml
**Purpose**: Test conversion of 1080p image using manual path input

**Steps**:
1. Enter path: `/sdcard/Download/test-images/test-1080p.jpg`
2. Convert with 'balanced' preset
3. Verify success message
4. Verify output image is displayed
5. Verify results section shows conversion details

**Expected Result**: Successfully converts 1920×1080 JPEG to WebP

### 08-convert-2k.yaml
**Purpose**: Test conversion of 2K image

**Steps**:
1. Enter path: `/sdcard/Download/test-images/test-2k.jpg`
2. Convert with 'balanced' preset
3. Verify conversion succeeds (longer timeout for larger image)
4. Verify output and results

**Expected Result**: Successfully converts 2560×1440 JPEG to WebP

### 09-convert-4k.yaml
**Purpose**: Test conversion of 4K image

**Steps**:
1. Enter path: `/sdcard/Download/test-images/test-4k.jpg`
2. Convert with 'balanced' preset
3. Verify conversion succeeds (longer timeout for 4K image)
4. Verify output and results

**Expected Result**: Successfully converts 3840×2160 JPEG to WebP

### 10-convert-all-resolutions.yaml
**Purpose**: Test conversion of all resolutions with different presets

**Steps**:
1. Convert 1080p with 'small' preset
2. Convert 2K with 'fast' preset
3. Convert 4K with 'lossless' preset
4. Verify all conversions complete

**Expected Result**: All conversions succeed with different presets

### 11-convert-with-resize.yaml
**Purpose**: Test conversion with maxLongEdge resize option

**Steps**:
1. Convert 4K image with maxLongEdge=2048
2. Verify output dimensions are resized
3. Convert 2K image with maxLongEdge=1024
4. Verify resize works correctly

**Expected Result**: Images are resized according to maxLongEdge parameter

## Running Conversion Tests

### Run Single Test
```bash
# Make sure app is running
adb shell am start -n dynlabs.reactnativeimagetowebp.example/.MainActivity

# Run 1080p conversion test
maestro test .maestro/flows/android/07-convert-1080p.yaml

# Run 2K conversion test
maestro test .maestro/flows/android/08-convert-2k.yaml

# Run 4K conversion test
maestro test .maestro/flows/android/09-convert-4k.yaml
```

### Run All Conversion Tests
```bash
# Run all resolution tests
maestro test .maestro/flows/android/07-convert-1080p.yaml .maestro/flows/android/08-convert-2k.yaml .maestro/flows/android/09-convert-4k.yaml

# Or run the comprehensive test
maestro test .maestro/flows/android/10-convert-all-resolutions.yaml
```

### Visual Testing
```bash
# Run with visual output (watch emulator window)
yarn test:e2e:visual
```

## Prerequisites

1. **Test images must be pushed to device**:
   ```bash
   yarn test:images:push
   ```

2. **App must be installed**:
   ```bash
   cd example
   yarn android
   ```

3. **Device/emulator must be connected**:
   ```bash
   adb devices
   ```

## What Gets Tested

✅ Image file path input  
✅ Conversion with different presets  
✅ Conversion of different resolutions (1080p, 2K, 4K)  
✅ Resize functionality (maxLongEdge)  
✅ Success/failure handling  
✅ Output image display  
✅ Results display (dimensions, file size, duration)  

## Test Timeouts

- **1080p**: 15 seconds
- **2K**: 20 seconds  
- **4K**: 30 seconds

These timeouts account for larger images taking longer to process.

## Troubleshooting

### Test fails with "File not found"
- Ensure test images are pushed: `yarn test:images:push`
- Verify files exist: `adb shell ls -lh /sdcard/Download/test-images/`

### Conversion timeout
- Larger images (4K) may need more time
- Increase timeout in test file if needed

### App not launching
- Launch manually: `adb shell am start -n dynlabs.reactnativeimagetowebp.example/.MainActivity`
- Or use test files that don't use `launchApp`
