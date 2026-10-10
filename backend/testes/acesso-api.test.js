import request from "supertest";
import {
  afterAll,
  beforeAll,
  beforeEach,
  describe,
  expect,
  test,
} from "vitest";
import { criarApp } from "../src/app.js";
import { banco } from "../src/banco.js";
import { gerarHashSenha } from "../src/senha.js";
import {
  criarAnimal,
  criarTutor,
  criarVeterinario,
  gerarCpf,
  limparBanco,
} from "./apoio.js";

// O acesso aos contatos dos doadores pela API (F27 a F34): o tutor pede a
// liberação a um veterinário; o veterinário libera, recusa, renova e
// encerra; a liberação vence sozinha. Cada teste cria uma API nova (com os
// limites zerados) sobre um banco vazio, com duas tutoras e dois
// veterinários do mesmo hospital.

const SENHA = "senha-dos-testes";
const HORA = 60 * 60 * 1000;

let senhaHash;
beforeAll(async () => {
  senhaHash = await gerarHashSenha(SENHA);
});
afterAll(() => banco.$disconnect());

let app;
let hospital;
let beatriz;
let camila;
let victor;
let paulo;
beforeEach(async () => {
  await limparBanco();
  app = criarApp();
  hospital = await banco.estabelecimento.create({
    data: { nome: "Hospital Veterinário UFV", cidade: "Viçosa", uf: "MG" },
  });
  beatriz = await criarTutor({
    nome: "Beatriz dos Reis",
    email: "beatriz@example.com",
    cpf: gerarCpf("111444777"),
  });
  camila = await criarTutor({
    nome: "Camila Nunes",
    email: "camila@example.com",
    cpf: gerarCpf("161803398"),
  });
  victor = await criarVeterinario({
    nome: "Victor Hugo Martins",
    email: "victor@example.com",
    cpf: gerarCpf("084512336"),
    crmv: "78120",
    estabelecimentoId: hospital.id,
  });
  paulo = await criarVeterinario({
    nome: "Paulo Rezende",
    email: "paulo@example.com",
    cpf: gerarCpf("333444555"),
    crmv: "88214",
    estabelecimentoId: hospital.id,
  });
});

// Um navegador logado como a pessoa, pelo login de verdade.
async function entrar(usuario, email) {
  await banco.usuario.update({
    where: { id: usuario.id },
    data: { senhaHash },
  });
  const navegador = request.agent(app);
  await navegador.post("/api/sessao").send({ email, senha: SENHA }).expect(200);
  return navegador;
}
const comoBeatriz = () => entrar(beatriz, "beatriz@example.com");
const comoCamila = () => entrar(camila, "camila@example.com");
const comoVictor = () => entrar(victor, "victor@example.com");
const comoPaulo = () => entrar(paulo, "paulo@example.com");

// Uma liberação gravada direto no banco, com o prazo escolhido.
const liberacaoNoBanco = (
  tutor,
  veterinario,
  { expiraEm, encerradaEm = null },
) =>
  banco.liberacaoContato.create({
    data: {
      tutorId: tutor.id,
      veterinarioId: veterinario.id,
      duracaoHoras: 24,
      expiraEm,
      encerradaEm,
    },
  });

const pedidoNoBanco = (tutor, veterinario, caso = "Luna precisa de sangue") =>
  banco.pedidoLiberacao.create({
    data: { tutorId: tutor.id, veterinarioId: veterinario.id, caso },
  });

