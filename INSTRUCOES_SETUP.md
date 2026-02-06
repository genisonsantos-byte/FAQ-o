# 🛠️ Configuração de Variáveis de Ambiente

Para garantir a segurança do seu projeto, usamos **Script Properties** para guardar chaves de API e IDs. Siga estes passos para configurar o ambiente no Google Apps Script.

## 1. Envie os arquivos para o servidor

Execute o comando no terminal para enviar as alterações e o script de configuração:

```bash
clasp push
```

## 2. Execute o Setup

1. Abra o projeto no navegador:
   ```bash
   clasp open
   ```
2. No editor do Apps Script, abra o arquivo `SetupConfig.gs` (ou `.js`).
3. Selecione a função `setupEnvironmentVariables` na barra de ferramentas superior.
4. Clique em **Executar**.

![Executar Setup](https://developers.google.com/static/apps-script/images/guides/clasp/clasp-run.png)

> ✅ **Pronto!** Suas chaves estão salvas de forma segura no cofre do projeto.

---

## 3. (Opcional) Limpeza

Após executar, você pode excluir o arquivo `SetupConfig.js` do servidor se desejar, mas ele está seguro localmente pois foi adicionado ao `.gitignore`.

## 🔒 Segurança

O arquivo `SetupConfig.js` contém suas chaves reais, por isso ele foi adicionado ao `.gitignore` e **NÃO** será enviado ao GitHub. Ele existe apenas no seu computador e no projeto do Apps Script (após o push).
