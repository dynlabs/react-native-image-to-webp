package com.dynlabs.reactnativeimagetowebp

import android.graphics.Bitmap
import android.graphics.BitmapFactory
import android.graphics.ImageDecoder
import android.net.Uri
import android.os.Build
import com.facebook.react.bridge.Arguments
import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReadableMap
import com.facebook.react.bridge.WritableMap
import java.io.File
import java.io.FileNotFoundException
import java.io.FileOutputStream
import java.util.concurrent.ExecutorService
import java.util.concurrent.Executors

class ReactNativeImageToWebpModule(reactContext: ReactApplicationContext) :
  NativeReactNativeImageToWebpSpec(reactContext) {

  private val executor: ExecutorService = Executors.newSingleThreadExecutor()

  companion object {
    init {
      System.loadLibrary("react-native-image-to-webp")
    }

    const val NAME = NativeReactNativeImageToWebpSpec.NAME

    private const val ERROR_CODE_INVALID_INPUT = "INVALID_INPUT"
    private const val ERROR_CODE_FILE_NOT_FOUND = "FILE_NOT_FOUND"
    private const val ERROR_CODE_DECODE_FAILED = "DECODE_FAILED"
    private const val ERROR_CODE_ENCODE_FAILED = "ENCODE_FAILED"
    private const val ERROR_CODE_IO_ERROR = "IO_ERROR"
    private const val ERROR_CODE_UNSUPPORTED_FORMAT = "UNSUPPORTED_FORMAT"
  }

  // Native JNI methods
  private external fun nativeEncodeWebP(
    rgbaData: ByteArray,
    width: Int,
    height: Int,
    quality: Int,
    method: Int,
    lossless: Boolean,
    outputPath: String
  ): Boolean

  private external fun nativeGetLastError(): String

  override fun convertImageToWebP(
    options: ReadableMap,
    promise: Promise
  ) {
    executor.execute {
      try {
        val result = convertImageToWebPInternal(options)
        promise.resolve(result)
      } catch (e: Exception) {
        promise.reject(
          when (e) {
            is FileNotFoundException -> ERROR_CODE_FILE_NOT_FOUND
            is IllegalArgumentException -> ERROR_CODE_INVALID_INPUT
            is UnsupportedOperationException -> ERROR_CODE_UNSUPPORTED_FORMAT
            else -> ERROR_CODE_DECODE_FAILED
          },
          e.message ?: "Unknown error",
          e
        )
      }
    }
  }

  private fun convertImageToWebPInternal(options: ReadableMap): WritableMap {
    // Parse options
    val inputPath = options.getString("inputPath")
      ?: throw IllegalArgumentException("inputPath is required")

    val preset = options.getString("preset") ?: "balanced"
    val outputPath = options.getString("outputPath")
      ?: deriveOutputPath(inputPath, preset)

    val maxLongEdge = if (options.hasKey("maxLongEdge")) {
      options.getDouble("maxLongEdge").toInt()
    } else {
      null
    }

    val quality = if (options.hasKey("quality")) {
      options.getInt("quality")
    } else {
      80
    }

    val method = if (options.hasKey("method")) {
      options.getInt("method")
    } else {
      3
    }

    val lossless = options.hasKey("lossless") && options.getBoolean("lossless")

    // Validate
    if (maxLongEdge != null && maxLongEdge <= 0) {
      throw IllegalArgumentException("maxLongEdge must be positive")
    }
    if (quality < 0 || quality > 100) {
      throw IllegalArgumentException("quality must be between 0 and 100")
    }
    if (method < 0 || method > 6) {
      throw IllegalArgumentException("method must be between 0 and 6")
    }

    // Check input file
    val inputFile = File(inputPath)
    if (!inputFile.exists() || !inputFile.canRead()) {
      throw FileNotFoundException("File not found: $inputPath")
    }

    // Decode image
    val bitmap = decodeImage(inputFile, maxLongEdge)
      ?: throw RuntimeException("Failed to decode image")

    val width = bitmap.width
    val height = bitmap.height

    // Convert bitmap to RGBA
    val rgbaData = bitmapToRGBA(bitmap)
    bitmap.recycle()

    // Ensure output directory exists
    val outputFile = File(outputPath)
    outputFile.parentFile?.mkdirs()

    // Encode to WebP using native code
    val success = nativeEncodeWebP(
      rgbaData,
      width,
      height,
      quality,
      method,
      lossless,
      outputPath
    )

    if (!success) {
      val errorMsg = nativeGetLastError()
      throw RuntimeException("WebP encoding failed: $errorMsg")
    }

    // Get file size
    val sizeBytes = outputFile.length()

    // Return result
    val result = Arguments.createMap()
    result.putString("outputPath", outputPath)
    result.putInt("width", width)
    result.putInt("height", height)
    result.putDouble("sizeBytes", sizeBytes.toDouble())

    return result
  }

  private fun decodeImage(file: File, maxLongEdge: Int?): Bitmap? {
    return try {
      if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.P) {
        // Use ImageDecoder for modern Android
        val source = ImageDecoder.createSource(file)
        val decoder = ImageDecoder.decodeBitmap(source) { decoder, info, source ->
          // Force software bitmap to avoid HARDWARE config which doesn't support getPixels()
          decoder.setAllocator(ImageDecoder.ALLOCATOR_SOFTWARE)
          
          // Apply sampling if maxLongEdge is specified
          maxLongEdge?.let { maxEdge ->
            val originalWidth = info.size.width
            val originalHeight = info.size.height
            val maxDimension = maxOf(originalWidth, originalHeight)
            if (maxDimension > maxEdge) {
              val sampleSize = (maxDimension / maxEdge).toInt().coerceAtLeast(1)
              decoder.setTargetSampleSize(sampleSize)
            }
          }
        }
        
        // Ensure bitmap is not hardware-accelerated and can be accessed
        var bitmap = decoder
        if (bitmap.config == Bitmap.Config.HARDWARE) {
          // Convert hardware bitmap to software bitmap
          val softwareBitmap = bitmap.copy(Bitmap.Config.ARGB_8888, false)
          bitmap.recycle()
          bitmap = softwareBitmap
        }
        
        // Final resize if still needed (setTargetSampleSize is approximate)
        maxLongEdge?.let { maxEdge ->
          val currentMax = maxOf(bitmap.width, bitmap.height)
          if (currentMax > maxEdge) {
            val scale = maxEdge.toFloat() / currentMax
            val newWidth = (bitmap.width * scale).toInt()
            val newHeight = (bitmap.height * scale).toInt()
            val resized = Bitmap.createScaledBitmap(bitmap, newWidth, newHeight, true)
            if (resized != bitmap) {
              bitmap.recycle()
              bitmap = resized
            }
          }
        }
        
        bitmap
      } else {
        // Fallback to BitmapFactory
        val options = BitmapFactory.Options().apply {
          inJustDecodeBounds = true
        }
        BitmapFactory.decodeFile(file.absolutePath, options)

        maxLongEdge?.let { maxEdge ->
          val maxDimension = maxOf(options.outWidth, options.outHeight)
          if (maxDimension > maxEdge) {
            val sampleSize = (maxDimension / maxEdge).toInt().coerceAtLeast(1)
            options.inSampleSize = sampleSize
          }
        }

        options.inJustDecodeBounds = false
        options.inPreferredConfig = Bitmap.Config.ARGB_8888

        var bitmap = BitmapFactory.decodeFile(file.absolutePath, options)
          ?: return null

        // Ensure bitmap is not hardware-accelerated and can be accessed
        if (bitmap.config == Bitmap.Config.HARDWARE) {
          // Convert hardware bitmap to software bitmap
          val softwareBitmap = bitmap.copy(Bitmap.Config.ARGB_8888, false)
          bitmap.recycle()
          bitmap = softwareBitmap
        }

        // Apply EXIF orientation if needed
        bitmap = applyExifOrientation(bitmap, file)

        // Final resize if still needed (inSampleSize is approximate)
        maxLongEdge?.let { maxEdge ->
          val currentMax = maxOf(bitmap.width, bitmap.height)
          if (currentMax > maxEdge) {
            val scale = maxEdge.toFloat() / currentMax
            val newWidth = (bitmap.width * scale).toInt()
            val newHeight = (bitmap.height * scale).toInt()
            val resized = Bitmap.createScaledBitmap(bitmap, newWidth, newHeight, true)
            if (resized != bitmap) {
              bitmap.recycle()
              bitmap = resized
            }
          }
        }

        bitmap
      }
    } catch (e: Exception) {
      throw RuntimeException("Failed to decode image: ${e.message}", e)
    }
  }

  private fun applyExifOrientation(bitmap: Bitmap, file: File): Bitmap {
    // Note: For full EXIF support, use ExifInterface
    // For now, return bitmap as-is
    // TODO: Implement EXIF orientation handling using android.media.ExifInterface
    return bitmap
  }

  private fun bitmapToRGBA(bitmap: Bitmap): ByteArray {
    val width = bitmap.width
    val height = bitmap.height
    val pixels = IntArray(width * height)
    bitmap.getPixels(pixels, 0, width, 0, 0, width, height)

    val rgbaData = ByteArray(width * height * 4)
    var index = 0
    for (pixel in pixels) {
      rgbaData[index++] = ((pixel shr 16) and 0xFF).toByte() // R
      rgbaData[index++] = ((pixel shr 8) and 0xFF).toByte()  // G
      rgbaData[index++] = (pixel and 0xFF).toByte()          // B
      rgbaData[index++] = ((pixel shr 24) and 0xFF).toByte() // A
    }

    return rgbaData
  }

  private fun deriveOutputPath(inputPath: String, preset: String): String {
    val inputFile = File(inputPath)
    val directory = inputFile.parent
    val filename = inputFile.nameWithoutExtension
    return File(directory, "$filename.webp").absolutePath
  }
}
