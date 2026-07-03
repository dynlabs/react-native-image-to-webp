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

## 🔗 Input Sources

`inputPath` accepts the URIs that modern image pickers hand you directly — you
no longer need to copy files into app storage first:

| Scheme              | Platform | Typical source                                                        |
| ------------------- | -------- | --------------------------------------------------------------------- |
| `file://` / raw path | iOS & Android | `react-native-image-picker`, `expo-image-picker`              |
| `content://`        | Android  | Scoped storage (Android 10+), the Android 13+ system Photo Picker     |
| `ph://`             | iOS      | CameraRoll / `expo-media-library` PhotoKit asset identifiers          |

```tsx
// Straight from react-native-image-picker — no manual file handling:
const { assets } = await launchImageLibrary({ mediaType: 'photo' });
const result = await convertImageToWebP({ inputPath: assets[0].uri });
```

When the input is a `content://` or `ph://` URI (which has no writable parent
directory), the converted `.webp` is written to the app cache / temporary
directory unless you pass an explicit `outputPath`.

> **iOS `ph://` note:** resolving PhotoKit assets requires photo library access.
> Add an `NSPhotoLibraryUsageDescription` entry to your `Info.plist` and ensure
> the user has granted permission (your picker normally handles this).

---

## 🎨 Presets & Benchmarks

The following benchmarks were run natively on an Android Emulator using an original 4K image (4017 x 2683, ~1.96 MB). Note that Github may resize or compress the embedded images below.

| Preset     | Result (WebP)                                             | Output Size | Space Saved  | Notes                                                   |
| ---------- | --------------------------------------------------------- | ----------- | ------------ | ------------------------------------------------------- |
| _Original_ | <img src="samples/input-4k.jpg" width="300" />            | 1.96 MB     | -            | The raw 4K JPEG.                                        |
| `fast`     | <img src="samples/output-4k-fast.webp" width="300" />     | 980.9 KB    | ~50.0%       | Focused on encoding speed. Trades efficiency for speed. |
| `balanced` | <img src="samples/output-4k-balanced.webp" width="300" /> | 1007.1 KB   | ~48.7%       | **Default**. Sweet spot for fidelity and size.          |
| `small`    | <img src="samples/output-4k-small.webp" width="300" />    | 686.0 KB    | ~65.0%       | Aggressive compression. Massive real-world savings!     |
| `lossless` | <img src="samples/output-4k-lossless.webp" width="300" /> | 10.37 MB    | _(+8.41 MB)_ | Perfect mathematical recreation. Very large for 4K.     |

> ⚠️ **Note on `lossless`**: Lossless WebP mathematically guarantees bit-for-bit recreation without throwing away any data. While extremely efficient for PNGs, passing a lossy format like a JPEG into the `lossless` preset will frequently result in an output file that is significantly larger than the original input.

---

## 📐 Resizing Recommendation

Always set `maxLongEdge` to improve performance and save space:

- **Thumbnails**: 512
- **Mobile Display**: 1024
- **Retina/Default**: 2048 (Recommended)

---

## 🛡️ License

MIT. Made with ❤️ by the community.
