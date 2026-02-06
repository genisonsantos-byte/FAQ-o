# 🔪 FAQão - Sistema de Suporte de TI Inteligente

![Google Apps Script](https://img.shields.io/badge/Google%20Apps%20Script-4285F4?style=for-the-badge&logo=google&logoColor=white)
![Gemini AI](https://img.shields.io/badge/Gemini%20AI-8E75B2?style=for-the-badge&logo=google&logoColor=white)
![License](https://img.shields.io/badge/license-MIT-green?style=for-the-badge)

Sistema web de suporte de TI que utiliza **Gemini AI** para responder dúvidas de analistas, integrando múltiplas fontes de conhecimento: scripts de automação, base de tutoriais e documentação do Google Drive.

## 📋 Índice

- [Características](#-características)
- [Tecnologias](#-tecnologias)
- [Estrutura do Projeto](#-estrutura-do-projeto)
- [Configuração](#-configuração)
- [Como Usar](#-como-usar)
- [Funcionalidades](#-funcionalidades)
- [Desenvolvimento Local](#-desenvolvimento-local)
- [Contribuindo](#-contribuindo)
- [Licença](#-licença)

## ✨ Características

- 🤖 **Chat Inteligente** - Integração com Gemini AI para respostas contextualizadas
- 📚 **Base de Conhecimento** - Biblioteca de tutoriais categorizados
- 💻 **Scripts de Automação** - Repositório de scripts CMD/PowerShell
- 📄 **Integração com Drive** - Leitura automática de documentação do Google Drive
- 🔐 **Sistema de Permissões** - Controle de acesso baseado em administradores
- 🎨 **Interface Moderna** - Design responsivo e intuitivo

## 🛠 Tecnologias

- **Backend**: Google Apps Script (JavaScript)
- **Frontend**: HTML5, CSS3, JavaScript
- **IA**: Google Gemini 2.5 Flash API
- **Armazenamento**: Google Sheets (banco de dados)
- **Documentação**: Google Drive

## 📁 Estrutura do Projeto

```
FAQao/
├── Código.js           # Backend principal (API e lógica de negócio)
├── Index.html          # Página principal
├── Home.html           # Tela inicial
├── Chat.html           # Interface do chat com IA
├── Scripts.html        # Gerenciamento de scripts
├── Biblioteca.html     # Gerenciamento de tutoriais
├── Templates.html      # Sistema de templates
├── Documentacao.html   # Documentação do sistema
├── CSS.html            # Estilos globais
├── appsscript.json     # Configuração do Apps Script
├── .clasp.json         # Configuração do Clasp CLI
└── guia-clasp.md       # Guia de uso do Clasp
```

## ⚙️ Configuração

### Pré-requisitos

- Conta Google Workspace
- Google Apps Script habilitado
- [Clasp CLI](https://github.com/google/clasp) instalado (opcional, para desenvolvimento local)

### Instalação

1. **Clone o repositório**
   ```bash
   git clone https://github.com/seu-usuario/FAQao.git
   cd FAQao
   ```

2. **Configure o Clasp** (opcional)
   ```bash
   npm install -g @google/clasp
   clasp login
   ```

3. **Crie um novo projeto Apps Script ou clone um existente**
   ```bash
   # Criar novo
   clasp create --title "FAQão" --type standalone
   
   # OU clonar existente
   clasp clone SEU_SCRIPT_ID
   ```

4. **Configure as variáveis no arquivo `Código.js`**
   
   > [!IMPORTANT]
   > Você precisa configurar as seguintes variáveis antes de usar o sistema:

   ```javascript
   // Linha 25: Sua chave da API Gemini
   const API_KEY = 'SUA_CHAVE_API_GEMINI';
   
   // Linha 26: ID da pasta do Google Drive com documentação
   const ID_PASTA_DOCS = 'ID_DA_SUA_PASTA_DRIVE';
   
   // Linha 113: ID da planilha que será usada como banco de dados
   var idDaPlanilha = "ID_DA_SUA_PLANILHA";
   ```

5. **Crie a planilha de banco de dados**
   - Crie uma nova Google Sheets
   - Adicione uma aba chamada `Admins` com os emails dos administradores
   - O sistema criará automaticamente as abas `ScriptsDB` e `BibliotecaDB`

6. **Faça o deploy**
   ```bash
   clasp push
   clasp deploy --description "Versão inicial"
   ```

7. **Configure as permissões**
   - Abra o projeto no Apps Script Editor
   - Vá em **Implantar** > **Nova implantação**
   - Escolha **Aplicativo da Web**
   - Configure o acesso conforme necessário

## 🚀 Como Usar

### Acesso ao Sistema

1. Acesse a URL do aplicativo web implantado
2. Navegue pelas seções:
   - **Home**: Visão geral do sistema
   - **Chat**: Faça perguntas à IA
   - **Scripts**: Consulte scripts de automação
   - **Biblioteca**: Acesse tutoriais
   - **Templates**: Modelos prontos

### Chat com IA

O chat integra três fontes de conhecimento:

1. **Scripts de Automação** - Comandos CMD/PowerShell
2. **Base de Conhecimento** - Tutoriais categorizados
3. **Documentação Drive** - Arquivos Google Docs

A IA retorna respostas organizadas por categoria com links relevantes.

### Gerenciamento (Admin)

Administradores podem:
- ✏️ Criar, editar e excluir scripts
- 📝 Criar, editar e excluir tutoriais
- 🔗 Adicionar links para arquivos externos

## 💻 Desenvolvimento Local

### Usando Clasp CLI

```bash
# Baixar alterações do servidor
clasp pull

# Editar arquivos localmente
# (use seu editor preferido)

# Enviar alterações
clasp push

# Assistir mudanças automaticamente
clasp push --watch

# Ver logs em tempo real
clasp logs --watch
```

### Estrutura de Dados

**ScriptsDB** (Google Sheets):
| Data | Titulo | Tipo | Descricao | Codigo | Autor | LinkArquivo |
|------|--------|------|-----------|--------|-------|-------------|

**BibliotecaDB** (Google Sheets):
| Data | Titulo | Categoria | Conteudo | Autor | LinkArquivo |
|------|--------|-----------|----------|-------|-------------|

**Admins** (Google Sheets):
| Email |
|-------|
| admin@exemplo.com |

## 🤝 Contribuindo

Contribuições são bem-vindas! Para contribuir:

1. Faça um fork do projeto
2. Crie uma branch para sua feature (`git checkout -b feature/MinhaFeature`)
3. Commit suas mudanças (`git commit -m 'Adiciona MinhaFeature'`)
4. Push para a branch (`git push origin feature/MinhaFeature`)
5. Abra um Pull Request

## 📄 Licença

Este projeto está sob a licença MIT. Veja o arquivo [LICENSE](LICENSE) para mais detalhes.

## 🔒 Segurança

> [!WARNING]
> **Nunca commite suas chaves de API ou IDs sensíveis no repositório!**

- Use o arquivo `.gitignore` para proteger informações sensíveis
- Considere usar [Google Secret Manager](https://cloud.google.com/secret-manager) para produção
- Revise as permissões de acesso ao aplicativo web

## 📞 Suporte

Para dúvidas ou problemas:
- Abra uma [issue](https://github.com/seu-usuario/FAQao/issues)
- Consulte a [documentação do Apps Script](https://developers.google.com/apps-script)
- Veja o [guia do Clasp](guia-clasp.md)

---

Desenvolvido com ❤️ para facilitar o suporte de TI
