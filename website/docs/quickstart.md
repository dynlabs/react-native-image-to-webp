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

- 🚀 **TurboModule** for maximal performance (New Architecture).
- 🎨 **Smart Presets**: Choose between balance, small, fast, and lossless.
- 📐 **Smart Resizing**: Auto-preserve aspect ratio with `maxLongEdge`.
- 🔒 **Privacy-First**: Automatically strips EXIF metadata.
- 📱 **Native Performance**: Runs entirely off-thread (background worker).

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

The easiest way to use the library is with the built-in React hook:

```tsx
import { useImageConverter } from '@dynlabs/react-native-image-to-webp';

function App() {
  const { convert, isConverting, result } = useImageConverter();

  const handlePress = async () => {
    const res = await convert({
      inputPath: '/path/to/image.jpg',
      preset: 'balanced',
      maxLongEdge: 2048,
    });
    console.log('Saved to:', res.outputPath);
  };

  return (
    <Button
      title={isConverting ? 'Converting...' : 'Convert to WebP'}
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
  preset: 'small', // 'balanced' | 'small' | 'fast' | 'lossless'
});
```

---

## 🎨 Presets & Benchmarks

The following benchmarks were run natively on an Android Emulator using an original 4K image (4017 x 2683, ~1.96 MB).

| Preset     | Output Size | Space Saved  | Notes                                                   |
| ---------- | ----------- | ------------ | ------------------------------------------------------- |
| _Original_ | 1.96 MB     | -            | The raw 4K JPEG.                                        |
| `fast`     | 980.9 KB    | ~50.0%       | Focused on encoding speed. Trades efficiency for speed. |
| `balanced` | 1007.1 KB   | ~48.7%       | **Default**. Sweet spot for fidelity and size.          |
| `small`    | 686.0 KB    | ~65.0%       | Aggressive compression. Massive real-world savings!     |
| `lossless` | 10.37 MB    | _(+8.41 MB)_ | Perfect mathematical recreation. Very large for 4K.     |

:::warning Note on `lossless`

Lossless WebP mathematically guarantees bit-for-bit recreation without throwing away any data. While extremely efficient for PNGs, passing a lossy format like a JPEG into the `lossless` preset will frequently result in an output file that is significantly larger than the original input.

:::

---

## 📐 Resizing Recommendation

Always set `maxLongEdge` to improve performance and save space:

- **Thumbnails**: 512
- **Mobile Display**: 1024
- **Retina/Default**: 2048 (Recommended)

---

## 🛡️ License

MIT. Made with ❤️ by the community.
