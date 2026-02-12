@echo off
setlocal enabledelayedexpansion

REM Hook post-commit para gerenciar versões e criar tags automáticas na branch develop
REM Detecta o tipo de alteração e atualiza a versão

for /f "tokens=*" %%i in ('git rev-parse --abbrev-ref HEAD') do set CURRENT_BRANCH=%%i

if "%CURRENT_BRANCH%"=="develop" (
    for /f "tokens=*" %%i in ('git rev-parse --show-toplevel') do set REPO_ROOT=%%i
    
    REM Log para debug
    echo [post-commit] Iniciando hook para branch: %CURRENT_BRANCH% >> "%REPO_ROOT%\.git\hooks\post-commit.log"
    echo [post-commit] Timestamp: %date% %time% >> "%REPO_ROOT%\.git\hooks\post-commit.log"
    
    REM Verificar se existe arquivo de tipo de versão
    if exist "%REPO_ROOT%\.git\GIT_VERSION_TYPE" (
        REM Ler o tipo de versão do arquivo
        for /f "tokens=*" %%i in ('type "%REPO_ROOT%\.git\GIT_VERSION_TYPE"') do set OPTION=%%i
        
        REM Deletar o arquivo para evitar reprocessamento
        del "%REPO_ROOT%\.git\GIT_VERSION_TYPE" > nul 2>&1
    ) else (
        REM Se não existe, usar padrão: feature
        set OPTION=2
    )
    
    REM Determinar o script a executar baseado na opção
    if "!OPTION!"=="1" (
        set PREPARE_SCRIPT=prepare:hotfix
        set TYPE_NAME=HOTFIX
    ) else if "!OPTION!"=="2" (
        set PREPARE_SCRIPT=prepare:feature
        set TYPE_NAME=FEATURE
    ) else if "!OPTION!"=="3" (
        set PREPARE_SCRIPT=prepare:release
        set TYPE_NAME=RELEASE
    ) else if "!OPTION!"=="4" (
        REM Opção 4: apenas enviar - não fazer bump de versão
        REM Apenas criar a tag com a versão atual
        set PREPARE_SCRIPT=prepare:only-tag
        set TYPE_NAME=APENAS ENVIAR
    ) else (
        REM Padrão: feature
        set PREPARE_SCRIPT=prepare:feature
        set TYPE_NAME=FEATURE
    )
    
    echo [post-commit] Executando: bun run %PREPARE_SCRIPT% >> "%REPO_ROOT%\.git\hooks\post-commit.log"
    
    REM Executar o script prepare
    cd /d "%REPO_ROOT%"
    call bun run %PREPARE_SCRIPT% >> "%REPO_ROOT%\.git\hooks\post-commit.log" 2>&1
    
    echo [post-commit] bun exit code: !ERRORLEVEL! >> "%REPO_ROOT%\.git\hooks\post-commit.log"
    
    if !ERRORLEVEL! EQU 0 (
        REM Obter a versão atual
        for /f "tokens=2 delims=:," %%A in ('findstr "\"version\"" "%REPO_ROOT%\package.json"') do (
            set VERSION=%%A
            set VERSION=!VERSION:~2,-1!
            goto :got_version
        )
        :got_version
        
        REM Obter o hash do commit
        for /f "tokens=*" %%i in ('git rev-parse --short HEAD') do set COMMIT_ID=%%i
        
        REM Criar a tag
        set TAG_NAME=!VERSION!-dev+!COMMIT_ID!
        git tag "!TAG_NAME!" >> "%REPO_ROOT%\.git\hooks\post-commit.log" 2>&1
        
        echo [post-commit] Sucesso: !TAG_NAME! criada >> "%REPO_ROOT%\.git\hooks\post-commit.log"
    ) else (
        echo [post-commit] Erro ao executar bun run %PREPARE_SCRIPT% >> "%REPO_ROOT%\.git\hooks\post-commit.log"
        exit /b 1
    )
)

exit /b 0
