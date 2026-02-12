# Scripts de Versionamento Git

Este diretório contém scripts para gerenciamento automático de versões e tags Git, com **suporte completo para Windows e Linux**.

## 📁 Estrutura

```
scripts/
├── setup-hooks.sh          # Instalador para Linux/macOS
├── setup-hooks.ps1         # Instalador para Windows (PowerShell)
├── setup-hooks.bat         # Instalador para Windows (Batch)
├── version-dialog.sh       # Diálogo de seleção para Linux/macOS
├── version-dialog.ps1      # Diálogo de seleção para Windows
├── create-version-tag.sh   # Script manual para criar versões (Linux/macOS)
├── create-version-tag.ps1  # Script manual para criar versões (Windows)
└── hooks/
    ├── pre-commit          # Hook pre-commit (multiplataforma)
    ├── post-commit         # Hook post-commit (Linux/macOS)
    ├── post-commit.ps1     # Hook post-commit (Windows PowerShell)
    ├── post-commit.bat     # Hook post-commit (Windows Batch)
    ├── post-commit-windows.bat
    └── post-merge          # Hook post-merge (Linux/macOS)
```

## 🚀 Instalação Rápida

### Linux/macOS

```bash
bash scripts/setup-hooks.sh
```

### Windows

PowerShell (recomendado):
```powershell
.\scripts\setup-hooks.ps1
```

Ou Batch:
```batch
.\scripts\setup-hooks.bat
```

## 🐧 Recursos Linux

O sistema detecta automaticamente o ambiente Linux e fornece:

### 1. Interface Gráfica (Opcional)

Se você tem ambiente desktop, instale o Zenity para diálogos gráficos:

```bash
# Ubuntu/Debian
sudo apt install zenity

# Fedora/RHEL
sudo dnf install zenity

# Arch Linux
sudo pacman -S zenity
```

### 2. Fallback Inteligente

Se não houver interface gráfica, o sistema usa automaticamente:
- **whiptail** - Interface ncurses simples
- **dialog** - Interface ncurses alternativa  
- **prompt de texto** - Sempre funciona como último recurso

### 3. Detecção Automática

O script `version-dialog.sh` tenta interfaces nesta ordem:
1. Zenity (GUI)
2. Whiptail (TUI)
3. Dialog (TUI)
4. Terminal simples

## 🪟 Recursos Windows

No Windows, o sistema usa:
- **PowerShell com WinForms** - Interface gráfica nativa
- **Detecção de ambiente** - Usa Git Bash se disponível
- **Fallback para batch** - Compatibilidade máxima

## ⚙️ Como Funciona

### Fluxo Normal

1. Você faz um commit: `git commit -m "mensagem"`
2. O **pre-commit hook** detecta o sistema operacional
3. Em ambientes não-interativos (como VS Code):
   - **Linux:** Executa `version-dialog.sh`
   - **Windows:** Executa `version-dialog.ps1`
4. O diálogo pergunta o tipo de alteração (hotfix/feature/release)
5. O **post-commit hook** incrementa a versão e cria a tag
6. Push automático para o remote

### Branches

- **develop/main/master:** Cria tags automaticamente
- **Outras branches:** Apenas push, sem tags

## 🔧 Scripts Disponíveis

### `version-dialog.sh`

Diálogo de seleção de tipo de versão para Linux/macOS.

**Características:**
- Suporta Zenity (GTK), Whiptail, Dialog
- Fallback para terminal simples
- Calcula automaticamente próximas versões
- Interface amigável com cores

**Uso:**
```bash
bash scripts/version-dialog.sh [git-dir]
```

### `setup-hooks.sh`

Instala os hooks Git no repositório local (Linux/macOS).

**Características:**
- Copia hooks para `.git/hooks/`
- Define permissões executáveis automaticamente
- Feedback colorido de progresso

**Uso:**
```bash
bash scripts/setup-hooks.sh
```

### `create-version-tag.sh`

Cria versões e tags manualmente (Linux/macOS).

**Características:**
- Menu interativo no terminal
- Valida branch (apenas develop)
- Opções: hotfix, feature, release
- Commit e push automáticos

**Uso:**
```bash
bash scripts/create-version-tag.sh
```

## 🐞 Troubleshooting

### Linux: "Comando não encontrado"

```bash
chmod +x scripts/*.sh
chmod +x .git/hooks/post-commit .git/hooks/pre-commit .git/hooks/post-merge
```

### Linux: "Diálogo não aparece"

Instale uma das ferramentas de diálogo:
```bash
sudo apt install zenity whiptail dialog
```

### Windows: "Não foi possível executar"

Execute o PowerShell como administrador ou use Git Bash.

### Todos: "Hook não executa"

1. Verifique se está na branch `develop`
2. Reinstale os hooks: `bash scripts/setup-hooks.sh`
3. Verifique permissões: `ls -la .git/hooks/`

## 📝 Desenvolvimento

### Adicionar Suporte para Novo OS

1. Crie os scripts específicos:
   - `version-dialog.[extensão]`
   - `setup-hooks.[extensão]`
   
2. Atualize `hooks/pre-commit` para detectar o novo OS:
   ```bash
   if [[ "$OSTYPE" == "seu-os" ]]; then
     # lógica específica
   fi
   ```

3. Teste em ambiente real

4. Documente neste README

## 📚 Documentação Completa

Veja [GIT_HOOKS.md](../GIT_HOOKS.md) para documentação completa do sistema de versionamento.

## 🎯 Contribuindo

1. Mantenha compatibilidade entre plataformas
2. Teste em Windows E Linux
3. Use padrões POSIX quando possível
4. Documente mudanças de comportamento
5. Adicione permissões executáveis aos scripts shell

---

**Suporte:** Windows 10/11, Linux (todas distribuições), macOS 10.15+
