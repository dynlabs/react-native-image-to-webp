#ifndef IMAGE_TO_WEBP_H
#define IMAGE_TO_WEBP_H

#include <cstdint>
#include <string>

struct WebPEncodeOptions {
  int quality = 80;
  int method = 3;
  bool lossless = false;
  bool stripMetadata = true;
  int threadLevel = 1;
  bool exact = false;
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
 * @param rgbaData Pointer to RGBA pixel data (width * height * 4 bytes)
 * @param width Image width in pixels
 * @param height Image height in pixels
 * @param options Encoding options
 * @param outputPath Path to write the WebP file
 * @return Result containing success status, dimensions, and file size
 */
WebPEncodeResult encodeWebP(
    const uint8_t* rgbaData,
    uint32_t width,
    uint32_t height,
    const WebPEncodeOptions& options,
    const std::string& outputPath);

#endif // IMAGE_TO_WEBP_H
