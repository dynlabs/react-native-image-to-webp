# Contributing

Contributions are welcome! This project uses a monorepo setup with Yarn workspaces.

## Getting Started

1. **Install dependencies**:
   ```bash
   yarn
   ```
2. **Launch Metro**:
   ```bash
   yarn example start
   ```
3. **Run Example App**:
   - **iOS**: `yarn example ios`
   - **Android**: `yarn example android`

## 🛠️ Development

- **Logic**: All JS/TS logic is in `src/`.
- **Natives**: iOS code is in `ios/`, Android in `android/`.
- **Shared**: C++ WebP encoding logic is in `cpp/`.

## ✅ Quality Checks

Before submitting a PR, please run:

- `yarn lint` - Fix linting/formatting.
- `yarn typecheck` - Verify TypeScript.
- `yarn build` - Ensure the library builds correctly.

## 🚀 Releasing

Versions are bumped via `npm version` (e.g., `npm version patch`) and releases are handled by GitHub Actions when tags are pushed to `main`.
