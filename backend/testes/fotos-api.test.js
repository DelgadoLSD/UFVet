import sharp from "sharp";
import request from "supertest";
import { afterAll, beforeEach, describe, expect, test } from "vitest";
import { criarApp } from "../src/app.js";
import { banco } from "../src/banco.js";
import {
  arquivosGuardados,
  fotoDeCelular,
  gerarCpf,
  limparArquivos,
  limparBanco,
} from "./apoio.js";

// As fotos pela API: as dos animais (NF8.3) e a de perfil (F3). Toda foto é
// conferida, reduzida e gravada de novo, sem a localização GPS (NF8.5). Cada
// teste começa com o banco e a pasta de fotos vazios.

let app;
beforeEach(async () => {
  await limparBanco();
  await limparArquivos();
  app = criarApp();
});
afterAll(() => banco.$disconnect());

const SENHA = "senha-da-beatriz";

const tutora = {
  papel: "TUTOR",
  nomeCompleto: "Beatriz dos Reis",
  cpf: gerarCpf("111444777"),
  email: "beatriz@example.com",
  telefone: "(31) 98871-4402",
  cidade: "Viçosa - MG",
  bairro: "Ramos",
  senha: SENHA,
  aceiteTermos: true,
  cienciaResponsabilidade: true,
};

const outroTutor = {
  ...tutora,
  nomeCompleto: "Caio Ferreira",
  cpf: gerarCpf("222555888"),
  email: "caio@example.com",
};

const zeus = {
  nome: "Zeus",
  especie: "CAO",
  raca: "Golden Retriever",
  sexo: "MACHO",
  castrado: true,
  dataNascimento: "2021-08-20",
  pesoKg: 32,
};

const NAO_E_IMAGEM = Buffer.from("<script>alert('oi')</script>");

async function navegadorComConta(dados = tutora) {
  const navegador = request.agent(app);
  const resposta = await navegador.post("/api/usuarios").send(dados);
  navegador.codigo = resposta.body.usuario.codigo;
  return navegador;
}

// Envia um pedido com arquivos: os dados no campo "dados" (JSON) e cada
// arquivo no campo indicado.
function comArquivos(pedido, dados, arquivos, campo = "fotos") {
  if (dados !== undefined) pedido.field("dados", JSON.stringify(dados));
  arquivos.forEach((conteudo, i) =>
    pedido.attach(campo, conteudo, {
      filename: `foto-${i}.jpg`,
      contentType: "image/jpeg",
    }),
  );
  return pedido;
}

const cadastrarComFotos = (navegador, fotos, dados = zeus) =>
  comArquivos(navegador.post("/api/animais"), dados, fotos);

const editarComFotos = (navegador, codigo, dados, fotos = []) =>
  comArquivos(navegador.patch(`/api/animais/${codigo}`), dados, fotos);

// O arquivo de uma foto, baixado pelo endereço que a API devolveu.
async function baixar(url) {
  const resposta = await request(app)
    .get(url)
    .buffer(true)
    .parse((res, pronto) => {
      const partes = [];
      res.on("data", (parte) => partes.push(parte));
      res.on("end", () => pronto(null, Buffer.concat(partes)));
    });
  return resposta;
}

async function fotos(quantas) {
  return Promise.all(Array.from({ length: quantas }, () => fotoDeCelular()));
}

