cd C:\WorkSpaces\voicetowebsite-copyright-mrjwswain

$ErrorActionPreference = "Stop"
$envPath = ".env"
$password = "5555"

if (!(Test-Path $envPath)) {
    New-Item -ItemType File -Path $envPath | Out-Null
}

$lines = Get-Content $envPath -ErrorAction SilentlyContinue
$out = @()
$hasControl = $false
$hasAdmin = $false

foreach ($line in $lines) {
    if ($line -match '^CONTROL_PASSWORD=') {
        if (-not $hasControl) {
            $out += "CONTROL_PASSWORD=$password"
            $hasControl = $true
        }
    }
    elseif ($line -match '^ADMIN_ACCESS_CODE=') {
        if (-not $hasAdmin) {
            $out += "ADMIN_ACCESS_CODE=$password"
            $hasAdmin = $true
        }
    }
    else {
        $out += $line
    }
}

if (-not $hasControl) { $out += "CONTROL_PASSWORD=$password" }
if (-not $hasAdmin) { $out += "ADMIN_ACCESS_CODE=$password" }

$out | Set-Content $envPath

Write-Host "Done. CONTROL_PASSWORD and ADMIN_ACCESS_CODE set to $password" -ForegroundColor Green
Select-String -Path $envPath -Pattern '^(CONTROL_PASSWORD|ADMIN_ACCESS_CODE)='
