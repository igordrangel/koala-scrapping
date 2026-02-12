@echo off
setlocal enabledelayedexpansion

for /f "tokens=*" %%i in ('git rev-parse --abbrev-ref HEAD 2^>nul') do set CURRENT_BRANCH=%%i

if NOT "%CURRENT_BRANCH%"=="develop" (
    exit /b 0
)

for /f "tokens=*" %%i in ('git rev-parse --show-toplevel 2^>nul') do set REPO_ROOT=%%i

if exist "%REPO_ROOT%\.git\GIT_VERSION_TYPE" (
    exit /b 0
)

REM Se está em processamento de versioning (amend), não fazer nada
if "%GIT_VERSION_IN_PROGRESS%"=="1" (
    exit /b 0
)

REM Marcar que estamos aguardando input do usuário
echo. > "%REPO_ROOT%\.git\GIT_VERSION_WAITING"

REM Log para debug
echo [pre-commit] Branch: %CURRENT_BRANCH% >> "%REPO_ROOT%\.git\hooks\pre-commit.log"
echo [pre-commit] RepoRoot: %REPO_ROOT% >> "%REPO_ROOT%\.git\hooks\pre-commit.log"

REM Executar o PowerShell dialog se possível
set SCRIPT_DIR=%REPO_ROOT%\scripts
set PS_SCRIPT=%SCRIPT_DIR%\version-dialog.ps1

if exist "%PS_SCRIPT%" (
    echo [pre-commit] Executando PowerShell dialog... >> "%REPO_ROOT%\.git\hooks\pre-commit.log"
    REM Tentar executar com PowerShell
    powershell -NoProfile -ExecutionPolicy Bypass -File "%PS_SCRIPT%" -GitDir "%REPO_ROOT%\.git" >> "%REPO_ROOT%\.git\hooks\pre-commit.log" 2>&1
    
    echo [pre-commit] PowerShell exit code: !ERRORLEVEL! >> "%REPO_ROOT%\.git\hooks\pre-commit.log"
    if !ERRORLEVEL! EQU 1 (
        REM Usuário cancelou - remover arquivo de espera e sair com erro
        echo [pre-commit] Usuário cancelou >> "%REPO_ROOT%\.git\hooks\pre-commit.log"
        del "%REPO_ROOT%\.git\GIT_VERSION_WAITING" 2>nul
        exit /b 1
    )
) else (
    REM Fallback: menu em linha de comando
    cls
    echo.
    echo =====================================
    echo Gerenciador de Versao
    echo =====================================
    echo.
    echo Qual tipo de alteracao?
    echo.
    echo 1) hotfix  - Correcao de bugs (patch)
    echo 2) feature - Nova funcionalidade (minor)
    echo 3) release - Release (major)
    echo 4) apenas enviar - Sem alterar versao
    echo.
    set /p OPTION="Selecione a opcao (1/2/3/4 ou Enter=2): "
    if "!OPTION!"=="" set OPTION=2
    
    echo !OPTION! > "%REPO_ROOT%\.git\GIT_VERSION_TYPE"
)

REM Remover arquivo de espera se existir
del "%REPO_ROOT%\.git\GIT_VERSION_WAITING" 2>nul

exit /b 0
