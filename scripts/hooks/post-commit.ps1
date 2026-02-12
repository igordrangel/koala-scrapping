# Hook post-commit para gerenciar versões e criar tags automáticas na branch develop
# Pergunta o tipo de alteração (hotfix, feature, release) e executa o comando prepare correspondente

# Obter a branch atual
$currentBranch = git rev-parse --abbrev-ref HEAD

# Verificar se estamos na branch develop
if ($currentBranch -eq "develop") {
    $repoRoot = git rev-parse --show-toplevel
    
    # Verificar se está em um ambiente interativo
    $isInteractive = [Environment]::UserInteractive -and -not [Environment]::GetEnvironmentVariable('TERM_PROGRAM') -eq 'vscode'
    
    if ($isInteractive) {
        # Terminal interativo - pedir input do usuário
        Write-Host "=====================================" -ForegroundColor Blue
        Write-Host "Gerenciador de Versão" -ForegroundColor Blue
        Write-Host "=====================================" -ForegroundColor Blue
        Write-Host ""
        Write-Host "Qual tipo de alteração você está realizando?"
        Write-Host ""
        Write-Host "1) hotfix  - Correção de bugs (patch)"
        Write-Host "2) feature - Nova funcionalidade (minor)"
        Write-Host "3) release - Release (major)"
        Write-Host ""
        
        # Ler input do usuário
        $option = Read-Host "Selecione a opção (1/2/3)"
    } else {
        # Não é terminal interativo - usar padrão
        $option = "2"
        Write-Host "[AVISO] Ambiente não interativo detectado. Usando padrão: feature" -ForegroundColor Yellow
    }
    
    switch ($option) {
        "1" {
            $prepareScript = "prepare:hotfix"
            $typeName = "HOTFIX"
            break
        }
        "2" {
            $prepareScript = "prepare:feature"
            $typeName = "FEATURE"
            break
        }
        "3" {
            $prepareScript = "prepare:release"
            $typeName = "RELEASE"
            break
        }
        "4" {
            $prepareScript = "prepare:only-tag"
            $typeName = "APENAS ENVIAR"
            break
        }
        default {
            Write-Host "Opção inválida. Usando padrão (feature)" -ForegroundColor Yellow
            $prepareScript = "prepare:feature"
            $typeName = "FEATURE"
        }
    }
    
    Write-Host ""
    Write-Host "Executando: bun run $prepareScript" -ForegroundColor Blue
    
    # Executar o script prepare correspondente
    Push-Location $repoRoot
    bun run $prepareScript 2>&1 | Where-Object { $_ -notmatch "bun notice" }
    
    if ($LASTEXITCODE -eq 0) {
        # Obter a nova versão do package.json
        $packageJson = Get-Content "$repoRoot\package.json" -Raw | ConvertFrom-Json
        $newVersion = $packageJson.version
        
        # Obter o hash do commit (abreviado em 7 caracteres)
        $commitId = git rev-parse --short HEAD
        
        # Criar a tag com a versão e tipo de alteração
        $tagName = "$newVersion-dev+$commitId"
        
        # Criar a tag
        git tag $tagName
        
        # Exibir mensagem de sucesso
        Write-Host ""
        Write-Host "=====================================" -ForegroundColor Green
        Write-Host "✓ Versão atualizada para: $newVersion" -ForegroundColor Green
        Write-Host "✓ Tipo de alteração: $typeName" -ForegroundColor Green
        Write-Host "✓ Tag criada: $tagName" -ForegroundColor Green
        Write-Host "=====================================" -ForegroundColor Green
    }
    else {
        Write-Host "Erro ao executar o script prepare" -ForegroundColor Yellow
        Pop-Location
        exit 1
    }
    
    Pop-Location
}

exit 0
