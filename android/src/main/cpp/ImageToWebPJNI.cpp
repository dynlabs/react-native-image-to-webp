#include <jni.h>
#include <string>
#include <vector>
#include "ImageToWebP.h"

extern "C" {

/**
 * Encode an RGBA buffer to a WebP file.
 *
 * @param rgbaBuffer Direct ByteBuffer with width * height * 4 bytes
 * @param premultiplied Whether the buffer carries premultiplied alpha
 *   (Android Bitmap pixels are premultiplied when the image has alpha)
 * @param exifData Raw EXIF payload to embed, or null to strip metadata
 * @param progressCallback Object with an onProgress(int) method, or null
 * @return null on success, otherwise a human-readable error message
 */
JNIEXPORT jstring JNICALL
Java_com_dynlabs_reactnativeimagetowebp_ReactNativeImageToWebpModule_nativeEncodeWebP(
    JNIEnv *env,
    jobject /* this */,
    jobject rgbaBuffer,
    jint width,
    jint height,
    jint quality,
    jint method,
    jboolean lossless,
    jboolean exact,
    jint threadLevel,
    jboolean premultiplied,
    jbyteArray exifData,
    jstring outputPath,
    jobject progressCallback) {

  auto *data = static_cast<uint8_t *>(env->GetDirectBufferAddress(rgbaBuffer));
  const jlong dataLength = env->GetDirectBufferCapacity(rgbaBuffer);
  const jlong expectedLength =
      static_cast<jlong>(width) * static_cast<jlong>(height) * 4;
  if (data == nullptr || dataLength < expectedLength) {
    return env->NewStringUTF("Invalid RGBA buffer");
  }

  const char *pathStr = env->GetStringUTFChars(outputPath, nullptr);
  if (pathStr == nullptr) {
    return env->NewStringUTF("Invalid output path");
  }
  std::string outputPathStr(pathStr);
  env->ReleaseStringUTFChars(outputPath, pathStr);

  // WebP expects straight alpha; Bitmap pixels are premultiplied
  if (premultiplied == JNI_TRUE) {
    unpremultiplyRGBA(data, static_cast<size_t>(width) * height);
  }

  // Copy the optional EXIF payload and neutralize its orientation tag
  // (rotation is already baked into the pixels)
  std::vector<uint8_t> exif;
  if (exifData != nullptr) {
    const jsize exifLength = env->GetArrayLength(exifData);
    if (exifLength > 0) {
      exif.resize(static_cast<size_t>(exifLength));
      env->GetByteArrayRegion(exifData, 0, exifLength,
                              reinterpret_cast<jbyte *>(exif.data()));
      resetExifOrientationTag(exif.data(), exif.size());
    }
  }

  WebPEncodeOptions options;
  options.quality = quality;
  options.method = method;
  options.lossless = (lossless == JNI_TRUE);
  options.exact = (exact == JNI_TRUE);
  options.threadLevel = threadLevel;
  options.stripMetadata = exif.empty();
  options.exifData = exif.empty() ? nullptr : exif.data();
  options.exifSize = exif.size();

  // The progress hook runs on this thread, so the JNIEnv can be used directly
  WebPProgressFn progressFn = nullptr;
  jmethodID onProgressMethod = nullptr;
  if (progressCallback != nullptr) {
    jclass callbackClass = env->GetObjectClass(progressCallback);
    onProgressMethod = env->GetMethodID(callbackClass, "onProgress", "(I)V");
    env->DeleteLocalRef(callbackClass);
    if (onProgressMethod != nullptr) {
      progressFn = [env, progressCallback, onProgressMethod](int percent) {
        env->CallVoidMethod(progressCallback, onProgressMethod,
                            static_cast<jint>(percent));
        if (env->ExceptionCheck()) {
          env->ExceptionClear();
        }
      };
    }
  }

  WebPEncodeResult result = encodeWebP(
      data,
      static_cast<uint32_t>(width),
      static_cast<uint32_t>(height),
      options,
      outputPathStr,
      progressFn);

  if (result.success) {
    return nullptr;
  }
  return env->NewStringUTF(result.errorMessage.c_str());
}

} // extern "C"
