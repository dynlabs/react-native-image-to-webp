# Contributing

Thank you for your interest in contributing to `@dynlabs/react-native-image-to-webp`!

## Development Setup

### Prerequisites

- Node.js (see `.nvmrc` for version)
- Yarn 4.x (package manager)
- React Native development environment:
  - iOS: Xcode, CocoaPods
  - Android: Android Studio, JDK

### Initial Setup

1. Clone the repository:
```bash
git clone <repo-url>
cd react-native-image-to-webp
```

2. Install dependencies:
```bash
yarn install
```

3. Build the library:
```bash
yarn build
```

### Running the Example App

The example app is in the `example/` directory.

**iOS**:
```bash
yarn example:ios
```

**Android**:
```bash
yarn example:android
```

**Note**: Make sure you have the required development environment set up for each platform.

## Development Workflow

### Code Quality

Before committing, ensure:

1. **Linting**: `yarn lint`
2. **Type checking**: `yarn typecheck`
3. **Formatting**: `yarn format:check` (or `yarn format` to auto-fix)

These are automatically run via `lint-staged` on commit (via Husky).

### Project Structure

- `src/`: TypeScript source code
- `ios/`: iOS native implementation
- `android/`: Android native implementation
- `cpp/`: Shared C++ code
- `example/`: Example React Native app
- `docs/`: Documentation

### Making Changes

1. Create a feature branch from `main`
2. Make your changes
3. Ensure tests pass (if applicable)
4. Run linting and type checking
5. Update documentation if needed
6. Commit using [Conventional Commits](https://www.conventionalcommits.org/)
7. Create a pull request

### Commit Messages

We use [Conventional Commits](https://www.conventionalcommits.org/):

- `feat:` New feature
- `fix:` Bug fix
- `docs:` Documentation changes
- `style:` Code style changes (formatting, etc.)
- `refactor:` Code refactoring
- `perf:` Performance improvements
- `test:` Test additions/changes
- `build:` Build system changes
- `ci:` CI changes
- `chore:` Other changes

Examples:
```
feat: add support for HEIC format on iOS
fix: handle EXIF orientation correctly on Android
docs: update API.md with new examples
```

## Testing

### Manual Testing

Use the example app to test changes:

1. Run the example app
2. Test conversion with various images
3. Test different presets
4. Test error cases (invalid paths, etc.)

### Automated Testing

Currently, the project focuses on manual testing via the example app. Unit tests can be added in the future.

## Native Code Changes

### iOS

- Edit files in `ios/`
- Rebuild the example app to test
- Ensure CocoaPods dependencies are updated if needed

### Android

- Edit files in `android/src/main/java/` (Kotlin) or `android/src/main/cpp/` (C++/JNI)
- Rebuild the example app to test
- Ensure CMake configuration is correct if adding C++ files

### C++ Shared Code

- Edit files in `cpp/`
- Both iOS and Android build systems include these files
- Ensure libwebp integration is correct if modifying encoding logic

## Documentation

- Update relevant docs in `docs/` when making changes
- Update `README.md` if API changes
- Add examples for new features

## Pull Request Process

1. Ensure your branch is up to date with `main`
2. Create a descriptive PR title and description
3. Reference any related issues
4. Ensure CI passes (linting, type checking)
5. Request review from maintainers

## Code Style

- TypeScript: Follow the existing code style (enforced by ESLint + Prettier)
- Kotlin: Follow Android Kotlin style guide
- Objective-C++: Follow Apple's style guide
- C++: Follow modern C++ practices (C++17)

## Questions?

Open an issue or reach out to maintainers for questions about contributing.
