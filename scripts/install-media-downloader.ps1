$ErrorActionPreference = 'Stop'
$gmmProject = [IO.Path]::GetFullPath((Join-Path $PSScriptRoot '..'))
$gmmEnv = Join-Path $gmmProject '.cache\media-downloader-env'
$gmmPython = Join-Path $gmmEnv 'Scripts\python.exe'
if (-not (Test-Path -LiteralPath $gmmPython)) {
    & python -m venv $gmmEnv
    if ($LASTEXITCODE -ne 0) { throw 'Instale Python 3.11 ou superior e repita.' }
}
& $gmmPython -m pip install 'yt-dlp[default]==2026.10.21' 'yt-dlp-ejs==0.8.0'
if ($LASTEXITCODE -ne 0) { throw 'Instalação das dependências não concluiu.' }
$gmmNode = (Get-Command node -ErrorAction Stop).Source
$gmmCheck = & $gmmPython -X utf8 (Join-Path $gmmProject 'server\media-downloader\bridge.py') --tools (Join-Path $gmmProject '.cache\import-tools') --node $gmmNode --check
if ($LASTEXITCODE -ne 0) { throw 'Verifique Python, Node, FFmpeg e FFprobe locais.' }

if (-not (($gmmCheck | ConvertFrom-Json).ready)) { throw 'FFmpeg/FFprobe ou Node indisponíveis no projeto.' }
Write-Output $gmmCheck
