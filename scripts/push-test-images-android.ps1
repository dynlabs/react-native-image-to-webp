# PowerShell script to push test images to Android device via ADB

$ErrorActionPreference = "Stop"

# Get the script directory and project root
$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$ProjectRoot = Split-Path -Parent $ScriptDir
$TestImagesDir = Join-Path $ProjectRoot "test-images"

# Check if test images directory exists
if (-not (Test-Path $TestImagesDir)) {
    Write-Host "Error: Test images directory not found: $TestImagesDir" -ForegroundColor Red
    Write-Host "Please run scripts/generate-test-images.py first" -ForegroundColor Yellow
    exit 1
}

# Check if adb is available
try {
    $adbVersion = adb version 2>&1
    if ($LASTEXITCODE -ne 0) {
        throw "ADB not found"
    }
} catch {
    Write-Host "Error: ADB not found. Please ensure Android SDK platform-tools are in your PATH" -ForegroundColor Red
    exit 1
}

# Check if device is connected
$devices = adb devices 2>&1 | Out-String
if ($devices -notmatch "device\s*$") {
    Write-Host "Error: No Android device/emulator connected" -ForegroundColor Red
    Write-Host "Please ensure a device is connected and run 'adb devices' to verify" -ForegroundColor Yellow
    Write-Host "Current devices:" -ForegroundColor Yellow
    adb devices
    exit 1
}

Write-Host "Pushing test images to Android device..." -ForegroundColor Green
Write-Host ""

# Create directory on device
Write-Host "Creating directory on device: /sdcard/Download/test-images" -ForegroundColor Cyan
adb shell mkdir -p /sdcard/Download/test-images

# Push each test image
$images = @(
    "test-1080p.jpg",
    "test-2k.jpg",
    "test-4k.jpg"
)

foreach ($image in $images) {
    $localPath = Join-Path $TestImagesDir $image
    $remotePath = "/sdcard/Download/test-images/$image"
    
    if (Test-Path $localPath) {
        Write-Host "Pushing $image..." -ForegroundColor Cyan
        adb push $localPath $remotePath
        
        if ($LASTEXITCODE -eq 0) {
            $size = (Get-Item $localPath).Length / 1MB
            Write-Host "  [OK] Pushed $image ($([math]::Round($size, 2)) MB)" -ForegroundColor Green
        } else {
            Write-Host "  [FAIL] Failed to push $image" -ForegroundColor Red
        }
    } else {
        Write-Host "  [FAIL] File not found: $localPath" -ForegroundColor Red
    }
}

Write-Host ""
Write-Host "Verifying files on device..." -ForegroundColor Cyan
adb shell ls -lh /sdcard/Download/test-images/

Write-Host ""
Write-Host "Test images pushed successfully!" -ForegroundColor Green
Write-Host ""
Write-Host "Images are available at:" -ForegroundColor Yellow
Write-Host "  /sdcard/Download/test-images/test-1080p.jpg" -ForegroundColor White
Write-Host "  /sdcard/Download/test-images/test-2k.jpg" -ForegroundColor White
Write-Host "  /sdcard/Download/test-images/test-4k.jpg" -ForegroundColor White
Write-Host ""
Write-Host "You can use these paths in your Maestro tests or in the app's manual path input." -ForegroundColor Cyan
