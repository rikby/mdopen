@echo off
setlocal

where bun >nul 2>nul
if errorlevel 1 (
  echo mdopen: bun is not on PATH 1>&2
  exit /b 1
)

bun "%~dp0mdopen.js" %*
exit /b %ERRORLEVEL%
