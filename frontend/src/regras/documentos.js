import { TAMANHO_MAXIMO_MB } from "./fotos";

// Regras dos exames e documentos no site, as mesmas da API
// (backend/src/controladores/documentos.js). O site confere só para avisar
// antes de enviar: a API abre o arquivo para conferir de novo, porque o tipo
// que o navegador informa sai apenas do nome do arquivo.

export const TIPOS_ACEITOS_EXAME = [
  "application/pdf",
  "image/jpeg",
  "image/png",
  "image/webp",
];

// A mensagem do problema de um arquivo escolhido, ou undefined se está certo.
export function erroDoExame(arquivo) {
  if (!TIPOS_ACEITOS_EXAME.includes(arquivo.type)) {
    return "Envie o exame em PDF, JPG, PNG ou WebP.";
  }
  if (arquivo.size > TAMANHO_MAXIMO_MB * 1024 * 1024) {
    return `O arquivo pode ter no máximo ${TAMANHO_MAXIMO_MB} MB.`;
  }
}

// O aviso de que o envio deu certo, com a concordância de cada nome.
export const AVISO_DE_ENVIO = {
  HEMOGRAMA: "Hemograma enviado",
  SOROLOGIA: "Sorologias enviadas",
  VACINACAO: "Carteira de vacinação enviada",
};
