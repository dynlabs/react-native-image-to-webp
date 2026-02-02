#!/bin/bash
# Bash script to push test images to Android device via ADB

set -e

# Get the script directory and project root
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
TEST_IMAGES_DIR="$PROJECT_ROOT/test-images"

# Check if test images directory exists
if [ ! -d "$TEST_IMAGES_DIR" ]; then
    echo "Error: Test images directory not found: $TEST_IMAGES_DIR"
    echo "Please run scripts/generate-test-images.py first"
    exit 1
fi

# Check if adb is available
if ! command -v adb &> /dev/null; then
    echo "Error: ADB not found. Please ensure Android SDK platform-tools are in your PATH"
    exit 1
fi

# Check if device is connected
if ! adb devices | grep -q "device$"; then
    echo "Error: No Android device/emulator connected"
    echo "Please ensure a device is connected and run 'adb devices' to verify"
    exit 1
fi

echo "Pushing test images to Android device..."
echo ""

# Create directory on device
echo "Creating directory on device: /sdcard/Download/test-images"
adb shell mkdir -p /sdcard/Download/test-images

# Push each test image
images=("test-1080p.jpg" "test-2k.jpg" "test-4k.jpg")

for image in "${images[@]}"; do
    local_path="$TEST_IMAGES_DIR/$image"
    remote_path="/sdcard/Download/test-images/$image"
    
    if [ -f "$local_path" ]; then
        echo "Pushing $image..."
        if adb push "$local_path" "$remote_path"; then
            size=$(du -h "$local_path" | cut -f1)
            echo "  ✓ Pushed $image ($size)"
        else
            echo "  ✗ Failed to push $image"
        fi
    else
        echo "  ✗ File not found: $local_path"
    fi
done

echo ""
echo "Verifying files on device..."
adb shell ls -lh /sdcard/Download/test-images/

echo ""
echo "Test images pushed successfully!"
echo ""
echo "Images are available at:"
echo "  /sdcard/Download/test-images/test-1080p.jpg"
echo "  /sdcard/Download/test-images/test-2k.jpg"
echo "  /sdcard/Download/test-images/test-4k.jpg"
echo ""
echo "You can use these paths in your Maestro tests or in the app's manual path input."
