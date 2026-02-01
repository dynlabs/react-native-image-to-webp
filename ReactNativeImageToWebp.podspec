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
  s.source       = { :git => ".git", :tag => "#{s.version}" }

  s.source_files = "ios/**/*.{h,m,mm,swift,cpp}", "cpp/**/*.{h,cpp}"
  s.private_header_files = "ios/**/*.h", "cpp/**/*.h"

  # Include libwebp sources if vendored
  libwebp_path = File.join(__dir__, "cpp/vendor/libwebp/src")
  if Dir.exist?(libwebp_path)
    s.source_files += "cpp/vendor/libwebp/src/**/*.{c,h}"
    s.public_header_files = "cpp/vendor/libwebp/src/webp/*.h"
    s.compiler_flags = "-O3", "-DNDEBUG", "-DWEBP_AVAILABLE"
  else
    Pod::UI.warn "libwebp not found at #{libwebp_path}. Please vendor libwebp sources."
    s.compiler_flags = "-O3", "-DNDEBUG"
  end
  s.pod_target_xcconfig = {
    "HEADER_SEARCH_PATHS" => "$(inherited) ${PODS_ROOT}/Headers/Private/React-Core",
    "OTHER_CPLUSPLUSFLAGS" => "$(OTHER_CFLAGS) -std=c++17"
  }

  install_modules_dependencies(s)
end
