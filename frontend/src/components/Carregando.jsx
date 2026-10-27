// O sinal de "carregando" do site, o mesmo em todo lugar: um círculo
// vermelho girando, o aviso que os sites usam para "espere, está vindo".
// Aparece ao abrir uma página ou uma lista que vem da API e dentro dos
// botões enquanto a ação vai para lá (ver `carregando` em Botao). O mesmo
// desenho, feito só com CSS, aparece ao abrir o site (index.html).
//
// `Girando` é só o círculo; a cor vem de `cor` (vermelho, ou "text-current"
// para seguir a letra de um botão vermelho, em branco). O giro está em
// .girando, no index.css: com movimento reduzido, ele fica mais lento, e não
// para, porque parado ele não diria que algo está vindo.
export function Girando({ className = "w-5 h-5", cor = "text-[#9e0a24]" }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
      className={`girando shrink-0 ${cor} ${className}`}
    >
      <circle
        cx="12"
        cy="12"
        r="9.5"
        stroke="currentColor"
        strokeWidth="3"
        opacity="0.18"
      />
      <path
        d="M12 2.5a9.5 9.5 0 0 1 9.5 9.5"
        stroke="currentColor"
        strokeWidth="3"
        strokeLinecap="round"
      />
    </svg>
  );
}

// O lugar de uma página, lista ou janela enquanto ela carrega: o círculo e o
// que está vindo, por escrito (o leitor de tela anuncia o texto).
// - `claro`: em branco, para os blocos pretos e vermelhos;
// - `linha`: pequeno, ao lado do texto, para os espaços estreitos;
// - `className`: o espaço em volta (padrão: py-10).
function Carregando({
  texto,
  claro = false,
  linha = false,
  className = "py-10",
}) {
  return (
    <div
      role="status"
      className={`flex items-center justify-center text-center ${
        linha ? "gap-2" : "flex-col gap-3"
      } ${className}`}
    >
      <Girando
        className={linha ? "w-5 h-5" : "w-9 h-9"}
        cor={claro ? "text-white" : undefined}
      />
      <p className={`text-sm ${claro ? "text-white/70" : "text-[#5f5e5e]"}`}>
        {texto}
      </p>
    </div>
  );
}

export default Carregando;
