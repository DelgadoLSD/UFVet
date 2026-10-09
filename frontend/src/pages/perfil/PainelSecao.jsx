// Uma seção do perfil em painel: uma faixa vermelha no topo, com o título em
// branco, e o conteúdo embaixo, em branco. A faixa colorida é o
// que separa as partes de cada cartão (contato, localização, validação,
// observações, exames), em vez de deixá-las soltas no fundo branco.
//
// - `ajuda`: o "?" ao lado do título, na versão clara, para o vermelho;
// - `acao`: um botão no canto direito da faixa, no tamanho "xs" e numa
//   variante do Botao para fundo vermelho: "claro" (branco cheio) para o que
//   é a ação principal ali, "sobreVermelho" (branco translúcido) para uma
//   ação secundária. A faixa tem sempre a mesma altura, com ou sem botão,
//   para os painéis lado a lado ficarem alinhados;
// - `subtitulo`: uma linha dizendo para que serve a seção;
// - `nivel`: a tag do título. "h4" nos cartões dos animais (o nome do animal
//   é o h3); "h2" no cartão da pessoa, cujo nome é o h1 da página;
// - `corpo` ({ id, exibicao }): o id do conteúdo, para um botão da faixa
//   abri-lo e fechá-lo (aria-controls), e a classe de exibição dele ("flex"
//   por padrão; os filtros da busca usam "hidden lg:flex" quando fechados).
function PainelSecao({
  titulo,
  ajuda,
  acao,
  subtitulo,
  nivel: Titulo = "h4",
  corpo = {},
  children,
  className = "",
}) {
  return (
    <section
      className={`rounded-xl border border-[#eadede] bg-white overflow-hidden min-w-0 flex flex-col ${className}`}
    >
      <div className="flex items-center justify-between gap-3 px-4 py-2 min-h-12 bg-[#9e0a24]">
        {/* O "?" segue o texto: se o título quebrar a linha, ele fica
            colado na última palavra, não solto entre as duas linhas. */}
        <Titulo className="text-sm font-bold text-white leading-snug">
          {titulo}
          {ajuda && (
            <span className="inline-flex align-middle ml-1.5 -mt-0.5">
              {ajuda}
            </span>
          )}
        </Titulo>
        {acao}
      </div>
      <div
        id={corpo.id}
        className={`p-4 flex-1 flex-col gap-3 ${corpo.exibicao ?? "flex"}`}
      >
        {subtitulo && <p className="text-xs text-[#5f5e5e]">{subtitulo}</p>}
        {children}
      </div>
    </section>
  );
}

// Um campo de uma ficha dentro do painel (E-mail, Bairro, CRMV...): o nome do
// campo pequeno em cima e o dado embaixo.
export function CampoPainel({ rotulo, children }) {
  return (
    <div className="min-w-0">
      <p className="text-xs text-[#8f6f6e]">{rotulo}</p>
      <div className="mt-0.5 text-sm font-semibold text-[#1a1c1c] flex items-center gap-1.5 flex-wrap min-w-0">
        {children}
      </div>
    </div>
  );
}

export default PainelSecao;