describe("fotos dos animais (NF8.3)", () => {
  test("o animal é cadastrado já com as fotos, na ordem do envio", async () => {
    const navegador = await navegadorComConta();

    const resposta = await cadastrarComFotos(navegador, await fotos(2));

    expect(resposta.status).toBe(201);
    const enviadas = resposta.body.animal.fotos;
    expect(enviadas).toHaveLength(2);
    for (const foto of enviadas) {
      expect(foto.id).toMatch(/^[0-9a-f-]{36}$/);
      expect(foto.url).toMatch(/^\/api\/arquivos\/[0-9a-f-]{36}\.webp$/);
      const arquivo = await baixar(foto.url);
      expect(arquivo.status).toBe(200);
      expect(arquivo.headers["content-type"]).toBe("image/webp");
    }
    expect(await arquivosGuardados()).toHaveLength(2);
    // A lista do perfil traz as fotos na mesma ordem: a primeira é a
    // principal.
    const lista = await request(app).get(
      `/api/usuarios/${navegador.codigo}/animais`,
    );
    expect(lista.body.animais[0].fotos).toEqual(enviadas);
  });

  test("a foto guardada perde a localização GPS e os dados da câmera (NF8.5)", async () => {
    const navegador = await navegadorComConta();
    const original = await fotoDeCelular();
    // A foto de teste traz mesmo o bloco de GPS (a etiqueta 0x8825).
    const exifOriginal = (await sharp(original).metadata()).exif;
    expect(exifOriginal.includes(Buffer.from([0x25, 0x88]))).toBe(true);

    const { body } = await cadastrarComFotos(navegador, [original]);
    const guardada = await baixar(body.animal.fotos[0].url);

    const dados = await sharp(guardada.body).metadata();
    expect(dados.format).toBe("webp");
    expect(dados.exif).toBeUndefined();
    expect(dados.xmp).toBeUndefined();
    expect(guardada.body.includes(Buffer.from("Celular de teste"))).toBe(false);
  });

  test("foto grande é reduzida para no máximo 1600 px", async () => {
    const navegador = await navegadorComConta();
    const grande = await fotoDeCelular({ largura: 3000, altura: 2000 });

    const { body } = await cadastrarComFotos(navegador, [grande]);
    const guardada = await baixar(body.animal.fotos[0].url);

    const { width, height } = await sharp(guardada.body).metadata();
    expect(width).toBe(1600);
    expect(height).toBe(1067);
  });

  test("só JPG, PNG e WebP: GIF e SVG, mesmo sendo imagens, são recusados", async () => {
    const navegador = await navegadorComConta();
    const gif = await sharp({
      create: { width: 40, height: 30, channels: 3, background: "#b7102a" },
    })
      .gif()
      .toBuffer();
    // O SVG é texto e pode levar instruções além do desenho.
    const svg = Buffer.from(
      '<svg xmlns="http://www.w3.org/2000/svg" width="40" height="30">' +
        '<rect width="40" height="30" fill="#b7102a"/>' +
        "<script>alert(1)</script></svg>",
    );

    for (const arquivo of [gif, svg]) {
      const resposta = await cadastrarComFotos(navegador, [arquivo]);
      expect(resposta.status).toBe(400);
      expect(resposta.body.campos).toEqual({
        fotos: "Envie a foto em JPG, PNG ou WebP.",
      });
    }
    // PNG e WebP passam.
    const png = await sharp(await fotoDeCelular())
      .png()
      .toBuffer();
    const webp = await sharp(await fotoDeCelular())
      .webp()
      .toBuffer();
    await cadastrarComFotos(navegador, [png, webp]).expect(201);
  });

  test("arquivo que não é imagem é recusado, e com ele nada fica gravado", async () => {
    const navegador = await navegadorComConta();

    // Uma foto boa e um arquivo disfarçado de foto, no mesmo envio.
    const resposta = await cadastrarComFotos(navegador, [
      await fotoDeCelular(),
      NAO_E_IMAGEM,
    ]);

    expect(resposta.status).toBe(400);
    expect(resposta.body.campos).toEqual({
      fotos: "Envie a foto em JPG, PNG ou WebP.",
    });
    expect(await banco.animal.count()).toBe(0);
    expect(await arquivosGuardados()).toEqual([]);
  });

  test("mais de 5 fotos, ou uma foto acima de 10 MB, são recusadas", async () => {
    const navegador = await navegadorComConta();

    const muitas = await cadastrarComFotos(navegador, await fotos(6));
    const pesada = await cadastrarComFotos(navegador, [
      Buffer.alloc(11 * 1024 * 1024),
    ]);

    expect(muitas.status).toBe(400);
    expect(muitas.body.campos).toEqual({
      fotos: "Cada animal pode ter até 5 fotos.",
    });
    expect(pesada.status).toBe(413);
    expect(pesada.body.campos).toEqual({
      fotos: "Cada foto pode ter no máximo 10 MB.",
    });
    expect(await banco.animal.count()).toBe(0);
    expect(await arquivosGuardados()).toEqual([]);
  });

  test("na edição, reordena, remove e acrescenta de uma vez", async () => {
    const navegador = await navegadorComConta();
    const { body } = await cadastrarComFotos(navegador, await fotos(3));
    const [a, b, c] = body.animal.fotos;

    // C passa a ser a principal, entra uma nova em segundo, A vai para o
    // fim e B sai.
    const resposta = await editarComFotos(
      navegador,
      body.animal.codigo,
      { fotos: [c.id, "nova", a.id] },
      [await fotoDeCelular()],
    );

    expect(resposta.status).toBe(200);
    const depois = resposta.body.animal.fotos;
    expect(depois.map((f) => f.id)).toEqual([c.id, depois[1].id, a.id]);
    expect([a.id, b.id, c.id]).not.toContain(depois[1].id);
    // O arquivo da foto removida sai da pasta.
    expect((await baixar(b.url)).status).toBe(404);
    expect(await arquivosGuardados()).toHaveLength(3);
  });

  test("sem a lista, as fotos enviadas entram no fim, até o limite de 5", async () => {
    const navegador = await navegadorComConta();
    const { body } = await cadastrarComFotos(navegador, await fotos(4));
    const codigo = body.animal.codigo;

    const passa = await editarComFotos(navegador, codigo, {}, await fotos(2));
    expect(passa.status).toBe(400);
    expect(passa.body.campos).toEqual({
      fotos: "Cada animal pode ter até 5 fotos.",
    });

    const cabe = await editarComFotos(navegador, codigo, {}, await fotos(1));
    expect(cabe.body.animal.fotos).toHaveLength(5);
    expect(cabe.body.animal.fotos.slice(0, 4)).toEqual(body.animal.fotos);
    expect(await arquivosGuardados()).toHaveLength(5);
  });

  test("a lista não aceita foto de outro animal nem número errado de fotos novas", async () => {
    const navegador = await navegadorComConta();
    const rex = await cadastrarComFotos(navegador, await fotos(1));
    const mia = await cadastrarComFotos(navegador, await fotos(1), {
      ...zeus,
      nome: "Mia",
    });
    const fotoDaMia = mia.body.animal.fotos[0].id;
    const codigo = rex.body.animal.codigo;
    const mensagem = { fotos: "Lista de fotos inválida." };

    const alheia = await editarComFotos(navegador, codigo, {
      fotos: [fotoDaMia],
    });
    const semArquivo = await editarComFotos(navegador, codigo, {
      fotos: ["nova"],
    });

    expect(alheia.body.campos).toEqual(mensagem);
    expect(semArquivo.body.campos).toEqual(mensagem);
    // A foto da Mia continua com ela.
    expect((await baixar(mia.body.animal.fotos[0].url)).status).toBe(200);
  });

  test("ninguém mexe nas fotos do animal de outra pessoa", async () => {
    const navegador = await navegadorComConta();
    const { body } = await cadastrarComFotos(navegador, await fotos(2));
    const outro = await navegadorComConta(outroTutor);

    const remover = await editarComFotos(outro, body.animal.codigo, {
      fotos: [],
    });
    const acrescentar = await editarComFotos(
      outro,
      body.animal.codigo,
      {},
      await fotos(1),
    );

    expect(remover.status).toBe(404);
    expect(acrescentar.status).toBe(404);
    expect(await banco.animalFoto.count()).toBe(2);
    expect(await arquivosGuardados()).toHaveLength(2);
  });

  test("sem entrar, ninguém envia foto", async () => {
    const resposta = await cadastrarComFotos(request(app), await fotos(1));

    expect(resposta.status).toBe(401);
    expect(await arquivosGuardados()).toEqual([]);
  });

  test("excluir o animal apaga os arquivos das fotos", async () => {
    const navegador = await navegadorComConta();
    const { body } = await cadastrarComFotos(navegador, await fotos(2));

    await navegador.delete(`/api/animais/${body.animal.codigo}`).expect(204);

    expect(await arquivosGuardados()).toEqual([]);
  });

  test("a pasta de fotos só entrega as fotos, sem listar nem sair dela", async () => {
    const navegador = await navegadorComConta();
    await cadastrarComFotos(navegador, await fotos(1));

    for (const endereco of [
      "/api/arquivos/",
      "/api/arquivos/..%2F..%2F.env",
      "/api/arquivos/%2e%2e/package.json",
      "/api/arquivos/.oculto",
    ]) {
      const resposta = await request(app).get(endereco);
      expect(resposta.status).not.toBe(200);
    }
  });
});