describe("pedido de liberação (F27)", () => {
  test("a tutora pede a um veterinário pelo código, com o caso", async () => {
    const tutora = await comoBeatriz();
    const { body } = await tutora
      .post("/api/pedidos")
      .send({
        veterinario: `#${victor.codigo.toLowerCase()}`,
        caso: "  Luna precisa de transfusão hoje  ",
      })
      .expect(201);

    expect(body.pedido).toMatchObject({
      caso: "Luna precisa de transfusão hoje",
      tutor: { codigo: beatriz.codigo, nomeCompleto: "Beatriz dos Reis" },
      veterinario: {
        codigo: victor.codigo,
        tratamento: "DR",
        estabelecimento: { nome: "Hospital Veterinário UFV" },
      },
    });
    // Sem contato de ninguém na resposta.
    expect(JSON.stringify(body)).not.toMatch(/@|98871|cpf/i);

    const { body: acesso } = await tutora.get("/api/acesso").expect(200);
    expect(acesso.pedido.veterinario.codigo).toBe(victor.codigo);
    expect(acesso.liberacao).toBeNull();
  });

  test("o caso é obrigatório e precisa dizer alguma coisa (NF27.4)", async () => {
    const tutora = await comoBeatriz();
    const { body } = await tutora
      .post("/api/pedidos")
      .send({ veterinario: victor.codigo, caso: "oi" })
      .expect(400);
    expect(body.campos.caso).toMatch(/pelo menos 5 caracteres/);
  });

  test("vai para um veterinário que existe (NF27.1), e não para um tutor", async () => {
    const tutora = await comoBeatriz();
    const inexistente = await tutora
      .post("/api/pedidos")
      .send({ veterinario: "VZZZZZ", caso: "Luna precisa de sangue" })
      .expect(400);
    expect(inexistente.body.campos.veterinario).toMatch(
      /Nenhum veterinário com o código #VZZZZZ/,
    );

    const deTutor = await tutora
      .post("/api/pedidos")
      .send({ veterinario: camila.codigo, caso: "Luna precisa de sangue" })
      .expect(400);
    expect(deTutor.body.campos.veterinario).toMatch(/Nenhum veterinário/);

    const semVeterinario = await tutora
      .post("/api/pedidos")
      .send({ caso: "Luna precisa de sangue" })
      .expect(400);
    expect(semVeterinario.body.campos.veterinario).toMatch(
      /Escolha o veterinário/,
    );
  });

  test("só um pedido esperando resposta por vez (NF27.3)", async () => {
    const tutora = await comoBeatriz();
    await tutora
      .post("/api/pedidos")
      .send({ veterinario: victor.codigo, caso: "Luna precisa de sangue" })
      .expect(201);
    const { body } = await tutora
      .post("/api/pedidos")
      .send({ veterinario: paulo.codigo, caso: "Luna precisa de sangue" })
      .expect(409);
    expect(body.erro).toMatch(
      /já tem um pedido esperando resposta de Dr\. Victor/,
    );
    expect(await banco.pedidoLiberacao.count()).toBe(1);
  });

  test("dois pedidos ao mesmo tempo (clique duplo) gravam um só", async () => {
    const tutora = await comoBeatriz();
    const pedir = () =>
      tutora
        .post("/api/pedidos")
        .send({ veterinario: victor.codigo, caso: "Luna precisa de sangue" });
    const respostas = await Promise.all([pedir(), pedir(), pedir()]);
    expect(respostas.map((r) => r.status).sort()).toEqual([201, 409, 409]);
    expect(await banco.pedidoLiberacao.count()).toBe(1);
  });

  test("quem já está com o acesso liberado não precisa pedir", async () => {
    await liberacaoNoBanco(beatriz, paulo, {
      expiraEm: new Date(Date.now() + 5 * HORA),
    });
    const tutora = await comoBeatriz();
    const { body } = await tutora
      .post("/api/pedidos")
      .send({ veterinario: victor.codigo, caso: "Luna precisa de sangue" })
      .expect(409);
    expect(body.erro).toMatch(/já está liberado/);
  });

  test("veterinário não pede: ele já vê os contatos", async () => {
    const vet = await comoVictor();
    const { body } = await vet
      .post("/api/pedidos")
      .send({ veterinario: paulo.codigo, caso: "Preciso de sangue" })
      .expect(403);
    expect(body.erro).toMatch(/Veterinários já veem os contatos/);
    const acesso = await vet.get("/api/acesso").expect(200);
    expect(acesso.body.veterinario).toBe(true);
  });

  test("sem login, nada de pedido", async () => {
    await request(app)
      .post("/api/pedidos")
      .send({ veterinario: victor.codigo, caso: "Luna precisa de sangue" })
      .expect(401);
    await request(app).get("/api/acesso").expect(401);
  });
});

