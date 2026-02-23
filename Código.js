/**
 * ==========================================================================
 * FAQÃO - CENTRAL DE INTELIGÊNCIA (VERSÃO 8.0 - FULL STACK)
 * Inclui: Web App (doGet), Bot Chat (onMessage) e BigQuery (Joins)
 * ==========================================================================
 */

// --- CONFIGURAÇÕES GLOBAIS ---
const URL_GEMINI = "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent";
const BIGQUERY_PROJECT_ID = 'maga-bigdata';
const BIGQUERY_LOCATION = 'southamerica-east1'; // Região correta conforme imagem

function getScriptUrl() {
  return ScriptApp.getService().getUrl();
}

// ======================================================
// 1. BACKEND DO SITE (WEB APP)
// ======================================================

function doGet() {
  var linkIcone = 'https://cdnjs.cloudflare.com/ajax/libs/twemoji/14.0.2/72x72/1f52a.png';

  return HtmlService.createTemplateFromFile('Index')
    .evaluate()
    .setTitle('FAQão - Central de Suporte')
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL)
    .addMetaTag('viewport', 'width=device-width, initial-scale=1')
    .setFaviconUrl(linkIcone);
}

// Função para permitir importar outros arquivos HTML (CSS/JS) no Index
function include(filename) {
  return HtmlService.createHtmlOutputFromFile(filename).getContent();
}

// ======================================================
// 2. BACKEND DO BOT (GOOGLE CHAT)
// ======================================================

function onMessage(event) {
  if (!event || !event.message) return { "text": "Olá! Em que posso ajudar?" };

  var textoUsuario = event.message.text;

  // Limpa a menção ao Bot (@NomeDoBot)
  if (event.message.annotations) {
    event.message.annotations.forEach(function (a) {
      if (a.type === 'USER_MENTION') {
        textoUsuario = textoUsuario.replace(a.userMention.user.displayName, "").trim();
      }
    });
  }

  try {
    var resposta = perguntarAoGemini(textoUsuario);
    return { "text": resposta };
  } catch (erro) {
    return { "text": "⚠️ Erro no processamento: " + erro.message };
  }
}

function onAddToSpace(event) {
  return { "text": "🤖 **Faqão Bot Ativado!**\nAgora consulto dados cruzando as tabelas de Funcionários, Identidade e Filiais." };
}

// ======================================================
// 3. NÚCLEO DE INTELIGÊNCIA (MULTIPLAS FONTES)
// ======================================================

