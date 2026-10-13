import { enviarEmail } from "./carteiro.js";
import { decifrar, indiceEmail } from "./cifra.js";
import { config } from "./config.js";
import { VALIDADE_HORAS, criarLink } from "./modelos/links.js";

// Os e-mails que o UFVet manda, e o envio de cada um com o link criado na
// hora. Cada e-mail vai em texto simples e em HTML: o leitor de e-mail mostra
// o que souber mostrar. Os textos seguem os do site: curtos, dizendo o que
// fazer e o que acontece se a pessoa não fizer nada.

// "Beatriz dos Reis" -> "Olá, Beatriz!". O nome vem do cadastro, que
// qualquer um preenche: só entra o primeiro nome, e só se ele parecer um
// nome. Assim ninguém usa o cadastro para pôr um recado ou o endereço de um
// site dentro de um e-mail do UFVet.
export function saudacao(nomeCompleto) {
  const primeiro = nomeCompleto.trim().split(/\s+/)[0];
  return /^\p{L}[\p{L}'’-]{0,29}$/u.test(primeiro)
    ? `Olá, ${primeiro}!`
    : "Olá!";
}

const prazo = (horas) => (horas === 1 ? "1 hora" : `${horas} horas`);

const escaparHtml = (texto) =>
  texto
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");

// As mesmas cores do site: o vermelho dos botões e o preto dos textos. Os
// estilos vão em cada elemento porque os leitores de e-mail ignoram folhas
// de estilo.
const PARAGRAFO =
  "margin:0 0 16px;font-size:16px;line-height:1.5;color:#1a1c1c";
const NOTA = "margin:0 0 12px;font-size:14px;line-height:1.5;color:#5f5e5e";

function montarHtml({ assunto, ola, pedido, botao, link, validade, aviso }) {
  return `<!doctype html>
<html lang="pt-BR">
<head><meta charset="utf-8"><title>${escaparHtml(assunto)}</title></head>
<body style="margin:0;padding:24px 12px;background:#f6f2f2;font-family:Arial,Helvetica,sans-serif">
<div style="max-width:480px;margin:0 auto;background:#ffffff;border-radius:16px;padding:32px 28px">
<p style="margin:0 0 28px;font-size:24px;font-weight:800;letter-spacing:-0.5px;color:#1a1c1c">UF<span style="color:#9e0a24">Vet</span></p>
<p style="${PARAGRAFO}">${escaparHtml(ola)}</p>
<p style="${PARAGRAFO}">${escaparHtml(pedido)}</p>
<p style="margin:28px 0"><a href="${escaparHtml(link)}" style="display:inline-block;background:#9e0a24;color:#ffffff;font-size:16px;font-weight:700;text-decoration:none;padding:14px 24px;border-radius:12px">${escaparHtml(botao)}</a></p>
<p style="${NOTA}">${escaparHtml(validade)} Se o botão não abrir, copie este endereço no navegador:</p>
<p style="${NOTA};word-break:break-all"><a href="${escaparHtml(link)}" style="color:#9e0a24">${escaparHtml(link)}</a></p>
<p style="${NOTA};margin-top:24px">${escaparHtml(aviso)}</p>
</div>
</body>
</html>`;
}

function montar({
  tipo,
  para,
  assunto,
  ola,
  pedido,
  botao,
  link,
  validade,
  aviso,
}) {
  const texto = [ola, pedido, link, validade, aviso, "UFVet"].join("\n\n");
  return {
    tipo,
    para,
    assunto,
    texto,
    html: montarHtml({ assunto, ola, pedido, botao, link, validade, aviso }),
  };
}

const umaVez = (horas) =>
  `O link vale por ${prazo(horas)} e funciona uma vez só.`;

// O e-mail do cadastro: sem ele confirmado, ninguém entra na conta.
export const emailDeConfirmacao = ({ para, nome, link }) =>
  montar({
    tipo: "confirmacao",
    para,
    assunto: "Confirme seu e-mail no UFVet",
    ola: saudacao(nome),
    pedido:
      "Para terminar o seu cadastro no UFVet, confirme que este e-mail é seu.",
    botao: "Confirmar meu e-mail",
    link,
    validade: umaVez(VALIDADE_HORAS.CONFIRMAR_EMAIL),
    aviso:
      "Se não foi você que se cadastrou, ignore este e-mail. Sem a confirmação, ninguém entra no UFVet com este endereço.",
  });

// A troca de e-mail na Minha conta: o novo só vale depois de confirmado.
export const emailDeTroca = ({ para, nome, link }) =>
  montar({
    tipo: "troca",
    para,
    assunto: "Confirme seu novo e-mail no UFVet",
    ola: saudacao(nome),
    pedido:
      "Você pediu para usar este e-mail na sua conta do UFVet. Confirme que ele é seu para fazer a troca.",
    botao: "Confirmar a troca",
    link,
    validade: umaVez(VALIDADE_HORAS.CONFIRMAR_EMAIL),
    aviso:
      "Até a confirmação, a conta continua com o e-mail antigo. Se não foi você que pediu, ignore este e-mail.",
  });

// "Esqueceu a senha?".
export const emailDeSenhaNova = ({ para, nome, link }) =>
  montar({
    tipo: "senha",
    para,
    assunto: "Crie uma senha nova no UFVet",
    ola: saudacao(nome),
    pedido:
      "Recebemos um pedido para criar uma senha nova na sua conta do UFVet.",
    botao: "Criar senha nova",
    link,
    validade: umaVez(VALIDADE_HORAS.NOVA_SENHA),
    aviso:
      "Se não foi você que pediu, ignore este e-mail: a sua senha continua a mesma.",
  });

// O link vai na parte depois do "#", que o navegador não manda a nenhum
// servidor: o código não fica nos registros de acesso da hospedagem. A
// página lê o código e o manda à API.
const enderecoDoLink = (pagina, codigo) =>
  `${config.enderecoDoSite}/${pagina}#${codigo}`;

// Cria o link de confirmação e manda para `email`: o do cadastro, ou o novo
// numa troca de e-mail. Devolve se o e-mail saiu.
export async function mandarConfirmacao(usuario, email) {
  const troca =
    !!usuario.emailConfirmadoEm && indiceEmail(email) !== usuario.emailIndice;
  const codigo = await criarLink({
    usuarioId: usuario.id,
    finalidade: "CONFIRMAR_EMAIL",
    email,
  });
  const montarEmail = troca ? emailDeTroca : emailDeConfirmacao;
  return enviarEmail(
    montarEmail({
      para: email,
      nome: usuario.nomeCompleto,
      link: enderecoDoLink("confirmar-email", codigo),
    }),
  );
}

// Cria o link de senha nova e manda para o e-mail da conta.
export async function mandarLinkDeSenha(usuario) {
  const codigo = await criarLink({
    usuarioId: usuario.id,
    finalidade: "NOVA_SENHA",
  });
  return enviarEmail(
    emailDeSenhaNova({
      para: decifrar(usuario.emailCifrado),
      nome: usuario.nomeCompleto,
      link: enderecoDoLink("nova-senha", codigo),
    }),
  );
}
