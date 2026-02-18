cd C:\WorkSpaces\voicetowebsite-copyright-mrjwswain
$ErrorActionPreference = "Continue"

Write-Host ""
Write-Host "========================================"
Write-Host " AUTOFIX LOOP RUNNER"
Write-Host "========================================"
Write-Host ""

npm install

for ($i=1; $i -le 15; $i++) {
  Write-Host ""
  Write-Host "==== PASS $i / 15 ===="
  Write-Host ""

  npm run lint 2>$null
  npm run build

  if ($LASTEXITCODE -ne 0) {
    Write-Host "[!] BUILD FAILED"
    continue
  }

  npm test 2>$null

  if ($LASTEXITCODE -eq 0) {
    Write-Host ""
    Write-Host "[+] SUCCESS: BUILD + TEST PASSED"
    exit 0
  }

  Write-Host "[!] TEST FAILED"
}

Write-Host ""
Write-Host "[X] STILL FAILING AFTER 15 PASSES."
exit 1
