package com.dynlabs.reactnativeimagetowebp

import com.facebook.react.bridge.ReactApplicationContext

class ReactNativeImageToWebpModule(reactContext: ReactApplicationContext) :
  NativeReactNativeImageToWebpSpec(reactContext) {

  override fun multiply(a: Double, b: Double): Double {
    return a * b
  }

  companion object {
    const val NAME = NativeReactNativeImageToWebpSpec.NAME
  }
}
