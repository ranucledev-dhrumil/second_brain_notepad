$ErrorActionPreference = "Stop"

$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$projectRoot = Split-Path -Parent $scriptDir
$hostCrateDir = Join-Path $projectRoot "second-brain-host"
$targetExe = Join-Path $hostCrateDir "target\debug\second-brain-host.exe"

$appDataDir = Join-Path $env:APPDATA "SecondBrain"
$destManifest = Join-Path $appDataDir "com.secondbrain.host.json"

Write-Host "=================================================" -ForegroundColor Cyan
Write-Host " Setup Native Messaging Test Harness (Dev)" -ForegroundColor Cyan
Write-Host "=================================================" -ForegroundColor Cyan

# 1. Compile second-brain-host.exe (debug mode)
Write-Host "`n[1/4] Compiling second-brain-host.exe (debug mode)..." -ForegroundColor Yellow
Push-Location $hostCrateDir
try {
    cargo build
    if ($LASTEXITCODE -ne 0) {
        throw "cargo build failed with exit code $LASTEXITCODE"
    }
}
finally {
    Pop-Location
}

if (-not (Test-Path $targetExe)) {
    throw "Compiled binary not found at $targetExe"
}
Write-Host "      Compiled successfully: $targetExe" -ForegroundColor Green

# 2. Prepare %APPDATA%\SecondBrain directory
if (-not (Test-Path $appDataDir)) {
    New-Item -ItemType Directory -Path $appDataDir -Force | Out-Null
}

# 3. Update host manifest JSON with absolute path, preserving allowed_origins
Write-Host "`n[3/4] Updating host manifest at $destManifest..." -ForegroundColor Yellow

$manifestObj = @{}
if (Test-Path $destManifest) {
    $existingJson = Get-Content $destManifest -Raw | ConvertFrom-Json
    $manifestObj = $existingJson
} else {
    $manifestObj = [ordered]@{
        name = "com.secondbrain.host"
        description = "Second Brain Native Messaging Host"
        type = "stdio"
        allowed_origins = @("chrome-extension://nlkpiaianojgfobdnafcfhcjidihoomo/")
    }
}

$manifestObj.path = $targetExe

$manifestJson = $manifestObj | ConvertTo-Json -Depth 4
[System.IO.File]::WriteAllText($destManifest, $manifestJson, [System.Text.Encoding]::UTF8)
Write-Host "      Manifest updated to point to debug binary." -ForegroundColor Green

# 4. Register in Windows Registry for Google Chrome and Edge
Write-Host "`n[4/4] Registering Native Messaging Host in Registry..." -ForegroundColor Yellow

$chromeRegBase = "HKCU:\Software\Google\Chrome\NativeMessagingHosts"
$chromeRegKey = "HKCU:\Software\Google\Chrome\NativeMessagingHosts\com.secondbrain.host"
if (-not (Test-Path $chromeRegBase)) { New-Item -Path $chromeRegBase -Force | Out-Null }
if (-not (Test-Path $chromeRegKey)) { New-Item -Path $chromeRegKey -Force | Out-Null }
Set-ItemProperty -Path $chromeRegKey -Name "(Default)" -Value $destManifest -Force
Write-Host "      Chrome: $chromeRegKey -> $destManifest" -ForegroundColor Green

$edgeRegBase = "HKCU:\Software\Microsoft\Edge\NativeMessagingHosts"
$edgeRegKey = "HKCU:\Software\Microsoft\Edge\NativeMessagingHosts\com.secondbrain.host"
if (-not (Test-Path $edgeRegBase)) { New-Item -Path $edgeRegBase -Force | Out-Null }
if (-not (Test-Path $edgeRegKey)) { New-Item -Path $edgeRegKey -Force | Out-Null }
Set-ItemProperty -Path $edgeRegKey -Name "(Default)" -Value $destManifest -Force
Write-Host "      Edge: $edgeRegKey -> $destManifest" -ForegroundColor Green

Write-Host "`n=================================================" -ForegroundColor Cyan
Write-Host " Setup Complete! You can now run the test harness." -ForegroundColor Green
Write-Host "=================================================" -ForegroundColor Cyan
