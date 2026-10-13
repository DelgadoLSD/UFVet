// O carteiro do UFVet, em Google Apps Script. Fica na conta Gmail do
// projeto (script.google.com), publicado como "App da Web": a API do UFVet
// manda cada e-mail para este script, e ele envia pelo Gmail. O passo a
// passo para instalar está no backend/README.md, seção "E-mails".
//
// A senha não fica escrita aqui (este arquivo é público, no GitHub): ela vai
// nas propriedades do script, com o nome SEGREDO, e é a mesma da variável
// EMAIL_SCRIPT_SEGREDO da API. Pedido sem a senha certa não envia nada.
//
// A resposta diz só se deu certo e, se não deu, um motivo curto: "senha",
// "cota" (o limite diário do Gmail acabou), "pedido" (faltou um dado) ou
// "envio" (o Gmail recusou). O detalhe do erro fica no registro de
// execuções do próprio script, nunca na resposta: ele pode conter o
// endereço de alguém.

function doPost(e) {
  let pedido;
  try {
    pedido = JSON.parse(e.postData.contents);
  } catch (erro) {
    return responder({ ok: false, erro: "pedido" });
  }
  const segredo =
    PropertiesService.getScriptProperties().getProperty("SEGREDO");
  if (!segredo || pedido.segredo !== segredo) {
    return responder({ ok: false, erro: "senha" });
  }
  if (!pedido.para || !pedido.assunto || !pedido.texto) {
    return responder({ ok: false, erro: "pedido" });
  }
  try {
    if (MailApp.getRemainingDailyQuota() < 1) {
      return responder({ ok: false, erro: "cota" });
    }
    MailApp.sendEmail({
      to: pedido.para,
      subject: pedido.assunto,
      body: pedido.texto,
      htmlBody: pedido.html,
      name: "UFVet",
    });
    return responder({ ok: true });
  } catch (erro) {
    console.error(erro);
    return responder({ ok: false, erro: "envio" });
  }
}

function responder(dados) {
  return ContentService.createTextOutput(JSON.stringify(dados)).setMimeType(
    ContentService.MimeType.JSON,
  );
}
