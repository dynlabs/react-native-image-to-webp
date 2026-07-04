#include "ImageToWebP.h"
#include <fstream>
#include <vector>
#include <cstring>

// libwebp includes
#ifdef WEBP_AVAILABLE
#include "webp/encode.h"
#include "webp/mux.h"
#endif

#ifdef WEBP_AVAILABLE
static const char* encodingErrorToString(WebPEncodingError error) {
  switch (error) {
    case VP8_ENC_ERROR_OUT_OF_MEMORY:
      return "out of memory";
    case VP8_ENC_ERROR_BITSTREAM_OUT_OF_MEMORY:
      return "out of memory while flushing bitstream";
    case VP8_ENC_ERROR_NULL_PARAMETER:
      return "null parameter";
    case VP8_ENC_ERROR_INVALID_CONFIGURATION:
      return "invalid configuration";
    case VP8_ENC_ERROR_BAD_DIMENSION:
      return "invalid image dimensions";
    case VP8_ENC_ERROR_PARTITION0_OVERFLOW:
      return "partition 0 is too big to fit 512k";
    case VP8_ENC_ERROR_PARTITION_OVERFLOW:
      return "partition is too big to fit 16M";
    case VP8_ENC_ERROR_BAD_WRITE:
      return "error while flushing bytes";
    case VP8_ENC_ERROR_FILE_TOO_BIG:
      return "file is larger than 4GiB";
    case VP8_ENC_ERROR_USER_ABORT:
      return "aborted by user";
    default:
      return "unknown encoding error";
  }
}

static int progressHookTrampoline(int percent, const WebPPicture* picture) {
  const auto* fn = static_cast<const WebPProgressFn*>(picture->user_data);
  if (fn != nullptr && *fn) {
    (*fn)(percent);
  }
  return 1; // never abort
}

// Wrap the encoded bitstream in a container carrying an EXIF chunk.
// On any mux failure the plain encoded data survives untouched, so metadata
// embedding can only degrade to "stripped", never break the conversion.
static bool addExifChunk(
    const uint8_t* encoded,
    size_t encodedSize,
    const uint8_t* exifData,
    size_t exifSize,
    std::vector<uint8_t>& outData) {
  WebPData bitstream = {encoded, encodedSize};
  WebPMux* mux = WebPMuxCreate(&bitstream, 0 /* don't copy */);
  if (mux == nullptr) {
    return false;
  }

  WebPData exifChunk = {exifData, exifSize};
  if (WebPMuxSetChunk(mux, "EXIF", &exifChunk, 1 /* copy */) != WEBP_MUX_OK) {
    WebPMuxDelete(mux);
    return false;
  }

  WebPData assembled;
  WebPDataInit(&assembled);
  if (WebPMuxAssemble(mux, &assembled) != WEBP_MUX_OK) {
    WebPMuxDelete(mux);
    return false;
  }
  WebPMuxDelete(mux);

  outData.assign(assembled.bytes, assembled.bytes + assembled.size);
  WebPDataClear(&assembled);
  return true;
}
#endif // WEBP_AVAILABLE

