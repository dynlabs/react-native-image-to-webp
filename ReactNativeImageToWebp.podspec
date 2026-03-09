require "json"

package = JSON.parse(File.read(File.join(__dir__, "package.json")))

Pod::Spec.new do |s|
  s.name         = "ReactNativeImageToWebp"
  s.version      = package["version"]
  s.summary      = package["description"]
  s.homepage     = package["homepage"]
  s.license      = package["license"]
  s.authors      = package["author"]

  s.platforms    = { :ios => min_ios_version_supported }
  s.source       = { :git => "https://github.com/dynlabs/react-native-image-to-webp.git", :tag => "#{s.version}" }

  s.source_files = "ios/**/*.{h,m,mm,swift,cpp}", "cpp/**/*.{h,cpp}"
  s.private_header_files = "ios/**/*.h", "cpp/**/*.h"

  # Use CocoaPods dependency for libwebp
  # Note: libwebp pod is available up to version 1.5.0
  s.dependency "libwebp", "~> 1.5"
  s.compiler_flags = "-O3 -DNDEBUG -DWEBP_AVAILABLE"
  s.pod_target_xcconfig = {
    "HEADER_SEARCH_PATHS" => "\"$(inherited)\" \"${PODS_ROOT}/Headers/Private/React-Core\" \"${PODS_ROOT}/libwebp/src\"",
    "OTHER_CPLUSPLUSFLAGS" => "$(OTHER_CFLAGS)",
    "CLANG_CXX_LANGUAGE_STANDARD" => "c++20"
  }

  install_modules_dependencies(s)
end
