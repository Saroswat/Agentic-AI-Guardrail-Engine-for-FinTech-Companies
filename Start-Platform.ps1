param([int]$FrontendPort = 3010, [int]$BackendPort = 8010)
$ErrorActionPreference = 'Stop'
Set-Location -LiteralPath $PSScriptRoot
$localDir = Join-Path $PSScriptRoot '.local'
New-Item -ItemType Directory -Path $localDir -Force | Out-Null
$pythonPath = Join-Path $PSScriptRoot 'backend/.venv/Scripts/python.exe'
if (!(Test-Path -LiteralPath $pythonPath)) {
    python -m venv backend/.venv
    & $pythonPath -m pip install -r backend/requirements-lock.txt
    if ($LASTEXITCODE) { throw 'Python dependency installation failed.' }
}
if (!(Test-Path -LiteralPath 'frontend/node_modules')) {
    Push-Location frontend
    try { npm.cmd ci; if ($LASTEXITCODE) { throw 'Node dependency installation failed.' } } finally { Pop-Location }
}
$environmentPath = Join-Path $PSScriptRoot 'backend/.env'
if (!(Test-Path -LiteralPath $environmentPath)) {
    $passwordBytes = New-Object byte[] 24
    [System.Security.Cryptography.RandomNumberGenerator]::Fill($passwordBytes)
    $initialPassword = [Convert]::ToBase64String($passwordBytes)
    @("DATABASE_URL=sqlite:///./agentic_guardrail.db", "BOOTSTRAP_PASSWORD=$initialPassword", 'SEED_ON_STARTUP=true', "CORS_ORIGINS=http://localhost:$FrontendPort,http://127.0.0.1:$FrontendPort", 'APP_ENV=development') | Set-Content -LiteralPath $environmentPath
    @("Local demonstration credentials", 'Usernames: analyst, reviewer, admin', "Initial password: $initialPassword", 'Change each account password through the Account page before sharing the workspace.') | Set-Content -LiteralPath (Join-Path $localDir 'credentials.txt')
}
if (Test-Path -LiteralPath (Join-Path $localDir 'processes.json')) { throw 'A launch record already exists. Run Stop-Platform.ps1 before starting again.' }
Push-Location backend
try { & $pythonPath -m alembic upgrade head; if ($LASTEXITCODE) { throw 'Database migration failed.' } } finally { Pop-Location }
$env:BACKEND_URL = "http://127.0.0.1:$BackendPort"
$apiProcess = Start-Process -FilePath $pythonPath -ArgumentList @('-m','uvicorn','app.main:app','--host','127.0.0.1','--port',"$BackendPort") -WorkingDirectory (Join-Path $PSScriptRoot 'backend') -WindowStyle Hidden -RedirectStandardOutput (Join-Path $localDir 'backend.log') -RedirectStandardError (Join-Path $localDir 'backend-error.log') -PassThru
$workerProcess = Start-Process -FilePath $pythonPath -ArgumentList @('-m','app.services.investigation_worker') -WorkingDirectory (Join-Path $PSScriptRoot 'backend') -WindowStyle Hidden -RedirectStandardOutput (Join-Path $localDir 'worker.log') -RedirectStandardError (Join-Path $localDir 'worker-error.log') -PassThru
$nodePath = (Get-Command node.exe).Source
$nextPath = Join-Path $PSScriptRoot 'frontend/node_modules/next/dist/bin/next'
$webProcess = Start-Process -FilePath $nodePath -ArgumentList @("`"$nextPath`"",'dev','--hostname','127.0.0.1','--port',"$FrontendPort") -WorkingDirectory (Join-Path $PSScriptRoot 'frontend') -WindowStyle Hidden -RedirectStandardOutput (Join-Path $localDir 'frontend.log') -RedirectStandardError (Join-Path $localDir 'frontend-error.log') -PassThru
@(@{id=$apiProcess.Id;start=$apiProcess.StartTime.ToUniversalTime().ToString('o')},@{id=$workerProcess.Id;start=$workerProcess.StartTime.ToUniversalTime().ToString('o')},@{id=$webProcess.Id;start=$webProcess.StartTime.ToUniversalTime().ToString('o')}) | ConvertTo-Json | Set-Content -LiteralPath (Join-Path $localDir 'processes.json')
Write-Output "Workspace starting at http://127.0.0.1:$FrontendPort/login"
Write-Output "Credentials: $localDir\credentials.txt"
Write-Output "Logs: $localDir"
