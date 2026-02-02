# Run Maestro tests in visual/non-headless mode
# This ensures the emulator is visible and tests run interactively

param(
    [string]$Flow = "",
    [switch]$Studio = $false,
    [switch]$All = $false
)

$ErrorActionPreference = "Stop"

# Add Maestro to PATH
$maestroPath = "$env:USERPROFILE\maestro\maestro\bin"
if (Test-Path $maestroPath) {
    $env:PATH += ";$maestroPath"
} else {
    Write-Host "Error: Maestro not found at $maestroPath" -ForegroundColor Red
    exit 1
}

# Check if device is connected
$devices = adb devices 2>&1 | Out-String
if ($devices -notmatch "device\s*$") {
    Write-Host "Error: No Android device/emulator connected" -ForegroundColor Red
    Write-Host "Please start an emulator or connect a device" -ForegroundColor Yellow
    exit 1
}

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Maestro Visual Test Runner" -ForegroundColor Cyan
Write-Host "  (Non-Headless Mode)" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Make sure your Android emulator window is visible!" -ForegroundColor Yellow
Write-Host "You'll see all test actions happening in real-time.`n" -ForegroundColor Yellow

# Ensure app is running
Write-Host "Launching app..." -ForegroundColor Yellow
adb shell am start -n dynlabs.reactnativeimagetowebp.example/.MainActivity | Out-Null
Start-Sleep -Seconds 3

if ($Studio) {
    Write-Host "Starting Maestro Studio..." -ForegroundColor Green
    Write-Host "Maestro Studio will open in your browser" -ForegroundColor Yellow
    Write-Host "You can interact with tests visually" -ForegroundColor Yellow
    Write-Host ""
    maestro studio
} elseif ($All) {
    Write-Host "Running all Android tests..." -ForegroundColor Green
    Write-Host "Watch the emulator window to see test execution!`n" -ForegroundColor Yellow
    maestro test .maestro/flows/android/
} elseif ($Flow -ne "") {
    Write-Host "Running test: $Flow" -ForegroundColor Green
    Write-Host "Watch the emulator window to see test execution!`n" -ForegroundColor Yellow
    maestro test $Flow
} else {
    Write-Host "Running image conversion test (1080p)..." -ForegroundColor Green
    Write-Host "Watch the emulator window to see:" -ForegroundColor Yellow
    Write-Host "  • Image path being entered" -ForegroundColor White
    Write-Host "  • Conversion happening" -ForegroundColor White
    Write-Host "  • Success message and output image`n" -ForegroundColor White
    maestro test .maestro/flows/android/07-convert-1080p.yaml
}
