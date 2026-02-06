// 1. Backend do Site (Atualizado para permitir templates)
function doGet() {
      
  var linkIcone = 'https://cdnjs.cloudflare.com/ajax/libs/twemoji/14.0.2/72x72/1f52a.png';

  return HtmlService.createTemplateFromFile('Index') // Note que mudou de createHtmlOutput para createTemplate
      .evaluate()
      .setTitle('FAQão')
      .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL)
      .addMetaTag('viewport', 'width=device-width, initial-scale=1')
      .setFaviconUrl(linkIcone);
}

// Função mágica que permite importar outros arquivos HTML
function include(filename) {
  return HtmlService.createHtmlOutputFromFile(filename).getContent();
}

// 2. Função Principal
function perguntarAoGemini(perguntaUsuario) {
  // ======================================================
  // ÁREA DE CONFIGURAÇÃO
  // ======================================================
  
  // IMPORTANTE: Configure sua chave de API do Gemini aqui
  // Obtenha em: https://makersuite.google.com/app/apikey
  const API_KEY = 'SUA_CHAVE_API_GEMINI'; 
  
  // IMPORTANTE: Configure o ID da pasta do Google Drive com sua documentação
  // Copie o ID da URL da pasta (a parte após /folders/)
  const ID_PASTA_DOCS = 'ID_DA_SUA_PASTA_DRIVE';

  // ======================================================

  const URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${API_KEY}`;

  try {
    // 1. LER DOCS DO DRIVE
    let contextoDocs = "";
    if (ID_PASTA_DOCS) {
      const docsLidos = lerDocsDaPasta(ID_PASTA_DOCS);
      if (!docsLidos.startsWith("Erro") && !docsLidos.startsWith("AVISO")) {
        contextoDocs = docsLidos;
      }
    }

    // 2. LER SCRIPTS (Formatado para IA)
    const listaScripts = listarScripts();
    let contextoScripts = "\n\n--- FONTE: SCRIPTS DE AUTOMAÇÃO (CMD/POWERSHELL) ---\n";
    if (listaScripts.length > 0) {
      listaScripts.forEach(s => {
        const linkStr = s.link ? ` [Link: ${s.link}]` : "";
        contextoScripts += `Item: ${s.titulo} | Tipo: ${s.tipo}\nO que faz: ${s.descricao}\nComando: ${s.codigo}${linkStr}\n---\n`;
      });
    }

    // 3. LER TUTORIAIS (Formatado para IA)
    const listaTutoriais = listarTutoriais();
    let contextoTutoriais = "\n\n--- FONTE: BASE DE CONHECIMENTO (TUTORIAIS) ---\n";
    if (listaTutoriais.length > 0) {
      listaTutoriais.forEach(t => {
        const linkStr = t.link ? ` [Link Anexo: ${t.link}]` : "";
        contextoTutoriais += `Item: ${t.titulo} | Categoria: ${t.categoria}\nResumo: ${t.conteudo}${linkStr}\n---\n`;
      });
    }

    // 4. JUNTAR TUDO
    const contextoFinal = contextoDocs + contextoScripts + contextoTutoriais;

    // 5. O PULO DO GATO: O PROMPT "AGREGADOR"
    const promptSistema = `
    Você é o Agente Central de Suporte de TI.
    Sua missão é varrer as bases de dados abaixo e encontrar TODAS as soluções possíveis para a dúvida do usuário.

    REGRAS OBRIGATÓRIAS DE RESPOSTA:
    1.  **NÃO se limite a uma única resposta.** Se houver um Script E um Tutorial sobre o tema, LISTE OS DOIS.
    2.  **Organize a resposta** claramente usando estes emojis e seções se encontrar conteúdo nelas:
        * 💻 **Opção de Script:** (Se houver script útil) - Dê o nome e o comando.
        * 📚 **Na Base de Conhecimento:** (Se houver tutorial) - Dê o título e o resumo.
        * 📄 **Documentação Oficial:** (Se houver no Drive) - Resuma o documento.
    3.  **Links:** Se o dado tiver link (Link Anexo ou Link Download), você é OBRIGADO a mostrá-lo.
    4.  Se não encontrar nada exato, sugira o item mais próximo.

    --- DADOS DISPONÍVEIS ---
    ${contextoFinal}
    --- FIM DOS DADOS ---

    PERGUNTA DO USUÁRIO: ${perguntaUsuario}
    `;

    const payload = {
      "contents": [{ "parts": [{ "text": promptSistema }] }]
    };

    const options = {
      "method": "post",
      "contentType": "application/json",
      "payload": JSON.stringify(payload),
      "muteHttpExceptions": true
    };

    const response = UrlFetchApp.fetch(URL, options);
    const json = JSON.parse(response.getContentText());

    if (json.error) return "Erro na API Gemini: " + json.error.message;
    if (!json.candidates) return "Não encontrei informações sobre isso nas bases (Scripts, Tutoriais ou Docs).";

    return json.candidates[0].content.parts[0].text;

  } catch (e) {
    return "Erro Crítico: " + e.toString();
  }
}

// 3. Função de Leitura do Drive (Blindada)
function abrirPlanilhaDB() {
  // IMPORTANTE: Configure o ID da sua planilha aqui
  // Copie o ID da URL da planilha (a parte entre /d/ e /edit)
  var idDaPlanilha = "ID_DA_SUA_PLANILHA"; 
  // ------------------------
  
  try {
    return SpreadsheetApp.openById(idDaPlanilha);
  } catch(e) {
    throw new Error("ERRO CRÍTICO: Não foi possível abrir a planilha pelo ID: " + idDaPlanilha);
  }
}

function getUsuarioAtual() {
  return Session.getActiveUser().getEmail();
}

// Verifica Admin na aba 'Admins'
function verificarPermissaoAdmin() {
  const emailUsuario = Session.getActiveUser().getEmail();
  if (!emailUsuario) return false; 

  const ss = abrirPlanilhaDB(); 
  const sheet = ss.getSheetByName('Admins');
  
  // Se não tiver aba Admins, ninguém é admin (segurança)
  if (!sheet) return false; 

  const admins = sheet.getDataRange().getValues().flat(); 
  return admins.includes(emailUsuario);
}

// --- MÓDULO SCRIPTS ---

function salvarScript(dados) {
  if (!verificarPermissaoAdmin()) throw new Error("Permissão negada.");
  const ss = abrirPlanilhaDB();
  let sheet = ss.getSheetByName('ScriptsDB');
  
  if (!sheet) {
    sheet = ss.insertSheet('ScriptsDB');
    sheet.appendRow(['Data', 'Titulo', 'Tipo', 'Descricao', 'Codigo', 'Autor', 'LinkArquivo']);
  }
  
  sheet.appendRow([
    new Date(), dados.titulo, dados.tipo, dados.descricao, dados.codigo, Session.getActiveUser().getEmail(), dados.link
  ]);
  return "Criado com sucesso";
}

function editarScript(dados) {
  if (!verificarPermissaoAdmin()) throw new Error("Permissão negada.");
  const ss = abrirPlanilhaDB();
  const sheet = ss.getSheetByName('ScriptsDB');
  
  // O ID é o número da linha na planilha
  const linha = parseInt(dados.id);
  
  // Atualiza as colunas B até G (Titulo, Tipo, Descricao, Codigo, Autor, Link)
  // Nota: Não mudamos a Data (coluna A) para manter o histórico, ou você pode mudar se quiser.
  sheet.getRange(linha, 2, 1, 6).setValues([[
    dados.titulo, 
    dados.tipo, 
    dados.descricao, 
    dados.codigo, 
    Session.getActiveUser().getEmail(), // Atualiza quem editou por último
    dados.link
  ]]);
  
  return "Editado com sucesso";
}

function listarScripts() {
  const ss = abrirPlanilhaDB();
  const sheet = ss.getSheetByName('ScriptsDB');
  if (!sheet || sheet.getLastRow() <= 1) return [];

  const dados = sheet.getRange(2, 1, sheet.getLastRow() - 1, 7).getValues();
  
  return dados.map((linha, index) => ({
    id: index + 2, // O ID é o índice + 2 (conta cabeçalho)
    titulo: linha[1],
    tipo: linha[2],
    descricao: linha[3],
    codigo: linha[4],
    autor: linha[5],
    link: linha[6]
  })).reverse();
}

// --- MÓDULO BIBLIOTECA (TUTORIAIS) ---

function salvarTutorial(dados) {
  if (!verificarPermissaoAdmin()) throw new Error("Permissão negada.");
  const ss = abrirPlanilhaDB();
  let sheet = ss.getSheetByName('BibliotecaDB');
  
  if (!sheet) {
    sheet = ss.insertSheet('BibliotecaDB');
    sheet.appendRow(['Data', 'Titulo', 'Categoria', 'Conteudo', 'Autor', 'LinkArquivo']);
  }

  sheet.appendRow([
    new Date(), dados.titulo, dados.categoria, dados.conteudo, Session.getActiveUser().getEmail(), dados.link
  ]);
  return "Criado com sucesso";
}

function editarTutorial(dados) {
  if (!verificarPermissaoAdmin()) throw new Error("Permissão negada.");
  const ss = abrirPlanilhaDB();
  const sheet = ss.getSheetByName('BibliotecaDB');
  
  const linha = parseInt(dados.id);
  
  // Atualiza colunas B até F
  sheet.getRange(linha, 2, 1, 5).setValues([[
    dados.titulo, 
    dados.categoria, 
    dados.conteudo, 
    Session.getActiveUser().getEmail(),
    dados.link
  ]]);
  
  return "Editado com sucesso";
}

function listarTutoriais() {
  const ss = abrirPlanilhaDB();
  var sheet = ss.getSheetByName('BibliotecaDB');
  if (!sheet) return [];
  
  var lastRow = sheet.getLastRow();
  if (lastRow <= 1) return [];

  var dados = sheet.getRange(2, 1, lastRow - 1, 6).getValues();
  
  return dados.map(function(linha, index) {
    var dataFormatada = "";
    try {
      if (linha[0] instanceof Date) {
        dataFormatada = Utilities.formatDate(linha[0], Session.getScriptTimeZone(), "dd/MM/yyyy");
      } else {
        dataFormatada = String(linha[0]);
      }
    } catch (ex) { dataFormatada = "--/--/----"; }

    return {
      id: index + 2, // ID da Linha
      data: dataFormatada,
      titulo: linha[1],
      categoria: linha[2],
      conteudo: linha[3],
      autor: linha[4],
      link: linha[5] || ""
    };
  }).reverse();
}

function lerDocsDaPasta(folderId) {
  try {
    var folder = DriveApp.getFolderById(folderId);
    var files = folder.getFiles();
    var textoAcumulado = "";
    var contagemArquivos = 0;

    while (files.hasNext()) {
      var file = files.next();
      
      // Verifica se é um Google Doc (somente Docs têm texto legível fácil)
      if (file.getMimeType() === MimeType.GOOGLE_DOCS) {
        var doc = DocumentApp.openById(file.getId());
        var body = doc.getBody().getText();
        
        // Adiciona o título e o conteúdo ao contexto
        textoAcumulado += "\n--- ARQUIVO: " + file.getName() + " ---\n";
        textoAcumulado += body + "\n";
        contagemArquivos++;
      }
    }

    if (contagemArquivos === 0) {
      return "AVISO: Nenhum arquivo Google Doc encontrado na pasta. O sistema só lê arquivos de texto nativos do Google.";
    }

    return textoAcumulado;

  } catch (e) {
    return "Erro ao ler a pasta do Drive: " + e.toString();
  }
}

// ======================================================
// FUNÇÕES DE EXCLUSÃO
// ======================================================

function excluirScript(id) {
  if (!verificarPermissaoAdmin()) throw new Error("Permissão negada.");
  
  const ss = abrirPlanilhaDB();
  const sheet = ss.getSheetByName('ScriptsDB');
  
  // O ID que usamos é o número da linha. 
  // O Google Sheets deleta a linha exata passada.
  sheet.deleteRow(parseInt(id));
  
  return "Script excluído com sucesso.";
}

function excluirTutorial(id) {
  if (!verificarPermissaoAdmin()) throw new Error("Permissão negada.");
  
  const ss = abrirPlanilhaDB();
  const sheet = ss.getSheetByName('BibliotecaDB');
  
  sheet.deleteRow(parseInt(id));
  
  return "Artigo excluído com sucesso.";
}

function getEmailUsuario() {
  var email = Session.getActiveUser().getEmail();
  return email ? email : "Visitante / Externo";
}

function getContent(filename) {
  return HtmlService.createHtmlOutputFromFile(filename).getContent();
}