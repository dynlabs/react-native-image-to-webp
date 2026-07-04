#import "ReactNativeImageToWebp.h"
#import <React/RCTUtils.h>
#import <ImageIO/ImageIO.h>
#import <CoreGraphics/CoreGraphics.h>
#import <Foundation/Foundation.h>
#import <Photos/Photos.h>
#import <QuartzCore/QuartzCore.h>
#import <stdatomic.h>
#import <vector>
#import "ImageToWebP.h"

// Error codes matching JS API
static NSString *const kErrorCodeInvalidInput = @"INVALID_INPUT";
static NSString *const kErrorCodeFileNotFound = @"FILE_NOT_FOUND";
static NSString *const kErrorCodeDecodeFailed = @"DECODE_FAILED";
static NSString *const kErrorCodeEncodeFailed = @"ENCODE_FAILED";
static NSString *const kErrorCodeIOError = @"IO_ERROR";

@implementation ReactNativeImageToWebp

+ (NSString *)moduleName {
  return @"ReactNativeImageToWebp";
}

// Fetch the raw bytes of a photo-library asset (ph://<localIdentifier>)
static NSData *loadPhotoLibraryAssetData(NSString *phUri) {
  NSString *localIdentifier = [phUri substringFromIndex:@"ph://".length];
  PHFetchResult<PHAsset *> *fetchResult =
      [PHAsset fetchAssetsWithLocalIdentifiers:@[ localIdentifier ] options:nil];
  PHAsset *asset = fetchResult.firstObject;
  if (asset == nil) {
    return nil;
  }

  PHImageRequestOptions *requestOptions = [PHImageRequestOptions new];
  requestOptions.synchronous = YES;
  requestOptions.networkAccessAllowed = YES;
  requestOptions.version = PHImageRequestOptionsVersionCurrent;
  requestOptions.deliveryMode = PHImageRequestOptionsDeliveryModeHighQualityFormat;

  __block NSData *assetData = nil;
  [[PHImageManager defaultManager]
      requestImageDataAndOrientationForAsset:asset
                                     options:requestOptions
                               resultHandler:^(NSData *imageData, NSString *dataUTI,
                                               CGImagePropertyOrientation orientation,
                                               NSDictionary *info) {
                                 assetData = imageData;
                               }];
  return assetData;
}

// Convert CGImage to a premultiplied RGBA buffer
static uint8_t *createRGBABuffer(CGImageRef image, uint32_t *outWidth, uint32_t *outHeight) {
  size_t width = CGImageGetWidth(image);
  size_t height = CGImageGetHeight(image);
  size_t bytesPerRow = width * 4;
  size_t bufferSize = bytesPerRow * height;

  uint8_t *buffer = (uint8_t *)malloc(bufferSize);
  if (!buffer) {
    return NULL;
  }

  CGColorSpaceRef colorSpace = CGColorSpaceCreateDeviceRGB();
  CGContextRef context = CGBitmapContextCreate(buffer,
                                               width,
                                               height,
                                               8,
                                               bytesPerRow,
                                               colorSpace,
                                               kCGImageAlphaPremultipliedLast | kCGBitmapByteOrder32Big);
  CGColorSpaceRelease(colorSpace);

  if (!context) {
    free(buffer);
    return NULL;
  }

  CGContextDrawImage(context, CGRectMake(0, 0, width, height), image);
  CGContextRelease(context);

  *outWidth = (uint32_t)width;
  *outHeight = (uint32_t)height;
  return buffer;
}

static BOOL imageHasAlpha(CGImageRef image) {
  CGImageAlphaInfo alphaInfo = CGImageGetAlphaInfo(image);
  return alphaInfo != kCGImageAlphaNone &&
         alphaInfo != kCGImageAlphaNoneSkipLast &&
         alphaInfo != kCGImageAlphaNoneSkipFirst;
}

// Default output: a uniquely named file in the cache directory, which is
// always writable and never collides with the source
static NSString *deriveOutputPath(NSString *inputPath) {
  static atomic_ulong uniqueSuffix = 0;

  NSString *cachesDirectory =
      NSSearchPathForDirectoriesInDomains(NSCachesDirectory, NSUserDomainMask, YES).firstObject;
  NSString *directory = [cachesDirectory stringByAppendingPathComponent:@"webp"];
  [[NSFileManager defaultManager] createDirectoryAtPath:directory
                            withIntermediateDirectories:YES
                                             attributes:nil
                                                  error:nil];

  NSString *base = [[inputPath lastPathComponent] stringByDeletingPathExtension];
  NSMutableCharacterSet *allowed = [NSMutableCharacterSet alphanumericCharacterSet];
  [allowed addCharactersInString:@"._-"];
  base = [[base componentsSeparatedByCharactersInSet:[allowed invertedSet]]
      componentsJoinedByString:@"_"];
  if (base.length == 0) {
    base = @"image";
  }

  unsigned long suffix = atomic_fetch_add(&uniqueSuffix, 1) + 1;
  NSString *filename =
      [NSString stringWithFormat:@"%@-%lld-%lu.webp", base,
                                 (long long)([NSDate date].timeIntervalSince1970 * 1000), suffix];
  return [directory stringByAppendingPathComponent:filename];
}

