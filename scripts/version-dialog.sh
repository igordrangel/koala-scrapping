#!/bin/bash
# Script para selecionar tipo de versão com interface gráfica (ou fallback para texto)
# Uso: ./version-dialog.sh [caminho-do-git-dir]

GIT_DIR="${1:-.git}"

# Converter para caminho absoluto
if [[ ! "$GIT_DIR" = /* ]]; then
    GIT_DIR="$(pwd)/$GIT_DIR"
fi

# Ler versão atual do package.json
PACKAGE_JSON_PATH="$(pwd)/package.json"
CURRENT_VERSION="1.1.15"
if [ -f "$PACKAGE_JSON_PATH" ]; then
    CURRENT_VERSION=$(grep -m 1 '"version"' "$PACKAGE_JSON_PATH" | cut -d'"' -f4)
fi

# Calcular próximas versões
IFS='.' read -r -a version_parts <<< "$CURRENT_VERSION"
major="${version_parts[0]}"
minor="${version_parts[1]}"
patch="${version_parts[2]}"

hotfix_version="$major.$minor.$((patch + 1))"
feature_version="$major.$((minor + 1)).0"
release_version="$((major + 1)).0.0"

# Função para tentar usar zenity (interface gráfica moderna)
try_zenity() {
    if ! command -v zenity &> /dev/null; then
        return 1
    fi

    local choice=$(zenity --list \
        --title="Gerenciador de Versão" \
        --text="Qual tipo de alteração você está realizando?\n\nVersão atual: <b>$CURRENT_VERSION</b>" \
        --radiolist \
        --column="Sel" --column="Código" --column="Tipo" --column="Nova Versão" --column="Descrição" \
        --width=600 --height=350 \
        TRUE 1 "hotfix" "$hotfix_version" "Correção de bugs (patch)" \
        FALSE 2 "feature" "$feature_version" "Nova funcionalidade (minor)" \
        FALSE 3 "release" "$release_version" "Release (major)" \
        FALSE 4 "apenas enviar" "$CURRENT_VERSION" "Sem alterar versão" 2>/dev/null)
    
    if [ $? -ne 0 ]; then
        return 1
    fi
    
    echo "$choice" > "$GIT_DIR/GIT_VERSION_TYPE"
    return 0
}

# Função para tentar usar whiptail (interface texto em ncurses)
try_whiptail() {
    if ! command -v whiptail &> /dev/null; then
        return 1
    fi

    local choice=$(whiptail --title "Gerenciador de Versão" \
        --radiolist "Qual tipo de alteração?\n\nVersão atual: $CURRENT_VERSION" 20 78 4 \
        "1" "hotfix  - $hotfix_version (patch)" ON \
        "2" "feature - $feature_version (minor)" OFF \
        "3" "release - $release_version (major)" OFF \
        "4" "apenas enviar - $CURRENT_VERSION (sem alterar)" OFF \
        3>&1 1>&2 2>&3)
    
    if [ $? -ne 0 ]; then
        return 1
    fi
    
    echo "$choice" > "$GIT_DIR/GIT_VERSION_TYPE"
    return 0
}

# Função para tentar usar dialog (interface texto em ncurses)
try_dialog() {
    if ! command -v dialog &> /dev/null; then
        return 1
    fi

    local choice=$(dialog --stdout --title "Gerenciador de Versão" \
        --radiolist "Qual tipo de alteração?\n\nVersão atual: $CURRENT_VERSION" 20 70 4 \
        1 "hotfix  - $hotfix_version (patch)" on \
        2 "feature - $feature_version (minor)" off \
        3 "release - $release_version (major)" off \
        4 "apenas enviar - $CURRENT_VERSION (sem alterar)" off)
    
    if [ $? -ne 0 ]; then
        return 1
    fi
    
    echo "$choice" > "$GIT_DIR/GIT_VERSION_TYPE"
    return 0
}

# Função fallback para terminal simples
use_terminal_prompt() {
    echo "======================================"
    echo "Gerenciador de Versão"
    echo "======================================"
    echo ""
    echo "Versão atual: $CURRENT_VERSION"
    echo ""
    echo "Qual tipo de alteração você está realizando?"
    echo ""
    echo "1) hotfix  - $hotfix_version (Correção de bugs - patch)"
    echo "2) feature - $feature_version (Nova funcionalidade - minor)"
    echo "3) release - $release_version (Release - major)"
    echo "4) apenas enviar - $CURRENT_VERSION (Sem alterar versão)"
    echo ""
    
    read -p "Selecione a opção (1-4, padrão=4): " choice
    choice=${choice:-4}
    
    case "$choice" in
        1|2|3|4)
            echo "$choice" > "$GIT_DIR/GIT_VERSION_TYPE"
            return 0
            ;;
        *)
            echo "Opção inválida. Usando padrão (4)."
            echo "4" > "$GIT_DIR/GIT_VERSION_TYPE"
            return 1
            ;;
    esac
}

# Tentar interfaces na ordem: zenity (GUI) > whiptail > dialog > terminal simples
if try_zenity; then
    exit 0
elif try_whiptail; then
    exit 0
elif try_dialog; then
    exit 0
else
    use_terminal_prompt
    exit $?
fi
