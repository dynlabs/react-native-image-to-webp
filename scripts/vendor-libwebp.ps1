# PowerShell script to vendor libwebp sources

$LIBWEBP_VERSION = "1.6.0"
$VENDOR_DIR = "cpp\vendor"
$LIBWEBP_DIR = "$VENDOR_DIR\libwebp"

Write-Host "Vendoring libwebp $LIBWEBP_VERSION..." -ForegroundColor Cyan

# Create vendor directory
if (-not (Test-Path $VENDOR_DIR)) {
    New-Item -ItemType Directory -Path $VENDOR_DIR | Out-Null
}

# Clone or update libwebp
if (Test-Path $LIBWEBP_DIR) {
    Write-Host "libwebp directory exists, updating..." -ForegroundColor Yellow
    Push-Location $LIBWEBP_DIR
    git fetch
    git checkout "v$LIBWEBP_VERSION" -ErrorAction SilentlyContinue
    if ($LASTEXITCODE -ne 0) {
        git checkout $LIBWEBP_VERSION
    }
    Pop-Location
} else {
    Write-Host "Cloning libwebp..." -ForegroundColor Green
    git clone https://github.com/webmproject/libwebp.git $LIBWEBP_DIR
    Push-Location $LIBWEBP_DIR
    git checkout "v$LIBWEBP_VERSION" -ErrorAction SilentlyContinue
    if ($LASTEXITCODE -ne 0) {
        git checkout $LIBWEBP_VERSION
    }
    Pop-Location
}

Write-Host "✓ libwebp $LIBWEBP_VERSION vendored successfully!" -ForegroundColor Green
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Cyan
Write-Host "1. Uncomment the libwebp includes in cpp/ImageToWebP.cpp"
Write-Host "2. Uncomment the implementation in cpp/ImageToWebP.cpp"
Write-Host "3. Update build files (podspec and CMakeLists.txt) to include libwebp sources"
Write-Host "4. Rebuild the project"
