while ($true) {
    cd C:\WorkSpaces\voicetowebsite-copyright-mrjwswain
    git add .
    git commit -m "auto-live update $(Get-Date -Format 'HH:mm:ss')" 2>$null
    git push origin main 2>$null
    Start-Sleep -Seconds 5
}
