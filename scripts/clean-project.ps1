# PowerShell script to completely clean the project
# Removes test images, caches, node_modules, build artifacts, and temporary files

$ErrorActionPreference = "Continue"

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Project Cleanup Script" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Get the script directory and project root
$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$ProjectRoot = Split-Path -Parent $ScriptDir

# Change to project root
Set-Location $ProjectRoot

$totalSize = 0
$itemsRemoved = 0

function Remove-ItemSafely {
    param(
        [string]$Path,
        [string]$Description
    )
    
    if (Test-Path $Path) {
        try {
            $item = Get-Item $Path -ErrorAction SilentlyContinue
            if ($item) {
                $size = if ($item.PSIsContainer) {
                    (Get-ChildItem $Path -Recurse -ErrorAction SilentlyContinue | 
                     Measure-Object -Property Length -Sum -ErrorAction SilentlyContinue).Sum
                } else {
                    $item.Length
                }
                
                Remove-Item $Path -Recurse -Force -ErrorAction SilentlyContinue
                
                if (-not (Test-Path $Path)) {
                    $script:totalSize += $size
                    $script:itemsRemoved++
                    $sizeMB = [math]::Round($size / 1MB, 2)
                    Write-Host "  [OK] Removed: $Description ($sizeMB MB)" -ForegroundColor Green
                    return $true
                } else {
                    Write-Host "  [WARN] Partially removed: $Description" -ForegroundColor Yellow
                    return $false
                }
            }
        } catch {
            Write-Host "  [ERROR] Failed to remove $Description : $_" -ForegroundColor Red
            return $false
        }
    } else {
        Write-Host "  [SKIP] Not found: $Description" -ForegroundColor Gray
        return $false
    }
}

Write-Host "Cleaning test images..." -ForegroundColor Yellow
# Remove test images but keep README.md
$testImagesDir = Join-Path $ProjectRoot "test-images"
if (Test-Path $testImagesDir) {
    Get-ChildItem $testImagesDir -File | Where-Object { $_.Extension -in @('.jpg', '.png', '.webp') } | ForEach-Object {
        Remove-ItemSafely $_.FullName "test-images/$($_.Name)"
    }
}

Write-Host ""
Write-Host "Cleaning node_modules..." -ForegroundColor Yellow
# Root node_modules
Remove-ItemSafely (Join-Path $ProjectRoot "node_modules") "node_modules (root)"
# Example node_modules
Remove-ItemSafely (Join-Path $ProjectRoot "example\node_modules") "node_modules (example)"

Write-Host ""
Write-Host "Cleaning build directories..." -ForegroundColor Yellow
# Android build directories
Remove-ItemSafely (Join-Path $ProjectRoot "android\build") "android/build"
Remove-ItemSafely (Join-Path $ProjectRoot "example\android\build") "example/android/build"
Remove-ItemSafely (Join-Path $ProjectRoot "example\android\app\build") "example/android/app/build"
Remove-ItemSafely (Join-Path $ProjectRoot "example\android\.cxx") "example/android/.cxx"
Remove-ItemSafely (Join-Path $ProjectRoot "example\android\app\.cxx") "example/android/app/.cxx"
# iOS build directories
Remove-ItemSafely (Join-Path $ProjectRoot "example\ios\build") "example/ios/build"
# Library build output
Remove-ItemSafely (Join-Path $ProjectRoot "lib") "lib (built library)"

Write-Host ""
Write-Host "Cleaning Gradle caches..." -ForegroundColor Yellow
# Gradle caches in project
Remove-ItemSafely (Join-Path $ProjectRoot "android\.gradle") "android/.gradle"
Remove-ItemSafely (Join-Path $ProjectRoot "example\android\.gradle") "example/android/.gradle"
Remove-ItemSafely (Join-Path $ProjectRoot "example\android\app\.gradle") "example/android/app/.gradle"

Write-Host ""
Write-Host "Cleaning Yarn caches..." -ForegroundColor Yellow
# Yarn cache and install state
Remove-ItemSafely (Join-Path $ProjectRoot ".yarn\cache") ".yarn/cache"
Remove-ItemSafely (Join-Path $ProjectRoot ".yarn\install-state.gz") ".yarn/install-state.gz"
Remove-ItemSafely (Join-Path $ProjectRoot ".yarn\unplugged") ".yarn/unplugged"

Write-Host ""
Write-Host "Cleaning Turbo cache..." -ForegroundColor Yellow
Remove-ItemSafely (Join-Path $ProjectRoot ".turbo") ".turbo"

Write-Host ""
Write-Host "Cleaning Maestro artifacts..." -ForegroundColor Yellow
# Maestro artifacts
Remove-ItemSafely (Join-Path $ProjectRoot "maestro.zip") "maestro.zip"
Remove-ItemSafely (Join-Path $ProjectRoot "maestro-report.html") "maestro-report.html"
# Maestro screenshots/videos
if (Test-Path (Join-Path $ProjectRoot ".maestro")) {
    Get-ChildItem (Join-Path $ProjectRoot ".maestro") -Recurse -File | 
        Where-Object { $_.Extension -in @('.png', '.mp4') } | ForEach-Object {
            Remove-ItemSafely $_.FullName ".maestro/$($_.Name)"
        }
}

Write-Host ""
Write-Host "Cleaning artifacts directory..." -ForegroundColor Yellow
Remove-ItemSafely (Join-Path $ProjectRoot "artifacts") "artifacts"

Write-Host ""
Write-Host "Cleaning other temporary files..." -ForegroundColor Yellow
# Log files
Remove-ItemSafely (Join-Path $ProjectRoot "npm-debug.log") "npm-debug.log"
Remove-ItemSafely (Join-Path $ProjectRoot "yarn-debug.log") "yarn-debug.log"
Remove-ItemSafely (Join-Path $ProjectRoot "yarn-error.log") "yarn-error.log"

# iOS Pods (if exists)
Remove-ItemSafely (Join-Path $ProjectRoot "example\ios\Pods") "example/ios/Pods"
Remove-ItemSafely (Join-Path $ProjectRoot "example\ios\Podfile.lock") "example/ios/Podfile.lock"

# Android local.properties
Remove-ItemSafely (Join-Path $ProjectRoot "example\android\local.properties") "example/android/local.properties"

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Cleanup Summary" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Items removed: $itemsRemoved" -ForegroundColor Green
$totalSizeMB = [math]::Round($totalSize / 1MB, 2)
Write-Host "Total size freed: $totalSizeMB MB" -ForegroundColor Green
Write-Host ""
Write-Host "Project cleaned successfully!" -ForegroundColor Green
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Cyan
Write-Host "  1. Run 'yarn install' to restore dependencies" -ForegroundColor White
Write-Host "  2. Run 'yarn build' to build the library (if needed)" -ForegroundColor White
Write-Host "  3. Run 'yarn example:android' or 'yarn example:ios' to build example app" -ForegroundColor White
Write-Host ""
