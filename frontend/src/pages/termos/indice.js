// Os itens dos termos de uso e privacidade, na ordem da página. O índice e
// os títulos das seções saem daqui: o número que alguém cita ("o item 7")
// é o mesmo nos dois lugares.
export const ITENS = [
  { id: "o-que-e", titulo: "O que o UFVet é, e o que não é" },
  { id: "quem-usa", titulo: "Quem usa o UFVet" },
  { id: "quem-ve", titulo: "Quem vê os seus dados" },
  { id: "compromissos", titulo: "O que pedimos de você" },
  { id: "doador", titulo: "Se o seu animal é doador" },
  { id: "receptor", titulo: "Se o seu animal precisa de sangue" },
  { id: "veterinarios", titulo: "Para veterinários" },
  { id: "limites", titulo: "O que o UFVet não garante" },
  { id: "privacidade", titulo: "Privacidade e seus dados" },
  { id: "contato", titulo: "Mudanças e contato" },
];

export const numeroDo = (id) => ITENS.findIndex((item) => item.id === id) + 1;
export const tituloDo = (id) => ITENS.find((item) => item.id === id).titulo;

// A versão em vigor. A mesma versão fica gravada no aceite de cada conta
// nova (VERSAO_DOS_TERMOS, em backend/src/controladores/usuarios.js):
// quando o texto mudar, as duas mudam juntas.
export const VERSAO = { numero: "2", vigencia: "12 de outubro de 2026" };

// Para dúvidas e pedidos sobre os dados (o rodapé usa o mesmo).
export const CONTATO = "lucas.delgado@ufv.br";
