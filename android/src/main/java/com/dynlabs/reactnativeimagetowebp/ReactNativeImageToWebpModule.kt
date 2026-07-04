package com.dynlabs.reactnativeimagetowebp

import android.content.res.AssetFileDescriptor
import android.graphics.Bitmap
import android.graphics.BitmapFactory
import android.graphics.ImageDecoder
import android.graphics.Matrix
import android.net.Uri
import android.os.Build
import android.os.SystemClock
import android.util.Log
import androidx.exifinterface.media.ExifInterface
import com.facebook.react.bridge.Arguments
import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReadableMap
import com.facebook.react.bridge.WritableMap
import java.io.BufferedInputStream
import java.io.DataInputStream
import java.io.File
import java.io.FileNotFoundException
import java.io.InputStream
import java.nio.ByteBuffer
import java.util.concurrent.ExecutorService
import java.util.concurrent.Executors
import java.util.concurrent.atomic.AtomicLong
import kotlin.math.max
import kotlin.math.min
import kotlin.math.roundToInt

class ReactNativeImageToWebpModule(reactContext: ReactApplicationContext) :
  NativeReactNativeImageToWebpSpec(reactContext) {

  // Small pool so batch conversions run in parallel while leaving headroom
  // for the UI and JS threads
  private val executor: ExecutorService = Executors.newFixedThreadPool(
    max(1, min(4, Runtime.getRuntime().availableProcessors() - 1))
  )

  fun interface WebPProgressListener {
    fun onProgress(percent: Int)
  }

  private class ConversionException(
    val code: String,
    message: String,
    cause: Throwable? = null,
  ) : Exception(message, cause)

  private data class DecodedImage(
    val bitmap: Bitmap,
    val originalWidth: Int,
    val originalHeight: Int,
  )

  companion object {
    init {
      System.loadLibrary("react-native-image-to-webp")
    }

    const val NAME = NativeReactNativeImageToWebpSpec.NAME
    private const val TAG = "ImageToWebP"

    private const val ERROR_CODE_INVALID_INPUT = "INVALID_INPUT"
    private const val ERROR_CODE_FILE_NOT_FOUND = "FILE_NOT_FOUND"
    private const val ERROR_CODE_DECODE_FAILED = "DECODE_FAILED"
    private const val ERROR_CODE_ENCODE_FAILED = "ENCODE_FAILED"
    private const val ERROR_CODE_IO_ERROR = "IO_ERROR"

    private val uniqueSuffix = AtomicLong(0)
  }

  // Returns null on success, otherwise an error message
  private external fun nativeEncodeWebP(
    rgbaBuffer: ByteBuffer,
    width: Int,
    height: Int,
    quality: Int,
    method: Int,
    lossless: Boolean,
    exact: Boolean,
    threadLevel: Int,
    premultiplied: Boolean,
    exifData: ByteArray?,
    outputPath: String,
    progressCallback: WebPProgressListener?,
  ): String?

  override fun invalidate() {
    super.invalidate()
    executor.shutdown()
  }

  override fun convertImageToWebP(
    options: ReadableMap,
    promise: Promise
  ) {
    executor.execute {
      try {
        promise.resolve(convertImageToWebPInternal(options))
      } catch (e: Exception) {
        val code = when (e) {
          is ConversionException -> e.code
          is FileNotFoundException -> ERROR_CODE_FILE_NOT_FOUND
          is IllegalArgumentException -> ERROR_CODE_INVALID_INPUT
          is java.io.IOException -> ERROR_CODE_IO_ERROR
          else -> ERROR_CODE_DECODE_FAILED
        }
        promise.reject(code, e.message ?: "Unknown error", e)
      }
    }
  }

  private fun convertImageToWebPInternal(options: ReadableMap): WritableMap {
    val startTime = SystemClock.elapsedRealtime()

    // Parse options; defaults mirror the JS 'balanced' preset but the JS
    // layer always sends fully resolved values
    val rawInputPath = options.getString("inputPath")
      ?: throw ConversionException(ERROR_CODE_INVALID_INPUT, "inputPath is required")
    // JS normalizes file:// URIs already; decode here too for direct native
    // callers so both platforms treat file:// the same way
    val inputPath = rawInputPath.removePrefix("file://").let {
      if (it.contains('%') && !it.startsWith("content://")) Uri.decode(it) else it
    }
    val maxLongEdge = if (options.hasKey("maxLongEdge")) options.getDouble("maxLongEdge").toInt() else 0
    val quality = if (options.hasKey("quality")) options.getInt("quality") else 80
    val method = if (options.hasKey("method")) options.getInt("method") else 3
    val lossless = options.hasKey("lossless") && options.getBoolean("lossless")
    val exact = options.hasKey("exact") && options.getBoolean("exact")
    val threadLevel = if (options.hasKey("threadLevel")) options.getInt("threadLevel") else 1
    val stripMetadata = !options.hasKey("stripMetadata") || options.getBoolean("stripMetadata")
    val debug = options.hasKey("debug") && options.getBoolean("debug")
    val emitProgress = options.hasKey("emitProgress") && options.getBoolean("emitProgress")
    val conversionId = if (options.hasKey("conversionId")) options.getInt("conversionId") else -1

    if (maxLongEdge < 0) {
      throw ConversionException(ERROR_CODE_INVALID_INPUT, "maxLongEdge must not be negative")
    }
    if (quality < 0 || quality > 100) {
      throw ConversionException(ERROR_CODE_INVALID_INPUT, "quality must be between 0 and 100")
    }
    if (method < 0 || method > 6) {
      throw ConversionException(ERROR_CODE_INVALID_INPUT, "method must be between 0 and 6")
    }

    var lastEmitted = -1
    fun sendProgress(percent: Int, phase: String) {
      if (!emitProgress || conversionId < 0) return
      val clamped = percent.coerceIn(0, 100)
      if (clamped == lastEmitted) return
      lastEmitted = clamped
      val event = Arguments.createMap().apply {
        putInt("conversionId", conversionId)
        putInt("progress", clamped)
        putString("phase", phase)
      }
      emitOnConversionProgress(event)
    }

    val isContentUri = inputPath.startsWith("content://")
    val contentUri = if (isContentUri) Uri.parse(inputPath) else null
    val inputFile = if (isContentUri) null else File(inputPath)

    if (inputFile != null && (!inputFile.exists() || !inputFile.canRead())) {
      throw ConversionException(ERROR_CODE_FILE_NOT_FOUND, "File not found: $inputPath")
    }

    val originalSizeBytes = getOriginalSizeBytes(contentUri, inputFile)
    val outputPath = options.getString("outputPath") ?: deriveOutputPath(inputPath)

    sendProgress(0, "decode")

    // Decode (rotated per EXIF, resized to maxLongEdge)
    val decodeStart = SystemClock.elapsedRealtime()
    val decoded = decodeImage(contentUri, inputFile, maxLongEdge)
    val decodeMs = SystemClock.elapsedRealtime() - decodeStart
    sendProgress(25, "decode")

    var bitmap = decoded.bitmap
    if (bitmap.config != Bitmap.Config.ARGB_8888) {
      val converted = bitmap.copy(Bitmap.Config.ARGB_8888, false)
        ?: throw ConversionException(ERROR_CODE_DECODE_FAILED, "Failed to convert bitmap to ARGB_8888")
      bitmap.recycle()
      bitmap = converted
    }

    val width = bitmap.width
    val height = bitmap.height

    val pixelBytes = width.toLong() * height.toLong() * 4L
    if (pixelBytes > Int.MAX_VALUE) {
      bitmap.recycle()
      throw ConversionException(
        ERROR_CODE_INVALID_INPUT,
        "Decoded image is too large (${width}x$height); set maxLongEdge to resize"
      )
    }

    // ARGB_8888 pixels are RGBA in memory: one bulk copy instead of a
    // per-pixel repack. Alpha is premultiplied; native code undoes that.
    val buffer = ByteBuffer.allocateDirect(pixelBytes.toInt())
    bitmap.copyPixelsToBuffer(buffer)
    val premultiplied = bitmap.hasAlpha() && bitmap.isPremultiplied
    bitmap.recycle()

    // Optionally carry JPEG EXIF over into the WebP container
    val exifData = if (!stripMetadata) {
      try {
        openInputStream(contentUri, inputFile)?.use { extractJpegExif(it) }
      } catch (e: Exception) {
        null // best effort: fall back to stripping
      }
    } else {
      null
    }

    val outputFile = File(outputPath)
    outputFile.parentFile?.mkdirs()

    val encodeStart = SystemClock.elapsedRealtime()
    val progressListener = if (emitProgress && conversionId >= 0) {
      WebPProgressListener { percent -> sendProgress(25 + percent * 70 / 100, "encode") }
    } else {
      null
    }

    val errorMessage = nativeEncodeWebP(
      buffer,
      width,
      height,
      quality,
      method,
      lossless,
      exact,
      threadLevel,
      premultiplied,
      exifData,
      outputPath,
      progressListener,
    )
    val encodeMs = SystemClock.elapsedRealtime() - encodeStart

    if (errorMessage != null) {
      // JNI tags failures with a stable "IO:"/"ENC:" prefix
      val code = if (errorMessage.startsWith("IO:")) ERROR_CODE_IO_ERROR else ERROR_CODE_ENCODE_FAILED
      val message = errorMessage.removePrefix("IO:").removePrefix("ENC:")
      throw ConversionException(code, "WebP encoding failed: $message")
    }

    sendProgress(100, "done")

    val durationMs = SystemClock.elapsedRealtime() - startTime
    if (debug) {
      Log.d(
        TAG,
        "converted $inputPath -> $outputPath: " +
          "${decoded.originalWidth}x${decoded.originalHeight} ($originalSizeBytes B) -> " +
          "${width}x$height (${outputFile.length()} B) " +
          "[decode ${decodeMs}ms, encode ${encodeMs}ms, total ${durationMs}ms]"
      )
    }

    return Arguments.createMap().apply {
      putString("outputPath", outputPath)
      putInt("width", width)
      putInt("height", height)
      putDouble("sizeBytes", outputFile.length().toDouble())
      putInt("originalWidth", decoded.originalWidth)
      putInt("originalHeight", decoded.originalHeight)
      putDouble("originalSizeBytes", originalSizeBytes.toDouble())
      putDouble("durationMs", durationMs.toDouble())
    }
  }

  private fun openInputStream(contentUri: Uri?, inputFile: File?): InputStream? {
    return if (contentUri != null) {
      reactApplicationContext.contentResolver.openInputStream(contentUri)
    } else {
      inputFile?.inputStream()
    }
  }

  private fun getOriginalSizeBytes(contentUri: Uri?, inputFile: File?): Long {
    if (inputFile != null) {
      return inputFile.length()
    }
    if (contentUri != null) {
      try {
        reactApplicationContext.contentResolver
          .openAssetFileDescriptor(contentUri, "r")?.use { descriptor ->
            if (descriptor.length != AssetFileDescriptor.UNKNOWN_LENGTH) {
              return descriptor.length
            }
          }
      } catch (e: Exception) {
        // fall through
      }
    }
    return 0
  }

  private fun decodeImage(contentUri: Uri?, inputFile: File?, maxLongEdge: Int): DecodedImage {
    return try {
      if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.P) {
        decodeWithImageDecoder(contentUri, inputFile, maxLongEdge)
      } else {
        decodeWithBitmapFactory(contentUri, inputFile, maxLongEdge)
      }
    } catch (e: ConversionException) {
      throw e
    } catch (e: FileNotFoundException) {
      throw ConversionException(ERROR_CODE_FILE_NOT_FOUND, "File not found: ${e.message}", e)
    } catch (e: Exception) {
      throw ConversionException(ERROR_CODE_DECODE_FAILED, "Failed to decode image: ${e.message}", e)
    }
  }

  // API 28+: ImageDecoder decodes directly at the target size and applies
  // EXIF orientation itself
  private fun decodeWithImageDecoder(contentUri: Uri?, inputFile: File?, maxLongEdge: Int): DecodedImage {
    val source = if (contentUri != null) {
      ImageDecoder.createSource(reactApplicationContext.contentResolver, contentUri)
    } else {
      ImageDecoder.createSource(inputFile!!)
    }

    var originalWidth = 0
    var originalHeight = 0
    val bitmap = ImageDecoder.decodeBitmap(source) { decoder, info, _ ->
      // Software bitmap: HARDWARE config does not support pixel access
      decoder.allocator = ImageDecoder.ALLOCATOR_SOFTWARE
      originalWidth = info.size.width
      originalHeight = info.size.height
      if (maxLongEdge > 0) {
        val maxDimension = max(originalWidth, originalHeight)
        if (maxDimension > maxLongEdge) {
          val scale = maxLongEdge.toFloat() / maxDimension
          decoder.setTargetSize(
            max(1, (originalWidth * scale).roundToInt()),
            max(1, (originalHeight * scale).roundToInt()),
          )
        }
      }
    }
    return DecodedImage(bitmap, originalWidth, originalHeight)
  }

  // API 24-27: BitmapFactory with subsampling, then EXIF rotation and an
  // exact final scale
  private fun decodeWithBitmapFactory(contentUri: Uri?, inputFile: File?, maxLongEdge: Int): DecodedImage {
    val boundsOptions = BitmapFactory.Options().apply { inJustDecodeBounds = true }
    openInputStream(contentUri, inputFile)?.use {
      BitmapFactory.decodeStream(it, null, boundsOptions)
    } ?: throw FileNotFoundException(contentUri?.toString() ?: inputFile?.path)

    val originalWidth = boundsOptions.outWidth
    val originalHeight = boundsOptions.outHeight
    if (originalWidth <= 0 || originalHeight <= 0) {
      throw ConversionException(ERROR_CODE_DECODE_FAILED, "Failed to read image dimensions")
    }

    val decodeOptions = BitmapFactory.Options().apply {
      inPreferredConfig = Bitmap.Config.ARGB_8888
      if (maxLongEdge > 0) {
        val maxDimension = max(originalWidth, originalHeight)
        if (maxDimension > maxLongEdge) {
          inSampleSize = max(1, maxDimension / maxLongEdge)
        }
      }
    }

    var bitmap = openInputStream(contentUri, inputFile)?.use {
      BitmapFactory.decodeStream(it, null, decodeOptions)
    } ?: throw ConversionException(ERROR_CODE_DECODE_FAILED, "Failed to decode image")

    val orientation = try {
      openInputStream(contentUri, inputFile)?.use {
        ExifInterface(it).getAttributeInt(
          ExifInterface.TAG_ORIENTATION,
          ExifInterface.ORIENTATION_NORMAL,
        )
      } ?: ExifInterface.ORIENTATION_NORMAL
    } catch (e: Exception) {
      ExifInterface.ORIENTATION_NORMAL
    }
    bitmap = applyExifOrientation(bitmap, orientation)

    // inSampleSize is a power of two, so a final exact scale may remain
    if (maxLongEdge > 0) {
      val currentMax = max(bitmap.width, bitmap.height)
      if (currentMax > maxLongEdge) {
        val scale = maxLongEdge.toFloat() / currentMax
        val resized = Bitmap.createScaledBitmap(
          bitmap,
          max(1, (bitmap.width * scale).roundToInt()),
          max(1, (bitmap.height * scale).roundToInt()),
          true,
        )
        if (resized != bitmap) {
          bitmap.recycle()
          bitmap = resized
        }
      }
    }

    // Report user-facing dimensions: transposing orientations swap the axes
    val transposed = orientation == ExifInterface.ORIENTATION_TRANSPOSE ||
      orientation == ExifInterface.ORIENTATION_ROTATE_90 ||
      orientation == ExifInterface.ORIENTATION_TRANSVERSE ||
      orientation == ExifInterface.ORIENTATION_ROTATE_270
    return if (transposed) {
      DecodedImage(bitmap, originalHeight, originalWidth)
    } else {
      DecodedImage(bitmap, originalWidth, originalHeight)
    }
  }

  private fun applyExifOrientation(bitmap: Bitmap, orientation: Int): Bitmap {
    val matrix = Matrix()
    when (orientation) {
      ExifInterface.ORIENTATION_FLIP_HORIZONTAL -> matrix.preScale(-1f, 1f)
      ExifInterface.ORIENTATION_ROTATE_180 -> matrix.postRotate(180f)
      ExifInterface.ORIENTATION_FLIP_VERTICAL -> matrix.preScale(1f, -1f)
      ExifInterface.ORIENTATION_TRANSPOSE -> {
        matrix.postRotate(90f)
        matrix.preScale(-1f, 1f)
      }
      ExifInterface.ORIENTATION_ROTATE_90 -> matrix.postRotate(90f)
      ExifInterface.ORIENTATION_TRANSVERSE -> {
        matrix.postRotate(-90f)
        matrix.preScale(-1f, 1f)
      }
      ExifInterface.ORIENTATION_ROTATE_270 -> matrix.postRotate(270f)
      else -> return bitmap
    }
    val transformed = Bitmap.createBitmap(bitmap, 0, 0, bitmap.width, bitmap.height, matrix, true)
    if (transformed != bitmap) {
      bitmap.recycle()
    }
    return transformed
  }

  /**
   * Extract the raw EXIF payload (without the "Exif  " identifier)
   * from a JPEG stream. Returns null for non-JPEG inputs or JPEGs without
   * EXIF data.
   */
  private fun extractJpegExif(stream: InputStream): ByteArray? {
    try {
      val input = DataInputStream(BufferedInputStream(stream))
      if (input.read() != 0xFF || input.read() != 0xD8) {
        return null // not a JPEG
      }
      while (true) {
        var byte = input.read()
        if (byte == -1) return null
        if (byte != 0xFF) return null
        var marker = input.read()
        while (marker == 0xFF) marker = input.read()
        if (marker == -1) return null
        if (marker == 0xDA || marker == 0xD9) return null // image data reached
        if (marker == 0x01 || marker in 0xD0..0xD7) continue // standalone marker
        val lengthHigh = input.read()
        val lengthLow = input.read()
        if (lengthHigh == -1 || lengthLow == -1) return null
        val payloadLength = ((lengthHigh shl 8) or lengthLow) - 2
        if (payloadLength < 0) return null
        if (marker == 0xE1 && payloadLength > 6) {
          val payload = ByteArray(payloadLength)
          input.readFully(payload)
          val isExif = payload[0] == 'E'.code.toByte() &&
            payload[1] == 'x'.code.toByte() &&
            payload[2] == 'i'.code.toByte() &&
            payload[3] == 'f'.code.toByte() &&
            payload[4] == 0.toByte() &&
            payload[5] == 0.toByte()
          if (isExif) {
            return payload.copyOfRange(6, payload.size)
          }
        } else {
          var remaining = payloadLength
          while (remaining > 0) {
            val skipped = input.skipBytes(remaining)
            if (skipped <= 0) return null
            remaining -= skipped
          }
        }
      }
    } catch (e: Exception) {
      return null
    }
  }

  // Default output: a uniquely named file in the cache directory, which is
  // always writable and never collides with the source
  private fun deriveOutputPath(inputPath: String): String {
    val directory = File(reactApplicationContext.cacheDir, "webp")
    directory.mkdirs()
    val lastSegment = inputPath.substringAfterLast('/').substringBeforeLast('.')
    val base = lastSegment.replace(Regex("[^A-Za-z0-9._-]"), "_").ifEmpty { "image" }
    val unique = "${System.currentTimeMillis()}-${uniqueSuffix.incrementAndGet()}"
    return File(directory, "$base-$unique.webp").absolutePath
  }
}
