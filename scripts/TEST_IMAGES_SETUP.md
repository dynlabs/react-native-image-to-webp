# Test Images Setup Guide

## Overview

Test images in three resolutions (1080p, 2K, and 4K) have been created and pushed to the Android device for E2E testing.

## Generated Images

| Resolution | Dimensions | File Size | Location |
|------------|-----------|-----------|----------|
| 1080p (Full HD) | 1920×1080 | ~53 KB | `/sdcard/Download/test-images/test-1080p.jpg` |
| 2K (QHD) | 2560×1440 | ~107 KB | `/sdcard/Download/test-images/test-2k.jpg` |
| 4K (UHD) | 3840×2160 | ~170 KB | `/sdcard/Download/test-images/test-4k.jpg` |

## Quick Commands

### Generate Images
```bash
yarn test:images:generate
# or
python scripts/generate-test-images.py
```

### Push to Device
```bash
yarn test:images:push
# or
powershell -ExecutionPolicy Bypass -File scripts/push-test-images-android.ps1
```

### Verify on Device
```bash
adb shell ls -lh /sdcard/Download/test-images/
```

## Usage in Maestro Tests

The manual path test (`04-manual-path.yaml`) now uses:
```yaml
- inputText: "/sdcard/Download/test-images/test-1080p.jpg"
```

You can update other tests to use:
- `/sdcard/Download/test-images/test-1080p.jpg` (1080p)
- `/sdcard/Download/test-images/test-2k.jpg` (2K)
- `/sdcard/Download/test-images/test-4k.jpg` (4K)

## Image Properties

- **Format**: JPEG
- **Quality**: 95%
- **Content**: Colorful gradient backgrounds with resolution labels
- **Purpose**: Testing image conversion at different resolutions

## Files Created

1. `scripts/generate-test-images.py` - Python script to generate test images
2. `scripts/push-test-images-android.ps1` - PowerShell script to push images to Android
3. `scripts/push-test-images-android.sh` - Bash script to push images to Android
4. `test-images/README.md` - Documentation for test images
5. `test-images/*.jpg` - Generated test images (gitignored)

## Verification

All images have been successfully pushed and verified:
- ✅ Files exist on device
- ✅ Correct file sizes
- ✅ Valid JPEG format
- ✅ Correct dimensions

## Next Steps

1. Update Maestro tests to use these image paths
2. Test image conversion with different resolutions
3. Verify performance with larger images (2K, 4K)
