package com.dynlabs.reactnativeimagetowebp

import android.graphics.Bitmap
import android.graphics.BitmapFactory
import android.graphics.ImageDecoder
import android.graphics.Matrix
import android.media.ExifInterface
import android.net.Uri
import android.os.Build
import com.facebook.react.bridge.Arguments
import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReadableMap
import com.facebook.react.bridge.WritableMap
import java.io.File
import java.io.FileNotFoundException
import java.io.InputStream
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

    // Modern photo pickers and scoped storage (Android 10+) hand back
    // content:// URIs rather than raw file paths, so resolve those via the
    // ContentResolver instead of java.io.File.
    val isContentUri = inputPath.startsWith("content://") ||
      inputPath.startsWith("android.resource://")

    val outputPath = options.getString("outputPath")
      ?: deriveOutputPath(inputPath, isContentUri)

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

    // Decode image (from a content:// URI or a raw filesystem path)
    val bitmap = if (isContentUri) {
      decodeImageFromUri(Uri.parse(inputPath), maxLongEdge)
    } else {
      val inputFile = File(inputPath)
      if (!inputFile.exists() || !inputFile.canRead()) {
        throw FileNotFoundException("File not found: $inputPath")
      }
      decodeImage(inputFile, maxLongEdge)
    } ?: throw RuntimeException("Failed to decode image")

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
        decodeWithImageDecoder(ImageDecoder.createSource(file), maxLongEdge)
      } else {
        // Fallback to BitmapFactory (two passes: bounds, then decode)
        val bounds = BitmapFactory.Options().apply { inJustDecodeBounds = true }
        BitmapFactory.decodeFile(file.absolutePath, bounds)

        val options = buildFallbackOptions(bounds, maxLongEdge)
        val raw = BitmapFactory.decodeFile(file.absolutePath, options) ?: return null
        val bitmap = applyExifOrientationFromFile(raw, file)
        finalizeBitmap(bitmap, maxLongEdge)
      }
    } catch (e: Exception) {
      throw RuntimeException("Failed to decode image: ${e.message}", e)
    }
  }

  private fun decodeImageFromUri(uri: Uri, maxLongEdge: Int?): Bitmap? {
    val resolver = reactApplicationContext.contentResolver
    return try {
      if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.P) {
        decodeWithImageDecoder(ImageDecoder.createSource(resolver, uri), maxLongEdge)
      } else {
        // Fallback to BitmapFactory. The stream can only be read once, so open
        // it twice: first to read bounds, then to decode.
        val bounds = BitmapFactory.Options().apply { inJustDecodeBounds = true }
        openUriStream(resolver, uri).use { input ->
          BitmapFactory.decodeStream(input, null, bounds)
        }

        val options = buildFallbackOptions(bounds, maxLongEdge)
        val raw = openUriStream(resolver, uri).use { input ->
          BitmapFactory.decodeStream(input, null, options)
        } ?: return null
        // ExifInterface(InputStream) is available from API 24 (our minSdk).
        val bitmap = openUriStream(resolver, uri).use { exifStream ->
          applyExifOrientationFromStream(raw, exifStream)
        }
        finalizeBitmap(bitmap, maxLongEdge)
      }
    } catch (e: FileNotFoundException) {
      throw e
    } catch (e: Exception) {
      throw RuntimeException("Failed to decode image: ${e.message}", e)
    }
  }

  private fun openUriStream(
    resolver: android.content.ContentResolver,
    uri: Uri
  ): InputStream {
    return resolver.openInputStream(uri)
      ?: throw FileNotFoundException("Cannot open input stream for: $uri")
  }

  private fun buildFallbackOptions(
    bounds: BitmapFactory.Options,
    maxLongEdge: Int?
  ): BitmapFactory.Options {
    return BitmapFactory.Options().apply {
      maxLongEdge?.let { maxEdge ->
        val maxDimension = maxOf(bounds.outWidth, bounds.outHeight)
        if (maxDimension > maxEdge) {
          inSampleSize = (maxDimension / maxEdge).coerceAtLeast(1)
        }
      }
      inPreferredConfig = Bitmap.Config.ARGB_8888
    }
  }

  /**
   * Decode an [ImageDecoder.Source] (file- or URI-backed) into a software
   * ARGB_8888 bitmap, applying sampling and a final exact resize. ImageDecoder
   * automatically honors EXIF orientation.
   */
  private fun decodeWithImageDecoder(
    source: ImageDecoder.Source,
    maxLongEdge: Int?
  ): Bitmap {
    val decoded = ImageDecoder.decodeBitmap(source) { decoder, info, _ ->
      // Force a software bitmap; HARDWARE config doesn't support getPixels().
      decoder.setAllocator(ImageDecoder.ALLOCATOR_SOFTWARE)
      maxLongEdge?.let { maxEdge ->
        val maxDimension = maxOf(info.size.width, info.size.height)
        if (maxDimension > maxEdge) {
          decoder.setTargetSampleSize((maxDimension / maxEdge).coerceAtLeast(1))
        }
      }
    }
    return finalizeBitmap(decoded, maxLongEdge)
  }

  /**
   * Ensure the bitmap is software-backed (pixel-readable) and apply an exact
   * final resize, since sampling during decode is only approximate.
   */
  private fun finalizeBitmap(bitmap: Bitmap, maxLongEdge: Int?): Bitmap {
    var result = bitmap
    if (result.config == Bitmap.Config.HARDWARE) {
      val software = result.copy(Bitmap.Config.ARGB_8888, false)
      result.recycle()
      result = software
    }

    maxLongEdge?.let { maxEdge ->
      val currentMax = maxOf(result.width, result.height)
      if (currentMax > maxEdge) {
        val scale = maxEdge.toFloat() / currentMax
        val newWidth = (result.width * scale).toInt()
        val newHeight = (result.height * scale).toInt()
        val resized = Bitmap.createScaledBitmap(result, newWidth, newHeight, true)
        if (resized != result) {
          result.recycle()
          result = resized
        }
      }
    }
    return result
  }

  private fun applyExifOrientationFromFile(bitmap: Bitmap, file: File): Bitmap {
    return try {
      rotateBitmapForExif(bitmap, ExifInterface(file.absolutePath))
    } catch (e: Exception) {
      bitmap
    }
  }

  private fun applyExifOrientationFromStream(bitmap: Bitmap, stream: InputStream): Bitmap {
    return try {
      rotateBitmapForExif(bitmap, ExifInterface(stream))
    } catch (e: Exception) {
      bitmap
    }
  }

  private fun rotateBitmapForExif(bitmap: Bitmap, exif: ExifInterface): Bitmap {
    val orientation = exif.getAttributeInt(
      ExifInterface.TAG_ORIENTATION,
      ExifInterface.ORIENTATION_NORMAL
    )

    val matrix = Matrix()
    when (orientation) {
      ExifInterface.ORIENTATION_FLIP_HORIZONTAL -> matrix.setScale(-1f, 1f)
      ExifInterface.ORIENTATION_ROTATE_180 -> matrix.setRotate(180f)
      ExifInterface.ORIENTATION_FLIP_VERTICAL -> matrix.setScale(1f, -1f)
      ExifInterface.ORIENTATION_TRANSPOSE -> {
        matrix.setRotate(90f)
        matrix.postScale(-1f, 1f)
      }
      ExifInterface.ORIENTATION_ROTATE_90 -> matrix.setRotate(90f)
      ExifInterface.ORIENTATION_TRANSVERSE -> {
        matrix.setRotate(-90f)
        matrix.postScale(-1f, 1f)
      }
      ExifInterface.ORIENTATION_ROTATE_270 -> matrix.setRotate(-90f)
      else -> return bitmap // ORIENTATION_NORMAL or unrecognised: no transform
    }

    val rotated = Bitmap.createBitmap(bitmap, 0, 0, bitmap.width, bitmap.height, matrix, true)
    if (rotated != bitmap) bitmap.recycle()
    return rotated
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

  private fun deriveOutputPath(inputPath: String, isContentUri: Boolean): String {
    // A content:// URI has no writable parent directory, so default its output
    // into the app cache dir using a sanitized name derived from the URI.
    if (isContentUri) {
      val baseName = Uri.parse(inputPath).lastPathSegment
        ?.substringAfterLast('/')
        ?.substringBeforeLast('.')
        ?.takeIf { it.isNotBlank() }
        ?: "image_${System.currentTimeMillis()}"
      val safeName = baseName.replace(Regex("[^A-Za-z0-9_-]"), "_")
      return File(reactApplicationContext.cacheDir, "$safeName.webp").absolutePath
    }

    val inputFile = File(inputPath)
    val directory = inputFile.parent
    val filename = inputFile.nameWithoutExtension
    return File(directory, "$filename.webp").absolutePath
  }
}
