$ErrorActionPreference = 'Stop'
$secret = Read-Host 'Cole uma chave NOVA do OpenRouter (entrada oculta; não use a chave enviada no chat)' -AsSecureString
$pointer = [Runtime.InteropServices.Marshal]::SecureStringToBSTR($secret)
try {
    $newKey = [Runtime.InteropServices.Marshal]::PtrToStringBSTR($pointer).Trim()
    if ($newKey -notmatch '^sk-or-v1-[a-fA-F0-9]{32,}$') { throw 'Formato de chave não reconhecido. Nenhum arquivo foi alterado.' }
    $utf8 = New-Object System.Text.UTF8Encoding($false)
    [IO.File]::WriteAllText((Join-Path $PSScriptRoot '.env'), "OPENROUTER_API_KEY=$newKey`n", $utf8)
    $projectRoot = Split-Path -Parent $PSScriptRoot
    $appEnv = Join-Path $projectRoot '.env'
    if (-not (Test-Path -LiteralPath $appEnv)) {
        Copy-Item -LiteralPath (Join-Path $projectRoot '.env.example') -Destination $appEnv
    }
    Write-Host 'Chave salva somente em server/.env. Ela não foi validada nem exibida.'
    Write-Host 'O .env do app contém somente a URL pública local. Para emulador Android, use 10.0.2.2:8787.'
} finally {
    [Runtime.InteropServices.Marshal]::ZeroFreeBSTR($pointer)
    $newKey = $null
    $secret.Dispose()
}
