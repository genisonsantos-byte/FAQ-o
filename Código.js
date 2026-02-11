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

  // CONFIGURAÇÃO VIA SCRIPT PROPERTIES (Profissional)
  const props = PropertiesService.getScriptProperties();
  const API_KEY = props.getProperty('GEMINI_API_KEY');
  const ID_PASTA_DOCS = props.getProperty('PASTA_DRIVE_ID');

  if (!API_KEY || !ID_PASTA_DOCS) {
    return "❌ ERRO DE CONFIGURAÇÃO: As chaves de API não foram configuradas. Execute a função setupEnvironmentVariables() uma vez.";
  }

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

    // 5. O PULO DO GATO: O PROMPT "AGREGADOR" COM ROTEAMENTO INTELIGENTE

    // Palavras-chave que indicam intenção de buscar no banco de dados (Pessoas/Locais)
    const termosSQL = ['quem', 'email', 'e-mail', 'mail', 'setor', 'area', 'área', 'departamento', 'filial', 'loja', 'onde fica', 'local', 'cargo', 'função', 'colaborador', 'funcionario', 'funcionário', 'trabalha', 'gerente', 'lider', 'líder'];

    // Verifica se a pergunta tem alguma dessas palavras
    const perguntaLower = perguntaUsuario.toLowerCase();
    const isSQLIntent = termosSQL.some(t => perguntaLower.includes(t));

    let promptSistema = "";

    if (isSQLIntent) {
      // CENÁRIO A: PERGUNTA SOBRE PESSOAS/LOCAIS -> INCLUI SQL
      promptSistema = `
      Você é o Agente Central de Suporte de TI.
      
      --- CONTEXTO SQL (PRIORIDADE PARA DADOS DE PESSOAS) ---
      ${ESQUEMA_BANCO}
      -------------------------------------------------------
      
      --- OUTRAS FONTES ---
      ${contextoFinal}
      ---------------------

      REGRAS OBRIGATÓRIAS:
      1. Se a pergunta for sobre PESSOAS, CARGOS, EMAILS ou LOCAIS, tente gerar um SQL BigQuery.
         - Formato: \`\`\`sql SELECT ... \`\`\`
      2. Se não for possível responder com SQL, procure nas "OUTRAS FONTES".
      
      PERGUNTA DO USUÁRIO: ${perguntaUsuario}
      `;
    } else {
      // CENÁRIO B: PERGUNTA TÉCNICA/GERAL -> FOCA NOS DOCS E SCRIPTS (SEM SQL)
      promptSistema = `
      Você é o Agente Central de Suporte de TI.
      Sua missão é responder DÚVIDAS TÉCNICAS baseando-se EXCLUSIVAMENTE nos documentos abaixo.
      
      IMPORTANTE: NÃO gere código SQL. Apenas leia os textos e responda.
      
      --- DADOS DISPONÍVEIS (LEIA COM ATENÇÃO) ---
      ${contextoFinal}
      --- FIM DOS DADOS ---

      REGRAS:
      1. Responda de forma direta e útil.
      2. Se baseie nos Tutoriais, Scripts e Documentos fornecidos acima.
      3. Se a informação não estiver lá, diga que não encontrou na base de conhecimento.
      
      PERGUNTA DO USUÁRIO: ${perguntaUsuario}
      `;
    }

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

    const respostaIA = json.candidates[0].content.parts[0].text;

    // 6. DETECTAR SE É SQL (TEXT-TO-SQL)
    if (respostaIA.includes('```sql')) {
      // Extrair o SQL do bloco de código
      let sqlCode = respostaIA.split('```sql')[1].split('```')[0].trim();

      // Executar no BigQuery com SEGURANÇA
      return executarQueryBigQuery(sqlCode);
    }

    return respostaIA;

  } catch (e) {
    return "Erro Crítico: " + e.toString();
  }
}

// 3. Função de Leitura do Drive (Blindada)
function abrirPlanilhaDB() {
  // CONFIGURAÇÃO VIA SCRIPT PROPERTIES
  var idDaPlanilha = PropertiesService.getScriptProperties().getProperty('PLANILHA_ID');

  if (!idDaPlanilha) throw new Error("ERRO CRÍTICO: ID da Planilha não configurado no Script Properties.");

  try {
    return SpreadsheetApp.openById(idDaPlanilha);
  } catch (e) {
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

  return dados.map(function (linha, index) {
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

// Helper para o Frontend pegar configurações seguras de forma dinâmica
function getDriveFolderId() {
  const props = PropertiesService.getScriptProperties();
  return props.getProperty('PASTA_DRIVE_ID');
}