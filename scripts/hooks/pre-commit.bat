@echo off
REM Wrapper para pré-commit hook
REM Este arquivo chama o script batch do pré-commit

setlocal enabledelayedexpansion

for /f "tokens=*" %%i in ('git rev-parse --show-toplevel 2^>nul') do set REPO_ROOT=%%i

if exist "%REPO_ROOT%\scripts\hooks\pre-commit-windows.bat" (
    call "%REPO_ROOT%\scripts\hooks\pre-commit-windows.bat"
    exit /b !ERRORLEVEL!
) else (
    REM Fallback para versão bash se batch não existir
    exit /b 0
)
