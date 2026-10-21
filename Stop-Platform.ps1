$ErrorActionPreference = 'Stop'
$recordPath = Join-Path $PSScriptRoot '.local/processes.json'
if (!(Test-Path -LiteralPath $recordPath)) { Write-Output 'No managed processes.'; exit }
foreach ($record in (Get-Content -LiteralPath $recordPath -Raw | ConvertFrom-Json)) {
    $managedProcess = Get-Process -Id $record.id -ErrorAction SilentlyContinue
    if ($managedProcess -and $managedProcess.StartTime.ToUniversalTime().ToString('o') -eq $record.start) {
        & taskkill.exe /PID $record.id /T /F | Out-Null
    }
}
Remove-Item -LiteralPath $recordPath
Write-Output 'Managed platform processes stopped.'
