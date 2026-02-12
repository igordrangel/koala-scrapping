#!/bin/bash
# Script de teste para validar a instalação dos hooks no Linux

# Cores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}================================================${NC}"
echo -e "${BLUE}  Teste de Hooks Git - Suporte Linux${NC}"
echo -e "${BLUE}================================================${NC}"
echo ""

# Função para checar se um comando existe
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Variáveis de status
all_ok=true

# 1. Verificar se estamos em um repositório Git
echo -n "1. Verificando repositório Git... "
if git rev-parse --git-dir > /dev/null 2>&1; then
    echo -e "${GREEN}✓${NC}"
else
    echo -e "${RED}✗${NC}"
    echo -e "${RED}   Erro: Não está em um repositório Git${NC}"
    all_ok=false
fi

# 2. Verificar scripts principais
echo -n "2. Verificando scripts principais... "
missing_scripts=()
for script in "scripts/setup-hooks.sh" "scripts/version-dialog.sh" "scripts/create-version-tag.sh"; do
    if [ ! -f "$script" ]; then
        missing_scripts+=("$script")
    fi
done

if [ ${#missing_scripts[@]} -eq 0 ]; then
    echo -e "${GREEN}✓${NC}"
else
    echo -e "${RED}✗${NC}"
    echo -e "${RED}   Scripts faltando: ${missing_scripts[*]}${NC}"
    all_ok=false
fi

# 3. Verificar permissões executáveis
echo -n "3. Verificando permissões executáveis... "
non_executable=()
for script in "scripts/setup-hooks.sh" "scripts/version-dialog.sh" "scripts/create-version-tag.sh"; do
    if [ -f "$script" ] && [ ! -x "$script" ]; then
        non_executable+=("$script")
    fi
done

if [ ${#non_executable[@]} -eq 0 ]; then
    echo -e "${GREEN}✓${NC}"
else
    echo -e "${YELLOW}⚠${NC}"
    echo -e "${YELLOW}   Scripts sem permissão executável: ${non_executable[*]}${NC}"
    echo -e "${YELLOW}   Execute: chmod +x ${non_executable[*]}${NC}"
fi

# 4. Verificar hooks nos scripts/hooks/
echo -n "4. Verificando hooks de origem... "
missing_hooks=()
for hook in "scripts/hooks/pre-commit" "scripts/hooks/post-commit" "scripts/hooks/post-merge"; do
    if [ ! -f "$hook" ]; then
        missing_hooks+=("$hook")
    fi
done

if [ ${#missing_hooks[@]} -eq 0 ]; then
    echo -e "${GREEN}✓${NC}"
else
    echo -e "${RED}✗${NC}"
    echo -e "${RED}   Hooks faltando: ${missing_hooks[*]}${NC}"
    all_ok=false
fi

# 5. Verificar hooks instalados em .git/hooks/
echo -n "5. Verificando hooks instalados... "
if [ -d ".git/hooks" ]; then
    installed=0
    for hook in "pre-commit" "post-commit" "post-merge"; do
        if [ -f ".git/hooks/$hook" ]; then
            ((installed++))
        fi
    done
    
    if [ $installed -eq 3 ]; then
        echo -e "${GREEN}✓ (todos instalados)${NC}"
    elif [ $installed -gt 0 ]; then
        echo -e "${YELLOW}⚠ ($installed de 3 instalados)${NC}"
        echo -e "${YELLOW}   Execute: bash scripts/setup-hooks.sh${NC}"
    else
        echo -e "${RED}✗ (nenhum instalado)${NC}"
        echo -e "${RED}   Execute: bash scripts/setup-hooks.sh${NC}"
    fi
else
    echo -e "${RED}✗${NC}"
    echo -e "${RED}   Diretório .git/hooks não encontrado${NC}"
    all_ok=false
fi

# 6. Verificar ferramentas de diálogo disponíveis
echo ""
echo -e "${BLUE}Ferramentas de interface disponíveis:${NC}"

if command_exists zenity; then
    echo -e "  ${GREEN}✓${NC} zenity (interface gráfica GTK)"
else
    echo -e "  ${YELLOW}✗${NC} zenity (recomendado)"
    echo -e "    ${YELLOW}Instale: sudo apt install zenity${NC}"
fi

if command_exists whiptail; then
    echo -e "  ${GREEN}✓${NC} whiptail (interface ncurses)"
else
    echo -e "  ${YELLOW}✗${NC} whiptail"
fi

if command_exists dialog; then
    echo -e "  ${GREEN}✓${NC} dialog (interface ncurses)"
else
    echo -e "  ${YELLOW}✗${NC} dialog"
fi

echo -e "  ${GREEN}✓${NC} terminal simples (fallback sempre disponível)"

# 7. Verificar variáveis de ambiente importantes
echo ""
echo -e "${BLUE}Ambiente:${NC}"
echo "  Sistema: $(uname -s)"
echo "  Arquitetura: $(uname -m)"

if [ -n "$DISPLAY" ]; then
    echo -e "  Display: ${GREEN}$DISPLAY${NC} (interface gráfica disponível)"
else
    echo -e "  Display: ${YELLOW}não configurado${NC} (usará interface de terminal)"
fi

# 8. Verificar branch atual
echo ""
current_branch=$(git rev-parse --abbrev-ref HEAD 2>/dev/null)
if [ "$current_branch" = "develop" ]; then
    echo -e "${GREEN}✓${NC} Branch atual: ${GREEN}develop${NC} (hooks ativos)"
else
    echo -e "${YELLOW}⚠${NC} Branch atual: ${YELLOW}$current_branch${NC}"
    echo -e "  ${YELLOW}(hooks só criam tags na branch develop)${NC}"
fi

# Resumo final
echo ""
echo -e "${BLUE}================================================${NC}"
if [ "$all_ok" = true ]; then
    echo -e "${GREEN}✓ Sistema de hooks está OK!${NC}"
    echo ""
    echo -e "${BLUE}Próximos passos:${NC}"
    echo "  1. Se ainda não instalou: bash scripts/setup-hooks.sh"
    echo "  2. Faça um commit para testar: git commit -m 'teste'"
    echo "  3. Escolha o tipo de versão no diálogo"
else
    echo -e "${RED}✗ Alguns problemas encontrados${NC}"
    echo -e "${YELLOW}Execute: bash scripts/setup-hooks.sh${NC}"
fi
echo -e "${BLUE}================================================${NC}"
