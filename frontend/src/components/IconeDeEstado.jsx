// O ícone grande no alto das telas que mostram um resultado no lugar do
// formulário (e-mail confirmado, link que não vale mais). O desenho muda com
// o estado, não só a cor: quem não distingue as cores entende pelo ícone e
// pelo título.
const TONS = {
  sucesso: "bg-[#e6f4ea] text-[#17643a]",
  marca: "bg-[#fdecee] text-[#9e0a24]",
  neutro: "bg-[#f4efef] text-[#5f5e5e]",
};

// O círculo é uma caixa à parte: os ícones têm a largura presa a 1em
// (index.css), e o fundo sairia cortado.
function IconeDeEstado({ nome, tom = "marca" }) {
  return (
    <span
      aria-hidden="true"
      className={`w-14 h-14 rounded-2xl flex items-center justify-center ${TONS[tom]}`}
    >
      <span className="material-symbols-outlined text-[30px]">{nome}</span>
    </span>
  );
}

export default IconeDeEstado;
