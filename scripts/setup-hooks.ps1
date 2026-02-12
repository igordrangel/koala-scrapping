#!/usr/bin/env powershell

# Script para instalar os git hooks do projeto (Windows - PowerShell)

$ErrorActionPreference = "Stop"

try {
    $repoRoot = git rev-parse --show-toplevel
    if ($LASTEXITCODE -ne 0) {
        throw "Erro: Não foi possível obter a raiz do repositório. Certifique-se de que você está em um repositório Git."
    }
} catch {
    Write-Host "Erro ao executar git: $_" -ForegroundColor Red
    exit 1
}

$hooksDir = Join-Path $repoRoot "scripts\hooks"
$gitHooksDir = Join-Path $repoRoot ".git\hooks"

Write-Host "`n=====================================" -ForegroundColor Blue
Write-Host "Instalando Git Hooks" -ForegroundColor Blue
Write-Host "=====================================" -ForegroundColor Blue

# Verificar se o diretório de hooks existe
if (-not (Test-Path $hooksDir)) {
    Write-Host "Erro: Diretório $hooksDir não encontrado" -ForegroundColor Red
    exit 1
}

# Verificar se o diretório .git existe
if (-not (Test-Path $gitHooksDir)) {
    Write-Host "Erro: Diretório .git não encontrado. Você está em um repositório Git?" -ForegroundColor Red
    exit 1
}

# Instalar post-commit hook
$postCommitSource = Join-Path $hooksDir "post-commit.ps1"
$postCommitDest = Join-Path $gitHooksDir "post-commit"

if (Test-Path $postCommitSource) {
    try {
        Copy-Item $postCommitSource $postCommitDest -Force
        Write-Host "✓ post-commit hook instalado (PowerShell)" -ForegroundColor Green
    } catch {
        Write-Host "Erro ao instalar post-commit hook: $_" -ForegroundColor Red
        exit 1
    }
} else {
    Write-Host "Aviso: post-commit.ps1 não encontrado em $hooksDir" -ForegroundColor Yellow
    
    # Tentar usar versão Bash como fallback
    $postCommitSourceBash = Join-Path $hooksDir "post-commit"
    if (Test-Path $postCommitSourceBash) {
        try {
            Copy-Item $postCommitSourceBash $postCommitDest -Force
            Write-Host "✓ post-commit hook instalado (Bash)" -ForegroundColor Green
        } catch {
            Write-Host "Erro ao instalar post-commit hook: $_" -ForegroundColor Red
            exit 1
        }
    } else {
        Write-Host "Erro: post-commit hook não encontrado em $hooksDir" -ForegroundColor Red
        exit 1
    }
}

Write-Host "`n✓ Todos os hooks foram instalados com sucesso!" -ForegroundColor Green
Write-Host "=====================================" -ForegroundColor Blue
Write-Host ""
