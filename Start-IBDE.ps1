param([switch]$NoBrowser)
$ErrorActionPreference = 'Stop'
$projectRoot = $PSScriptRoot
$pythonPath = Join-Path $projectRoot '.venv\Scripts\python.exe'
$runtimePath = Join-Path $projectRoot '.ibde'
$baseUrl = 'http://127.0.0.1:8000'

function Test-IBDE {
    try {
        $metadata = Invoke-RestMethod -Uri ($baseUrl + '/') -TimeoutSec 2
        return $metadata.Project -eq 'Intelligent Business Decision Engine (IBDE)'
    } catch { return $false }
}

if (Test-IBDE) {
    Write-Host 'IBDE is already running. Reusing the existing server.'
    if (-not $NoBrowser) { Start-Process ($baseUrl + '/app') }
    exit 0
}

if (Get-NetTCPConnection -LocalPort 8000 -State Listen -ErrorAction SilentlyContinue) {
    throw 'Another application is using port 8000. Stop that application or choose a different port manually.'
}

if (-not (Test-Path -LiteralPath $pythonPath)) {
    Write-Host 'Preparing the Python 3.12 environment...'
    & py -3.12 -m venv (Join-Path $projectRoot '.venv')
    if ($LASTEXITCODE -ne 0) { throw 'Install Python 3.12, then run this launcher again.' }
}

& $pythonPath -c "import importlib.util, sys; sys.exit(0 if all(importlib.util.find_spec(m) for m in ['fastapi','uvicorn','sklearn','pandas','numpy','matplotlib','seaborn','joblib','multipart','jinja2']) else 1)"
if ($LASTEXITCODE -ne 0) {
    & $pythonPath -m pip install -r (Join-Path $projectRoot 'requirements.txt')
    if ($LASTEXITCODE -ne 0) { throw 'Dependency installation failed. Check the output above.' }
}

New-Item -ItemType Directory -Path $runtimePath -Force | Out-Null
$stdoutPath = Join-Path $runtimePath 'server.log'
$stderrPath = Join-Path $runtimePath 'server-error.log'
$serverProcess = Start-Process -FilePath $pythonPath -ArgumentList @('-m','uvicorn','final_integration:app','--host','127.0.0.1','--port','8000') -WorkingDirectory $projectRoot -WindowStyle Hidden -RedirectStandardOutput $stdoutPath -RedirectStandardError $stderrPath -PassThru
$serverProcess.Id | Set-Content -LiteralPath (Join-Path $runtimePath 'server.pid')

$deadline = (Get-Date).AddSeconds(120)
while ((Get-Date) -lt $deadline) {
    if (Test-IBDE) {
        Write-Host ('IBDE is running: ' + $baseUrl + '/app')
        Write-Host ('API documentation: ' + $baseUrl + '/docs')
        if (-not $NoBrowser) { Start-Process ($baseUrl + '/app') }
        exit 0
    }
    $serverProcess.Refresh()
    if ($serverProcess.HasExited) {
        if (Test-Path -LiteralPath $stderrPath) { Get-Content -LiteralPath $stderrPath -Tail 30 }
        throw 'IBDE stopped during startup. Review .ibde/server-error.log.'
    }
    Start-Sleep -Milliseconds 300
}
throw 'IBDE is taking longer than expected to start. Review .ibde/server-error.log.'
