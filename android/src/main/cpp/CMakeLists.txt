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
  ${CMAKE_CURRENT_SOURCE_DIR}/../../../../cpp
)

# Use CMake FetchContent to automatically download libwebp sources
include(FetchContent)

FetchContent_Declare(
  libwebp
  GIT_REPOSITORY https://github.com/webmproject/libwebp.git
  GIT_TAG        v1.6.0
  GIT_SHALLOW    TRUE
)

# Download libwebp sources
message(STATUS "Downloading libwebp via FetchContent...")
FetchContent_GetProperties(libwebp)
if(NOT libwebp_POPULATED)
  FetchContent_Populate(libwebp)
endif()
set(LIBWEBP_SOURCE_DIR ${libwebp_SOURCE_DIR})

# Include libwebp headers
include_directories(
  ${LIBWEBP_SOURCE_DIR}
  ${LIBWEBP_SOURCE_DIR}/src
)

# Add libwebp source files (we compile them ourselves)
file(GLOB_RECURSE WEBP_SOURCES
  "${LIBWEBP_SOURCE_DIR}/src/enc/*.c"
  "${LIBWEBP_SOURCE_DIR}/src/dec/*.c"
  "${LIBWEBP_SOURCE_DIR}/src/dsp/*.c"
  "${LIBWEBP_SOURCE_DIR}/src/utils/*.c"
  "${LIBWEBP_SOURCE_DIR}/src/webp/*.c"
  "${LIBWEBP_SOURCE_DIR}/sharpyuv/*.c"
)

# Define WEBP_AVAILABLE preprocessor macro
add_definitions(-DWEBP_AVAILABLE)
message(STATUS "libwebp configured, including sources")

# Source files
set(SOURCES
  ImageToWebPJNI.cpp
  ../../../../cpp/ImageToWebP.cpp
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
