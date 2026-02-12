#!/bin/bash

# Script para criar tags e versões manualmente na branch develop
# Uso: ./scripts/create-version-tag.sh

# Cores
BLUE='\033[0;34m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Verificar se estamos na branch develop
current_branch=$(git rev-parse --abbrev-ref HEAD)
if [ "$current_branch" != "develop" ]; then
  echo -e "${RED}Erro: Este script só funciona na branch 'develop'${NC}"
  echo "Branch atual: $current_branch"
  exit 1
fi

# Exibir menu
echo -e "${BLUE}=====================================${NC}"
echo -e "${BLUE}Gerenciador de Versão${NC}"
echo -e "${BLUE}=====================================${NC}"
echo ""
echo "Qual tipo de alteração você está realizando?"
echo ""
echo "1) hotfix  - Correção de bugs (patch)"
echo "2) feature - Nova funcionalidade (minor)"
echo "3) release - Release (major)"
echo "4) apenas enviar - Sem alterar versão"
echo ""

# Ler input do usuário
read -p "Selecione a opção (1/2/3): " option

# Validar entrada
case "$option" in
  1)
    prepare_script="prepare:hotfix"
    type_name="HOTFIX"
    ;;
  2)
    prepare_script="prepare:feature"
    type_name="FEATURE"
    ;;
  3)
    prepare_script="prepare:release"
    type_name="RELEASE"
    ;;
  4)
    prepare_script="prepare:only-tag"
    type_name="APENAS ENVIAR"
    ;;
  *)
    echo -e "${RED}Opção inválida!${NC}"
    exit 1
    ;;
esac

echo ""
echo -e "${GREEN}Tipo de alteração selecionado: $type_name${NC}"
echo ""
echo -e "${BLUE}Salvar configuração para próximo commit...${NC}"

# Salvar a opção em um arquivo para o hook pegar
git_dir=".git"
version_type_file="$git_dir/GIT_VERSION_TYPE"

# Criar o arquivo com a opção
echo -n "$option" > "$version_type_file"

echo ""
echo -e "${GREEN}=====================================${NC}"
echo -e "${GREEN}✓ Configuração salva!${NC}"
echo -e "${GREEN}✓ Tipo de alteração: $type_name${NC}"
echo -e "${GREEN}=====================================${NC}"
echo ""
echo -e "${BLUE}Próximos passos:${NC}"
echo "1. Faça suas alterações no código"
echo "2. Execute: git add ."
echo "3. Execute: git commit -m 'sua mensagem'"
echo ""
echo -e "${BLUE}O hook post-commit irá automaticamente:${NC}"
echo "  • Executar npm run $prepare_script"
echo "  • Atualizar package.json com nova versão"
echo "  • Criar tag no padrão [VERSION]-dev+[COMMIT]"
echo "  • Fazer push das alterações e tags"
echo ""

exit 0