describe("pedidos que chegam ao veterinário e a recusa (F29)", () => {
  test("cada veterinário vê só os pedidos endereçados a ele", async () => {
    await pedidoNoBanco(beatriz, victor, "Luna, transfusão");
    await pedidoNoBanco(camila, paulo, "Amora, transfusão");
    const { body } = await (await comoVictor()).get("/api/pedidos").expect(200);
    expect(body.pedidos.map((p) => p.caso)).toEqual(["Luna, transfusão"]);
    expect(body.pedidos[0].tutor.codigo).toBe(beatriz.codigo);
  });

  test("tutor não lê a lista de pedidos", async () => {
    await (await comoBeatriz()).get("/api/pedidos").expect(403);
  });

  test("recusar deixa o pedido como recusado, e a tutora pode pedir de novo", async () => {
    const pedido = await pedidoNoBanco(beatriz, victor);
    const vet = await comoVictor();
    await vet.post(`/api/pedidos/${pedido.id}/recusa`).expect(204);

    const gravado = await banco.pedidoLiberacao.findUnique({
      where: { id: pedido.id },
    });
    expect(gravado.status).toBe("RECUSADO");
    expect(gravado.respondidoEm).toBeInstanceOf(Date);
    expect((await vet.get("/api/pedidos")).body.pedidos).toEqual([]);

    const recusar = await vet
      .post(`/api/pedidos/${pedido.id}/recusa`)
      .expect(409);
    expect(recusar.body.erro).toMatch(/já foi recusado/);

    await (
      await comoBeatriz()
    )
      .post("/api/pedidos")
      .send({ veterinario: paulo.codigo, caso: "Luna precisa de sangue" })
      .expect(201);
  });

  test("o pedido de outro veterinário não é encontrado", async () => {
    const pedido = await pedidoNoBanco(beatriz, victor);
    await (
      await comoPaulo()
    )
      .post(`/api/pedidos/${pedido.id}/recusa`)
      .expect(404);
    await (
      await comoPaulo()
    )
      .post("/api/pedidos/nao-e-um-id/recusa")
      .expect(404);
    const gravado = await banco.pedidoLiberacao.findUnique({
      where: { id: pedido.id },
    });
    expect(gravado.status).toBe("PENDENTE");
  });
});

