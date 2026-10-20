$ErrorActionPreference = 'Stop'
$pidPath = Join-Path $PSScriptRoot '.ibde\server.pid'
$expectedPython = Join-Path $PSScriptRoot '.venv\Scripts\python.exe'
if (-not (Test-Path -LiteralPath $pidPath)) {
    Write-Host 'No IBDE server was started by this launcher.'
    exit 0
}
$serverId = [int](Get-Content -LiteralPath $pidPath)
$server = Get-CimInstance Win32_Process -Filter "ProcessId=$serverId"
if (-not $server) {
    Remove-Item -LiteralPath $pidPath
    Write-Host 'IBDE is already stopped.'
    exit 0
}
if ($server.ExecutablePath -ne $expectedPython -or $server.CommandLine -notlike '*uvicorn final_integration:app*') {
    throw 'The saved process no longer matches this IBDE launcher. Nothing was stopped.'
}
$children = Get-CimInstance Win32_Process -Filter "ParentProcessId=$serverId"
foreach ($child in $children) {
    if ($child.Name -eq 'python.exe' -and $child.CommandLine -like '*uvicorn final_integration:app*') {
        Stop-Process -Id $child.ProcessId -ErrorAction SilentlyContinue
    }
}
Stop-Process -Id $serverId -ErrorAction SilentlyContinue
Remove-Item -LiteralPath $pidPath
Write-Host 'IBDE stopped.'
