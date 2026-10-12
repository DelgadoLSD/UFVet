// As seções do site, na ordem em que aparecem no topo (components/Header.jsx),
// e as regras do deslize do dedo entre elas no celular
// (components/DeslizeEntreSecoes.jsx). Sem tela: os testes conferem as
// regras sozinhas.

// A seção de cada página: 0, o início; 1, a busca (e os perfis abertos por
// ela); 2, a conta (o próprio perfil, a página da conta, entrar e
// cadastrar-se). Uma página fora delas (um endereço que não existe) fica sem
// seção.
export function secaoDoCaminho(caminho) {
  if (caminho === "/") return 0;
  if (caminho === "/buscar" || caminho.startsWith("/tutor/")) return 1;
  if (["/meu-perfil", "/conta", "/login", "/cadastrar"].includes(caminho)) {
    return 2;
  }
  return null;
}

// Na conta do visitante, a parte da página: 0, Entrar; 1, Cadastre-se.
export const metadeDoCaminho = (caminho) =>
  caminho === "/login" ? 0 : caminho === "/cadastrar" ? 1 : null;

// As paradas do deslize: a página principal de cada seção, na ordem do
// topo. Para o visitante, Entrar e Cadastre-se são duas paradas, como no
// topo. Enquanto o site ainda pergunta quem está logado, a conta fica de
// fora: ainda não se sabe se ela é o perfil ou Entrar.
export function paradasDoDeslize({ logado, carregando }) {
  if (carregando) return ["/", "/buscar"];
  return logado
    ? ["/", "/buscar", "/meu-perfil"]
    : ["/", "/buscar", "/login", "/cadastrar"];
}

// A página para onde o dedo leva. `sentido` 1 é a próxima (o dedo vai para
// a esquerda, puxando a página da direita, como nas abas dos aplicativos);
// -1, a anterior. null nas pontas e nas páginas internas (um perfil aberto
// pela busca, a página da conta), onde o gesto natural é voltar, e o iPhone
// já faz isso deslizando a partir da borda.
export function destinoDoDeslize(caminho, sentido, paradas) {
  const atual = paradas.indexOf(caminho);
  if (atual === -1) return null;
  return paradas[atual + sentido] ?? null;
}

// Para que lado vai o gesto, depois dos primeiros 10 px: "lado" (o
// deslize) ou "rolagem" (a página rola, e o deslize fica de fora). Tem de
// ser claramente para o lado: rolando um perfil comprido, o dedo nunca
// desce reto, e um gesto meio de lado não pode trocar de página.
export const MOVIMENTO_MINIMO = 10; // px
export function direcaoDoGesto(dx, dy) {
  if (Math.hypot(dx, dy) < MOVIMENTO_MINIMO) return null;
  return Math.abs(dx) > Math.abs(dy) * 1.5 ? "lado" : "rolagem";
}

// Ao soltar, troca de página quem arrastou mais de 30% da tela, ou quem
// "jogou" a página: um movimento rápido (mais de 0,5 px por ms) de pelo
// menos 40 px, no mesmo sentido do arrasto.
export function trocaAoSoltar({ deslocamento, largura, velocidade }) {
  const distancia = Math.abs(deslocamento);
  if (distancia > largura * 0.3) return true;
  return (
    distancia > 40 &&
    Math.abs(velocidade) > 0.5 &&
    Math.sign(velocidade) === Math.sign(deslocamento)
  );
}
