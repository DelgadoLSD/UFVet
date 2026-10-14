import { readFileSync } from "node:fs";
import { createServer } from "node:http";
import { afterEach, describe, expect, test } from "vitest";
import { conferirScript, enviarPeloScript } from "../src/carteiro.js";
import { PORTA_DO_SCRIPT_DE_MENTIRA } from "../vitest.config.js";
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

  test("a prévia do e-mail no site repete o assunto e o começo dos e-mails de verdade", () => {
    // O site mostra como o e-mail aparece na caixa de entrada, para a pessoa
    // saber o que procurar (frontend/src/components/PreviaDoEmail.jsx).
    const previa = readFileSync(
      new URL(
        "../../frontend/src/components/PreviaDoEmail.jsx",
        import.meta.url,
      ),
      "utf8",
    ).replace(/\s+/g, " ");
    const dados = { para: "a@example.com", nome: "Ana Souza", link: LINK };
    for (const email of [emailDeConfirmacao(dados), emailDeSenhaNova(dados)]) {
      const comeco = email.texto.split("\n\n")[1];
      expect(previa).toContain(`"${email.assunto}"`);
      expect(previa).toContain(`"${comeco}"`);
    }
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
    expect(falha.message).toContain("limite diário de e-mails do Gmail acabou");
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
    ).rejects.toThrow("confira o EMAIL_SCRIPT_URL");
  });
});

describe("a conferência do script, ao ligar a API", () => {
  let servidor;
  afterEach(() => servidor?.close());

  // Um Google de mentira que confere a senha como o script de verdade.
  async function scriptDeMentira(senhaDoScript) {
    const recebidos = [];
    servidor = createServer((req, res) => {
      let corpo = "";
      req.on("data", (pedaco) => (corpo += pedaco));
      req.on("end", () => {
        const pedido = JSON.parse(corpo);
        recebidos.push(pedido);
        const resposta =
          pedido.segredo !== senhaDoScript
            ? { ok: false, erro: "senha" }
            : !pedido.para
              ? { ok: false, erro: "pedido" }
              : { ok: true };
        res.writeHead(200, { "Content-Type": "application/json" });
        res.end(JSON.stringify(resposta));
      });
    });
    await new Promise((pronto) => servidor.listen(0, "127.0.0.1", pronto));
    return {
      url: `http://127.0.0.1:${servidor.address().port}/exec`,
      recebidos,
    };
  }

  test("com a senha certa, está tudo certo, e nenhum e-mail sai", async () => {
    const { url, recebidos } = await scriptDeMentira("senha-certa");

    expect(await conferirScript({ url, segredo: "senha-certa" })).toBeNull();
    // O pedido vai sem destinatário: o script não tem para quem mandar.
    expect(recebidos[0].para).toBe("");
  });

  test("com a senha diferente, o motivo diz qual variável conferir", async () => {
    const { url } = await scriptDeMentira("senha-certa");

    expect(await conferirScript({ url, segredo: "outra-senha" })).toContain(
      "EMAIL_SCRIPT_SEGREDO não é igual à propriedade SEGREDO",
    );
  });

  test("sem resposta do endereço, o motivo manda conferir o EMAIL_SCRIPT_URL", async () => {
    const motivo = await conferirScript({
      url: "http://127.0.0.1:9/exec",
      segredo: "qualquer",
    });

    expect(motivo).toContain("não foi possível chamar o script");
    expect(motivo).toContain("EMAIL_SCRIPT_URL");
  });

  // O caminho da API publicada: o carteiro chamado sem endereço, com o que
  // está na configuração (EMAIL_SCRIPT_URL e EMAIL_SCRIPT_SEGREDO, que nos
  // testes apontam para um script de mentira; ver vitest.config.js). Um erro
  // de nome entre a configuração e o carteiro já deixou a API chamando o
  // script com o endereço vazio, e só este teste pegaria.
  test("sem dizer o endereço, o carteiro usa o da configuração", async () => {
    const recebidos = [];
    servidor = createServer((req, res) => {
      let corpo = "";
      req.on("data", (pedaco) => (corpo += pedaco));
      req.on("end", () => {
        const pedido = JSON.parse(corpo);
        recebidos.push(pedido);
        const resposta =
          pedido.segredo !== process.env.EMAIL_SCRIPT_SEGREDO
            ? { ok: false, erro: "senha" }
            : !pedido.para
              ? { ok: false, erro: "pedido" }
              : { ok: true };
        res.writeHead(200, { "Content-Type": "application/json" });
        res.end(JSON.stringify(resposta));
      });
    });
    await new Promise((pronto) =>
      servidor.listen(PORTA_DO_SCRIPT_DE_MENTIRA, "127.0.0.1", pronto),
    );

    expect(await conferirScript()).toBeNull();
    await enviarPeloScript(
      emailDeConfirmacao({ para: "ana@example.com", nome: "Ana", link: LINK }),
    );

    expect(recebidos.map((pedido) => pedido.para)).toEqual([
      "",
      "ana@example.com",
    ]);
  });
});
