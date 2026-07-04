#import <React/RCTBridgeModule.h>

/**
 * Test fixture for the example app and the Maestro e2e suite: returns the
 * path of the bundled sample.jpg, so flows can exercise the conversion
 * pipeline without the system image picker.
 */
@interface SampleImage : NSObject <RCTBridgeModule>
@end

@implementation SampleImage

RCT_EXPORT_MODULE();

+ (BOOL)requiresMainQueueSetup {
  return NO;
}

RCT_EXPORT_METHOD(getSampleImagePath:(RCTPromiseResolveBlock)resolve
                  reject:(RCTPromiseRejectBlock)reject) {
  NSString *path = [[NSBundle mainBundle] pathForResource:@"sample" ofType:@"jpg"];
  if (path != nil) {
    resolve(path);
  } else {
    reject(@"E_SAMPLE_IMAGE", @"sample.jpg is not bundled in the app", nil);
  }
}

@end