function perguntarAoGemini(perguntaUsuario) {
  const props = PropertiesService.getScriptProperties();
  const API_KEY = props.getProperty('GEMINI_API_KEY');
  const ID_PASTA_DOCS = props.getProperty('PASTA_DRIVE_ID');

  if (!API_KEY) return "❌ Chave API não configurada no Script Properties.";

  try {
    // --- ETAPA 1: CLASSIFICAR INTENÇÃO ---
    const promptClassificacao = `
    Classifique a pergunta do usuário para decidir onde buscar a resposta.
    Responda APENAS com uma das tags XML:
    <TIPO>PESSOA</TIPO> -> Se perguntar sobre funcionários, email, cargo, time, quem é alguém.
    <TIPO>CONHECIMENTO</TIPO> -> Se perguntar sobre ferramentas, softwares, links, procedimentos, tutoriais, "como fazer", "onde fica".
    <TIPO>AMBOS</TIPO> -> Se envolver tanto dados de pessoa quanto um procedimento.
    
    PERGUNTA: "${perguntaUsuario}"
    `;

    const classificacao = chamarGemini(promptClassificacao, API_KEY);
    const tipoBusca = classificacao.match(/<TIPO>(.*?)<\/TIPO>/) ? classificacao.match(/<TIPO>(.*?)<\/TIPO>/)[1] : "AMBOS";

    // --- ETAPA 2: BUSCAR DADOS NAS FONTES ---
    let dadosBigQuery = "";
    let dadosBiblioteca = "";
    let dadosDocs = "";
    let dadosScripts = "";

    // A. Busca no BigQuery (Se for Pessoa ou Ambos)
    if (tipoBusca === "PESSOA" || tipoBusca === "AMBOS") {
      const SCHEMA_BIGQUERY = `
      --- FONTES DE DADOS (BIGQUERY) ---
      1. TABELA FUNCIONÁRIOS: \`maga-bigdata.mlpap.mag_v_funcionarios_ativos\` (func)
         - NOME, CARGO, SITUACAO, CENTRO_CUSTO, FILIAL.
      2. TABELA IDENTIDADE: \`maga-bigdata.kirk.assignee\` (kirk)
         - email, first_name, last_name (Join com func.NOME).
      3. TABELA FILIAIS: \`maga-bigdata.balboa.cad_filial\` (filial)
         - codfil, cidade (Join com func.FILIAL).
      `;

      const promptSQL = `
      Você é um especialista em SQL BigQuery. Gere um SQL seguro para responder: "${perguntaUsuario}"
      USANDO ESTE SCHEMA:
      ${SCHEMA_BIGQUERY}
      
      REGRAS:
      - Una as tabelas corretamente.
      - Use UPPER(func.NOME) LIKE UPPER('%termo%') para buscas.
      - Retorne APENAS o código SQL puro dentro de tag <SQL>...</SQL>.
      `;

      const respSQL = chamarGemini(promptSQL, API_KEY);
      if (respSQL.includes('<SQL>')) {
        let sqlCode = respSQL.match(/<SQL>(.*?)<\/SQL>/s)[1].trim().replace(/```sql/g, "").replace(/```/g, "");
        dadosBigQuery = executarQueryBigQuery(sqlCode);
      }
    }

    // B. Busca na Biblioteca, Docs e Scripts (Se for Conhecimento ou Ambos)
    if (tipoBusca === "CONHECIMENTO" || tipoBusca === "AMBOS") {
      // B1. Busca na Planilha (BibliotecaDB)
      const artigosEncontrados = buscarNaBiblioteca(perguntaUsuario);
      if (artigosEncontrados) {
        dadosBiblioteca = "--- ARTIGOS RELACIONADOS NA BIBLIOTECA ---\n" + artigosEncontrados;
      }

      // B2. Busca na Planilha (ScriptsDB)
      const scriptsEncontrados = buscarNosScripts(perguntaUsuario);
      if (scriptsEncontrados) {
        dadosScripts = "--- SCRIPTS E COMANDOS ÚTEIS ---\n" + scriptsEncontrados;
      }

      // B3. Busca no Drive (Docs)
      if (ID_PASTA_DOCS) {
        const docs = lerDocsDaPasta(ID_PASTA_DOCS);
        if (docs && !docs.startsWith("Erro")) {
          // AUMENTADO PARA 150.000 CARACTERES (Aprox. 40k tokens)
          dadosDocs = "--- CONTEÚDO DOS DOCUMENTOS NO DRIVE ---\n" + docs.substring(0, 150000);
        }
      }
    }

    const promptFinal = `
    Você é o Agente de Suporte FAQão, um especialista em responder dúvidas com base em documentos internos.
    Responda à pergunta do usuário com base APENAS nos dados recuperados abaixo.
    
    PERGUNTA: "${perguntaUsuario}"
    
    DADOS RECUPERADOS:
    ${dadosBigQuery ? `[DO BIGQUERY - DADOS PESSOAIS]:\n${dadosBigQuery}\n` : ""}
    ${dadosBiblioteca ? `[DA BIBLIOTECA - PROCEDIMENTOS]:\n${dadosBiblioteca}\n` : ""}
    ${dadosScripts ? `[DA BASE DE SCRIPTS ÚTEIS]:\n${dadosScripts}\n` : ""}
    ${dadosDocs ? `[DOS DOCUMENTOS DRIVE]:\n${dadosDocs}\n` : ""}
    
    INSTRUÇÕES:
    1. Se houver dados do BigQuery (Pessoas), monte um minidossiê detalhado.
    2. Se a resposta estiver nos DOCUMENTOS DRIVE, cite obrigatoriamente o nome do arquivo (ex: "Conforme o documento [NOME_DO_ARQUIVO]...").
    3. Se houver dados de SCRIPTS, forneça o código usando blocos de código markdown (\` \` \`).
    4. Se houver dados da Biblioteca, explique o procedimento.
    5. Se for uma ferramenta com link, forneça o link.
    6. Se não houver nada relevante, diga que não encontrou informações específicas nas bases (Drive, Biblioteca, Scripts e BigQuery).
    7. Seja extremamente inteligente e útil. Se a resposta for parcial em várias fontes, consolide-as.
    `;

    return chamarGemini(promptFinal, API_KEY);

  } catch (e) { return "Erro Crítico: " + e.toString(); }
}

