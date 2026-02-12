#!/bin/bash

# Script para instalar os git hooks do projeto

REPO_ROOT=$(git rev-parse --show-toplevel)
HOOKS_DIR="$REPO_ROOT/scripts/hooks"
GIT_HOOKS_DIR="$REPO_ROOT/.git/hooks"

# Cores para output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}Instalando git hooks...${NC}"

# Instalar post-commit hook
if [ -f "$HOOKS_DIR/post-commit" ]; then
  cp "$HOOKS_DIR/post-commit" "$GIT_HOOKS_DIR/post-commit"
  chmod +x "$GIT_HOOKS_DIR/post-commit"
  echo -e "${GREEN}✓ post-commit hook instalado${NC}"
else
  echo "Erro: post-commit hook não encontrado em $HOOKS_DIR"
  exit 1
fi

# Instalar pre-commit hook
if [ -f "$HOOKS_DIR/pre-commit" ]; then
  cp "$HOOKS_DIR/pre-commit" "$GIT_HOOKS_DIR/pre-commit"
  chmod +x "$GIT_HOOKS_DIR/pre-commit"
  echo -e "${GREEN}✓ pre-commit hook instalado${NC}"
else
  echo -e "${YELLOW}⚠ pre-commit hook não encontrado em $HOOKS_DIR${NC}"
fi

# Instalar post-merge hook
if [ -f "$HOOKS_DIR/post-merge" ]; then
  cp "$HOOKS_DIR/post-merge" "$GIT_HOOKS_DIR/post-merge"
  chmod +x "$GIT_HOOKS_DIR/post-merge"
  echo -e "${GREEN}✓ post-merge hook instalado${NC}"
else
  echo -e "${YELLOW}⚠ post-merge hook não encontrado em $HOOKS_DIR${NC}"
fi

echo -e "${GREEN}✓ Todos os hooks foram instalados com sucesso!${NC}"
