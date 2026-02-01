# Release Process

This document describes the versioning and release process for `@dynlabs/react-native-image-to-webp`.

## Versioning Policy

We follow [Semantic Versioning](https://semver.org/) (SemVer):

- **MAJOR** (x.0.0): Breaking changes to the API
- **MINOR** (0.x.0): New features, backward-compatible
- **PATCH** (0.0.x): Bug fixes, backward-compatible

## Release Automation

We use [Changesets](https://github.com/changesets/changesets) for version management and release automation.

**Note:** For the initial release (v0.1.0), publish manually. Changesets will handle all subsequent releases.

### How It Works

1. **During Development**: Contributors add changeset files describing their changes
2. **On PR Merge**: Changesets are collected
3. **Version Bump PR**: A "Version Packages" PR is automatically created
4. **On Version PR Merge**: Package is published to npm and GitHub Release is created

### Adding a Changeset

When making changes that should trigger a release:

1. Run: `yarn changeset`
2. Select the type of change (major/minor/patch)
3. Describe the change
4. Commit the changeset file

Example changeset file (`.changeset/foo-bar.md`):

```markdown
---
'@dynlabs/react-native-image-to-webp': patch
---

Fix EXIF orientation handling on Android
```

### Release Workflow

The release process is automated via GitHub Actions (`.github/workflows/release.yml`):

1. **Trigger**: Push to `main` branch
2. **Check**: If there are changesets, proceed
3. **Version Bump**: Create PR with version bump and CHANGELOG update
4. **On Merge**: Publish to npm and create GitHub Release

### Manual Release (if needed)

If you need to release manually:

1. Update version in `package.json`
2. Update `CHANGELOG.md`
3. Commit and tag: `git tag v1.2.3`
4. Push: `git push && git push --tags`
5. Publish: `npm publish --access restricted`

## Publishing to npm

The package is published to the `@dynlabs` scope (private/restricted access).

**Requirements**:

- `NODE_AUTH_TOKEN` secret in GitHub Actions (npm token)
- `publishConfig.access` set to `"restricted"` in `package.json`

## Pre-releases

To create a pre-release (e.g., `1.2.3-beta.1`):

1. Add changeset with `prerelease` type
2. Or manually modify version in changeset PR

## CHANGELOG.md

The CHANGELOG is automatically updated by Changesets. It follows [Keep a Changelog](https://keepachangelog.com/) format.

**Manual edits**: If you need to manually edit CHANGELOG, do so in the version bump PR before merging.

## GitHub Releases

GitHub Releases are automatically created with:

- Version tag (e.g., `v1.2.3`)
- Release notes from changesets
- Link to CHANGELOG

## Release Checklist

Before a release:

- [ ] All tests pass
- [ ] Documentation is up to date
- [ ] CHANGELOG is accurate
- [ ] Version number is correct
- [ ] Example app works with new version

## Rollback

If a release has issues:

1. **npm**: Use `npm deprecate` to mark version as deprecated
2. **GitHub**: Add a note to the release
3. **Fix**: Create a patch release with the fix

## Questions?

Contact maintainers for questions about the release process.
