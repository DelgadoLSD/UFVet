import { rm } from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";
import request from "supertest";
import { afterAll, beforeEach, describe, expect, test } from "vitest";
import { criarApp } from "../src/app.js";
import { banco } from "../src/banco.js";
import { config } from "../src/config.js";
import { hojeISO } from "../src/datas.js";
import { criarConvite } from "../src/modelos/convite.js";
import {
  arquivosGuardados,
  examesGuardados,
  fotoDeCelular,
  gerarCpf,
  limparArquivos,
  limparBanco,
  limparExames,
  pdfDeExame,
} from "./apoio.js";

// Os exames e documentos dos animais pela API (F14 e F15): o hemograma, as
// sorologias e a carteira de vacinação. O dono envia (imagem ou PDF, NF14.2),
// cada envio vira uma versão nova, e o arquivo só abre para o dono e para os
// veterinários: um laudo costuma trazer o nome, o telefone e o endereço do
// tutor. Cada teste começa com o banco e as pastas de arquivos vazios.

let app;
let hospital;
beforeEach(async () => {
  await limparBanco();
  await limparArquivos();
  await limparExames();
  app = criarApp();
  hospital = await banco.estabelecimento.create({
    data: { nome: "Hospital Veterinário UFV", cidade: "Viçosa", uf: "MG" },
  });
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

const NAO_E_EXAME = Buffer.from("<script>alert('oi')</script>");
const FORMATO = "Envie o exame em PDF, JPG, PNG ou WebP.";

async function navegadorComConta(dados = tutora) {
  const navegador = request.agent(app);
  const resposta = await navegador.post("/api/usuarios").send(dados);
  navegador.codigo = resposta.body.usuario.codigo;
  return navegador;
}

// A veterinária entra pelo caminho de verdade: com um convite do hospital.
async function navegadorDaVeterinaria() {
  const { codigo } = await criarConvite({
    nome: "Camila Rocha Duarte",
    crmv: "45210",
    ufCrmv: "MG",
    estabelecimentoId: hospital.id,
  });
  return navegadorComConta({
    ...tutora,
    papel: "VETERINARIO",
    nomeCompleto: "Camila Rocha Duarte",
    cpf: gerarCpf("987654321"),
    email: "camila@example.com",
    tratamento: "DRA",
    convite: codigo,
  });
}

// A tutora com o Zeus cadastrado.
async function cenario() {
  const tutor = await navegadorComConta();
  const { body } = await tutor.post("/api/animais").send(zeus).expect(201);
  return { tutor, codigo: body.animal.codigo };
}

// Envia um arquivo no campo "arquivo", como o site envia.
const enviar = (
  navegador,
  codigo,
  tipo,
  conteudo,
  { nome = "exame.pdf", tipoDoArquivo = "application/pdf" } = {},
) =>
  navegador
    .post(`/api/animais/${codigo}/documentos/${tipo}`)
    .attach("arquivo", conteudo, {
      filename: nome,
      contentType: tipoDoArquivo,
    });

const comoFoto = { nome: "carteira.jpg", tipoDoArquivo: "image/jpeg" };

// As versões de um tipo de documento, no animal que a API devolveu.
const versoesDe = (animal, tipo) =>
  animal.documentos.find((documento) => documento.tipo === tipo).versoes;

// O arquivo de uma versão, baixado inteiro (`quem` é um navegador logado ou
// a API sem login).
const baixar = (quem, url) =>
  quem
    .get(url)
    .buffer(true)
    .parse((res, pronto) => {
      const partes = [];
      res.on("data", (parte) => partes.push(parte));
      res.on("end", () => pronto(null, Buffer.concat(partes)));
    });

describe("enviar exames (F14)", () => {
  test("a tutora envia o hemograma em PDF: o arquivo fica guardado como veio", async () => {
    const { tutor, codigo } = await cenario();
    const pdf = pdfDeExame();

    const resposta = await enviar(tutor, codigo, "HEMOGRAMA", pdf);

    expect(resposta.status).toBe(201);
    // Os três documentos vêm sempre, na ordem do perfil.
    expect(resposta.body.animal.documentos.map((d) => d.tipo)).toEqual([
      "HEMOGRAMA",
      "SOROLOGIA",
      "VACINACAO",
    ]);
    const [versao] = versoesDe(resposta.body.animal, "HEMOGRAMA");
    expect(versao).toMatchObject({
      enviadoPorNome: "Beatriz dos Reis",
      formato: "pdf",
    });
    expect(versao.arquivoUrl).toMatch(
      /^\/api\/documentos\/versoes\/[0-9a-f-]{36}$/,
    );
    expect(versoesDe(resposta.body.animal, "SOROLOGIA")).toEqual([]);

    const arquivo = await baixar(tutor, versao.arquivoUrl);
    expect(arquivo.status).toBe(200);
    expect(arquivo.headers["content-type"]).toBe("application/pdf");
    expect(arquivo.body.equals(pdf)).toBe(true);
    // Ao salvar, o arquivo leva um nome que diz o que ele é.
    expect(arquivo.headers["content-disposition"]).toBe(
      `inline; filename="hemograma-zeus-${hojeISO()}.pdf"`,
    );
    // Vai para a pasta dos exames, e não para a pasta pública das fotos.
    expect(await examesGuardados()).toHaveLength(1);
    expect(await arquivosGuardados()).toHaveLength(0);
  });

  test("a foto de um exame é regravada em WebP, sem a localização GPS (NF8.5)", async () => {
    const { tutor, codigo } = await cenario();

    const { body } = await enviar(
      tutor,
      codigo,
      "VACINACAO",
      await fotoDeCelular(),
      comoFoto,
    ).expect(201);

    const [versao] = versoesDe(body.animal, "VACINACAO");
    expect(versao.formato).toBe("imagem");
    const arquivo = await baixar(tutor, versao.arquivoUrl);
    expect(arquivo.headers["content-type"]).toBe("image/webp");
    const dados = await sharp(arquivo.body).metadata();
    expect(dados.format).toBe("webp");
    expect(dados.exif).toBeUndefined();
  });

  test("um exame refeito entra como versão nova, e a anterior continua (F15)", async () => {
    const { tutor, codigo } = await cenario();
    await enviar(tutor, codigo, "SOROLOGIA", pdfDeExame("março")).expect(201);

    const { body } = await enviar(
      tutor,
      codigo,
      "SOROLOGIA",
      pdfDeExame("outubro"),
    ).expect(201);

    // Da primeira enviada à última.
    const versoes = versoesDe(body.animal, "SOROLOGIA");
    expect(versoes).toHaveLength(2);
    expect(
      new Date(versoes[0].enviadoEm) <= new Date(versoes[1].enviadoEm),
    ).toBe(true);
    const primeira = await baixar(tutor, versoes[0].arquivoUrl);
    const segunda = await baixar(tutor, versoes[1].arquivoUrl);
    expect(primeira.body.equals(pdfDeExame("março"))).toBe(true);
    expect(segunda.body.equals(pdfDeExame("outubro"))).toBe(true);
    expect(await examesGuardados()).toHaveLength(2);
    // Um documento só, com as duas versões.
    expect(await banco.documento.count()).toBe(1);
  });

  test("o tipo vem do endereço, sem diferenciar maiúsculas; um tipo que não existe é recusado", async () => {
    const { tutor, codigo } = await cenario();

    await enviar(tutor, codigo, "hemograma", pdfDeExame()).expect(201);
    const errado = await enviar(tutor, codigo, "RAIO_X", pdfDeExame());

    expect(errado.status).toBe(404);
    expect(errado.body.erro).toBe("Tipo de documento não encontrado.");
    expect(await examesGuardados()).toHaveLength(1);
  });

  test("arquivo que não é imagem nem PDF é recusado no campo, e nada fica guardado", async () => {
    const { tutor, codigo } = await cenario();

    // O nome e o tipo dizem PDF, mas o conteúdo não é.
    const resposta = await enviar(tutor, codigo, "HEMOGRAMA", NAO_E_EXAME);

    expect(resposta.status).toBe(400);
    expect(resposta.body.campos).toEqual({ arquivo: FORMATO });
    expect(await examesGuardados()).toHaveLength(0);
    expect(await banco.documento.count()).toBe(0);
  });

  test("sem arquivo, a mensagem diz o que fazer", async () => {
    const { tutor, codigo } = await cenario();

    const resposta = await tutor
      .post(`/api/animais/${codigo}/documentos/HEMOGRAMA`)
      .send({});

    expect(resposta.status).toBe(400);
    expect(resposta.body.campos).toEqual({
      arquivo: "Escolha o arquivo do exame.",
    });
  });

  test("arquivo acima de 10 MB é barrado antes de ser tratado", async () => {
    const { tutor, codigo } = await cenario();
    const grande = Buffer.concat([
      pdfDeExame(),
      Buffer.alloc(10 * 1024 * 1024),
    ]);

    const resposta = await enviar(tutor, codigo, "HEMOGRAMA", grande);

    expect(resposta.status).toBe(413);
    expect(resposta.body.campos).toEqual({
      arquivo: "O arquivo pode ter no máximo 10 MB.",
    });
    expect(await examesGuardados()).toHaveLength(0);
  });

  test("dois arquivos de uma vez são recusados", async () => {
    const { tutor, codigo } = await cenario();

    const resposta = await tutor
      .post(`/api/animais/${codigo}/documentos/HEMOGRAMA`)
      .attach("arquivo", pdfDeExame(), "um.pdf")
      .attach("arquivo", pdfDeExame(), "outro.pdf");

    expect(resposta.status).toBe(400);
    expect(resposta.body.campos).toEqual({ arquivo: "Envie um arquivo só." });
    expect(await examesGuardados()).toHaveLength(0);
  });

  test("só o dono envia: os outros recebem 'não encontrado', e o visitante precisa entrar", async () => {
    const { codigo } = await cenario();
    const caio = await navegadorComConta(outroTutor);
    const vet = await navegadorDaVeterinaria();

    for (const navegador of [caio, vet]) {
      const resposta = await enviar(
        navegador,
        codigo,
        "HEMOGRAMA",
        pdfDeExame(),
      );
      expect(resposta.status).toBe(404);
      expect(resposta.body.erro).toBe("Animal não encontrado.");
    }
    const visitante = await enviar(
      request(app),
      codigo,
      "HEMOGRAMA",
      pdfDeExame(),
    );
    expect(visitante.status).toBe(401);
    expect(await examesGuardados()).toHaveLength(0);
  });
});

describe("quem abre os exames", () => {
  // A tutora com o hemograma do Zeus enviado.
  async function comHemograma() {
    const { tutor, codigo } = await cenario();
    const { body } = await enviar(tutor, codigo, "HEMOGRAMA", pdfDeExame());
    const [versao] = versoesDe(body.animal, "HEMOGRAMA");
    return { tutor, codigo, url: versao.arquivoUrl };
  }

  const versaoNoPerfil = async (quem, codigoTutor) => {
    const { body } = await quem
      .get(`/api/usuarios/${codigoTutor}/animais`)
      .expect(200);
    return versoesDe(body.animais[0], "HEMOGRAMA")[0];
  };

  test("no perfil, todos veem que o exame existe; o endereço do arquivo só vai para o dono e os veterinários", async () => {
    const { tutor } = await comHemograma();
    const caio = await navegadorComConta(outroTutor);
    const vet = await navegadorDaVeterinaria();

    for (const quem of [request(app), caio]) {
      const versao = await versaoNoPerfil(quem, tutor.codigo);
      expect(versao).toMatchObject({
        enviadoPorNome: "Beatriz dos Reis",
        formato: "pdf",
        arquivoUrl: null,
      });
    }
    for (const quem of [tutor, vet]) {
      const versao = await versaoNoPerfil(quem, tutor.codigo);
      expect(versao.arquivoUrl).toMatch(/^\/api\/documentos\/versoes\//);
    }
  });

  test("o arquivo só abre para o dono e para os veterinários", async () => {
    const { tutor, url } = await comHemograma();
    const caio = await navegadorComConta(outroTutor);
    const vet = await navegadorDaVeterinaria();

    expect((await baixar(tutor, url)).status).toBe(200);
    expect((await baixar(vet, url)).status).toBe(200);

    const deOutroTutor = await caio.get(url);
    expect(deOutroTutor.status).toBe(403);
    expect(deOutroTutor.body.erro).toBe(
      "Só o tutor do animal e os veterinários abrem os exames.",
    );
    expect((await request(app).get(url)).status).toBe(401);
  });

  test("o navegador não guarda cópia, e a política de segurança não deixa rodar nada", async () => {
    const { tutor, url } = await comHemograma();

    const arquivo = await baixar(tutor, url);

    expect(arquivo.headers["cache-control"]).toBe("private, no-store");
    expect(arquivo.headers["content-security-policy"]).toContain(
      "default-src 'none'",
    );
    expect(arquivo.headers["content-security-policy"]).toContain(
      "frame-ancestors 'self'",
    );
    expect(arquivo.headers["x-content-type-options"]).toBe("nosniff");
  });

  test("versão que não existe, ou endereço mal formado, dá 'não encontrado'", async () => {
    const { tutor } = await comHemograma();

    for (const id of ["00000000-0000-4000-8000-000000000000", "nao-e-um-id"]) {
      const resposta = await tutor.get(`/api/documentos/versoes/${id}`);
      expect(resposta.status).toBe(404);
      expect(resposta.body.erro).toBe("Exame não encontrado.");
    }
  });

  test("o exame não sai pela pasta pública das fotos", async () => {
    await comHemograma();
    const [nome] = await examesGuardados();

    const resposta = await request(app).get(`/api/arquivos/${nome}`);

    expect(resposta.status).toBe(404);
  });

  test("arquivo que sumiu da pasta: a versão continua, e quem abre fica sabendo o que fazer", async () => {
    const { tutor, url } = await comHemograma();
    const [nome] = await examesGuardados();
    await rm(path.join(config.pastaExames, nome));

    const resposta = await tutor.get(url);

    expect(resposta.status).toBe(404);
    expect(resposta.body.erro).toBe(
      "O arquivo deste exame não está mais guardado. Ele precisa ser enviado de novo.",
    );
    expect(resposta.headers["content-disposition"]).toBeUndefined();
  });
});

describe("os arquivos saem junto com o animal e com a conta", () => {
  test("excluir o animal apaga os arquivos dos exames", async () => {
    const { tutor, codigo } = await cenario();
    await enviar(tutor, codigo, "HEMOGRAMA", pdfDeExame()).expect(201);
    await enviar(
      tutor,
      codigo,
      "VACINACAO",
      await fotoDeCelular(),
      comoFoto,
    ).expect(201);
    expect(await examesGuardados()).toHaveLength(2);

    await tutor.delete(`/api/animais/${codigo}`).expect(204);

    expect(await examesGuardados()).toHaveLength(0);
    expect(await banco.documentoVersao.count()).toBe(0);
  });

  test("encerrar a conta apaga os arquivos dos exames dos animais dela", async () => {
    const { tutor, codigo } = await cenario();
    await enviar(tutor, codigo, "SOROLOGIA", pdfDeExame()).expect(201);
    // O exame do animal de outra pessoa fica.
    const caio = await navegadorComConta(outroTutor);
    const { body } = await caio.post("/api/animais").send(zeus).expect(201);
    await enviar(caio, body.animal.codigo, "SOROLOGIA", pdfDeExame()).expect(
      201,
    );

    await tutor.delete("/api/conta").send({ senhaAtual: SENHA }).expect(204);

    expect(await examesGuardados()).toHaveLength(1);
    expect(await banco.documentoVersao.count()).toBe(1);
  });
});

describe("apagar uma versão (o arquivo errado) e a validação (F21)", () => {
  const todosAtendidos = {
    TIPAGEM: true,
    PESO_IDADE: true,
    VACINACAO: true,
    SOROLOGIAS: true,
    SEM_TRANSFUSAO: true,
  };

  // A tutora com o Zeus e a veterinária. `antes` são os exames que a tutora
  // envia antes da validação; a veterinária então valida com `criterios`.
  async function validadoCom(antes, criterios = todosAtendidos) {
    const { tutor, codigo } = await cenario();
    const vet = await navegadorDaVeterinaria();
    for (const [tipo, conteudo, opcoes] of antes) {
      await enviar(tutor, codigo, tipo, conteudo, opcoes).expect(201);
    }
    await vet
      .post(`/api/animais/${codigo}/validacoes`)
      .send({
        criterios,
        tipoSanguineo: criterios.TIPAGEM ? "DEA 1.1+" : null,
      })
      .expect(201);
    return { tutor, vet, codigo };
  }

  // O animal como a dona o vê, e a última versão de um documento dele.
  const animalDaDona = async (tutor) =>
    (await tutor.get(`/api/usuarios/${tutor.codigo}/animais`).expect(200)).body
      .animais[0];
  const ultimaVersao = async (tutor, tipo) =>
    versoesDe(await animalDaDona(tutor), tipo).at(-1);
  const apagar = (navegador, versao) =>
    navegador.delete(`/api/documentos/versoes/${versao.id}`);
  // Se o Zeus aparece como validado na busca.
  const validadoNaBusca = async () => {
    const { body } = await request(app).get("/api/doadores?especie=CAO");
    return body.doadores[0].validado;
  };

  test("o arquivo errado, enviado depois da validação, sai sem mexer nela", async () => {
    const { tutor, codigo } = await validadoCom([
      ["SOROLOGIA", pdfDeExame("conferida")],
    ]);
    await enviar(
      tutor,
      codigo,
      "SOROLOGIA",
      await fotoDeCelular(),
      comoFoto,
    ).expect(201);
    const errada = await ultimaVersao(tutor, "SOROLOGIA");
    expect(errada.criterioAfetado).toBeNull();
    expect(await examesGuardados()).toHaveLength(2);

    const resposta = await apagar(tutor, errada);

    expect(resposta.status).toBe(200);
    expect(resposta.body.criterioInvalidado).toBeNull();
    const versoes = versoesDe(resposta.body.animal, "SOROLOGIA");
    expect(versoes).toHaveLength(1);
    expect(versoes[0].formato).toBe("pdf");
    expect(resposta.body.animal.validacoes[0].invalidacao).toBeNull();
    expect(await validadoNaBusca()).toBe(true);
    expect(await examesGuardados()).toHaveLength(1);
    // O endereço da versão apagada não abre mais nada.
    expect((await tutor.get(errada.arquivoUrl)).status).toBe(404);
  });

  test("apagar a sorologia que a validação conferiu tira o efeito do critério, e o Zeus sai dos validados", async () => {
    const { tutor } = await validadoCom([["SOROLOGIA", pdfDeExame()]]);
    const conferida = await ultimaVersao(tutor, "SOROLOGIA");
    // O site sabe antes, para avisar a tutora.
    expect(conferida.criterioAfetado).toBe("SOROLOGIAS");
    expect(await validadoNaBusca()).toBe(true);

    const resposta = await apagar(tutor, conferida).expect(200);

    expect(resposta.body.criterioInvalidado).toBe("SOROLOGIAS");
    const validacao = resposta.body.animal.validacoes[0];
    expect(validacao.invalidacao.motivo).toBe("EXCLUSAO_SOROLOGIA");
    // O que foi assinado não muda: só perde o efeito.
    expect(validacao.criterios.SOROLOGIAS).toBe(true);
    expect(await validadoNaBusca()).toBe(false);
    // Sem versões, o documento sai junto.
    expect(versoesDe(resposta.body.animal, "SOROLOGIA")).toEqual([]);
    expect(await banco.documento.count()).toBe(0);
    expect(await examesGuardados()).toHaveLength(0);
  });

  test("com a carteira de vacinação, quem perde o efeito é o critério da vacinação", async () => {
    const { tutor } = await validadoCom([
      ["VACINACAO", await fotoDeCelular(), comoFoto],
    ]);

    const resposta = await apagar(
      tutor,
      await ultimaVersao(tutor, "VACINACAO"),
    ).expect(200);

    expect(resposta.body.criterioInvalidado).toBe("VACINACAO");
    expect(resposta.body.animal.validacoes[0].invalidacao.motivo).toBe(
      "EXCLUSAO_VACINACAO",
    );
  });

  test("o hemograma não comprova nenhum critério: apagar não mexe na validação", async () => {
    const { tutor } = await validadoCom([["HEMOGRAMA", pdfDeExame()]]);
    const hemograma = await ultimaVersao(tutor, "HEMOGRAMA");
    expect(hemograma.criterioAfetado).toBeNull();

    const resposta = await apagar(tutor, hemograma).expect(200);

    expect(resposta.body.criterioInvalidado).toBeNull();
    expect(resposta.body.animal.validacoes[0].invalidacao).toBeNull();
  });

  test("critério que o veterinário não marcou como atendido não tem o que perder", async () => {
    const { tutor } = await validadoCom([["SOROLOGIA", pdfDeExame()]], {
      ...todosAtendidos,
      SOROLOGIAS: false,
    });

    const resposta = await apagar(
      tutor,
      await ultimaVersao(tutor, "SOROLOGIA"),
    ).expect(200);

    expect(resposta.body.criterioInvalidado).toBeNull();
    expect(resposta.body.animal.validacoes[0].invalidacao).toBeNull();
  });

  test("validação vencida, ou que já perdeu o efeito, fica como estava", async () => {
    const { tutor } = await validadoCom([
      ["SOROLOGIA", pdfDeExame("um")],
      ["SOROLOGIA", pdfDeExame("dois")],
    ]);
    const [primeira, segunda] = versoesDe(
      await animalDaDona(tutor),
      "SOROLOGIA",
    );

    // Vencida há anos.
    await banco.validacao.updateMany({
      data: { validaAte: new Date("2020-01-01") },
    });
    const vencida = await apagar(tutor, primeira).expect(200);
    expect(vencida.body.criterioInvalidado).toBeNull();
    expect(vencida.body.animal.validacoes[0].invalidacao).toBeNull();

    // Já sem efeito, por outro motivo: o motivo continua o primeiro.
    await banco.validacao.updateMany({
      data: {
        validaAte: new Date("2099-01-01"),
        invalidadaEm: new Date(),
        invalidadaMotivo: "EDICAO_PESO",
      },
    });
    const semEfeito = await apagar(tutor, segunda).expect(200);
    expect(semEfeito.body.criterioInvalidado).toBeNull();
    expect(semEfeito.body.animal.validacoes[0].invalidacao.motivo).toBe(
      "EDICAO_PESO",
    );
  });

  test("só a dona apaga: os outros recebem 'não encontrado', e o visitante precisa entrar", async () => {
    const { tutor, vet } = await validadoCom([["SOROLOGIA", pdfDeExame()]]);
    const versao = await ultimaVersao(tutor, "SOROLOGIA");
    const caio = await navegadorComConta(outroTutor);

    for (const navegador of [caio, vet]) {
      const resposta = await apagar(navegador, versao);
      expect(resposta.status).toBe(404);
      expect(resposta.body.erro).toBe("Exame não encontrado.");
    }
    expect((await apagar(request(app), versao)).status).toBe(401);
    // Nada mudou: a versão, o arquivo e a validação continuam.
    expect((await ultimaVersao(tutor, "SOROLOGIA")).id).toBe(versao.id);
    expect(await examesGuardados()).toHaveLength(1);
    expect(await validadoNaBusca()).toBe(true);
  });

  test("versão que não existe dá 'não encontrado'", async () => {
    const { tutor } = await cenario();

    const resposta = await tutor.delete(
      "/api/documentos/versoes/00000000-0000-4000-8000-000000000000",
    );

    expect(resposta.status).toBe(404);
    expect(resposta.body.erro).toBe("Exame não encontrado.");
  });
});
