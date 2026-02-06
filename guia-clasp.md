# Guia Completo: Clasp CLI para Google Apps Script

## O que é o Clasp?

O **Clasp** (Command Line Apps Script Projects) é a ferramenta oficial do Google para desenvolver projetos do Apps Script localmente no seu computador.

## Instalação

```bash
npm install -g @google/clasp
```

## Autenticação

### Login Inicial
```bash
clasp login
```
Isso abrirá seu navegador para autorizar o Clasp a acessar seus projetos.

### Verificar Status de Login
```bash
clasp login --status
```

### Logout
```bash
clasp logout
```

## Comandos Principais

### 📥 Clonar um Projeto Existente

```bash
clasp clone <SCRIPT_ID>
```

**Como encontrar o Script ID:**
1. Abra seu projeto no [Apps Script Editor](https://script.google.com)
2. Vá em **Configurações do Projeto** (ícone de engrenagem)
3. Copie o **Script ID** ou **ID do projeto**

**Exemplo:**
```bash
clasp clone 1a2b3c4d5e6f7g8h9i0j
```

### 📤 Enviar Alterações (Push)

Enviar código local para o Apps Script:
```bash
clasp push
```

**Opções úteis:**
- `clasp push --watch` - Envia automaticamente quando detecta alterações
- `clasp push --force` - Força o envio mesmo com conflitos

### 📥 Baixar Alterações (Pull)

Baixar código do Apps Script para local:
```bash
clasp pull
```

### 🆕 Criar Novo Projeto

```bash
clasp create --title "Nome do Projeto" --type standalone
```

**Tipos disponíveis:**
- `standalone` - Script independente
- `docs` - Vinculado ao Google Docs
- `sheets` - Vinculado ao Google Sheets
- `slides` - Vinculado ao Google Slides
- `forms` - Vinculado ao Google Forms

### 🌐 Abrir no Navegador

```bash
clasp open
```

Abre o projeto atual no editor web do Apps Script.

### 📋 Listar Projetos

```bash
clasp list
```

### 📊 Ver Informações do Projeto

```bash
clasp status
```

### 🚀 Deploy

```bash
clasp deploy
```

**Com descrição:**
```bash
clasp deploy --description "Versão 1.0"
```

**Listar deploys:**
```bash
clasp deployments
```

### 📝 Ver Logs

```bash
clasp logs
```

**Logs em tempo real:**
```bash
clasp logs --watch
```

## Estrutura de Arquivos

Após clonar um projeto, você terá:

### `.clasp.json`
Arquivo de configuração do Clasp:
```json
{
  "scriptId": "seu-script-id",
  "rootDir": "./src"
}
```

### `appsscript.json`
Manifesto do Apps Script com configurações do projeto:
```json
{
  "timeZone": "America/Sao_Paulo",
  "dependencies": {},
  "exceptionLogging": "STACKDRIVER"
}
```

### Arquivos de Código
- `.js` ou `.gs` - Arquivos de código JavaScript
- `.html` - Arquivos HTML para interfaces

## Workflow Típico

### 1. Clone do Projeto
```bash
# Criar pasta para o projeto
mkdir meu-projeto
cd meu-projeto

# Clonar
clasp clone <SCRIPT_ID>
```

### 2. Desenvolvimento Local
```bash
# Editar arquivos localmente com seu editor preferido
code .  # Abre no VS Code

# Enviar alterações
clasp push
```

### 3. Testar
```bash
# Abrir no navegador para testar
clasp open

# Ver logs
clasp logs --watch
```

### 4. Deploy
```bash
# Fazer deploy da versão
clasp deploy --description "Nova funcionalidade X"
```

## Dicas Úteis

### Ignorar Arquivos
Crie um `.claspignore` para ignorar arquivos no push:
```
node_modules/**
.git/**
README.md
```

### TypeScript
O Clasp suporta TypeScript nativamente:
```bash
# Criar projeto TypeScript
clasp create --type standalone --title "Projeto TS" --rootDir ./src
```

### Múltiplos Ambientes
Use diferentes arquivos `.clasp.json` para dev/prod:
```bash
# Desenvolvimento
clasp push --config .clasp.dev.json

# Produção
clasp push --config .clasp.prod.json
```

## Solução de Problemas

### Erro de Autenticação
```bash
clasp login --no-localhost
```

### Conflitos de Código
```bash
# Baixar versão remota
clasp pull

# Forçar envio local
clasp push --force
```

### Ver Versão
```bash
clasp --version
```

## Recursos Adicionais

- [Documentação Oficial](https://github.com/google/clasp)
- [Apps Script Reference](https://developers.google.com/apps-script/reference)
- [Guia de Início Rápido](https://developers.google.com/apps-script/guides/clasp)