// --- FUNÇÕES AUXILIARES ---

function chamarGemini(prompt, apiKey) {
  const payload = {
    "contents": [{ "parts": [{ "text": prompt }] }]
  };
  const options = {
    "method": "post",
    "contentType": "application/json",
    "payload": JSON.stringify(payload),
    "muteHttpExceptions": true
  };
  const response = UrlFetchApp.fetch(URL_GEMINI + "?key=" + apiKey, options);
  const json = JSON.parse(response.getContentText());
  if (json.error) throw new Error(json.error.message);
  return json.candidates[0].content.parts[0].text;
}

function buscarNaBiblioteca(termo) {
  try {
    const todos = listarTutoriais(); // Já busca na aba correta 'BibliotecaDB'
    if (!todos.length) return "";

    // 1. Tokenização Inteligente (separa por espaços e remove palavras curtas < 3 chars)
    const tokens = termo.toUpperCase().split(/\s+/).filter(t => t.length > 2 && !['COM', 'PARA', 'QUE', 'UMA'].includes(t));
    if (!tokens.length) return ""; // Se só tiver "de", "da", retorna vazio

    // 2. Sistema de Pontuação (Ranking)
    const resultados = todos.map(artigo => {
      let pontos = 0;
      const tituloUpper = artigo.titulo.toUpperCase();
      const conteudoUpper = artigo.conteudo.toUpperCase();

      tokens.forEach(token => {
        if (tituloUpper.includes(token)) pontos += 3;   // Título vale mais
        if (conteudoUpper.includes(token)) pontos += 1; // Conteúdo vale menos
      });

      return { artigo, pontos };
    })
      .filter(item => item.pontos > 0)          // Remove quem não tem nada a ver
      .sort((a, b) => b.pontos - a.pontos)      // Ordena pelos mais relevantes
      .slice(0, 5);                             // Pega só os top 5

    if (!resultados.length) return "";

    // Formata para o Gemini ler
    return resultados.map(r => `[Relevância: ${r.pontos}]TÍTULO: ${r.artigo.titulo} \nCONTEÚDO: ${r.artigo.conteudo} \nLINK: ${r.artigo.link} \n`).join("\n---\n");
  } catch (e) { return ""; }
}

function buscarNosScripts(termo) {
  try {
    const todos = listarScripts(); // Já busca na aba correta 'ScriptsDB'
    if (!todos.length) return "";

    const tokens = termo.toUpperCase().split(/\s+/).filter(t => t.length > 2 && !['COM', 'PARA', 'QUE', 'UMA'].includes(t));
    if (!tokens.length) return "";

    const resultados = todos.map(script => {
      let pontos = 0;
      const tituloUpper = script.titulo.toUpperCase();
      const descUpper = script.descricao.toUpperCase();
      const tipoUpper = script.tipo.toUpperCase();

      tokens.forEach(token => {
        if (tituloUpper.includes(token)) pontos += 3;
        if (descUpper.includes(token)) pontos += 2;
        if (tipoUpper.includes(token)) pontos += 1;
      });

      return { script, pontos };
    })
      .filter(item => item.pontos > 0)
      .sort((a, b) => b.pontos - a.pontos)
      .slice(0, 5);

    if (!resultados.length) return "";

    return resultados.map(r => `[Relevância: ${r.pontos}]TÍTULO: ${r.script.titulo} \nTIPO: ${r.script.tipo} \nDESCRIÇÃO: ${r.script.descricao} \nCÓDIGO: \n${r.script.codigo} \nLINK: ${r.script.link} \n`).join("\n---\n");
  } catch (e) { return ""; }
}

function executarQueryBigQuery(sql) {
  try {
    const results = BigQuery.Jobs.query({ query: sql, useLegacySql: false, location: BIGQUERY_LOCATION }, BIGQUERY_PROJECT_ID);
    if (!results.rows) return "Nenhum resultado encontrado.";
    const headers = results.schema.fields.map(f => f.name).join(" | ");
    const dados = results.rows.map(row => row.f.map(col => col.v).join(" | ")).join("\n");
    return headers + "\n" + dados;
  } catch (e) { return "Erro no BigQuery: " + e.message; }
}

// ======================================================
// 4. FUNÇÕES DE APOIO (PLANILHA / DRIVE / ADMIN)
// ======================================================

function abrirPlanilhaDB() {
  var id = PropertiesService.getScriptProperties().getProperty('PLANILHA_ID');
  return SpreadsheetApp.openById(id);
}

