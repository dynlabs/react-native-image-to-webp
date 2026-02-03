# Android Emulator E2E Testing - Best Practices from Popular Repositories

## Overview

This document compares our Android emulator E2E setup with popular open-source repositories to identify best practices and improvements.

## Key Findings

### 1. **Linux vs macOS Runners**

**Popular Repositories (e.g., Square/radiography):**
- Use **Linux runners** (`ubuntu-latest`) with KVM enabled
- Enable KVM permissions BEFORE running the emulator
- Use `x86_64` architecture (requires KVM hardware acceleration)
- **2-3x faster** than macOS runners
- **More cost-effective** than macOS runners

**Our Current Setup:**
- Using `macos-latest` runners
- Using `arm64-v8a` architecture
- No KVM setup needed (macOS uses Hypervisor Framework)

### 2. **KVM Setup for Linux**

From Square's radiography workflow:
```yaml
- name: Enable KVM group perms
  shell: bash
  run: |
    echo 'KERNEL=="kvm", GROUP="kvm", MODE="0666", OPTIONS+="static_node=kvm"' | sudo tee /etc/udev/rules.d/99-kvm4all.rules
    sudo udevadm control --reload-rules
    sudo udevadm trigger --name-match=kvm
```

**This is the critical step** that enables hardware acceleration on Linux runners!

### 3. **Emulator Configuration**

**Popular Pattern:**
```yaml
- name: Instrumentation Tests
  uses: reactivecircus/android-emulator-runner@v2
  with:
    api-level: 33
    target: google_apis
    arch: x86_64  # Requires KVM on Linux
    script: ./gradlew connectedCheck
```

**Our Current Configuration:**
```yaml
- name: Create Android Emulator and Run Tests
  uses: reactivecircus/android-emulator-runner@v2
  with:
    api-level: 33
    arch: arm64-v8a  # Works on macOS without KVM
    target: google_apis
    emulator-boot-timeout: 300
    emulator-options: -no-window -gpu swiftshader_indirect -no-snapshot-load -noaudio -no-boot-anim -skip-adb-auth -wipe-data -no-metrics
    disable-animations: true
    disable-linux-hw-accel: true
```

### 4. **Architecture Selection**

**Linux Runners:**
- ✅ `x86_64` - Fast with KVM, requires hardware acceleration
- ❌ `arm64-v8a` - Cannot run on x86_64 hosts without hardware acceleration

**macOS Runners:**
- ✅ `arm64-v8a` - Native support on Apple Silicon, no KVM needed
- ✅ `x86_64` - Works but slower, uses Hypervisor Framework

### 5. **Emulator Options**

**Common Optimizations:**
- `-no-window` - Headless mode
- `-gpu swiftshader_indirect` - Software rendering (works everywhere)
- `-no-snapshot-load` - Fresh boot (slower but more reliable)
- `-noaudio` - Disable audio
- `-no-boot-anim` - Skip boot animation
- `-skip-adb-auth` - Skip ADB authentication
- `-wipe-data` - Clean state

**For Faster Boots (with caching):**
- Use snapshot caching (see android-emulator-runner README)
- Remove `-no-snapshot-load` and use `-no-snapshot-save` for subsequent runs

## Recommendations

### Option 1: Switch to Linux with KVM (Recommended for Speed)

**Pros:**
- 2-3x faster than macOS
- More cost-effective
- Better CI/CD performance

**Cons:**
- Requires KVM setup step
- Requires `x86_64` architecture

**Implementation:**
```yaml
runs-on: ubuntu-latest

steps:
  - name: Enable KVM group perms
    run: |
      echo 'KERNEL=="kvm", GROUP="kvm", MODE="0666", OPTIONS+="static_node=kvm"' | sudo tee /etc/udev/rules.d/99-kvm4all.rules
      sudo udevadm control --reload-rules
      sudo udevadm trigger --name-match=kvm
  
  - name: Create Android Emulator and Run Tests
    uses: reactivecircus/android-emulator-runner@v2
    with:
      api-level: 33
      arch: x86_64
      target: google_apis
      disable-linux-hw-accel: false  # Enable KVM
      script: |
        # Your test script
```

### Option 2: Stay on macOS (Current Approach)

**Pros:**
- Simpler setup (no KVM needed)
- Works with ARM64 natively
- More reliable for ARM64 builds

**Cons:**
- Slower than Linux
- More expensive
- Longer CI/CD times

## References

- [android-emulator-runner README](https://github.com/ReactiveCircus/android-emulator-runner/blob/v2/README.md)
- [Square/radiography workflow](https://github.com/square/radiography/blob/main/.github/workflows/android.yml)
- [GitHub Blog: Hardware Accelerated Android Virtualization](https://github.blog/changelog/2023-02-23-hardware-accelerated-android-virtualization-on-actions-windows-and-linux-larger-hosted-runners/)

## Popular Repositories Using android-emulator-runner

- Square (radiography, workflow-kotlin, retrofit, leakcanary)
- Cash App (sqldelight, copper)
- Coil-kt
- Google (android-fhir, accompanist)
- Wikimedia (apps-android-wikipedia)
- Home Assistant
- And many more...
