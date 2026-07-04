This is a new [**React Native**](https://reactnative.dev) project, bootstrapped using [`@react-native-community/cli`](https://github.com/react-native-community/cli).

# Getting Started

> **Note**: Make sure you have completed the [Set Up Your Environment](https://reactnative.dev/docs/set-up-your-environment) guide before proceeding.

## Step 1: Start Metro

First, you will need to run **Metro**, the JavaScript build tool for React Native.

To start the Metro dev server, run the following command from the root of your React Native project:

```sh
# Using npm
npm start

# OR using Yarn
yarn start
```

## Step 2: Build and run your app

With Metro running, open a new terminal window/pane from the root of your React Native project, and use one of the following commands to build and run your Android or iOS app:

### Android

```sh
# Using npm
npm run android

# OR using Yarn
yarn android
```

### iOS

For iOS, remember to install CocoaPods dependencies (this only needs to be run on first clone or after updating native deps).

The first time you create a new project, run the Ruby bundler to install CocoaPods itself:

```sh
bundle install
```

Then, and every time you update your native dependencies, run:

```sh
bundle exec pod install
```

For more information, please visit [CocoaPods Getting Started guide](https://guides.cocoapods.org/using/getting-started.html).

```sh
# Using npm
npm run ios

# OR using Yarn
yarn ios
```

If everything is set up correctly, you should see your new app running in the Android Emulator, iOS Simulator, or your connected device.

This is one way to run your app — you can also build it directly from Android Studio or Xcode.

## Step 3: Modify your app

Now that you have successfully run the app, let's make changes!

Open `App.tsx` in your text editor of choice and make some changes. When you save, your app will automatically update and reflect these changes — this is powered by [Fast Refresh](https://reactnative.dev/docs/fast-refresh).

When you want to forcefully reload, for example to reset the state of your app, you can perform a full reload:

- **Android**: Press the <kbd>R</kbd> key twice or select **"Reload"** from the **Dev Menu**, accessed via <kbd>Ctrl</kbd> + <kbd>M</kbd> (Windows/Linux) or <kbd>Cmd ⌘</kbd> + <kbd>M</kbd> (macOS).
- **iOS**: Press <kbd>R</kbd> in iOS Simulator.

## Congratulations! :tada:

You've successfully run and modified your React Native App. :partying_face:

### Now what?

- If you want to add this new React Native code to an existing application, check out the [Integration guide](https://reactnative.dev/docs/integration-with-existing-apps).
- If you're curious to learn more about React Native, check out the [docs](https://reactnative.dev/docs/getting-started).

# End-to-end tests (Maestro)

The example app doubles as the e2e test bed for
`@dynlabs/react-native-image-to-webp` (v2.0.0, consumed from the workspace).
Flows live in [`.maestro/`](./.maestro) and run against a real build of the
app on a device, emulator or simulator.

## Prerequisites

- [Maestro](https://docs.maestro.dev/getting-started/installing-maestro)
  **>= 2.6** (`curl -fsSL https://get.maestro.mobile.dev | bash`)
- The app installed on a running emulator/simulator or connected device
  (`yarn android` or `yarn ios` from this directory)

## Running

```sh
yarn e2e          # all flows except the picker flow
yarn e2e:smoke    # quick single-conversion smoke test
yarn e2e:picker   # opt-in: system photo-picker flow (content:// / ph://)
```

## What the flows cover

| Flow                        | Coverage                                                                                            |
| --------------------------- | --------------------------------------------------------------------------------------------------- |
| `01-smoke-convert`          | Zero-config conversion, savings/duration stats, output render, 2048px default resize                |
| `02-all-presets`            | Every preset end-to-end; resize contract per preset (2048px vs original dimensions)                 |
| `03-progress-observability` | Live progress UI driven by native progress events, full stats panel after completion                |
| `04-picker-content-uri`     | Real picker path via `addMedia` + system photo picker (`content://` on Android, photo asset on iOS) |

The flows load a deterministic 4K sample photo through a tiny `SampleImage`
native fixture module (Android asset copy / iOS bundle resource) instead of
the system picker, except for the opt-in picker flow. The `04` flow drives
the OS photo-picker UI, which varies across OS versions — expect to adjust
its selectors for your device image.

In CI, the **E2E (Android)** workflow (`.github/workflows/e2e-android.yml`)
builds a release APK and runs the suite on an emulator; trigger it from the
GitHub Actions tab.

# Troubleshooting

If you're having issues getting the above steps to work, see the [Troubleshooting](https://reactnative.dev/docs/troubleshooting) page.

# Learn More

To learn more about React Native, take a look at the following resources:

- [React Native Website](https://reactnative.dev) - learn more about React Native.
- [Getting Started](https://reactnative.dev/docs/environment-setup) - an **overview** of React Native and how setup your environment.
- [Learn the Basics](https://reactnative.dev/docs/getting-started) - a **guided tour** of the React Native **basics**.
- [Blog](https://reactnative.dev/blog) - read the latest official React Native **Blog** posts.
- [`@facebook/react-native`](https://github.com/facebook/react-native) - the Open Source; GitHub **repository** for React Native.
