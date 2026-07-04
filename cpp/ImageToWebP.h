#ifndef IMAGE_TO_WEBP_H
#define IMAGE_TO_WEBP_H

#include <cstdint>
#include <cstddef>
#include <functional>
#include <string>
#include <vector>

/**
 * Encoding progress callback. Receives 0-100 while libwebp encodes.
 */
using WebPProgressFn = std::function<void(int)>;

struct WebPEncodeOptions {
  int quality = 80;
  int method = 3;
  bool lossless = false;
  bool stripMetadata = true;
  int threadLevel = 1;
  bool exact = false;
  // Raw EXIF payload (TIFF header first, no "Exif\0\0" prefix) to embed in
  // the output when stripMetadata is false. Not owned; must outlive the call.
  const uint8_t* exifData = nullptr;
  size_t exifSize = 0;
};

struct WebPEncodeResult {
  bool success = false;
  std::string errorMessage;
  uint32_t width = 0;
  uint32_t height = 0;
  size_t sizeBytes = 0;
};

/**
 * Encode RGBA image data to WebP format.
 *
 * @param rgbaData Pointer to RGBA pixel data (width * height * 4 bytes),
 *   non-premultiplied. Use unpremultiplyRGBA() first if the platform decoder
 *   produced premultiplied alpha.
 * @param width Image width in pixels
 * @param height Image height in pixels
 * @param options Encoding options
 * @param outputPath Path to write the WebP file
 * @param progress Optional callback invoked with 0-100 during encoding
 * @return Result containing success status, dimensions, and file size
 */
WebPEncodeResult encodeWebP(
    const uint8_t* rgbaData,
    uint32_t width,
    uint32_t height,
    const WebPEncodeOptions& options,
    const std::string& outputPath,
    const WebPProgressFn& progress = nullptr);

/**
 * Convert premultiplied RGBA to straight (non-premultiplied) RGBA in place.
 * Platform decoders (Android Bitmap, CoreGraphics) hand out premultiplied
 * pixels; WebP expects straight alpha.
 */
void unpremultiplyRGBA(uint8_t* rgbaData, size_t pixelCount);

/**
 * Extract the raw EXIF payload from a JPEG byte stream (APP1 "Exif" segment,
 * returned without the "Exif\0\0" identifier so it can be embedded directly
 * as a WebP EXIF chunk). Returns an empty vector when the input is not a
 * JPEG or carries no EXIF data; never throws.
 */
std::vector<uint8_t> extractExifFromJpeg(const uint8_t* data, size_t size);

/**
 * Reset the EXIF Orientation tag (0x0112 in IFD0) to 1 ("top-left") in a raw
 * EXIF payload. Conversion bakes the rotation into the pixels, so a preserved
 * orientation tag would make viewers rotate the image twice. Best effort: a
 * payload that cannot be parsed is left untouched.
 */
void resetExifOrientationTag(uint8_t* exif, size_t size);

#endif // IMAGE_TO_WEBP_H
