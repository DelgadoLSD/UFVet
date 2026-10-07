import { randomInt } from "node:crypto";

// Códigos que as pessoas leem, digitam ou ditam: o código público de cada
// conta (#T3M8P1) e o código de convite de veterinário (7K3P-9XQ2).
//
// O alfabeto deixa de fora 0, O, 1, I e L, que se confundem ao ler ou ditar.
// O sorteio usa o gerador criptográfico do Node, que não é previsível.
const ALFABETO = "23456789ABCDEFGHJKMNPQRSTUVWXYZ";

const sortear = (quantos) =>
  Array.from(
    { length: quantos },
    () => ALFABETO[randomInt(ALFABETO.length)],
  ).join("");

// Código público de uma conta (F6): seis caracteres, e o primeiro diz o
// papel (T para tutor, V para veterinário). A unicidade é conferida por quem
// grava (NF6.1).
export const sortearCodigoPublico = (papel) =>
  (papel === "VETERINARIO" ? "V" : "T") + sortear(5);

// Código de convite: oito caracteres, em dois blocos para facilitar a cópia.
// Com 31 opções por caractere, são cerca de 850 bilhões de combinações.
export const sortearCodigoConvite = () => `${sortear(4)}-${sortear(4)}`;
