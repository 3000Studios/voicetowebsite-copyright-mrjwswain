$body = @{
    action = "list-commands"
} | ConvertTo-Json

$response = Invoke-WebRequest -Uri "http://localhost:8787/api/ui-command" `
  -Method POST `
  -ContentType "application/json" `
  -Body $body `
  -SkipHttpErrorCheck

Write-Host "Status: $($response.StatusCode)"
Write-Host "Content:"
$response.Content | ConvertFrom-Json | ConvertTo-Json
