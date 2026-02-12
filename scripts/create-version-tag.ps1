#!/usr/bin/env pwsh
# Script para criar tags e versões manualmente na branch develop
# Uso: .\scripts\create-version-tag.ps1

# Verificar se estamos na branch develop
$currentBranch = git rev-parse --abbrev-ref HEAD
if ($currentBranch -ne "develop") {
    Write-Host "Erro: Este script só funciona na branch 'develop'" -ForegroundColor Red
    Write-Host "Branch atual: $currentBranch"
    exit 1
}

# Exibir menu
Write-Host "======================================" -ForegroundColor Blue
Write-Host "Gerenciador de Versão" -ForegroundColor Blue
Write-Host "======================================" -ForegroundColor Blue
Write-Host ""
Write-Host "Qual tipo de alteração você está realizando?"
Write-Host ""
Write-Host "1) hotfix  - Correção de bugs (patch)"
Write-Host "2) feature - Nova funcionalidade (minor)"
Write-Host "3) release - Release (major)"
Write-Host "4) apenas enviar - Sem alterar versão"
Write-Host ""

# Ler input do usuário
$option = Read-Host "Selecione a opção (1/2/3)"

# Validar entrada
switch ($option) {
    "1" {
        $prepareScript = "prepare:hotfix"
        $typeName = "HOTFIX"
    }
    "2" {
        $prepareScript = "prepare:feature"
        $typeName = "FEATURE"
    }
    "3" {
        $prepareScript = "prepare:release"
        $typeName = "RELEASE"
    }
    "4" {
        $prepareScript = "prepare:only-tag"
        $typeName = "APENAS ENVIAR"
    }
    default {
        Write-Host "Opção inválida!" -ForegroundColor Red
        exit 1
    }
}

Write-Host ""
Write-Host "Tipo de alteração selecionado: $typeName" -ForegroundColor Green
Write-Host ""
Write-Host "Salvar configuração para próximo commit..." -ForegroundColor Blue

# Salvar a opção em um arquivo para o hook pegar
$gitDir = ".git"
$versionTypeFile = Join-Path $gitDir "GIT_VERSION_TYPE"

# Criar o arquivo com a opção
Set-Content -Path $versionTypeFile -Value $option -Encoding ASCII -NoNewline

Write-Host ""
Write-Host "=====================================" -ForegroundColor Green
Write-Host "✓ Configuração salva!" -ForegroundColor Green
Write-Host "✓ Tipo de alteração: $typeName" -ForegroundColor Green
Write-Host "=====================================" -ForegroundColor Green
Write-Host ""
Write-Host "Próximos passos:" -ForegroundColor Blue
Write-Host "1. Faça suas alterações no código"
Write-Host "2. Execute: git add ."
Write-Host "3. Execute: git commit -m 'sua mensagem'"
Write-Host ""
Write-Host "O hook post-commit irá automaticamente:" -ForegroundColor Cyan
Write-Host "  • Executar npm run $prepareScript"
Write-Host "  • Atualizar package.json com nova versão"
Write-Host "  • Criar tag no padrão [VERSION]-dev+[COMMIT]"
Write-Host "  • Fazer push das alterações e tags"
Write-Host ""

exit 0
