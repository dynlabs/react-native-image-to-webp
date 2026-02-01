#include "ImageToWebP.h"
#include <fstream>
#include <vector>
#include <cstring>

// libwebp includes (uncomment after vendoring libwebp)
#ifdef WEBP_AVAILABLE
#include "webp/encode.h"
#include "webp/mux.h"
#endif

WebPEncodeResult encodeWebP(
    const uint8_t* rgbaData,
    uint32_t width,
    uint32_t height,
    const WebPEncodeOptions& options,
    const std::string& outputPath) {
  WebPEncodeResult result;
  result.width = width;
  result.height = height;

#ifdef WEBP_AVAILABLE
  // Initialize WebP config
  WebPConfig config;
  if (!WebPConfigInit(&config)) {
    result.success = false;
    result.errorMessage = "Failed to initialize WebP config";
    return result;
  }

  // Apply preset
  WebPPreset preset = WEBP_PRESET_DEFAULT;
  if (options.lossless) {
    preset = WEBP_PRESET_DEFAULT; // Will be overridden by lossless flag
  }
  
  if (!WebPConfigPreset(&config, preset, options.quality)) {
    result.success = false;
    result.errorMessage = "Failed to configure WebP preset";
    return result;
  }

  // Override with options
  config.quality = static_cast<float>(options.quality);
  config.method = options.method;
  config.lossless = options.lossless ? 1 : 0;
  config.exact = options.exact ? 1 : 0;
  
  // Thread level (if supported)
  #ifdef WEBP_USE_THREAD
  config.thread_level = options.threadLevel;
  #endif

  // Validate config
  if (!WebPValidateConfig(&config)) {
    result.success = false;
    result.errorMessage = "Invalid WebP config";
    return result;
  }

  // Initialize picture
  WebPPicture picture;
  if (!WebPPictureInit(&picture)) {
    result.success = false;
    result.errorMessage = "Failed to initialize WebP picture";
    return result;
  }

  picture.width = static_cast<int>(width);
  picture.height = static_cast<int>(height);
  picture.use_argb = options.lossless ? 1 : 0; // Use ARGB for lossless

  // Import RGBA data
  if (!WebPPictureImportRGBA(&picture, rgbaData, static_cast<int>(width * 4))) {
    WebPPictureFree(&picture);
    result.success = false;
    result.errorMessage = "Failed to import RGBA data";
    return result;
  }

  // Setup memory writer for output
  WebPMemoryWriter writer;
  WebPMemoryWriterInit(&writer);
  picture.writer = WebPMemoryWriterWrite;
  picture.custom_ptr = &writer;

  // Encode
  if (!WebPEncode(&config, &picture)) {
    WebPMemoryWriterClear(&writer);
    WebPPictureFree(&picture);
    result.success = false;
    result.errorMessage = std::string("WebP encoding failed: ") + std::to_string(picture.error_code);
    return result;
  }

  // Write to file
  std::ofstream outFile(outputPath, std::ios::binary);
  if (!outFile.is_open()) {
    WebPMemoryWriterClear(&writer);
    WebPPictureFree(&picture);
    result.success = false;
    result.errorMessage = "Failed to open output file for writing";
    return result;
  }

  outFile.write(reinterpret_cast<const char*>(writer.mem), writer.size);
  if (!outFile.good()) {
    WebPMemoryWriterClear(&writer);
    WebPPictureFree(&picture);
    result.success = false;
    result.errorMessage = "Failed to write WebP data to file";
    return result;
  }
  outFile.close();

  // Set result
  result.success = true;
  result.sizeBytes = writer.size;

  // Cleanup
  WebPMemoryWriterClear(&writer);
  WebPPictureFree(&picture);
  
  return result;
#else
  // Placeholder until libwebp is vendored
  result.success = false;
  result.errorMessage = "libwebp not yet integrated. Please vendor libwebp sources to cpp/vendor/libwebp/ and define WEBP_AVAILABLE.";
  
  return result;
#endif
}
