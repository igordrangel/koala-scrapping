@echo off
REM Script para instalar os git hooks do projeto (Windows - CMD)
REM Uso: setup-hooks.bat

setlocal enabledelayedexpansion

REM Obter a raiz do repositório
for /f "tokens=*" %%i in ('git rev-parse --show-toplevel') do set REPO_ROOT=%%i

if errorlevel 1 (
    echo Erro: Nao foi possivel obter a raiz do repositorio.
    echo Certifique-se de que voce esta em um repositorio Git.
    pause
    exit /b 1
)

set HOOKS_DIR=%REPO_ROOT%\scripts\hooks
set GIT_HOOKS_DIR=%REPO_ROOT%\.git\hooks

echo.
echo =====================================
echo Instalando Git Hooks
echo =====================================
echo.

REM Verificar se o diretório de hooks existe
if not exist "%HOOKS_DIR%" (
    echo Erro: Diretorio %HOOKS_DIR% nao encontrado
    pause
    exit /b 1
)

REM Verificar se o diretório .git existe
if not exist "%GIT_HOOKS_DIR%" (
    echo Erro: Diretorio .git nao encontrado. Voce esta em um repositorio Git?
    pause
    exit /b 1
)

REM ========== INSTALAR HOOKS BASH ==========
REM Copiar hooks bash para .git/hooks

REM PRE-COMMIT
if exist "%HOOKS_DIR%\pre-commit" (
    copy "%HOOKS_DIR%\pre-commit" "%GIT_HOOKS_DIR%\pre-commit" /Y >nul
    if errorlevel 1 (
        echo Erro: Nao foi possivel instalar o pre-commit hook
        pause
        exit /b 1
    ) else (
        echo [OK] pre-commit hook instalado
    )
) else (
    echo Erro: pre-commit hook nao encontrado em %HOOKS_DIR%
    pause
    exit /b 1
)

REM POST-COMMIT
if exist "%HOOKS_DIR%\post-commit" (
    copy "%HOOKS_DIR%\post-commit" "%GIT_HOOKS_DIR%\post-commit" /Y >nul
    if errorlevel 1 (
        echo Erro: Nao foi possivel instalar o post-commit hook
        pause
        exit /b 1
    ) else (
        echo [OK] post-commit hook instalado
    )
) else (
    echo Erro: post-commit hook nao encontrado em %HOOKS_DIR%
    pause
    exit /b 1
)

REM POST-MERGE
if exist "%HOOKS_DIR%\post-merge" (
    copy "%HOOKS_DIR%\post-merge" "%GIT_HOOKS_DIR%\post-merge" /Y >nul
    if errorlevel 1 (
        echo Erro: Nao foi possivel instalar o post-merge hook
        pause
        exit /b 1
    ) else (
        echo [OK] post-merge hook instalado
    )
) else (
    echo Erro: post-merge hook nao encontrado em %HOOKS_DIR%
    pause
    exit /b 1
)

echo.
echo [OK] Todos os hooks foram instalados com sucesso!
echo.
echo Informacoes dos hooks instalados:
echo - pre-commit:  Exibe dialogo para selecionar tipo de alteracao
echo - post-commit: Atualiza versao e cria tags automaticamente
echo - post-merge:  Cria tags automaticamente apos merge (sem alterar versao)
echo.
echo Opcoes disponiveis:
echo   1) hotfix    - Correcao de bugs (patch)
echo   2) feature   - Nova funcionalidade (minor)
echo   3) release   - Release (major)
echo   4) apenas enviar - Sem alterar versao
echo.
echo =====================================
echo.
pause
