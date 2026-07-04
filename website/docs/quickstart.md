---
sidebar_position: 1
title: Quick Start
slug: /
---

# @dynlabs/react-native-image-to-webp

**Performant. Type-safe. Zero-effort WebP conversion for React Native.**

Convert any image to WebP format in milliseconds using React Native's **New Architecture (TurboModules)**. Optimized for speed and quality with native implementations and `libwebp`.

---

## ⚡ Features

- 🧘 **Zero configuration**: `convertImageToWebP({ inputPath })` is production-ready — sensible preset, display-friendly resize, safe output location.
- 🔗 **Any input URI**: plain paths, `file://`, Android `content://` (image pickers!) and iOS `ph://` photo-library assets.
- 🚀 **TurboModule** for maximal performance (New Architecture), parallel conversions off the JS thread.
- 📈 **Observable**: live progress events, per-conversion timing, size savings, and an opt-in debug log with a native timing breakdown.
- 🎨 **Smart Presets**: `balanced`, `small`, `fast`, `lossless`, `document`.
- 📐 **Smart Resizing**: aspect-ratio-preserving `maxLongEdge`, decoded directly at target size.
- 🔒 **Privacy-First**: strips EXIF metadata by default (opt out with `stripMetadata: false` to carry JPEG EXIF over).
- 🧪 **Test-friendly**: ships a ready-made Jest mock.

---

## 📦 Installation

```bash
npm install @dynlabs/react-native-image-to-webp
# or
yarn add @dynlabs/react-native-image-to-webp
```

### iOS Setup

```bash
cd ios && pod install && cd ..
```

_Note: Android works out of the box._

---

## 🚀 Quick Start (5 seconds)

The easiest way to use the library is with the built-in React hook — pass it whatever URI your image picker returns:

```tsx
import { useImageConverter } from '@dynlabs/react-native-image-to-webp';

function App() {
  const { convert, isConverting, progress, result } = useImageConverter();

  const handlePress = async () => {
    // file://, content:// and ph:// URIs all work — no options needed
    const res = await convert({ inputPath: asset.uri });
    console.log(
      `Saved ${res.savedPercent.toFixed(1)}% in ${res.durationMs}ms:`,
      res.outputPath
    );
  };

  return (
    <Button
      title={
        isConverting
          ? `Converting… ${progress?.percent ?? 0}%`
          : 'Convert to WebP'
      }
      onPress={handlePress}
    />
  );
}
```

### Manual Usage

```tsx
import { convertImageToWebP } from '@dynlabs/react-native-image-to-webp';

const result = await convertImageToWebP({
  inputPath: '/path/to/image.jpg',
  preset: 'small', // 'balanced' | 'small' | 'fast' | 'lossless' | 'document'
  onProgress: ({ percent, phase }) => console.log(phase, percent),
});
```

Every conversion returns rich stats — no bookkeeping required:

```ts
result.outputPath; // unique file in the app cache directory
result.width, result.height;
result.sizeBytes;
result.originalWidth, result.originalHeight, result.originalSizeBytes;
result.savedBytes, result.savedPercent;
result.durationMs;
```

### Debugging

```ts
import { setDebugLogging } from '@dynlabs/react-native-image-to-webp';

setDebugLogging(true); // or pass `debug: true` per call
```

Logs the effective options and a native decode/encode timing breakdown to the JS console and logcat / os_log.

---

## 🎨 Presets & Benchmarks

The following benchmarks were run natively on an Android Emulator using an original 4K image (4017 x 2683, ~1.96 MB). Note that Github may resize or compress the embedded images below.

| Preset     | Result (WebP)                                             | Output Size | Space Saved  | Notes                                                       |
| ---------- | --------------------------------------------------------- | ----------- | ------------ | ----------------------------------------------------------- |
| _Original_ | <img src="https://raw.githubusercontent.com/dynlabs/react-native-image-to-webp/main/samples/input-4k.jpg" width="300" />            | 1.96 MB     | -            | The raw 4K JPEG.                                            |
| `fast`     | <img src="https://raw.githubusercontent.com/dynlabs/react-native-image-to-webp/main/samples/output-4k-fast.webp" width="300" />     | 980.9 KB    | ~50.0%       | Focused on encoding speed. Trades efficiency for speed.     |
| `balanced` | <img src="https://raw.githubusercontent.com/dynlabs/react-native-image-to-webp/main/samples/output-4k-balanced.webp" width="300" /> | 1007.1 KB   | ~48.7%       | **Default**. Sweet spot for fidelity and size.              |
| `small`    | <img src="https://raw.githubusercontent.com/dynlabs/react-native-image-to-webp/main/samples/output-4k-small.webp" width="300" />    | 686.0 KB    | ~65.0%       | Aggressive compression. Massive real-world savings!         |
| `lossless` | <img src="https://raw.githubusercontent.com/dynlabs/react-native-image-to-webp/main/samples/output-4k-lossless.webp" width="300" /> | 10.37 MB    | _(+8.41 MB)_ | Perfect mathematical recreation. Very large for 4K.         |
| `document` | -                                                         | -           | -            | Tuned for screenshots, scans and text: sharper, `exact` on. |

> ⚠️ **Note on `lossless`**: Lossless WebP mathematically guarantees bit-for-bit recreation without throwing away any data. While extremely efficient for PNGs, passing a lossy format like a JPEG into the `lossless` preset will frequently result in an output file that is significantly larger than the original input.

> The benchmarks above were measured without resizing. Since v1.1.0 the `balanced`, `small` and `fast` presets resize to a 2048px long edge by default, so real-world savings are even larger. Pass `maxLongEdge: 0` to keep original dimensions.

---

## 📐 Resizing

`balanced`, `small` and `fast` default to `maxLongEdge: 2048` — a retina-friendly size that makes conversion dramatically faster and smaller. `lossless` and `document` keep original dimensions. Override per call:

- **Thumbnails**: `maxLongEdge: 512`
- **Mobile Display**: `maxLongEdge: 1024`
- **Retina (default)**: `maxLongEdge: 2048`
- **Original size**: `maxLongEdge: 0`

---

## 🧪 Testing your app

TurboModules aren't available in Jest. Mock the package once in your Jest setup file:

```js
jest.mock('@dynlabs/react-native-image-to-webp', () =>
  require('@dynlabs/react-native-image-to-webp/jest')
);
```

`convertImageToWebP` becomes a `jest.fn()` resolving realistic results (and firing `onProgress`), and `useImageConverter` keeps working.

---

## 📱 Notes

- **Android `content://` URIs** are read through the `ContentResolver`, so URIs from `react-native-image-picker`, `expo-image-picker`, the camera or the Storage Access Framework work directly.
- **iOS `ph://` URIs** are resolved through the Photos framework. Loading them requires photo-library access (the permission your picker already requested).
- **Metadata**: output is metadata-free by default. With `stripMetadata: false`, EXIF from JPEG sources is embedded in the WebP container (with the orientation tag neutralized, since rotation is baked into the pixels).

See [/api](/api) for the full API reference.

---

## 🛡️ License

MIT. Made with ❤️ by the community.
