# 🤝 Guia de Contribuição

Obrigado por considerar contribuir com o FAQão! Este documento fornece diretrizes para contribuir com o projeto.

## 📋 Código de Conduta

- Seja respeitoso e profissional
- Aceite críticas construtivas
- Foque no que é melhor para a comunidade
- Mostre empatia com outros membros da comunidade

## 🚀 Como Contribuir

### Reportando Bugs

Antes de criar um issue, verifique se o bug já não foi reportado. Ao criar um issue, inclua:

- **Descrição clara** do problema
- **Passos para reproduzir** o comportamento
- **Comportamento esperado** vs **comportamento atual**
- **Screenshots** se aplicável
- **Ambiente** (navegador, versão do Apps Script, etc.)

### Sugerindo Melhorias

Issues de sugestão são bem-vindos! Inclua:

- **Descrição detalhada** da funcionalidade
- **Justificativa** - por que seria útil?
- **Exemplos** de uso, se possível

### Pull Requests

1. **Fork o repositório**
   ```bash
   git clone https://github.com/seu-usuario/FAQao.git
   ```

2. **Crie uma branch**
   ```bash
   git checkout -b feature/minha-feature
   # ou
   git checkout -b fix/meu-bug-fix
   ```

3. **Faça suas alterações**
   - Siga o estilo de código existente
   - Adicione comentários quando necessário
   - Teste suas alterações

4. **Commit suas mudanças**
   ```bash
   git commit -m "feat: adiciona nova funcionalidade X"
   # ou
   git commit -m "fix: corrige bug Y"
   ```

   **Convenção de commits:**
   - `feat:` - Nova funcionalidade
   - `fix:` - Correção de bug
   - `docs:` - Mudanças na documentação
   - `style:` - Formatação, ponto e vírgula, etc
   - `refactor:` - Refatoração de código
   - `test:` - Adição de testes
   - `chore:` - Manutenção

5. **Push para o GitHub**
   ```bash
   git push origin feature/minha-feature
   ```

6. **Abra um Pull Request**
   - Descreva suas mudanças claramente
   - Referencie issues relacionados
   - Aguarde review

## 🔍 Diretrizes de Código

### JavaScript/Apps Script

```javascript
// ✅ BOM
function calcularTotal(itens) {
  return itens.reduce((total, item) => total + item.valor, 0);
}

// ❌ EVITE
function calc(i) {
  var t = 0;
  for(var x=0;x<i.length;x++){t+=i[x].valor}
  return t;
}
```

**Boas práticas:**
- Use nomes descritivos para variáveis e funções
- Adicione comentários para lógica complexa
- Prefira `const` e `let` ao invés de `var`
- Mantenha funções pequenas e focadas
- Trate erros adequadamente com try/catch

### HTML/CSS

```html
<!-- ✅ BOM -->
<div class="card-container">
  <h2 class="card-title">Título</h2>
  <p class="card-description">Descrição</p>
</div>

<!-- ❌ EVITE -->
<div style="padding:10px;margin:5px">
  <h2 style="color:blue">Título</h2>
</div>
```

**Boas práticas:**
- Use classes CSS ao invés de estilos inline
- Mantenha HTML semântico
- Organize CSS de forma modular
- Use nomes de classes descritivos

## 🧪 Testes

Antes de submeter um PR:

1. **Teste localmente**
   ```bash
   clasp push
   clasp open
   ```

2. **Verifique:**
   - ✅ Todas as funcionalidades existentes ainda funcionam
   - ✅ Sua nova funcionalidade funciona como esperado
   - ✅ Não há erros no console
   - ✅ Interface está responsiva

3. **Teste em diferentes cenários:**
   - Como administrador
   - Como usuário comum
   - Com e sem dados

## 📚 Documentação

Ao adicionar novas funcionalidades:

- Atualize o `README.md` se necessário
- Adicione comentários no código
- Documente parâmetros de funções complexas
- Atualize o `guia-clasp.md` se houver mudanças no workflow

## 🔐 Segurança

> [!CAUTION]
> **NUNCA** commite informações sensíveis:

- ❌ Chaves de API
- ❌ IDs de planilhas/pastas
- ❌ Emails ou dados pessoais
- ❌ Credenciais de qualquer tipo

Use variáveis de exemplo:
```javascript
// ✅ BOM
const API_KEY = 'SUA_CHAVE_API_GEMINI';
const ID_PASTA = 'ID_DA_SUA_PASTA';

// ❌ NUNCA FAÇA ISSO
const API_KEY = 'AIzaSyBOY4hCFcR4_V4iwiGzy6cZ06cxVOaZg10';
```

## 📝 Checklist do Pull Request

Antes de submeter, verifique:

- [ ] Código segue as diretrizes do projeto
- [ ] Comentários foram adicionados onde necessário
- [ ] Documentação foi atualizada
- [ ] Mudanças foram testadas localmente
- [ ] Não há informações sensíveis no código
- [ ] Commit messages seguem a convenção
- [ ] Branch está atualizada com a main

## 🎯 Áreas para Contribuir

Algumas ideias de contribuição:

- 🐛 Correção de bugs
- ✨ Novas funcionalidades
- 📝 Melhorias na documentação
- 🎨 Melhorias na interface
- ⚡ Otimizações de performance
- 🧪 Adição de testes
- 🌐 Internacionalização
- ♿ Acessibilidade

## 💬 Dúvidas?

Se tiver dúvidas sobre como contribuir:

- Abra uma [issue](https://github.com/seu-usuario/FAQao/issues) com a tag `question`
- Entre em contato com os mantenedores

---

**Obrigado por contribuir! 🎉**
