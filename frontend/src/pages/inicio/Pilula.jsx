import { Link } from "react-router-dom";

// Link em forma de pílula, o botão grande da página inicial: vermelho para a
// ação principal, branco para a outra.
const VARIANTES = {
  vermelho: "bg-[#9e0a24] text-white hover:bg-[#7d0a1d]",
  branco:
    "border border-white bg-white text-black hover:scale-105 motion-reduce:hover:scale-100",
};

function Pilula({ to, variante = "vermelho", children }) {
  return (
    <Link
      to={to}
      className={`inline-block px-6 sm:px-10 py-5 rounded-full font-bold text-sm uppercase tracking-widest text-center sm:whitespace-nowrap transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#9e0a24] focus-visible:ring-offset-2 ${VARIANTES[variante]}`}
    >
      {children}
    </Link>
  );
}

export default Pilula;
