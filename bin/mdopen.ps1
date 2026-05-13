$ErrorActionPreference = "Stop"

if (-not (Get-Command bun -ErrorAction SilentlyContinue)) {
  Write-Error "mdopen: bun is not on PATH"
  exit 1
}

& bun "$PSScriptRoot/mdopen.js" @args
exit $LASTEXITCODE
