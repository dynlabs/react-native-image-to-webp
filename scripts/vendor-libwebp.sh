#!/bin/bash
# Script to vendor libwebp sources

set -e

LIBWEBP_VERSION="1.6.0"
VENDOR_DIR="cpp/vendor"
LIBWEBP_DIR="${VENDOR_DIR}/libwebp"

echo "Vendoring libwebp ${LIBWEBP_VERSION}..."

# Create vendor directory
mkdir -p "${VENDOR_DIR}"

# Clone or update libwebp
if [ -d "${LIBWEBP_DIR}" ]; then
  echo "libwebp directory exists, updating..."
  cd "${LIBWEBP_DIR}"
  git fetch
  git checkout "v${LIBWEBP_VERSION}" || git checkout "${LIBWEBP_VERSION}"
  cd - > /dev/null
else
  echo "Cloning libwebp..."
  git clone https://github.com/webmproject/libwebp.git "${LIBWEBP_DIR}"
  cd "${LIBWEBP_DIR}"
  git checkout "v${LIBWEBP_VERSION}" || git checkout "${LIBWEBP_VERSION}"
  cd - > /dev/null
fi

echo "✓ libwebp ${LIBWEBP_VERSION} vendored successfully!"
echo ""
echo "Next steps:"
echo "1. Uncomment the libwebp includes in cpp/ImageToWebP.cpp"
echo "2. Uncomment the implementation in cpp/ImageToWebP.cpp"
echo "3. Update build files (podspec and CMakeLists.txt) to include libwebp sources"
echo "4. Rebuild the project"
