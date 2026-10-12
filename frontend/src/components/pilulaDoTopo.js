// Onde a pílula do topo estava na página anterior. Cada página desenha o
// próprio topo (components/Header.jsx): guardada aqui, fora dele, a posição
// deixa o topo da página nova começar com a pílula no lugar antigo e
// deslizar até o novo.
//
// `secao` é a da pílula grande (0, o início; 1, a busca; 2, a conta);
// `metade`, a da pílula menor do visitante (0, Entrar; 1, Cadastre-se).
// Quando o dedo já levou a pílula até a seção nova (DeslizeEntreSecoes), as
// duas são escritas antes da troca de página, e a pílula nova começa lá,
// sem deslizar de novo.
export const pilulaDoTopo = { secao: null, metade: null };
