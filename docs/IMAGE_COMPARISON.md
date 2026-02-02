# Image Comparison Feature

## Overview

The example app now displays both the original image and the converted WebP output side-by-side, allowing visual verification that the conversion maintains the likeness of the original image.

## Features

### Side-by-Side Comparison

When a conversion is completed, the app displays:
- **Original Image** (left side) - The input image before conversion
- **WebP Output** (right side) - The converted WebP image

Both images are displayed at the same size (200px height) for easy visual comparison.

### Original Image Display

The original image is displayed:
1. **When selected from gallery/camera** - Shows immediately after selection
2. **When using manual path** - Shows when a valid image path is entered
3. **After conversion** - Remains visible alongside the output for comparison

## UI Changes

### Before Conversion
- Original image is shown in the "Select Image" section
- Label: "Original Image:"

### After Conversion
- New section: "Comparison: Original vs WebP"
- Two images displayed side-by-side:
  - Left: "Original" label with original image
  - Right: "WebP Output" label with converted image
- Output path displayed below for reference

## Visual Verification

The side-by-side display allows users to:
- ✅ Compare visual quality
- ✅ Verify colors are preserved
- ✅ Check that details are maintained
- ✅ Ensure no artifacts or distortions
- ✅ Confirm aspect ratio is preserved

## Technical Details

### Image Display Logic

```typescript
// Original image URI is stored separately
const [originalImageUri, setOriginalImageUri] = useState<string | null>(null);

// For manual paths, create display URI
const displayUri = text.startsWith('file://') ? text : `file://${text}`;
setOriginalImageUri(displayUri);

// Both images displayed in comparison container
<View style={styles.comparisonContainer}>
  <View style={styles.comparisonImageWrapper}>
    <Text>Original</Text>
    <Image source={{ uri: originalImageUri }} />
  </View>
  <View style={styles.comparisonImageWrapper}>
    <Text>WebP Output</Text>
    <Image source={{ uri: outputImageUri }} />
  </View>
</View>
```

### Styling

- **comparisonContainer**: Flexbox row layout with gap
- **comparisonImageWrapper**: Each image takes 50% width (flex: 1)
- **comparisonImage**: Fixed height (200px) with contain resize mode
- **comparisonLabel**: Small label above each image

## Testing

### Maestro Test: 12-verify-image-likeness.yaml

This test verifies:
1. Original image is displayed when path is entered
2. Conversion completes successfully
3. Comparison section appears with both images
4. Both "Original" and "WebP Output" labels are visible
5. Results section shows conversion details

### Manual Testing

1. Enter image path: `/sdcard/Download/test-images/test-1080p.jpg`
2. Verify original image appears
3. Click "Convert (balanced)"
4. After conversion, verify:
   - Both images are visible side-by-side
   - Images look similar (visual inspection)
   - Dimensions match (or are resized if maxLongEdge was set)
   - File size is shown

## Benefits

1. **Visual Quality Assurance** - Users can immediately see if conversion quality is acceptable
2. **Debugging** - Easy to spot conversion issues or artifacts
3. **Confidence** - Side-by-side comparison builds trust in the conversion process
4. **Education** - Users can see the difference (or lack thereof) between formats

## Future Enhancements

Potential improvements:
- Zoom functionality for detailed inspection
- Image difference overlay
- Histogram comparison
- PSNR/SSIM metrics display
- Toggle between side-by-side and overlay modes