describe("foto de perfil (F3)", () => {
  const trocarFoto = (navegador, conteudo) =>
    comArquivos(
      navegador.put("/api/conta/foto"),
      undefined,
      [conteudo],
      "foto",
    );

  test("troca a foto, sem a localização, e o arquivo da anterior sai", async () => {
    const navegador = await navegadorComConta();

    const primeira = await trocarFoto(navegador, await fotoDeCelular());
    const segunda = await trocarFoto(navegador, await fotoDeCelular());

    expect(primeira.status).toBe(200);
    const url = segunda.body.usuario.fotoUrl;
    expect(url).toMatch(/^\/api\/arquivos\/[0-9a-f-]{36}\.webp$/);
    expect(url).not.toBe(primeira.body.usuario.fotoUrl);
    expect((await baixar(primeira.body.usuario.fotoUrl)).status).toBe(404);
    const guardada = await baixar(url);
    expect((await sharp(guardada.body).metadata()).exif).toBeUndefined();
    expect(await arquivosGuardados()).toHaveLength(1);
  });

  test("remover volta para as iniciais e apaga o arquivo", async () => {
    const navegador = await navegadorComConta();
    await trocarFoto(navegador, await fotoDeCelular());

    const resposta = await navegador.delete("/api/conta/foto");

    expect(resposta.status).toBe(200);
    expect(resposta.body.usuario.fotoUrl).toBeNull();
    expect(await arquivosGuardados()).toEqual([]);
  });

  test("recusa o que não é imagem, pedido sem foto ou com duas, e quem não entrou", async () => {
    const navegador = await navegadorComConta();

    const disfarcada = await trocarFoto(navegador, NAO_E_IMAGEM);
    const vazia = await navegador.put("/api/conta/foto");
    const duas = await comArquivos(
      navegador.put("/api/conta/foto"),
      undefined,
      await fotos(2),
      "foto",
    );
    const visitante = await trocarFoto(request(app), await fotoDeCelular());

    expect(disfarcada.body.campos).toEqual({
      foto: "Envie a foto em JPG, PNG ou WebP.",
    });
    expect(vazia.body.campos).toEqual({ foto: "Escolha uma foto." });
    expect(duas.body.campos).toEqual({ foto: "Envie uma foto só." });
    expect(visitante.status).toBe(401);
    expect(await arquivosGuardados()).toEqual([]);
  });

  test("encerrar a conta apaga a foto de perfil e as fotos dos animais", async () => {
    const navegador = await navegadorComConta();
    await trocarFoto(navegador, await fotoDeCelular());
    await cadastrarComFotos(navegador, await fotos(2));
    expect(await arquivosGuardados()).toHaveLength(3);

    await navegador
      .delete("/api/conta")
      .send({ senhaAtual: SENHA })
      .expect(204);

    expect(await arquivosGuardados()).toEqual([]);
  });
});

describe("limite de envios", () => {
  test("60 envios por hora, por conta; mudanças sem arquivo não contam", async () => {
    const navegador = await navegadorComConta();
    const { body } = await navegador.post("/api/animais").send(zeus);
    const foto = await fotoDeCelular({ largura: 40, altura: 30 });

    for (let i = 0; i < 60; i++) {
      await comArquivos(
        navegador.put("/api/conta/foto"),
        undefined,
        [foto],
        "foto",
      ).expect(200);
    }
    const barrado = await comArquivos(
      navegador.put("/api/conta/foto"),
      undefined,
      [foto],
      "foto",
    );

    expect(barrado.status).toBe(429);
    // Tirar o animal da busca não envia arquivo e continua possível.
    await navegador
      .patch(`/api/animais/${body.animal.codigo}`)
      .send({ disponivel: false })
      .expect(200);
  });
});