describe("liberação (F28) e o pedido que perde a finalidade (F34)", () => {
  test("o veterinário libera pelo código, pelo prazo escolhido (NF28.2)", async () => {
    const vet = await comoVictor();
    const antes = Date.now();
    const { body } = await vet
      .post("/api/liberacoes")
      .send({
        tutor: beatriz.codigo,
        duracaoHoras: 72,
        caso: "Luna, transfusão",
      })
      .expect(201);

    expect(body.liberacao).toMatchObject({
      tutor: { codigo: beatriz.codigo },
      veterinario: { codigo: victor.codigo },
      caso: "Luna, transfusão",
      duracaoHoras: 72,
    });
    const expira = new Date(body.liberacao.expiraEm).getTime();
    expect(expira - antes).toBeGreaterThanOrEqual(72 * HORA - 1000);
    expect(expira - antes).toBeLessThanOrEqual(72 * HORA + 5000);

    // A tutora passa a ver o contato dos doadores (F33).
    const tutora = await comoBeatriz();
    const acesso = await tutora.get("/api/acesso").expect(200);
    expect(acesso.body.liberacao.veterinario.codigo).toBe(victor.codigo);
    await tutora.get(`/api/usuarios/${camila.codigo}/contato`).expect(200);
  });

  test("só os prazos previstos: 24 horas, 3 dias ou 7 dias", async () => {
    const vet = await comoVictor();
    const { body } = await vet
      .post("/api/liberacoes")
      .send({ tutor: beatriz.codigo, duracaoHoras: 1000 })
      .expect(400);
    expect(body.campos.duracaoHoras).toMatch(/24 horas, 3 dias ou 7 dias/);
    expect(await banco.liberacaoContato.count()).toBe(0);
  });

  test("só veterinário libera (NF28.1)", async () => {
    await (
      await comoCamila()
    )
      .post("/api/liberacoes")
      .send({ tutor: beatriz.codigo, duracaoHoras: 24 })
      .expect(403);
    expect(await banco.liberacaoContato.count()).toBe(0);
  });

  test("o código precisa ser de um tutor que existe", async () => {
    const vet = await comoVictor();
    const inexistente = await vet
      .post("/api/liberacoes")
      .send({ tutor: "TZZZZZ", duracaoHoras: 24 })
      .expect(400);
    expect(inexistente.body.campos.tutor).toMatch(
      /Nenhum tutor com o código #TZZZZZ/,
    );
    const deVet = await vet
      .post("/api/liberacoes")
      .send({ tutor: paulo.codigo, duracaoHoras: 24 })
      .expect(400);
    expect(deVet.body.campos.tutor).toMatch(/é de um veterinário/);
  });

  test("quem já tem liberação ativa, mesmo de outro veterinário, não recebe outra (NF28.4)", async () => {
    await liberacaoNoBanco(beatriz, paulo, {
      expiraEm: new Date(Date.now() + 5 * HORA),
    });
    const { body } = await (
      await comoVictor()
    )
      .post("/api/liberacoes")
      .send({ tutor: beatriz.codigo, duracaoHoras: 24 })
      .expect(409);
    expect(body.erro).toMatch(
      /Beatriz dos Reis já está com o acesso liberado por Dr\. Paulo/,
    );
    expect(await banco.liberacaoContato.count()).toBe(1);
  });

  test("uma liberação vencida ou encerrada não impede liberar de novo", async () => {
    await liberacaoNoBanco(beatriz, paulo, {
      expiraEm: new Date(Date.now() - HORA),
    });
    await liberacaoNoBanco(beatriz, paulo, {
      expiraEm: new Date(Date.now() + 5 * HORA),
      encerradaEm: new Date(),
    });
    await (
      await comoVictor()
    )
      .post("/api/liberacoes")
      .send({ tutor: beatriz.codigo, duracaoHoras: 24 })
      .expect(201);
  });

  test("dois veterinários liberando a mesma tutora ao mesmo tempo gravam uma liberação só", async () => {
    const [vet1, vet2] = [await comoVictor(), await comoPaulo()];
    const liberar = (vet) =>
      vet
        .post("/api/liberacoes")
        .send({ tutor: beatriz.codigo, duracaoHoras: 24 });
    const respostas = await Promise.all([
      liberar(vet1),
      liberar(vet2),
      liberar(vet1),
    ]);
    expect(respostas.map((r) => r.status).sort()).toEqual([201, 409, 409]);
    expect(await banco.liberacaoContato.count()).toBe(1);
  });

  test("aceitar um pedido libera a tutora dele e marca o pedido como atendido", async () => {
    const pedido = await pedidoNoBanco(
      beatriz,
      victor,
      "Luna precisa de transfusão hoje",
    );
    const { body } = await (
      await comoVictor()
    )
      .post("/api/liberacoes")
      .send({ pedido: pedido.id, duracaoHoras: 24 })
      .expect(201);

    // O caso continua no pedido; a liberação aponta para ele.
    expect(body.liberacao.caso).toBe("Luna precisa de transfusão hoje");
    expect(body.liberacao.tutor.codigo).toBe(beatriz.codigo);
    const gravado = await banco.pedidoLiberacao.findUnique({
      where: { id: pedido.id },
    });
    expect(gravado.status).toBe("ATENDIDO");
    const liberacao = await banco.liberacaoContato.findFirst();
    expect(liberacao.pedidoId).toBe(pedido.id);
  });

  test("só o veterinário do pedido o aceita", async () => {
    const pedido = await pedidoNoBanco(beatriz, victor);
    await (
      await comoPaulo()
    )
      .post("/api/liberacoes")
      .send({ pedido: pedido.id, duracaoHoras: 24 })
      .expect(404);
    expect(await banco.liberacaoContato.count()).toBe(0);
  });

  test("liberada pelo código, o pedido que ela tinha com outro veterinário deixa de existir (F34)", async () => {
    const pedido = await pedidoNoBanco(beatriz, paulo);
    await (
      await comoVictor()
    )
      .post("/api/liberacoes")
      .send({ tutor: beatriz.codigo, duracaoHoras: 24 })
      .expect(201);
    const gravado = await banco.pedidoLiberacao.findUnique({
      where: { id: pedido.id },
    });
    expect(gravado.status).toBe("ATENDIDO");
    expect(
      (await (await comoPaulo()).get("/api/pedidos")).body.pedidos,
    ).toEqual([]);
    const acesso = await (await comoBeatriz()).get("/api/acesso");
    expect(acesso.body.pedido).toBeNull();
  });
});

