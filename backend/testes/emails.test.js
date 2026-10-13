import { createServer } from "node:http";
import { afterEach, describe, expect, test } from "vitest";
import { enviarPeloScript } from "../src/carteiro.js";
import {
  emailDeConfirmacao,
  emailDeSenhaNova,
  saudacao,
} from "../src/emails.js";

// O texto dos e-mails (emails.js) e a ida até o script do Google
// (carteiro.js), com um servidor de mentira no lugar do Google.

const LINK =
  "http://ufvet.test/confirmar-email#Ab3_-xY9Ab3_-xY9Ab3_-xY9Ab3_-xY9Ab3_-xY9Ab3";

describe("o texto dos e-mails", () => {
  test("a saudação usa só o primeiro nome, e só se ele parecer um nome", () => {
    expect(saudacao("Beatriz dos Reis")).toBe("Olá, Beatriz!");
    expect(saudacao("  João-Pedro Alves ")).toBe("Olá, João-Pedro!");
    expect(saudacao("D'Ávila Souza")).toBe("Olá, D'Ávila!");
    // O cadastro é preenchido por qualquer um: nada de endereço de site,
    // recado ou HTML dentro de um e-mail do UFVet.
    expect(saudacao("www.site-falso.com Silva")).toBe("Olá!");
    expect(saudacao("<b>Ana</b> Souza")).toBe("Olá!");
    expect(saudacao("Clique:aqui Silva")).toBe("Olá!");
  });

  test("o link vai no botão e por escrito, no texto e no HTML", () => {
    const email = emailDeConfirmacao({
      para: "beatriz@example.com",
      nome: "Beatriz dos Reis",
      link: LINK,
    });

    expect(email).toMatchObject({
      tipo: "confirmacao",
      para: "beatriz@example.com",
      assunto: "Confirme seu e-mail no UFVet",
    });
    expect(email.texto).toContain(LINK);
    expect(email.texto).toContain("24 horas");
    expect(email.html.split(LINK)).toHaveLength(4);
    expect(email.html).toContain("Confirmar meu e-mail");
  });

  test("nada que veio de fora vira HTML", () => {
    const email = emailDeSenhaNova({
      para: "ana@example.com",
      nome: "<img src=x onerror=alert(1)> Souza",
      link: `${LINK}"><script>`,
    });

    expect(email.html).not.toContain("<img");
    expect(email.html).not.toContain("<script");
    expect(email.texto).toContain("1 hora");
  });
});

describe("o carteiro e o script do Google", () => {
  let servidor;
  afterEach(() => servidor?.close());

  // Um servidor que faz o papel do Google: recebe o pedido, responde com um
  // redirecionamento (como o Apps Script faz) e entrega a resposta no
  // endereço novo.
  async function googleDeMentira(resposta) {
    const recebidos = [];
    servidor = createServer((req, res) => {
      if (req.method === "POST" && req.url === "/exec") {
        let corpo = "";
        req.on("data", (pedaco) => (corpo += pedaco));
        req.on("end", () => {
          recebidos.push(JSON.parse(corpo));
          res.writeHead(302, { Location: "/echo" }).end();
        });
        return;
      }
      res.writeHead(200, { "Content-Type": "application/json" });
      res.end(JSON.stringify(resposta));
    });
    await new Promise((pronto) => servidor.listen(0, "127.0.0.1", pronto));
    const url = `http://127.0.0.1:${servidor.address().port}/exec`;
    return { url, recebidos };
  }

  const mensagem = () =>
    emailDeConfirmacao({
      para: "beatriz@example.com",
      nome: "Beatriz",
      link: LINK,
    });

  test("manda a senha e o e-mail, segue o redirecionamento e entende o ok", async () => {
    const { url, recebidos } = await googleDeMentira({ ok: true });

    await enviarPeloScript(mensagem(), { url, segredo: "senha-do-script" });

    expect(recebidos).toHaveLength(1);
    expect(recebidos[0]).toMatchObject({
      segredo: "senha-do-script",
      para: "beatriz@example.com",
      assunto: "Confirme seu e-mail no UFVet",
    });
    expect(recebidos[0].html).toContain(LINK);
  });

  test("quando o script recusa, o envio falha com o motivo, sem o endereço", async () => {
    const { url } = await googleDeMentira({ ok: false, erro: "cota" });

    const falha = await enviarPeloScript(mensagem(), {
      url,
      segredo: "senha-do-script",
    }).catch((erro) => erro);

    expect(falha).toBeInstanceOf(Error);
    expect(falha.message).toContain("cota");
    expect(falha.message).not.toContain("beatriz");
  });

  test("uma resposta que não é a do script (uma página de erro) também é falha", async () => {
    servidor = createServer((req, res) => {
      res.writeHead(200, { "Content-Type": "text/html" });
      res.end("<html>Erro do Google</html>");
    });
    await new Promise((pronto) => servidor.listen(0, "127.0.0.1", pronto));
    const url = `http://127.0.0.1:${servidor.address().port}/exec`;

    await expect(
      enviarPeloScript(mensagem(), { url, segredo: "senha-do-script" }),
    ).rejects.toThrow("o script respondeu 200");
  });
});
