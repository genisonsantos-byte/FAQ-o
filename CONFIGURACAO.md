# ⚙️ Configuração do FAQão

Este arquivo contém instruções para configurar o sistema antes do primeiro uso.

## 🔐 Variáveis Sensíveis

Você precisa configurar as seguintes informações no arquivo `Código.js`:

### 1. API Key do Gemini

**Localização:** Linha 25 do arquivo `Código.js`

```javascript
const API_KEY = 'SUA_CHAVE_API_GEMINI';
```

**Como obter:**
1. Acesse [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Clique em "Create API Key"
3. Copie a chave gerada (começa com `AIza...`)
4. Cole no código

### 2. ID da Pasta do Google Drive

**Localização:** Linha 26 do arquivo `Código.js`

```javascript
const ID_PASTA_DOCS = 'ID_DA_SUA_PASTA_DRIVE';
```

**Como obter:**
1. Abra a pasta no Google Drive que contém sua documentação
2. Copie o ID da URL (a parte após `/folders/`)
   - Exemplo: `https://drive.google.com/drive/folders/1q6JgG9bqaJjpxV1_5XV3pNwWtylyrIAA`
   - ID: `1q6JgG9bqaJjpxV1_5XV3pNwWtylyrIAA`
3. Cole no código

### 3. ID da Planilha (Banco de Dados)

**Localização:** Linha 113 do arquivo `Código.js`

```javascript
var idDaPlanilha = "ID_DA_SUA_PLANILHA";
```

**Como obter:**
1. Crie uma nova Google Sheets
2. Copie o ID da URL (a parte entre `/d/` e `/edit`)
   - Exemplo: `https://docs.google.com/spreadsheets/d/1ikR5w9dc5aIYlKyaU7k2XMEq3x6inmQz-eQM1RyaklM/edit`
   - ID: `1ikR5w9dc5aIYlKyaU7k2XMEq3x6inmQz-eQM1RyaklM`
3. Cole no código

## 📊 Configuração da Planilha

A planilha precisa ter a seguinte estrutura:

### Aba: Admins
Crie uma aba chamada `Admins` com os emails dos administradores:

| Email |
|-------|
| admin@exemplo.com |
| outro.admin@exemplo.com |

### Abas Automáticas
As seguintes abas serão criadas automaticamente pelo sistema:
- `ScriptsDB` - Armazena scripts de automação
- `BibliotecaDB` - Armazena tutoriais

## 🚀 Deploy

Após configurar todas as variáveis:

1. **Faça push do código**
   ```bash
   clasp push
   ```

2. **Abra o projeto**
   ```bash
   clasp open
   ```

3. **Configure o deploy**
   - Clique em **Implantar** > **Nova implantação**
   - Tipo: **Aplicativo da Web**
   - Executar como: **Eu**
   - Quem tem acesso: Escolha conforme sua necessidade
     - `Somente eu` - Apenas você
     - `Qualquer pessoa na organização` - Todos do domínio
     - `Qualquer pessoa` - Público

4. **Copie a URL do aplicativo web**

## 🔒 Segurança

> [!CAUTION]
> **IMPORTANTE:** Nunca compartilhe suas chaves de API ou IDs publicamente!

- ✅ Mantenha o arquivo `.gitignore` atualizado
- ✅ Revise o código antes de fazer commit
- ✅ Use variáveis de ambiente em produção
- ❌ Nunca commite `Código.js` com valores reais

## 📝 Checklist de Configuração

Antes de fazer o primeiro deploy:

- [ ] API Key do Gemini configurada
- [ ] ID da pasta do Drive configurada
- [ ] ID da planilha configurada
- [ ] Aba `Admins` criada na planilha
- [ ] Emails dos admins adicionados
- [ ] Código testado localmente
- [ ] Deploy realizado
- [ ] Permissões configuradas

## 🆘 Problemas Comuns

### Erro: "Não foi possível abrir a planilha"
- Verifique se o ID da planilha está correto
- Confirme que você tem permissão de edição na planilha

### Erro na API Gemini
- Verifique se a chave de API está correta e ativa
- Confirme que a API está habilitada no Google Cloud Console

### Permissão negada
- Verifique se seu email está na aba `Admins`
- Confirme que a aba existe e está escrita corretamente

## 📚 Próximos Passos

Após a configuração:
1. Acesse o aplicativo web
2. Adicione alguns scripts de exemplo
3. Crie tutoriais na biblioteca
4. Teste o chat com perguntas
5. Adicione documentação na pasta do Drive

---

Para mais informações, consulte o [README.md](README.md)