describe("liberações do veterinário: listar, renovar e encerrar (F30, F31, NF28.5)", () => {
  test("cada veterinário vê só as liberações ativas que concedeu", async () => {
    await liberacaoNoBanco(beatriz, victor, {
      expiraEm: new Date(Date.now() + 5 * HORA),
    });
    await liberacaoNoBanco(camila, paulo, {
      expiraEm: new Date(Date.now() + 5 * HORA),
    });
    await liberacaoNoBanco(camila, victor, {
      expiraEm: new Date(Date.now() - HORA),
    });
    const { body } = await (
      await comoVictor()
    )
      .get("/api/liberacoes")
      .expect(200);
    expect(body.liberacoes.map((l) => l.tutor.codigo)).toEqual([
      beatriz.codigo,
    ]);
  });

  test("renovar devolve o prazo inteiro, contado de agora", async () => {
    const liberacao = await liberacaoNoBanco(beatriz, victor, {
      expiraEm: new Date(Date.now() + HORA),
    });
    const { body } = await (
      await comoVictor()
    )
      .post(`/api/liberacoes/${liberacao.id}/renovacao`)
      .expect(200);
    const restante = new Date(body.liberacao.expiraEm).getTime() - Date.now();
    expect(restante).toBeGreaterThan(23.9 * HORA);
    expect(restante).toBeLessThanOrEqual(24 * HORA);
  });

  test("o veterinário escolhe o prazo da renovação, contado de agora", async () => {
    const liberacao = await liberacaoNoBanco(beatriz, victor, {
      expiraEm: new Date(Date.now() + 2 * HORA),
    });
    const { body } = await (
      await comoVictor()
    )
      .post(`/api/liberacoes/${liberacao.id}/renovacao`)
      .send({ duracaoHoras: 168 })
      .expect(200);
    const restante = new Date(body.liberacao.expiraEm).getTime() - Date.now();
    expect(restante).toBeGreaterThan(167.9 * HORA);
    expect(restante).toBeLessThanOrEqual(168 * HORA);
    // O prazo escolhido passa a ser o da liberação.
    expect(body.liberacao.duracaoHoras).toBe(168);
  });

  test("renovar não encurta: um prazo que terminaria antes do atual é recusado", async () => {
    const expiraEm = new Date(Date.now() + 50 * HORA);
    const liberacao = await liberacaoNoBanco(beatriz, victor, { expiraEm });
    const vet = await comoVictor();
    const { body } = await vet
      .post(`/api/liberacoes/${liberacao.id}/renovacao`)
      .send({ duracaoHoras: 24 })
      .expect(400);
    expect(body.campos.duracaoHoras).toMatch(/terminaria antes do atual/);
    const gravada = await banco.liberacaoContato.findUnique({
      where: { id: liberacao.id },
    });
    expect(gravada.expiraEm.getTime()).toBe(expiraEm.getTime());

    const foraDaLista = await vet
      .post(`/api/liberacoes/${liberacao.id}/renovacao`)
      .send({ duracaoHoras: 1000 })
      .expect(400);
    expect(foraDaLista.body.campos.duracaoHoras).toMatch(
      /24 horas, 3 dias ou 7 dias/,
    );
  });

  test("encerrar tira o acesso na hora (F31), e a liberação fica registrada", async () => {
    const liberacao = await liberacaoNoBanco(beatriz, victor, {
      expiraEm: new Date(Date.now() + 5 * HORA),
    });
    const tutora = await comoBeatriz();
    await tutora.get(`/api/usuarios/${camila.codigo}/contato`).expect(200);

    await (
      await comoVictor()
    )
      .delete(`/api/liberacoes/${liberacao.id}`)
      .expect(204);

    await tutora.get(`/api/usuarios/${camila.codigo}/contato`).expect(403);
    const gravada = await banco.liberacaoContato.findUnique({
      where: { id: liberacao.id },
    });
    expect(gravada.encerradaEm).toBeInstanceOf(Date);
    expect((await tutora.get("/api/acesso")).body.liberacao).toBeNull();
  });

  test("ninguém renova nem encerra a liberação de outro veterinário (NF28.5)", async () => {
    const liberacao = await liberacaoNoBanco(beatriz, paulo, {
      expiraEm: new Date(Date.now() + HORA),
    });
    const vet = await comoVictor();
    await vet.post(`/api/liberacoes/${liberacao.id}/renovacao`).expect(404);
    await vet.delete(`/api/liberacoes/${liberacao.id}`).expect(404);
    const gravada = await banco.liberacaoContato.findUnique({
      where: { id: liberacao.id },
    });
    expect(gravada.encerradaEm).toBeNull();
    expect(gravada.expiraEm.getTime()).toBe(liberacao.expiraEm.getTime());
  });

  test("uma liberação que já terminou não é renovada nem encerrada de novo", async () => {
    const vencida = await liberacaoNoBanco(beatriz, victor, {
      expiraEm: new Date(Date.now() - HORA),
    });
    const vet = await comoVictor();
    const { body } = await vet
      .post(`/api/liberacoes/${vencida.id}/renovacao`)
      .expect(409);
    expect(body.erro).toMatch(/já terminou/);
    await vet.delete(`/api/liberacoes/${vencida.id}`).expect(409);
  });
});

