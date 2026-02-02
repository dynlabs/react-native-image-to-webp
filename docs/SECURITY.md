# Security Policy

## Supported Versions

We provide security updates for the latest minor version and the previous minor version.

| Version | Supported          |
| ------- | ------------------ |
| 1.x.x   | :white_check_mark: |
| < 1.0   | :x:                |

## Reporting a Vulnerability

If you discover a security vulnerability, please **do not** open a public issue.

Instead, please report it via one of these methods:

1. **Email**: [Security contact email if available]
2. **Private Security Advisory**: Create a private security advisory on GitHub (if you have access)
3. **Direct Contact**: Contact maintainers directly

Please include:

- Description of the vulnerability
- Steps to reproduce
- Potential impact
- Suggested fix (if any)

We will respond within 48 hours and work with you to address the issue.

## Security Considerations

### File Path Handling

- **Input paths**: The library accepts file paths from JavaScript. Ensure paths are validated in your application code.
- **Path traversal**: Native code validates file existence but relies on React Native's file system APIs. Be cautious with user-provided paths.
- **Content URIs (Android)**: Limited support for `content://` URIs. Use `file://` paths when possible.

### Image Data

- **Memory**: Large images consume significant memory during processing. The library processes images off the main thread to avoid blocking, but be mindful of memory constraints on low-end devices.
- **PII in Images**: Images may contain EXIF metadata with location data, camera info, etc. The library **strips metadata by default** (`stripMetadata: true`). Set to `false` only if you need metadata and understand the privacy implications.

### Native Code

- **Input Validation**: All inputs are validated in JavaScript before reaching native code. Native code performs additional validation.
- **Error Handling**: Errors are caught and returned as structured errors, not crashes.
- **Memory Management**: Native code follows platform best practices for memory management (ARC on iOS, explicit cleanup on Android).

### Dependencies

- **libwebp**: Dependency managed via CocoaPods (iOS) and CMake FetchContent (Android). Uses version >= 1.6.0 from official source (webmproject/libwebp).
- **React Native**: Follow React Native's security advisories.

## Best Practices

1. **Validate Input Paths**: Don't trust user-provided paths without validation
2. **Strip Metadata**: Keep `stripMetadata: true` unless you specifically need metadata
3. **Resize Large Images**: Use `maxLongEdge` to limit memory usage
4. **Handle Errors**: Always handle `ImageToWebPError` in your code
5. **Update Dependencies**: Keep React Native and this library updated

## Known Limitations

- **Content URIs (Android)**: May not work with all `content://` URIs. Use `file://` paths when possible.
- **Very Large Images**: Images >50MP may cause memory issues on low-end devices. Always use `maxLongEdge`.
- **Format Support**: Depends on platform native decoders. Some formats may not be supported on older Android versions.

## Security Updates

Security updates will be released as patch versions (e.g., `1.2.3` → `1.2.4`). Critical vulnerabilities may trigger immediate releases.

## Disclosure Policy

- Vulnerabilities will be disclosed after a fix is available
- We will credit reporters (with permission)
- Disclosure timeline depends on severity and fix complexity
