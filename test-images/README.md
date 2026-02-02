# Test Images

This directory contains test images in different resolutions for E2E testing.

## Images

- **test-1080p.jpg** - 1920x1080 (Full HD)
- **test-2k.jpg** - 2560x1440 (QHD/2K)
- **test-4k.jpg** - 3840x2160 (UHD/4K)

## Generating Images

To regenerate the test images:

```bash
python scripts/generate-test-images.py
```

## Pushing to Android Device

To push images to a connected Android device/emulator:

**Windows:**
```powershell
powershell -ExecutionPolicy Bypass -File scripts/push-test-images-android.ps1
```

**Linux/macOS:**
```bash
bash scripts/push-test-images-android.sh
```

Or manually:
```bash
adb push test-images/test-1080p.jpg /sdcard/Download/test-images/
adb push test-images/test-2k.jpg /sdcard/Download/test-images/
adb push test-images/test-4k.jpg /sdcard/Download/test-images/
```

## Usage in Tests

### Maestro Tests

Use these paths in your Maestro test flows:

```yaml
- inputText: "/sdcard/Download/test-images/test-1080p.jpg"
```

### Manual Testing

In the app's "Manual Path" input field, use:
- `/sdcard/Download/test-images/test-1080p.jpg`
- `/sdcard/Download/test-images/test-2k.jpg`
- `/sdcard/Download/test-images/test-4k.jpg`

## Image Details

All images are JPEG format with:
- Colorful gradient backgrounds
- Resolution labels
- High quality (95% JPEG quality)
- File sizes: ~50KB (1080p), ~100KB (2K), ~170KB (4K)
