$ErrorActionPreference = 'Stop'
$gmmRoot = [IO.Path]::GetFullPath((Join-Path $PSScriptRoot '..'))
$gmmPidFile = Join-Path $gmmRoot '.cache\launcher\process.json'
if (-not (Test-Path -LiteralPath $gmmPidFile)) { Write-Output 'Nenhum processo iniciado pelo launcher foi registrado.'; exit 0 }
$gmmPrevious = Get-Content -LiteralPath $gmmPidFile -Raw | ConvertFrom-Json
$gmmProcess = Get-Process -Id $gmmPrevious.pid -ErrorAction SilentlyContinue
if ($gmmProcess) {
    if ($gmmPrevious.root -ne $gmmRoot -or $gmmProcess.StartTime.ToUniversalTime().ToString('o') -ne $gmmPrevious.startedAt) { throw 'Identidade do processo divergente. Nenhum processo foi encerrado.' }
    $gmmCommand = Get-CimInstance Win32_Process -Filter "ProcessId=$($gmmPrevious.pid)"
    if ($gmmCommand.CommandLine -notlike '*server/runtime/http.mjs*') { throw 'O processo não corresponde ao serviço. Operação cancelada.' }
    Stop-Process -Id $gmmPrevious.pid
}
Remove-Item -LiteralPath $gmmPidFile
Write-Output 'Serviço encerrado. SQLite e a fila serão recuperados na próxima inicialização. Agendamentos aceitos no YouTube continuam no provedor.'
