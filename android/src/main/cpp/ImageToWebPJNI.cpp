#include <jni.h>
#include <string>
#include <fstream>
#include "ImageToWebP.h"

extern "C" {

JNIEXPORT jboolean JNICALL
Java_com_dynlabs_reactnativeimagetowebp_ReactNativeImageToWebpModule_nativeEncodeWebP(
    JNIEnv *env,
    jobject /* this */,
    jbyteArray rgbaData,
    jint width,
    jint height,
    jint quality,
    jint method,
    jboolean lossless,
    jstring outputPath) {

  // Get RGBA data
  jbyte *data = env->GetByteArrayElements(rgbaData, NULL);
  if (!data) {
    return JNI_FALSE;
  }

  jsize dataLength = env->GetArrayLength(rgbaData);
  if (dataLength != width * height * 4) {
    env->ReleaseByteArrayElements(rgbaData, data, JNI_ABORT);
    return JNI_FALSE;
  }

  // Convert output path
  const char *pathStr = env->GetStringUTFChars(outputPath, NULL);
  if (!pathStr) {
    env->ReleaseByteArrayElements(rgbaData, data, JNI_ABORT);
    return JNI_FALSE;
  }

  std::string outputPathStr(pathStr);

  // Prepare encoding options
  WebPEncodeOptions options;
  options.quality = quality;
  options.method = method;
  options.lossless = (lossless == JNI_TRUE);
  options.stripMetadata = true;
  options.threadLevel = 1;

  // Encode
  const uint8_t *rgba = reinterpret_cast<const uint8_t *>(data);
  WebPEncodeResult result = encodeWebP(
      rgba,
      static_cast<uint32_t>(width),
      static_cast<uint32_t>(height),
      options,
      outputPathStr);

  // Cleanup
  env->ReleaseStringUTFChars(outputPath, pathStr);
  env->ReleaseByteArrayElements(rgbaData, data, JNI_ABORT);

  return result.success ? JNI_TRUE : JNI_FALSE;
}

JNIEXPORT jstring JNICALL
Java_com_dynlabs_reactnativeimagetowebp_ReactNativeImageToWebpModule_nativeGetLastError(
    JNIEnv *env,
    jobject /* this */) {
  // TODO: Store last error in thread-local storage
  return env->NewStringUTF("Encoding failed");
}

} // extern "C"
