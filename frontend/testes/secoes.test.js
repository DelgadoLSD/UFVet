import { describe, expect, test } from "vitest";
import {
  destinoDoDeslize,
  direcaoDoGesto,
  metadeDoCaminho,
  paradasDoDeslize,
  secaoDoCaminho,
  trocaAoSoltar,
} from "../src/regras/secoes";

// As seções do topo e as regras do deslize do dedo entre elas no celular
// (regras/secoes.js): para onde o dedo leva, quando o gesto é deslize (e
// não rolagem) e quando soltar troca de página.

const LOGADO = paradasDoDeslize({ logado: true, carregando: false });
const VISITANTE = paradasDoDeslize({ logado: false, carregando: false });

describe("as seções de cada página", () => {
  test("início, busca (com os perfis abertos por ela) e conta", () => {
    expect(secaoDoCaminho("/")).toBe(0);
    expect(secaoDoCaminho("/buscar")).toBe(1);
    expect(secaoDoCaminho("/tutor/T3M8P1")).toBe(1);
    for (const caminho of [
      "/meu-perfil",
      "/conta",
      "/login",
      "/cadastrar",
      "/confirmar-email",
      "/esqueci-a-senha",
      "/nova-senha",
    ]) {
      expect(secaoDoCaminho(caminho)).toBe(2);
    }
    expect(secaoDoCaminho("/nao-existe")).toBeNull();
  });

  test("na conta do visitante, Entrar e Cadastre-se são as duas partes", () => {
    expect(metadeDoCaminho("/login")).toBe(0);
    expect(metadeDoCaminho("/cadastrar")).toBe(1);
    // As páginas dos links do e-mail acendem a parte de onde a pessoa veio.
    expect(metadeDoCaminho("/esqueci-a-senha")).toBe(0);
    expect(metadeDoCaminho("/nova-senha")).toBe(0);
    expect(metadeDoCaminho("/confirmar-email")).toBe(1);
    expect(metadeDoCaminho("/meu-perfil")).toBeNull();
  });
});

describe("para onde o dedo leva", () => {
  test("logado: início, busca e o próprio perfil, na ordem do topo", () => {
    expect(LOGADO).toEqual(["/", "/buscar", "/meu-perfil"]);
    expect(destinoDoDeslize("/", 1, LOGADO)).toBe("/buscar");
    expect(destinoDoDeslize("/buscar", 1, LOGADO)).toBe("/meu-perfil");
    expect(destinoDoDeslize("/meu-perfil", -1, LOGADO)).toBe("/buscar");
    expect(destinoDoDeslize("/buscar", -1, LOGADO)).toBe("/");
  });

  test("visitante: Entrar e Cadastre-se são duas paradas, como no topo", () => {
    expect(VISITANTE).toEqual(["/", "/buscar", "/login", "/cadastrar"]);
    expect(destinoDoDeslize("/buscar", 1, VISITANTE)).toBe("/login");
    expect(destinoDoDeslize("/login", 1, VISITANTE)).toBe("/cadastrar");
    expect(destinoDoDeslize("/cadastrar", -1, VISITANTE)).toBe("/login");
  });

  test("nas pontas, o dedo não leva a lugar nenhum", () => {
    expect(destinoDoDeslize("/", -1, LOGADO)).toBeNull();
    expect(destinoDoDeslize("/meu-perfil", 1, LOGADO)).toBeNull();
    expect(destinoDoDeslize("/cadastrar", 1, VISITANTE)).toBeNull();
  });

  test("nas páginas internas, o deslize fica desligado (o gesto ali é voltar)", () => {
    expect(destinoDoDeslize("/tutor/T3M8P1", 1, LOGADO)).toBeNull();
    expect(destinoDoDeslize("/tutor/T3M8P1", -1, LOGADO)).toBeNull();
    expect(destinoDoDeslize("/conta", -1, LOGADO)).toBeNull();
  });

  test("enquanto o site pergunta quem está logado, a conta fica de fora", () => {
    const carregando = paradasDoDeslize({ logado: false, carregando: true });
    expect(destinoDoDeslize("/buscar", 1, carregando)).toBeNull();
    expect(destinoDoDeslize("/buscar", -1, carregando)).toBe("/");
  });
});

describe("deslize ou rolagem", () => {
  test("nos primeiros 10 px, ainda não se sabe", () => {
    expect(direcaoDoGesto(6, 5)).toBeNull();
  });

  test("claramente para o lado é deslize", () => {
    expect(direcaoDoGesto(-40, 8)).toBe("lado");
    expect(direcaoDoGesto(30, -12)).toBe("lado");
  });

  test("para cima, para baixo ou meio de lado é rolagem: a página rola", () => {
    expect(direcaoDoGesto(3, 40)).toBe("rolagem");
    expect(direcaoDoGesto(30, 25)).toBe("rolagem");
    expect(direcaoDoGesto(-20, -18)).toBe("rolagem");
  });
});

describe("ao soltar", () => {
  const largura = 390;

  test("depois de 30% da tela, troca de página", () => {
    expect(trocaAoSoltar({ deslocamento: -130, largura, velocidade: 0 })).toBe(
      true,
    );
    expect(trocaAoSoltar({ deslocamento: 120, largura, velocidade: 0 })).toBe(
      true,
    );
  });

  test("um arrasto curto e devagar volta ao lugar", () => {
    expect(
      trocaAoSoltar({ deslocamento: -100, largura, velocidade: -0.2 }),
    ).toBe(false);
  });

  test("um movimento rápido troca, mesmo curto", () => {
    expect(
      trocaAoSoltar({ deslocamento: -60, largura, velocidade: -0.9 }),
    ).toBe(true);
  });

  test("rápido, mas voltando no fim, ou curto demais, não troca", () => {
    expect(trocaAoSoltar({ deslocamento: -80, largura, velocidade: 0.9 })).toBe(
      false,
    );
    expect(
      trocaAoSoltar({ deslocamento: -30, largura, velocidade: -1.2 }),
    ).toBe(false);
  });
});
