package dynlabs.reactnativeimagetowebp.example

import com.facebook.react.ReactPackage
import com.facebook.react.bridge.NativeModule
import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod
import com.facebook.react.uimanager.ViewManager
import java.io.File
import java.io.FileOutputStream

/**
 * Test fixture for the example app and the Maestro e2e suite: copies the
 * bundled sample.jpg asset to the cache directory and returns its path, so
 * flows can exercise the conversion pipeline without the system image picker.
 */
class SampleImageModule(reactContext: ReactApplicationContext) :
  ReactContextBaseJavaModule(reactContext) {

  override fun getName() = "SampleImage"

  @ReactMethod
  fun getSampleImagePath(promise: Promise) {
    try {
      val outFile = File(reactApplicationContext.cacheDir, "e2e-sample.jpg")
      if (!outFile.exists() || outFile.length() == 0L) {
        reactApplicationContext.assets.open("sample.jpg").use { input ->
          FileOutputStream(outFile).use { output -> input.copyTo(output) }
        }
      }
      promise.resolve(outFile.absolutePath)
    } catch (e: Exception) {
      promise.reject("E_SAMPLE_IMAGE", e.message, e)
    }
  }
}

class SampleImagePackage : ReactPackage {
  override fun createNativeModules(
    reactContext: ReactApplicationContext
  ): List<NativeModule> = listOf(SampleImageModule(reactContext))

  override fun createViewManagers(
    reactContext: ReactApplicationContext
  ): List<ViewManager<*, *>> = emptyList()
}
