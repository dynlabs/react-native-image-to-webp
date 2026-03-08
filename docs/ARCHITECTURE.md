# Architecture Overview

`@dynlabs/react-native-image-to-webp` uses React Native's **New Architecture (TurboModules)** to provide high-performance image conversion.

## 🏗️ Core Layers

### 1. JavaScript / TypeScript (`src/`)
- **API**: Exposes `convertImageToWebP` and the `useImageConverter` hook.
- **Validation**: Ensures inputs are valid before crossing the bridge.
- **Presets**: Maps human-friendly names (e.g., `balanced`) to technical WebP settings.

### 2. TurboModule Bridge
- Uses **Codegen** for type-safe synchronous communication between JS and Native.
- Passes RGBA buffers and conversion parameters to native threads.

### 3. Native Layer (`ios/`, `android/`)
- processes all work on **background threads** to keep the UI responsive.
- **Decoders**: Uses platform-native tools (`ImageIO` on iOS, `ImageDecoder` on Android).
- **Processing**: Handles resizing (preserving aspect ratio) and EXIF orientation.

### 4. C++ Encoding (`cpp/`)
- Shared between iOS and Android.
- Wrapper around **libwebp** library.
- Efficiently encodes raw pixel data into a WebP file.

## 🧵 Threading Model

Zero work is done on the main thread:
1. JS initializes the call.
2. Bridge hand-offs to a dedicated background worker.
3. Native code decodes and encodes.
4. Bridge returns the result to JS.

## 🔋 Battery & Memory
By resizing *before* encoding (using `maxLongEdge`), the library minimizes peak memory usage and CPU cycles, ensuring minimal impact on device resources.