describe("prazo vencido (F32)", () => {
  test("a liberação vencida perde o efeito sozinha, sem ninguém encerrar", async () => {
    await liberacaoNoBanco(beatriz, victor, {
      expiraEm: new Date(Date.now() - 1000),
    });
    const tutora = await comoBeatriz();
    await tutora.get(`/api/usuarios/${camila.codigo}/contato`).expect(403);
    const acesso = await tutora.get("/api/acesso").expect(200);
    expect(acesso.body.liberacao).toBeNull();
    expect(
      (await (await comoVictor()).get("/api/liberacoes")).body.liberacoes,
    ).toEqual([]);
  });
});

describe("conferência do tutor antes de liberar (NF28.3) e veterinários do hospital (NF27.2)", () => {
  test("o veterinário vê quem é o código: nome, cidade, animais e se já tem acesso", async () => {
    await criarAnimal({ tutorId: beatriz.id, nome: "Luna" });
    await liberacaoNoBanco(beatriz, paulo, {
      expiraEm: new Date(Date.now() + 5 * HORA),
    });
    const { body } = await (
      await comoVictor()
    )
      .get(`/api/usuarios/${beatriz.codigo.toLowerCase()}/acesso`)
      .expect(200);
    expect(body.tutor).toMatchObject({
      codigo: beatriz.codigo,
      nomeCompleto: "Beatriz dos Reis",
      cidade: "Viçosa - MG",
      animais: [{ nome: "Luna", especie: "CAO" }],
    });
    expect(body.liberacao.veterinario.codigo).toBe(paulo.codigo);
    expect(JSON.stringify(body)).not.toMatch(/@|cpf|telefone/i);
  });

  test("a conferência é só para veterinários, e o código precisa ser de um tutor", async () => {
    await (
      await comoCamila()
    )
      .get(`/api/usuarios/${beatriz.codigo}/acesso`)
      .expect(403);
    const vet = await comoVictor();
    const inexistente = await vet
      .get("/api/usuarios/TZZZZZ/acesso")
      .expect(400);
    expect(inexistente.body.erro).toMatch(/Nenhum tutor com o código #TZZZZZ/);
    const deVet = await vet
      .get(`/api/usuarios/${paulo.codigo}/acesso`)
      .expect(400);
    expect(deVet.body.erro).toMatch(/é de um veterinário/);
  });

  test("os veterinários de um hospital, para escolher a quem pedir", async () => {
    const outro = await banco.estabelecimento.create({
      data: { nome: "Clínica Vida", cidade: "Viçosa", uf: "MG" },
    });
    await criarVeterinario({
      nome: "Murilo Nogueira",
      email: "murilo@example.com",
      cpf: gerarCpf("444555666"),
      crmv: "63771",
      estabelecimentoId: outro.id,
    });
    const tutora = await comoBeatriz();
    const { body } = await tutora
      .get(`/api/estabelecimentos/${hospital.id}/veterinarios`)
      .expect(200);
    expect(body.veterinarios.map((v) => v.nomeCompleto)).toEqual([
      "Paulo Rezende",
      "Victor Hugo Martins",
    ]);
    expect(JSON.stringify(body)).not.toMatch(/@|cpf|telefone/i);
    const nada = await tutora
      .get("/api/estabelecimentos/qualquer-coisa/veterinarios")
      .expect(200);
    expect(nada.body.veterinarios).toEqual([]);
  });
});
