# koala-scrapping

Uma poderosa biblioteca de abstração do [Puppeteer](https://pptr.dev/) para automação de navegadores e web scraping. Fornece uma API simplificada e intuitiva para interagir com páginas web, extrair dados e automatizar tarefas de RPA (Robotic Process Automation).

## Características

- ✅ Abstração elegante do Puppeteer
- ✅ Suporte a navegação, cliques e preenchimento de formulários
- ✅ Extração de dados de tabelas com paginação automática
- ✅ Interação com frames e iframes
- ✅ Download de arquivos
- ✅ Captura de screenshots
- ✅ API intuitiva e fácil de usar
- ✅ Suporte a teclado (pressionar teclas com combinações)

## Instalação

```bash
npm install @koalarx/scrapping puppeteer
```

Ou com Bun:

```bash
bun install @koalarx/scrapping puppeteer
```

## Uso Básico

### 1. Inicializar o Browser

```typescript
import { Browser } from '@koalarx/scrapping'

const browser = new Browser({
  headless: false,        // true para modo headless
  slowMo: 100,           // delay em ms entre ações (útil para debug)
})

await browser.init()
const page = browser.page

// ... suas ações aqui ...

await browser.close()
```

### 2. Navegar para uma URL

```typescript
await page.goTo('https://example.com')
```

### 3. Interagir com Elementos

#### Clicar em um elemento

```typescript
await page.click('#button-id')
// ou
await page.click('button.submit-btn')
```

#### Preencher um campo de input

```typescript
await page.fill('#email-input', 'user@example.com')
await page.fill('#password-input', 'senha123')
```

#### Focar em um elemento

```typescript
await page.focus('#search-input')
```

#### Pressionar teclas

```typescript
// Pressionar uma tecla simples
await page.pressKey('Enter')

// Pressionar combinações de teclas (ex: Ctrl+A)
await page.pressKey('a', 'Control')
```

### 4. Extrair Conteúdo

```typescript
// Extrair texto de elementos
const paragrafos = await page.content('#content p')
console.log(paragrafos) // Array de strings
```

### 5. Capturar Screenshot

```typescript
await page.screenshot()
// Salva a screenshot em ./screenshots/ por padrão
```

## Casos de Uso Avançados

### Extração de Dados de Tabelas

A biblioteca pode extrair dados de tabelas HTML automaticamente, convertendo para objetos TypeScript tipados:

```typescript
interface DadosTabela {
  nome: string
  posicao: string
  departamento: string
  salario: number
}

const dados = await page.getDatatable<DadosTabela>('#tabela-exemplo')
console.log(dados[0].nome)  // TypeScript com autocompletar
```

**Com paginação automática:**

```typescript
const dados = await page.getDatatable<DadosTabela>('#example', {
  withPagination: {
    nextButtonSelector: '#btn-proxima'
  }
})
// Extrai todas as páginas automaticamente!
```

📝 **Exemplo prático:** Ver [get-datatable.spec.ts](lib/test/get-datatable.spec.ts)

### Download de Arquivos

```typescript
await page.goTo('https://exemplo.com/arquivos')
await page.click('a.download-link')

// Aguardar e obter os arquivos baixados
const arquivos = await page.getDownloadedFiles()
console.log(arquivos[0])  // Buffer do arquivo
```

📝 **Exemplo prático:** Ver [download-file.spec.ts](lib/test/download-file.spec.ts)

### Interação com Frames e iFrames

A biblioteca oferece suporte completo para trabalhar com frames e iframes:

#### Buscar frame por URL

```typescript
const frame = await page.getFrameByURL('https://example.com')
// O frame também possui todos os métodos da classe Page/DOM
await frame.click('a.link')
await frame.fill('#input', 'valor')
```

#### Buscar frame por nome ou ID

```typescript
const frame = await page.getFrameByName('iframe-principal')
await frame.fill('#search', 'Einstein')
await frame.pressKey('Enter')
```

**Exemplo completo:**

```typescript
await page.goTo('https://iframetester.com/?url=https://pt.wikipedia.org')

// Encontrar o frame pelo atributo name
const frame = await page.getFrameByName('iframe-window')

// Interagir dentro do frame como se fosse uma página normal
await frame.click('#search-button')
await frame.fill('#search-input', 'Einstein')
await frame.pressKey('Enter')

const conteudo = await frame.content('#resultado p')
console.log(conteudo)
```

📝 **Exemplo prático:** Ver [frame-interaction.spec.ts](lib/test/frame-interaction.spec.ts)

### Web Scraping Completo

Exemplo de busca e extração de dados do Wikipedia:

```typescript
await page.goTo('https://pt.wikipedia.org')

// Clicar no campo de busca
await page.click('#searchInput')

// Preencher com termo de busca
await page.fill(
  '#searchform > div > div > div.cdx-text-input #search-input',
  'Einstein'
)

// Pressionar Enter
await page.pressKey('Enter')

// Aguardar navegação
await page.waitNavigation()

// Extrair conteúdo
const conteudo = await page.content('#mw-content-text p')
console.log(conteudo)  // Array com paragrafos
```

📝 **Exemplo prático:** Ver [search-wikipidea.spec.ts](lib/test/search-wikipidea.spec.ts)

## Configuração Avançada

### Opções do Browser

```typescript
const browser = new Browser({
  headless: true,              // Modo headless (sem UI)
  slowMo: 0,                   // Delay entre ações em ms
  proxy: 'http://proxy:8080',  // Usar proxy
  minimalist: true,            // Bloquear CSS, fonts e imagens (mais rápido)
  downloadFolderPath: './meus-downloads'  // Pasta para downloads
})
```

### Opções do DOM

```typescript
const page = browser.page

// Customizar pasta de screenshots
page = new Page(puppeteerPage, {
  screenshotFolderPath: './meus-screenshots',
  downloadFolderPath: './meus-downloads'
})
```

## API Referência

### Classe Browser

| Método | Descrição |
|--------|-----------|
| `init()` | Inicializa o navegador |
| `close()` | Fecha o navegador |
| `get page` | Obtém a página ativa |

### Classe Page extend DOM

| Método | Descrição |
|--------|-----------|
| `getFrameByURL(url)` | Busca um frame pela URL |
| `getFrameByName(name)` | Busca um frame pelo name ou id |

### Classe DOM (base para Page e Frame)

| Método | Retorno | Descrição |
|--------|---------|-----------|
| `goTo(url)` | `void` | Navega para uma URL |
| `click(selector)` | `void` | Clica em um elemento |
| `fill(selector, value)` | `void` | Preenche um campo |
| `focus(selector)` | `void` | Foca em um elemento |
| `pressKey(key, combine?)` | `void` | Pressiona uma tecla |
| `content(selector)` | `string[]` | Extrai texto de elementos |
| `getDatatable<T>(selector, options?)` | `T[]` | Extrai dados de tabela |
| `getDownloadedFiles()` | `Buffer[]` | Obtém arquivos baixados |
| `screenshot()` | `void` | Captura screenshot |
| `waitNavigation()` | `void` | Aguarda navegação |
| `close()` | `void` | Fecha a página |

## Exemplos Completos

### Exemplo 1: Buscar e Extrair Dados

```typescript
import { Browser } from '@koalarx/scrapping'

const browser = new Browser({ headless: true })
await browser.init()
const page = browser.page

// Ir para o site
await page.goTo('https://datatables.net')

// Extrair tabela
interface Funcionario {
  name: string
  position: string
  office: string
  age: number
  startDate: string
  salary: number
}

const funcionarios = await page.getDatatable<Funcionario>('#example', {
  withPagination: {
    nextButtonSelector: '.next-button'
  }
})

console.log(funcionarios)

await browser.close()
```

### Exemplo 2: Login e Scraping

```typescript
const browser = new Browser({ headless: false })
await browser.init()
const page = browser.page

// Navegar ao site
await page.goTo('https://exemplo.com/login')

// Fazer login
await page.fill('#email', 'user@example.com')
await page.fill('#password', 'senha123')
await page.click('#btn-login')

// Aguardar redirecionamento
await new Promise(r => setTimeout(r, 2000))

// Extrair dados
const dados = await page.getDatatable('#dados-tabela')
console.log(dados)

// Screenshot do resultado
await page.screenshot()

await browser.close()
```

## Development

Para instalar dependências:

```bash
bun install
```

Para compilar:

```bash
bun run build
```

Para rodar os testes:

```bash
bun test
```

## Licença

Ver arquivo [LICENSE](LICENSE)
