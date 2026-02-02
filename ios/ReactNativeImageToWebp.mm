#import "ReactNativeImageToWebp.h"
#import <React/RCTUtils.h>
#import <ImageIO/ImageIO.h>
#import <CoreGraphics/CoreGraphics.h>
#import <Accelerate/Accelerate.h>
#import <Foundation/Foundation.h>
#import "ImageToWebP.h"

// Error domain
static NSString *const kErrorDomain = @"ReactNativeImageToWebp";

// Error codes matching JS API
static NSString *const kErrorCodeInvalidInput = @"INVALID_INPUT";
static NSString *const kErrorCodeFileNotFound = @"FILE_NOT_FOUND";
static NSString *const kErrorCodeDecodeFailed = @"DECODE_FAILED";
static NSString *const kErrorCodeEncodeFailed = @"ENCODE_FAILED";
static NSString *const kErrorCodeIOError = @"IO_ERROR";
static NSString *const kErrorCodeUnsupportedFormat = @"UNSUPPORTED_FORMAT";

@interface ReactNativeImageToWebp ()
@end

@implementation ReactNativeImageToWebp

+ (NSString *)moduleName {
  return @"ReactNativeImageToWebp";
}

// Helper to get CGImageSource from file path
static CGImageSourceRef createImageSource(NSString *path, NSError **error) {
  NSURL *url = [NSURL fileURLWithPath:path];
  if (!url) {
    if (error) {
      *error = [NSError errorWithDomain:kErrorDomain
                                   code:1
                               userInfo:@{NSLocalizedDescriptionKey: @"Invalid file path",
                                          @"code": kErrorCodeInvalidInput}];
    }
    return NULL;
  }

  CGImageSourceRef source = CGImageSourceCreateWithURL((__bridge CFURLRef)url, NULL);
  if (!source) {
    if (error) {
      *error = [NSError errorWithDomain:kErrorDomain
                                   code:1
                               userInfo:@{NSLocalizedDescriptionKey: @"File not found or cannot be read",
                                          @"code": kErrorCodeFileNotFound}];
    }
    return NULL;
  }

  return source;
}

// Get image properties including orientation
static NSDictionary *getImageProperties(CGImageSourceRef source) {
  return (__bridge_transfer NSDictionary *)CGImageSourceCopyPropertiesAtIndex(source, 0, NULL);
}

// Apply EXIF orientation to get correctly oriented image
static CGImageRef createOrientedImage(CGImageRef image, NSDictionary *properties) {
  NSNumber *orientationValue = properties[(__bridge NSString *)kCGImagePropertyOrientation];
  if (!orientationValue) {
    return CGImageRetain(image);
  }

  int orientation = [orientationValue intValue];
  if (orientation == 1) {
    return CGImageRetain(image); // No rotation needed
  }

  // Calculate transform based on orientation
  CGAffineTransform transform = CGAffineTransformIdentity;
  CGFloat width = CGImageGetWidth(image);
  CGFloat height = CGImageGetHeight(image);

  switch (orientation) {
    case 2: // Flip horizontal
      transform = CGAffineTransformMakeScale(-1, 1);
      transform = CGAffineTransformTranslate(transform, -width, 0);
      break;
    case 3: // Rotate 180
      transform = CGAffineTransformMakeTranslation(width, height);
      transform = CGAffineTransformRotate(transform, M_PI);
      break;
    case 4: // Flip vertical
      transform = CGAffineTransformMakeScale(1, -1);
      transform = CGAffineTransformTranslate(transform, 0, -height);
      break;
    case 5: // Rotate 90 CCW and flip
      transform = CGAffineTransformMakeTranslation(height, 0);
      transform = CGAffineTransformRotate(transform, M_PI_2);
      transform = CGAffineTransformScale(transform, -1, 1);
      break;
    case 6: // Rotate 90 CW
      transform = CGAffineTransformMakeTranslation(height, 0);
      transform = CGAffineTransformRotate(transform, M_PI_2);
      break;
    case 7: // Rotate 90 CW and flip
      transform = CGAffineTransformMakeTranslation(0, width);
      transform = CGAffineTransformRotate(transform, -M_PI_2);
      transform = CGAffineTransformScale(transform, -1, 1);
      break;
    case 8: // Rotate 90 CCW
      transform = CGAffineTransformMakeTranslation(0, width);
      transform = CGAffineTransformRotate(transform, -M_PI_2);
      break;
    default:
      return CGImageRetain(image);
  }

  // Create bitmap context and draw transformed image
  CGColorSpaceRef colorSpace = CGColorSpaceCreateDeviceRGB();
  CGContextRef context = CGBitmapContextCreate(NULL,
                                               (orientation >= 5 && orientation <= 8) ? height : width,
                                               (orientation >= 5 && orientation <= 8) ? width : height,
                                               8, 0, colorSpace,
                                               kCGImageAlphaPremultipliedLast | kCGBitmapByteOrder32Big);
  CGColorSpaceRelease(colorSpace);

  if (!context) {
    return CGImageRetain(image);
  }

  CGContextConcatCTM(context, transform);
  CGContextDrawImage(context, CGRectMake(0, 0, width, height), image);
  CGImageRef orientedImage = CGBitmapContextCreateImage(context);
  CGContextRelease(context);

  return orientedImage ?: CGImageRetain(image);
}

