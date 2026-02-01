cmake_minimum_required(VERSION 3.22.1)

project("react-native-image-to-webp")

# Set C++ standard
set(CMAKE_CXX_STANDARD 17)
set(CMAKE_CXX_STANDARD_REQUIRED ON)

# Release flags
set(CMAKE_CXX_FLAGS_RELEASE "${CMAKE_CXX_FLAGS_RELEASE} -O3 -DNDEBUG")
set(CMAKE_C_FLAGS_RELEASE "${CMAKE_C_FLAGS_RELEASE} -O3 -DNDEBUG")

# Include directories
include_directories(
  ${CMAKE_CURRENT_SOURCE_DIR}/../../../cpp
)

# Check if libwebp is vendored
if(EXISTS "${CMAKE_CURRENT_SOURCE_DIR}/../../../cpp/vendor/libwebp/src")
  # libwebp is vendored, include it
  include_directories(
    ${CMAKE_CURRENT_SOURCE_DIR}/../../../cpp/vendor/libwebp/src
  )
  
  # Add libwebp source files
  file(GLOB_RECURSE WEBP_SOURCES
    "${CMAKE_CURRENT_SOURCE_DIR}/../../../cpp/vendor/libwebp/src/enc/*.c"
    "${CMAKE_CURRENT_SOURCE_DIR}/../../../cpp/vendor/libwebp/src/dec/*.c"
    "${CMAKE_CURRENT_SOURCE_DIR}/../../../cpp/vendor/libwebp/src/dsp/*.c"
    "${CMAKE_CURRENT_SOURCE_DIR}/../../../cpp/vendor/libwebp/src/utils/*.c"
    "${CMAKE_CURRENT_SOURCE_DIR}/../../../cpp/vendor/libwebp/src/webp/*.c"
  )
  
  # Define WEBP_AVAILABLE preprocessor macro
  add_definitions(-DWEBP_AVAILABLE)
  
  message(STATUS "libwebp found, including sources")
else()
  message(WARNING "libwebp not found. Please vendor libwebp to cpp/vendor/libwebp/")
  set(WEBP_SOURCES "")
endif()

# Source files
set(SOURCES
  ImageToWebPJNI.cpp
  ../../../cpp/ImageToWebP.cpp
  ${WEBP_SOURCES}
)

# Create shared library
add_library(
  react-native-image-to-webp
  SHARED
  ${SOURCES}
)

# Link libraries
find_library(
  log-lib
  log
)

target_link_libraries(
  react-native-image-to-webp
  ${log-lib}
  # libwebp static library would be linked here if built separately
)