- (void)convertImageToWebP:(JS::NativeReactNativeImageToWebp::NativeConvertOptions &)options
                   resolve:(RCTPromiseResolveBlock)resolve
                    reject:(RCTPromiseRejectBlock)reject {
  // Copy option values out of the codegen struct before leaving the JS thread
  NSString *rawInputPath = options.inputPath();
  NSString *explicitOutputPath = options.outputPath();
  double maxLongEdge = options.maxLongEdge().value_or(0);
  int quality = (int)options.quality().value_or(80);
  int method = (int)options.method().value_or(3);
  BOOL lossless = options.lossless().value_or(false);
  BOOL exact = options.exact().value_or(false);
  int threadLevel = (int)options.threadLevel().value_or(1);
  BOOL stripMetadata = options.stripMetadata().value_or(true);
  BOOL debug = options.debug().value_or(false);
  BOOL emitProgress = options.emitProgress().value_or(false);
  double conversionId = options.conversionId().value_or(-1);

  dispatch_async(dispatch_get_global_queue(DISPATCH_QUEUE_PRIORITY_DEFAULT, 0), ^{
    @autoreleasepool {
      CFTimeInterval startTime = CACurrentMediaTime();

      if (rawInputPath == nil || rawInputPath.length == 0) {
        reject(kErrorCodeInvalidInput, @"inputPath is required", nil);
        return;
      }
      if (quality < 0 || quality > 100) {
        reject(kErrorCodeInvalidInput, @"quality must be between 0 and 100", nil);
        return;
      }
      if (method < 0 || method > 6) {
        reject(kErrorCodeInvalidInput, @"method must be between 0 and 6", nil);
        return;
      }

      __block NSInteger lastEmitted = -1;
      void (^sendProgress)(NSInteger, NSString *) = ^(NSInteger percent, NSString *phase) {
        if (!emitProgress || conversionId < 0) {
          return;
        }
        NSInteger clamped = MIN(MAX(percent, (NSInteger)0), (NSInteger)100);
        if (clamped == lastEmitted) {
          return;
        }
        lastEmitted = clamped;
        [self emitOnConversionProgress:@{
          @"conversionId" : @(conversionId),
          @"progress" : @(clamped),
          @"phase" : phase,
        }];
      };

      sendProgress(0, @"decode");

      // Resolve the source into a CGImageSource. ph:// photo-library assets
      // are loaded through PHImageManager; everything else is a file path.
      NSString *inputPath = rawInputPath;
      NSData *sourceData = nil; // raw bytes, kept for EXIF extraction
      CGImageSourceRef source = NULL;
      long long originalSizeBytes = 0;

      if ([rawInputPath hasPrefix:@"ph://"]) {
        sourceData = loadPhotoLibraryAssetData(rawInputPath);
        if (sourceData == nil) {
          reject(kErrorCodeFileNotFound,
                 [NSString stringWithFormat:@"Photo library asset not found: %@", rawInputPath],
                 nil);
          return;
        }
        originalSizeBytes = (long long)sourceData.length;
        source = CGImageSourceCreateWithData((__bridge CFDataRef)sourceData, NULL);
      } else {
        if ([inputPath hasPrefix:@"file://"]) {
          inputPath = [[inputPath substringFromIndex:@"file://".length]
              stringByRemovingPercentEncoding] ?: [inputPath substringFromIndex:@"file://".length];
        }
        if (![[NSFileManager defaultManager] fileExistsAtPath:inputPath]) {
          reject(kErrorCodeFileNotFound,
                 [NSString stringWithFormat:@"File not found: %@", inputPath], nil);
          return;
        }
        NSDictionary *inputAttributes =
            [[NSFileManager defaultManager] attributesOfItemAtPath:inputPath error:nil];
        originalSizeBytes = [inputAttributes[NSFileSize] longLongValue];
        NSURL *url = [NSURL fileURLWithPath:inputPath];
        source = CGImageSourceCreateWithURL((__bridge CFURLRef)url, NULL);
      }

      if (!source) {
        reject(kErrorCodeDecodeFailed, @"Failed to read image data", nil);
        return;
      }

      NSDictionary *properties =
          (__bridge_transfer NSDictionary *)CGImageSourceCopyPropertiesAtIndex(source, 0, NULL);
      if (!properties) {
        CFRelease(source);
        reject(kErrorCodeDecodeFailed, @"Failed to read image properties", nil);
        return;
      }

      uint32_t originalWidth = [properties[(__bridge NSString *)kCGImagePropertyPixelWidth] unsignedIntValue];
      uint32_t originalHeight = [properties[(__bridge NSString *)kCGImagePropertyPixelHeight] unsignedIntValue];
      // Report user-facing dimensions: EXIF orientations 5-8 swap the axes
      int orientation = [properties[(__bridge NSString *)kCGImagePropertyOrientation] intValue];
      if (orientation >= 5 && orientation <= 8) {
        uint32_t tmp = originalWidth;
        originalWidth = originalHeight;
        originalHeight = tmp;
      }

      // Decode directly at the target size: far less memory and time than
      // decoding full-size and drawing down, and the transform option bakes
      // EXIF orientation into the pixels for free.
      CFTimeInterval decodeStart = CACurrentMediaTime();
      double maxPixelSize = maxLongEdge > 0
          ? maxLongEdge
          : (double)MAX(originalWidth, originalHeight);
      NSDictionary *thumbnailOptions = @{
        (__bridge NSString *)kCGImageSourceCreateThumbnailFromImageAlways : @YES,
        (__bridge NSString *)kCGImageSourceCreateThumbnailWithTransform : @YES,
        (__bridge NSString *)kCGImageSourceShouldCacheImmediately : @YES,
        (__bridge NSString *)kCGImageSourceThumbnailMaxPixelSize : @(maxPixelSize),
      };
      CGImageRef image = CGImageSourceCreateThumbnailAtIndex(
          source, 0, (__bridge CFDictionaryRef)thumbnailOptions);
      CFRelease(source);
      if (!image) {
        reject(kErrorCodeDecodeFailed, @"Failed to decode image", nil);
        return;
      }

      BOOL hasAlpha = imageHasAlpha(image);
      uint32_t width, height;
      uint8_t *rgbaData = createRGBABuffer(image, &width, &height);
      CGImageRelease(image);
      if (!rgbaData) {
        reject(kErrorCodeDecodeFailed, @"Failed to create RGBA buffer", nil);
        return;
      }
      // CoreGraphics only draws premultiplied; WebP expects straight alpha
      if (hasAlpha) {
        unpremultiplyRGBA(rgbaData, (size_t)width * height);
      }
      CFTimeInterval decodeMs = (CACurrentMediaTime() - decodeStart) * 1000.0;
      sendProgress(25, @"decode");

      // Optionally carry JPEG EXIF over into the WebP container
      std::vector<uint8_t> exif;
      if (!stripMetadata) {
        if (sourceData == nil) {
          sourceData = [NSData dataWithContentsOfFile:inputPath
                                              options:NSDataReadingMappedIfSafe
                                                error:nil];
        }
        if (sourceData != nil) {
          exif = extractExifFromJpeg((const uint8_t *)sourceData.bytes, sourceData.length);
          // Rotation is baked into the pixels now
          resetExifOrientationTag(exif.data(), exif.size());
        }
      }

      NSString *outputPath = (explicitOutputPath.length > 0)
          ? explicitOutputPath
          : deriveOutputPath(inputPath);

      WebPEncodeOptions encodeOptions;
      encodeOptions.quality = quality;
      encodeOptions.method = method;
      encodeOptions.lossless = lossless;
      encodeOptions.exact = exact;
      encodeOptions.threadLevel = threadLevel;
      encodeOptions.stripMetadata = exif.empty();
      encodeOptions.exifData = exif.empty() ? nullptr : exif.data();
      encodeOptions.exifSize = exif.size();

      WebPProgressFn progressFn = nullptr;
      if (emitProgress && conversionId >= 0) {
        progressFn = [sendProgress](int percent) {
          sendProgress(25 + percent * 70 / 100, @"encode");
        };
      }

      CFTimeInterval encodeStart = CACurrentMediaTime();
      WebPEncodeResult result = encodeWebP(
          rgbaData, width, height, encodeOptions, [outputPath UTF8String], progressFn);
      free(rgbaData);
      CFTimeInterval encodeMs = (CACurrentMediaTime() - encodeStart) * 1000.0;

      if (!result.success) {
        NSString *errorMessage = [NSString stringWithUTF8String:result.errorMessage.c_str()];
        NSString *code = [errorMessage containsString:@"output file"]
            ? kErrorCodeIOError
            : kErrorCodeEncodeFailed;
        reject(code, [NSString stringWithFormat:@"WebP encoding failed: %@", errorMessage], nil);
        return;
      }

      sendProgress(100, @"done");

      double durationMs = (CACurrentMediaTime() - startTime) * 1000.0;
      if (debug) {
        NSLog(@"[ImageToWebP] converted %@ -> %@: %ux%u (%lld B) -> %ux%u (%zu B) "
              @"[decode %.0fms, encode %.0fms, total %.0fms]",
              rawInputPath, outputPath, originalWidth, originalHeight, originalSizeBytes,
              width, height, result.sizeBytes, decodeMs, encodeMs, durationMs);
      }

      resolve(@{
        @"outputPath" : outputPath,
        @"width" : @(width),
        @"height" : @(height),
        @"sizeBytes" : @(result.sizeBytes),
        @"originalWidth" : @(originalWidth),
        @"originalHeight" : @(originalHeight),
        @"originalSizeBytes" : @(originalSizeBytes),
        @"durationMs" : @(durationMs),
      });
    }
  });
}

- (std::shared_ptr<facebook::react::TurboModule>)getTurboModule:
    (const facebook::react::ObjCTurboModule::InitParams &)params {
  return std::make_shared<facebook::react::NativeReactNativeImageToWebpSpecJSI>(params);
}

@end
