// Regras das fotos (dos animais e de perfil), as mesmas da API
// (backend/src/imagens.js e backend/src/middlewares/envio.js). O site confere
// só para avisar antes de enviar: a API abre cada imagem para conferir de
// novo, porque o tipo que o navegador informa sai apenas do nome do arquivo.

export const MAXIMO_FOTOS = 5; // por animal (NF8.3)
export const TAMANHO_MAXIMO_MB = 10;
export const TIPOS_ACEITOS = ["image/jpeg", "image/png", "image/webp"];

// A mensagem do problema de um arquivo escolhido, ou undefined se está certo.
export function erroDoArquivo(arquivo) {
  if (!TIPOS_ACEITOS.includes(arquivo.type)) {
    return "Envie a foto em JPG, PNG ou WebP.";
  }
  if (arquivo.size > TAMANHO_MAXIMO_MB * 1024 * 1024) {
    return `Cada foto pode ter no máximo ${TAMANHO_MAXIMO_MB} MB.`;
  }
}

// As fotos de um animal como aparecem no formulário, da principal em diante:
// { id, url } das que já estavam salvas e { arquivo, url } das escolhidas
// agora. Devolve o que mandar para a API: os arquivos novos, na ordem em que
// aparecem, e a nova ordem completa (o id de cada foto que fica e "nova" no
// lugar de cada arquivo), ou undefined se nada mudou.
export function pedidoDasFotos(naTela, antes = []) {
  const arquivos = naTela.filter((foto) => foto.arquivo).map((f) => f.arquivo);
  const ordem = naTela.map((foto) => (foto.arquivo ? "nova" : foto.id));
  const igual =
    arquivos.length === 0 &&
    ordem.length === antes.length &&
    ordem.every((id, i) => id === antes[i].id);
  return { arquivos, ordem: igual ? undefined : ordem };
}

// A foto na posição `indice` passa a ser a principal (a primeira).
export const tornarPrincipal = (fotos, indice) => [
  fotos[indice],
  ...fotos.filter((_, i) => i !== indice),
];