WebPEncodeResult encodeWebP(
    const uint8_t* rgbaData,
    uint32_t width,
    uint32_t height,
    const WebPEncodeOptions& options,
    const std::string& outputPath,
    const WebPProgressFn& progress) {
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

  if (!WebPConfigPreset(&config, WEBP_PRESET_DEFAULT,
                        static_cast<float>(options.quality))) {
    result.success = false;
    result.errorMessage = "Failed to configure WebP preset";
    return result;
  }

  // Override with options
  config.quality = static_cast<float>(options.quality);
  config.method = options.method;
  config.lossless = options.lossless ? 1 : 0;
  config.exact = options.exact ? 1 : 0;
  config.thread_level = options.threadLevel;

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
  picture.writer = WebPMemoryWrite;
  picture.custom_ptr = &writer;
  if (progress) {
    picture.progress_hook = progressHookTrampoline;
    picture.user_data = const_cast<WebPProgressFn*>(&progress);
  }

  // Encode
  if (!WebPEncode(&config, &picture)) {
    WebPEncodingError errorCode = picture.error_code;
    WebPMemoryWriterClear(&writer);
    WebPPictureFree(&picture);
    result.success = false;
    result.errorMessage =
        std::string("WebP encoding failed: ") + encodingErrorToString(errorCode);
    return result;
  }

  // Optionally embed EXIF metadata (JPEG sources only; extracted upstream)
  const uint8_t* outputData = writer.mem;
  size_t outputSize = writer.size;
  std::vector<uint8_t> muxedData;
  if (!options.stripMetadata && options.exifData != nullptr &&
      options.exifSize > 0) {
    if (addExifChunk(writer.mem, writer.size, options.exifData,
                     options.exifSize, muxedData)) {
      outputData = muxedData.data();
      outputSize = muxedData.size();
    }
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

  outFile.write(reinterpret_cast<const char*>(outputData),
                static_cast<std::streamsize>(outputSize));
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
  result.sizeBytes = outputSize;

  // Cleanup
  WebPMemoryWriterClear(&writer);
  WebPPictureFree(&picture);

  return result;
#else
  // libwebp not available
  (void)progress;
  result.success = false;
  result.errorMessage = "libwebp not available. Please ensure libwebp is properly configured.";

  return result;
#endif
}

void unpremultiplyRGBA(uint8_t* rgbaData, size_t pixelCount) {
  for (size_t i = 0; i < pixelCount; ++i) {
    uint8_t* px = rgbaData + i * 4;
    const uint8_t a = px[3];
    if (a == 0 || a == 255) {
      continue;
    }
    // round((c * 255) / a)
    px[0] = static_cast<uint8_t>((px[0] * 255 + a / 2) / a);
    px[1] = static_cast<uint8_t>((px[1] * 255 + a / 2) / a);
    px[2] = static_cast<uint8_t>((px[2] * 255 + a / 2) / a);
  }
}

std::vector<uint8_t> extractExifFromJpeg(const uint8_t* data, size_t size) {
  std::vector<uint8_t> exif;
  if (data == nullptr || size < 4) {
    return exif;
  }
  // SOI marker
  if (data[0] != 0xFF || data[1] != 0xD8) {
    return exif;
  }

  static const uint8_t kExifId[6] = {'E', 'x', 'i', 'f', 0, 0};
  size_t offset = 2;
  while (offset + 4 <= size) {
    if (data[offset] != 0xFF) {
      break; // corrupt stream
    }
    const uint8_t marker = data[offset + 1];
    if (marker == 0xD8 || (marker >= 0xD0 && marker <= 0xD7)) {
      // Standalone markers without a length field
      offset += 2;
      continue;
    }
    if (marker == 0xDA || marker == 0xD9) {
      break; // start of scan / end of image: no more metadata segments
    }
    const size_t segmentLength =
        (static_cast<size_t>(data[offset + 2]) << 8) | data[offset + 3];
    if (segmentLength < 2 || offset + 2 + segmentLength > size) {
      break; // corrupt length
    }
    if (marker == 0xE1 && segmentLength >= 2 + sizeof(kExifId)) {
      const uint8_t* payload = data + offset + 4;
      const size_t payloadSize = segmentLength - 2;
      if (payloadSize > sizeof(kExifId) &&
          std::memcmp(payload, kExifId, sizeof(kExifId)) == 0) {
        // Skip the "Exif\0\0" identifier: the WebP EXIF chunk payload
        // starts at the TIFF header.
        exif.assign(payload + sizeof(kExifId), payload + payloadSize);
        return exif;
      }
    }
    offset += 2 + segmentLength;
  }
  return exif;
}

void resetExifOrientationTag(uint8_t* exif, size_t size) {
  // Payload layout: TIFF header (byte order, magic 42, IFD0 offset), then
  // IFD0 as a count followed by 12-byte tag entries.
  if (exif == nullptr || size < 8) {
    return;
  }

  bool littleEndian;
  if (exif[0] == 'I' && exif[1] == 'I') {
    littleEndian = true;
  } else if (exif[0] == 'M' && exif[1] == 'M') {
    littleEndian = false;
  } else {
    return;
  }

  auto read16 = [&](size_t offset) -> uint16_t {
    return littleEndian
        ? static_cast<uint16_t>(exif[offset] | (exif[offset + 1] << 8))
        : static_cast<uint16_t>((exif[offset] << 8) | exif[offset + 1]);
  };
  auto read32 = [&](size_t offset) -> uint32_t {
    return littleEndian
        ? (static_cast<uint32_t>(exif[offset]) |
           (static_cast<uint32_t>(exif[offset + 1]) << 8) |
           (static_cast<uint32_t>(exif[offset + 2]) << 16) |
           (static_cast<uint32_t>(exif[offset + 3]) << 24))
        : ((static_cast<uint32_t>(exif[offset]) << 24) |
           (static_cast<uint32_t>(exif[offset + 1]) << 16) |
           (static_cast<uint32_t>(exif[offset + 2]) << 8) |
           static_cast<uint32_t>(exif[offset + 3]));
  };

  if (read16(2) != 42) {
    return;
  }

  const uint32_t ifdOffset = read32(4);
  if (ifdOffset + 2 > size) {
    return;
  }

  const uint16_t entryCount = read16(ifdOffset);
  for (uint16_t i = 0; i < entryCount; ++i) {
    const size_t entryOffset = ifdOffset + 2 + static_cast<size_t>(i) * 12;
    if (entryOffset + 12 > size) {
      return;
    }
    if (read16(entryOffset) == 0x0112) { // Orientation tag, type SHORT
      const size_t valueOffset = entryOffset + 8;
      if (littleEndian) {
        exif[valueOffset] = 1;
        exif[valueOffset + 1] = 0;
      } else {
        exif[valueOffset] = 0;
        exif[valueOffset + 1] = 1;
      }
      return;
    }
  }
}
