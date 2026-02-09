function diagnosticarAmbiente() {
    const props = PropertiesService.getScriptProperties();
    const pastaId = props.getProperty('PASTA_DRIVE_ID');
    const planilhaId = props.getProperty('PLANILHA_ID');

    console.log("--- DIAGNÓSTICO DE AMBIENTE ---");
    console.log("ID da Pasta Drive SALVO: [" + pastaId + "]");
    console.log("ID da Planilha SALVO:    [" + planilhaId + "]");

    const idCorreto = '1q6JgG9bqaJjpxV1_5XV3pNwWtylyrIAA';

    if (pastaId !== idCorreto) {
        console.error("ERRO DETECTADO: O ID da pasta salvo está diferente do esperado!");
        console.log("Esperado: " + idCorreto);
        console.log("Encontrado: " + pastaId);
        console.log("CORRIGINDO AUTOMATICAMENTE...");

        props.setProperty('PASTA_DRIVE_ID', idCorreto);
        console.log("✅ Correção aplicada! ID atualizado para: " + idCorreto);
    } else {
        console.log("✅ Tudo parece correto com o ID da pasta.");
    }
}
