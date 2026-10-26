$ErrorActionPreference = 'Stop'
$gmmRoot = [IO.Path]::GetFullPath((Join-Path $PSScriptRoot '..'))
$gmmNode = (Get-Command node -ErrorAction Stop).Source
Set-Location -LiteralPath $gmmRoot
if (-not (Test-Path -LiteralPath (Join-Path $gmmRoot '.env'))) {
    & $gmmNode (Join-Path $PSScriptRoot 'setup-service.mjs')
    if ($LASTEXITCODE -ne 0) { throw 'Não foi possível preparar a configuração.' }
}
$gmmRun = Join-Path $gmmRoot '.cache\launcher'
New-Item -ItemType Directory -Force -Path $gmmRun | Out-Null
$gmmPidFile = Join-Path $gmmRun 'process.json'
if (Test-Path -LiteralPath $gmmPidFile) {
    $gmmPrevious = Get-Content -LiteralPath $gmmPidFile -Raw | ConvertFrom-Json
    if ($gmmPrevious.startedAt -is [DateTime]) { $gmmPrevious.startedAt = $gmmPrevious.startedAt.ToUniversalTime().ToString('o') }
    $gmmProcess = Get-Process -Id $gmmPrevious.pid -ErrorAction SilentlyContinue
    if ($gmmProcess -and $gmmProcess.StartTime.ToUniversalTime().ToString('o') -eq $gmmPrevious.startedAt) {
        Write-Output 'Serviço já iniciado. Abra http://127.0.0.1:8877/painel.html'
        exit 0
    }
}
$gmmStarted = Start-Process -FilePath $gmmNode -ArgumentList '--env-file-if-exists=.env','server/runtime/http.mjs' -WorkingDirectory $gmmRoot -WindowStyle Hidden -RedirectStandardOutput (Join-Path $gmmRun 'service.log') -RedirectStandardError (Join-Path $gmmRun 'errors.log') -PassThru
@{pid=$gmmStarted.Id;startedAt=$gmmStarted.StartTime.ToUniversalTime().ToString('o');root=$gmmRoot} | ConvertTo-Json | Set-Content -LiteralPath $gmmPidFile
Write-Output 'Serviço iniciado em segundo plano. Abra http://127.0.0.1:8877/painel.html. Confirme a disponibilidade no painel. Fechar a aba não encerra o serviço.'