// Resize image if maxLongEdge is specified
static CGImageRef resizeImageIfNeeded(CGImageRef image, NSNumber *maxLongEdge) {
  if (!maxLongEdge || [maxLongEdge doubleValue] <= 0) {
    return CGImageRetain(image);
  }

  CGFloat width = CGImageGetWidth(image);
  CGFloat height = CGImageGetHeight(image);
  CGFloat maxEdge = [maxLongEdge doubleValue];
  CGFloat currentMax = MAX(width, height);

  if (currentMax <= maxEdge) {
    return CGImageRetain(image);
  }

  CGFloat scale = maxEdge / currentMax;
  CGFloat newWidth = width * scale;
  CGFloat newHeight = height * scale;

  CGColorSpaceRef colorSpace = CGColorSpaceCreateDeviceRGB();
  CGContextRef context = CGBitmapContextCreate(NULL,
                                               (size_t)newWidth,
                                               (size_t)newHeight,
                                               8, 0, colorSpace,
                                               kCGImageAlphaPremultipliedLast | kCGBitmapByteOrder32Big);
  CGColorSpaceRelease(colorSpace);

  if (!context) {
    return CGImageRetain(image);
  }

  CGContextSetInterpolationQuality(context, kCGInterpolationHigh);
  CGContextDrawImage(context, CGRectMake(0, 0, newWidth, newHeight), image);
  CGImageRef resizedImage = CGBitmapContextCreateImage(context);
  CGContextRelease(context);

  return resizedImage ?: CGImageRetain(image);
}

