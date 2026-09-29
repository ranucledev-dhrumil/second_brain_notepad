# Second Brain - Named Pipe Test Harness (CHANGE 18/19)
#
# Tests connectivity to the \\.\pipe\second-brain-nmh named pipe server
# exposed by the running Second Brain Tauri desktop application.

param(
    [string]$PipeName = "second-brain-nmh",
    [string]$Action = "ping",
    [string]$Title = "Test Page Title",
    [string]$Url = "https://example.com/test",
    [string]$SelectedText = "Hello from PowerShell test harness!",
    [int]$TimeoutMs = 3000
)

$ErrorActionPreference = "Stop"

Write-Host "========================================" -ForegroundColor Cyan
Write-Host " Second Brain - Named Pipe Test" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan

$pipeClient = New-Object System.IO.Pipes.NamedPipeClientStream(".", $PipeName, [System.IO.Pipes.PipeDirection]::InOut)

try {
    Write-Host "Connecting to named pipe '\\.\pipe\$PipeName' (timeout ${TimeoutMs}ms)..." -NoNewline
    $pipeClient.Connect($TimeoutMs)
    Write-Host " CONNECTED!" -ForegroundColor Green

    # Prepare JSON payload matching BrowserMessage schema
    $timestamp = [DateTimeOffset]::UtcNow.ToUnixTimeMilliseconds()
    $msgObject = @{
        version = 1
        action = $Action
        payload = @{
            title = $Title
            url = $Url
            selectedText = $SelectedText
            source = "powershell-test"
            timestamp = $timestamp
        }
    }

    $jsonStr = $msgObject | ConvertTo-Json -Compress
    $jsonBytes = [System.Text.Encoding]::UTF8.GetBytes($jsonStr)
    $lenBytes = [System.BitConverter]::GetBytes([uint32]$jsonBytes.Length)

    Write-Host "Sending payload ($($jsonBytes.Length) bytes):" -ForegroundColor Yellow
    Write-Host "  $jsonStr" -ForegroundColor Gray

    # Send 4-byte LE length + JSON
    $pipeClient.Write($lenBytes, 0, 4)
    $pipeClient.Write($jsonBytes, 0, $jsonBytes.Length)
    $pipeClient.Flush()

    # Read 4-byte LE response length
    $respLenBytes = New-Object byte[] 4
    $readLen = $pipeClient.Read($respLenBytes, 0, 4)
    if ($readLen -lt 4) {
        throw "Failed to read 4-byte response length from pipe"
    }

    $respLen = [System.BitConverter]::ToUInt32($respLenBytes, 0)
    $respBuffer = New-Object byte[] $respLen
    $totalRead = 0

    while ($totalRead -lt $respLen) {
        $r = $pipeClient.Read($respBuffer, $totalRead, $respLen - $totalRead)
        if ($r -le 0) { break }
        $totalRead += $r
    }

    $respStr = [System.Text.Encoding]::UTF8.GetString($respBuffer, 0, $totalRead)
    Write-Host "Received response ($totalRead bytes):" -ForegroundColor Yellow
    Write-Host "  $respStr" -ForegroundColor Cyan

    $respObj = $respStr | ConvertFrom-Json
    if ($respObj.ok -eq $true) {
        Write-Host "`nTest PASSED - Named pipe communication verified!" -ForegroundColor Green
    } else {
        Write-Host "`nTest FAILED with error: $($respObj.error)" -ForegroundColor Red
        exit 1
    }
}
catch {
    Write-Host " FAILED!" -ForegroundColor Red
    Write-Host "Error: $_" -ForegroundColor Red
    Write-Host "`nEnsure the Second Brain Tauri app is running before executing this test." -ForegroundColor Yellow
    exit 1
}
finally {
    if ($pipeClient -ne $null) {
        $pipeClient.Dispose()
    }
}
