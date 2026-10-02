// Pequenas regras de texto usadas em várias telas. Ficam juntas para que uma
// mudança de redação (por exemplo, como o site trata uma pessoa) seja feita
// num lugar só.

export const primeiroNome = (nome) => nome.split(" ")[0];

// "ela" -> "Ela", para o começo de uma frase.
export const maiuscula = (texto) =>
  texto.charAt(0).toUpperCase() + texto.slice(1);

// "32 kg", "4,5 kg"
export const formatarPeso = (kg) => `${kg.toLocaleString("pt-BR")} kg`;

// ─── Pessoas ──────────────────────────────────────────────────────────────────
// No banco, o papel é o enum PapelUsuario (TUTOR ou VETERINARIO).

export const ehVeterinario = (pessoa) => pessoa.papel === "VETERINARIO";

const ehMulher = (pessoa) => pessoa.genero === "F";

// "Dr." ou "Dra.", como o veterinário assina validações e coletas.
export const tratamento = (pessoa) => (ehMulher(pessoa) ? "Dra." : "Dr.");

// "Dr. Victor Hugo", como o veterinário assina.
export const nomeProfissional = (pessoa) =>
  `${tratamento(pessoa)} ${pessoa.nome}`;

// "Dr. Victor", nas frases sobre um pedido de liberação.
export const nomeProfissionalCurto = (pessoa) =>
  `${tratamento(pessoa)} ${primeiroNome(pessoa.nome)}`;

// "Veterinário", "Veterinária", "Tutor" ou "Tutora".
export function rotuloPapel(pessoa) {
  if (ehVeterinario(pessoa))
    return ehMulher(pessoa) ? "Veterinária" : "Veterinário";
  return ehMulher(pessoa) ? "Tutora" : "Tutor";
}

// "ele" ou "ela", para frases como "assim que ele liberar".
export const pronome = (pessoa) => (ehMulher(pessoa) ? "ela" : "ele");

// ─── Código público ───────────────────────────────────────────────────────────
// Cada pessoa e cada animal tem um código de 6 letras e números (#T3M8P1). É
// por ele que o veterinário libera um tutor e o tutor encontra um veterinário:
// nomes se repetem, códigos não.

export const TAMANHO_CODIGO = 6;

// O código costuma ser copiado do perfil com "#" na frente; a limpeza faz
// colar direto funcionar.
export const limparCodigo = (texto) =>
  texto
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, "")
    .slice(0, TAMANHO_CODIGO);
