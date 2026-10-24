$ErrorActionPreference = 'Stop'
$gmmRoot = [IO.Path]::GetFullPath((Join-Path $PSScriptRoot '..'))
$gmmStartup = [Environment]::GetFolderPath('Startup')
$gmmShortcutPath = Join-Path $gmmStartup 'Golden Music Memories.lnk'
if (Test-Path -LiteralPath $gmmShortcutPath) { throw 'Já existe atalho de inicialização. Preserve-o e confira seu destino antes de substituir.' }
$gmmShell = New-Object -ComObject WScript.Shell
$gmmShortcut = $gmmShell.CreateShortcut($gmmShortcutPath)
$gmmShortcut.TargetPath = (Get-Command powershell.exe).Source
$gmmShortcut.Arguments = '-NoProfile -WindowStyle Hidden -File "' + (Join-Path $PSScriptRoot 'start-service.ps1') + '"'
$gmmShortcut.WorkingDirectory = $gmmRoot
$gmmShortcut.WindowStyle = 7
$gmmShortcut.Description = 'Inicia o serviço local Golden Music Memories ao entrar no Windows.'
$gmmShortcut.Save()
Write-Output 'Atalho criado na inicialização do usuário. A política de execução do Windows precisa permitir este script local. Não alteramos a política do sistema.'