function verificarPermissaoAdmin() {
  return new UserAuth().isAdmin();
}

function lerDocsDaPasta(folderId) {
  try {
    var files = DriveApp.getFolderById(folderId).getFiles();
    var texto = "";
    while (files.hasNext()) {
      var file = files.next();
      var mime = file.getMimeType();
      var nome = file.getName();

      try {
        if (mime === MimeType.GOOGLE_DOCS) {
          texto += `\n[FONTE: ${nome}]\n`;
          texto += DocumentApp.openById(file.getId()).getBody().getText();
        }
        else if (mime === MimeType.PDF) {
          // Tenta extrair texto de PDF (Somente texto simples)
          texto += `\n[FONTE: ${nome} (PDF)]\n`;
          texto += file.getAs('text/plain').getDataAsString();
        }
        else if (mime === MimeType.PLAIN_TEXT) {
          texto += `\n[FONTE: ${nome}]\n`;
          texto += file.getBlob().getDataAsString();
        }
      } catch (err) {
        texto += `\n[ERRO NA LEITURA DE ${nome}: ${err.message}]\n`;
      }
    }
    return texto;
  } catch (e) {
    return "Erro no Drive: " + e.message;
  }
}

function getEmailUsuario() { return new UserAuth().email; }
function getUsuarioAtual() { return getEmailUsuario(); }

// ======================================================
// 5. FUNÇÕES DE LISTAGEM (SCRIPTS E TUTORIAIS)
// ======================================================

/**
 * Lista todos os scripts cadastrados na aba 'ScriptsDB' da planilha.
 * Estrutura: Data | Titulo | Tipo (CMD ou PowerShell) | Descricao | Codigo | Autor | LinkArquivo
 */
function listarScripts() {
  try {
    var sheet = abrirPlanilhaDB().getSheetByName('ScriptsDB');
    if (!sheet) return [];
    var dados = sheet.getDataRange().getValues();
    if (dados.length <= 1) return []; // Só cabeçalho ou vazia
    return dados.slice(1).map(function (row, i) {
      return {
        id: String(i + 1),
        titulo: String(row[1] || ''),
        tipo: String(row[2] || 'CMD'),
        descricao: String(row[3] || ''),
        codigo: String(row[4] || ''),
        autor: String(row[5] || ''),
        link: String(row[6] || '')
      };
    }).filter(function (s) { return s.titulo; });
  } catch (e) {
    console.error('Erro em listarScripts: ' + e.message);
    return [];
  }
}

/**
 * Lista todos os artigos cadastrados na aba 'BibliotecaDB' da planilha.
 * Estrutura: Data | Titulo | Categoria | Conteudo | Autor (Email) | LinkArquivo
 */
function listarTutoriais() {
  try {
    var sheet = abrirPlanilhaDB().getSheetByName('BibliotecaDB');
    if (!sheet) return [];
    var dados = sheet.getDataRange().getValues();
    if (dados.length <= 1) return []; // Só cabeçalho ou vazia
    return dados.slice(1).map(function (row, i) {
      var data = row[0] ? Utilities.formatDate(new Date(row[0]), Session.getScriptTimeZone(), 'dd/MM/yyyy') : '';
      return {
        id: String(i + 1),
        titulo: String(row[1] || ''),
        categoria: String(row[2] || 'Geral'),
        conteudo: String(row[3] || ''),
        autor: String(row[4] || 'Admin'),
        link: String(row[5] || ''),
        data: data
      };
    }).filter(function (t) { return t.titulo; });
  } catch (e) {
    console.error('Erro em listarTutoriais: ' + e.message);
    return [];
  }
}

/**
 * Retorna o ID da pasta do Drive configurada nas Script Properties.
 * Chamada pelo frontend para montar o link de redirecionamento.
 */
function getDriveFolderId() {
  return PropertiesService.getScriptProperties().getProperty('PASTA_DRIVE_ID') || '';
}


function gerarBase64DoDrive() {
  var fileId = "1xTFmEeUXkw1-P4pI1Cqovkl0KySGuaDR";
  var file = DriveApp.getFileById(fileId);
  var blob = file.getBlob();

  var base64 = Utilities.base64Encode(blob.getBytes());
  var mimeType = blob.getContentType();

  var base64Completo = "data:" + mimeType + ";base64," + base64;

  Logger.log(base64Completo);
}