// Convert CGImage to RGBA buffer
static uint8_t *createRGBABuffer(CGImageRef image, uint32_t *outWidth, uint32_t *outHeight) {
  size_t width = CGImageGetWidth(image);
  size_t height = CGImageGetHeight(image);
  size_t bytesPerPixel = 4;
  size_t bytesPerRow = width * bytesPerPixel;
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

// Derive output path from input path if not provided
static NSString *deriveOutputPath(NSString *inputPath, NSString *outputPath, NSString *preset) {
  if (outputPath && outputPath.length > 0) {
    return outputPath;
  }

  NSString *directory = [inputPath stringByDeletingLastPathComponent];
  NSString *filename = [[inputPath lastPathComponent] stringByDeletingPathExtension];
  NSString *newFilename = [NSString stringWithFormat:@"%@.webp", filename];
  return [directory stringByAppendingPathComponent:newFilename];
}

- (void)convertImageToWebP:(NSDictionary *)options
                   resolver:(RCTPromiseResolveBlock)resolve
                   rejecter:(RCTPromiseRejectBlock)reject {
  dispatch_async(dispatch_get_global_queue(DISPATCH_QUEUE_PRIORITY_DEFAULT, 0), ^{
    @autoreleasepool {
      NSError *error = nil;

      // Parse options
      NSString *inputPath = options[@"inputPath"];
      if (!inputPath || ![inputPath isKindOfClass:[NSString class]]) {
        reject(kErrorCodeInvalidInput, @"inputPath is required", nil);
        return;
      }

      NSString *preset = options[@"preset"] ?: @"balanced";
      NSString *outputPath = deriveOutputPath(inputPath, options[@"outputPath"], preset);
      NSNumber *maxLongEdge = options[@"maxLongEdge"];
      NSNumber *quality = options[@"quality"] ?: @80;
      NSNumber *method = options[@"method"] ?: @3;
      NSNumber *lossless = options[@"lossless"] ?: @NO;
      NSNumber *stripMetadata = options[@"stripMetadata"];
      if (!stripMetadata) {
        stripMetadata = @YES;
      }

      // Check if input file exists
      if (![[NSFileManager defaultManager] fileExistsAtPath:inputPath]) {
        reject(kErrorCodeFileNotFound, [NSString stringWithFormat:@"File not found: %@", inputPath], nil);
        return;
      }

      // Create image source
      CGImageSourceRef source = createImageSource(inputPath, &error);
      if (!source) {
        reject(error.userInfo[@"code"] ?: kErrorCodeDecodeFailed,
               error.localizedDescription ?: @"Failed to create image source",
               error);
        return;
      }

      // Get image properties
      NSDictionary *properties = getImageProperties(source);
      if (!properties) {
        CGImageSourceRelease(source);
        reject(kErrorCodeDecodeFailed, @"Failed to read image properties", nil);
        return;
      }

      // Create CGImage
      CGImageRef image = CGImageSourceCreateImageAtIndex(source, 0, NULL);
      CGImageSourceRelease(source);
      if (!image) {
        reject(kErrorCodeDecodeFailed, @"Failed to decode image", nil);
        return;
      }

      // Apply orientation
      CGImageRef orientedImage = createOrientedImage(image, properties);
      CGImageRelease(image);
      if (!orientedImage) {
        reject(kErrorCodeDecodeFailed, @"Failed to apply orientation", nil);
        return;
      }

      // Resize if needed
      CGImageRef finalImage = resizeImageIfNeeded(orientedImage, maxLongEdge);
      CGImageRelease(orientedImage);
      if (!finalImage) {
        reject(kErrorCodeDecodeFailed, @"Failed to resize image", nil);
        return;
      }

      // Convert to RGBA buffer
      uint32_t width, height;
      uint8_t *rgbaData = createRGBABuffer(finalImage, &width, &height);
      CGImageRelease(finalImage);
      if (!rgbaData) {
        reject(kErrorCodeDecodeFailed, @"Failed to create RGBA buffer", nil);
        return;
      }

      // Prepare WebP encoding options
      WebPEncodeOptions encodeOptions;
      encodeOptions.quality = [quality intValue];
      encodeOptions.method = [method intValue];
      encodeOptions.lossless = [lossless boolValue];
      encodeOptions.stripMetadata = [stripMetadata boolValue];
      encodeOptions.threadLevel = 1;

      // Encode to WebP
      std::string outputPathStr = [outputPath UTF8String];
      WebPEncodeResult result = encodeWebP(rgbaData, width, height, encodeOptions, outputPathStr);
      free(rgbaData);

      if (!result.success) {
        NSString *errorMsg = [NSString stringWithUTF8String:result.errorMessage.c_str()];
        reject(kErrorCodeEncodeFailed, errorMsg, nil);
        return;
      }

      // Get file size
      NSDictionary *fileAttributes = [[NSFileManager defaultManager] attributesOfItemAtPath:outputPath error:&error];
      NSNumber *fileSize = fileAttributes[NSFileSize];
      if (!fileSize) {
        fileSize = @0;
      }

      // Return result
      resolve(@{
        @"outputPath": outputPath,
        @"width": @(result.width ?: width),
        @"height": @(result.height ?: height),
        @"sizeBytes": fileSize,
      });
    }
  });
}

- (std::shared_ptr<facebook::react::TurboModule>)getTurboModule:
    (const facebook::react::ObjCTurboModule::InitParams &)params {
  return std::make_shared<facebook::react::NativeReactNativeImageToWebpSpecJSI>(params);
}

@end
