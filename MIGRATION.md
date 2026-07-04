# Migrating from 1.x to 2.0

v2.0 makes the library work with **zero configuration** — image-picker URIs,
safe output paths and display-friendly resizing all work out of the box — and
adds progress observation and richer results. In exchange, a few defaults
changed. This guide covers everything you need to check.

**TL;DR** — if you want 2.0's features but 1.x's exact behavior:

```ts
const result = await convertImageToWebP({
  inputPath,
  maxLongEdge: 0, // 1.x never resized by default
  outputPath: inputPath.replace(/\.[^.]+$/, '.webp'), // 1.x wrote next to the input
});
```

---

## 1. Install and rebuild

```bash
yarn add @dynlabs/react-native-image-to-webp@^2.0.0
cd ios && pod install && cd ..
```

The native module interface changed (new options, results and a progress
event emitter), so **a full native rebuild is required**. You cannot ship
this upgrade through an OTA/CodePush update alone.

Requirements changed: React Native **>= 0.76** with the New Architecture
(v2.0 uses codegen event emitters, introduced in RN 0.76).

## 2. Default resize: outputs are now capped at 2048px

**1.x**: no resizing unless you passed `maxLongEdge`.
**2.0**: the `balanced` (default), `small` and `fast` presets resize so the
longer edge is at most **2048px**. `lossless` and `document` still never
resize.

Who is affected: anyone calling `convertImageToWebP({ inputPath })` (or with
just a preset) and expecting full-resolution output — e.g. archiving original
camera photos.

```ts
// Keep 1.x behavior (no resize):
await convertImageToWebP({ inputPath, maxLongEdge: 0 });
```

If you were already passing `maxLongEdge`, nothing changes.

## 3. Default output path moved to the app cache directory

**1.x**: `/path/to/photo.jpg` → `/path/to/photo.webp` (same directory,
deterministic, overwrote on repeat conversions — and failed on read-only
locations).
**2.0**: `<cacheDir>/webp/<name>-<unique>.webp` (always writable, never
collides; a new file per conversion).

Who is affected:

- **Code that reconstructs the output path by convention** instead of using
  `result.outputPath`. Always read `result.outputPath`.
- **Code that relied on overwrite-on-reconvert for idempotency.** Each call
  now creates a new file. The OS reclaims the cache directory under storage
  pressure, but if you convert frequently, delete files you're done with
  (e.g. after upload), or pass a deterministic `outputPath` to get the old
  overwrite semantics:

```ts
// Keep 1.x behavior (write next to the input, overwrite on repeat):
await convertImageToWebP({
  inputPath,
  outputPath: inputPath.replace(/\.[^.]+$/, '.webp'),
});
```

## 4. `UNSUPPORTED_FORMAT` is no longer thrown

Unsupported or unreadable image formats now reject with **`DECODE_FAILED`**.
`UNSUPPORTED_FORMAT` remains in `ERROR_CODES` (reserved) but is never emitted.

```ts
// 1.x
if (e.code === 'UNSUPPORTED_FORMAT') showFormatError();

// 2.0
if (e.code === 'DECODE_FAILED') showFormatOrCorruptError();
```

Also note: error rejections now carry precise codes end-to-end (including a
new `IO_ERROR` for disk-full/permission failures during write), so `catch`
logic keyed on `error.code` is more reliable than in 1.x — review any
message-string matching you may have added as a workaround.

## 5. Output bytes are not identical to 1.x

Two intentional correctness fixes change the encoded bytes:

- **Alpha images**: 1.x encoded premultiplied pixel data, which darkened
  semi-transparent pixels. 2.0 encodes straight alpha. Transparent
  PNGs/WebPs will look (correctly) different.
- **`lossless` preset** now sets `exact: true` and encodes at maximum effort
  quality, preserving RGB values in fully transparent areas.

If you store hashes of converted output, expect them to change.

## 6. `stripMetadata: false` now actually works

1.x silently ignored `stripMetadata` on Android and always produced
metadata-free files on both platforms. In 2.0, `stripMetadata: false` embeds
the source JPEG's EXIF block into the WebP container (with the orientation
tag neutralized, since rotation is baked into the pixels).

If you passed `stripMetadata: false` in 1.x and depended on the output being
metadata-free anyway, remove the flag — the default (`true`) strips.

## 7. New capabilities you can now delete workarounds for

- **`content://` and `ph://` URIs work directly** — remove any
  copy-to-local-file glue you added for Android image pickers or the iOS
  camera roll.
- **`file://` URIs are percent-decoded** — remove manual `decodeURIComponent`
  calls.
- **Progress**: `onProgress: ({ percent, phase }) => …` per call, or the
  `progress` value returned by `useImageConverter`.
- **Richer results**: `originalWidth/Height`, `originalSizeBytes`,
  `savedBytes`, `savedPercent`, `durationMs` — delete any manual size
  bookkeeping.
- **Debugging**: `setDebugLogging(true)` logs effective options and a native
  decode/encode timing breakdown.
- **Jest**: mock the package with the bundled mock instead of hand-rolling
  one:

```js
jest.mock('@dynlabs/react-native-image-to-webp', () =>
  require('@dynlabs/react-native-image-to-webp/jest')
);
```

## 8. TypeScript notes

- `ConvertResult` gained fields (additive — existing code compiles).
- `ConvertOptions` gained `threadLevel`, `exact`, `debug`, `onProgress`
  (additive).
- New exported types: `ConversionProgress`, `ConversionPhase`, `ErrorCode`,
  and `PRESETS` (the resolved preset table) if you want to display preset
  values in your UI.
- If you imported the native spec module directly (unsupported), the option
  and result types were renamed to `NativeConvertOptions` /
  `NativeConvertResult`.

## Checklist

- [ ] `yarn add @dynlabs/react-native-image-to-webp@^2.0.0 && pod install`, full native rebuild
- [ ] Need full-resolution output? Add `maxLongEdge: 0`
- [ ] Using `result.outputPath` everywhere (not a path you compute yourself)?
- [ ] Converting repeatedly? Clean up cache outputs or pass a deterministic `outputPath`
- [ ] Replace `UNSUPPORTED_FORMAT` handling with `DECODE_FAILED`
- [ ] Remove `content://`/`ph://` copy workarounds and manual URI decoding
- [ ] Delete hand-rolled Jest mocks in favor of the bundled one
