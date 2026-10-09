import { useState } from "react";
import Ajuda from "../../components/Ajuda";
import Botao from "../../components/Botao";
import BotaoAjuda from "../../components/BotaoAjuda";
import Segmentado from "../../components/Segmentado";
import Selecao from "../../components/Selecao";
import PainelSecao from "../perfil/PainelSecao";
import { ESPECIES, partesDoTipo } from "../../regras/doacao";

// Os filtros da busca, num painel com a faixa vermelha dos painéis do perfil.
// No computador, ocupam a primeira coluna da grade da página (a largura de um
// cartão) e acompanham a rolagem, quando a tela tem altura para o painel
// inteiro; numa tela baixa (1366 × 768, por exemplo), rolam com a página,
// para a parte de baixo do painel não ficar escondida. No celular e no tablet, o painel começa
// fechado, só com a faixa (e quantos filtros estão ligados), para os doadores
// aparecerem logo; "Mostrar" abre.
//
// Não guarda os filtros: recebe os atuais e avisa a página do que mudou, por
// `onFiltrar({ campo: valor })`.

const OPCOES_ESPECIE = Object.entries(ESPECIES).map(([valor, e]) => ({
  valor,
  rotulo: e.rotulo,
}));

const OPCOES_VALIDACAO = [
  { valor: false, rotulo: "Todos" },
  { valor: true, rotulo: "Só validados" },
];

// A grade dos tipos sanguíneos de cada espécie. Na linha de cima, "Todos" e
// o tipo de nome longo, em casas largas; na de baixo, os de nome curto, uma
// casa por coluna.
const GRADE_TIPOS = {
  CAO: {
    colunas: "grid-cols-4",
    largura: "col-span-2",
    deCima: ["DEA 1.1 Universal"],
    deBaixo: ["DEA 1.1-", "DEA 1.1+", "DEA 4", "DEA 7"],
  },
  GATO: {
    colunas: "grid-cols-3",
    largura: "col-span-3",
    deCima: [],
    deBaixo: ["Tipo A", "Tipo B", "Tipo AB"],
  },
};

const TODOS_OS_TIPOS = {
  sistema: "Tipo",
  valor: "Todos",
  porExtenso: "Todos os tipos",
};

// Uma casa da grade dos tipos, no desenho da etiqueta do cartão do doador: o
// sistema pequeno em cima, o tipo grande embaixo. Escolhida, fica vermelha,
// com um ✓ antes do sistema (a marca não depende só da cor); as outras
// ficam no rosado da faixa de dados do perfil.
function CasaTipo({ tipo, escolhida, onClick, className = "" }) {
  return (
    <button
      type="button"
      aria-pressed={escolhida}
      aria-label={tipo.porExtenso}
      onClick={onClick}
      className={`h-16 px-1 flex flex-col items-center justify-center text-center transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[#1a1c1c] ${
        escolhida
          ? "bg-[#9e0a24] text-white"
          : "bg-[#fdecee] text-[#1a1c1c] hover:bg-[#f8dce1] hover:text-[#7d0a1d]"
      } ${className}`}
    >
      <span
        className={`flex items-center gap-0.5 text-[11px] font-bold leading-none ${
          escolhida ? "text-white" : "text-[#5b403f]"
        }`}
      >
        {escolhida && (
          <span
            aria-hidden="true"
            className="material-symbols-outlined text-[12px] -my-1"
            style={{ fontVariationSettings: "'wght' 700" }}
          >
            check
          </span>
        )}
        {tipo.sistema}
      </span>
      <span
        className={`mt-1.5 font-extrabold leading-none tracking-tight tabular-nums ${
          tipo.valor.length > 4 ? "text-xl" : "text-2xl"
        }`}
      >
        {tipo.valor}
      </span>
    </button>
  );
}

// "Todos" desliga o filtro de tipo; os outros ligam e desligam um por um, e
// dá para escolher mais de um. As casas ficam encostadas, com vãos brancos
// de 2px, como as células da faixa de dados do perfil.
function GradeTipos({ especie, tipos, onMudar }) {
  const grade = GRADE_TIPOS[especie];
  const alternar = (tipo) =>
    onMudar(
      tipos.includes(tipo) ? tipos.filter((t) => t !== tipo) : [...tipos, tipo],
    );
  const casa = (tipo, className) => (
    <CasaTipo
      key={tipo}
      tipo={partesDoTipo(tipo)}
      escolhida={tipos.includes(tipo)}
      onClick={() => alternar(tipo)}
      className={className}
    />
  );

  return (
    <div
      role="group"
      aria-label="Tipo sanguíneo"
      className={`grid ${grade.colunas} gap-[2px] rounded-xl overflow-hidden`}
    >
      <CasaTipo
        tipo={TODOS_OS_TIPOS}
        escolhida={tipos.length === 0}
        onClick={() => onMudar([])}
        className={grade.largura}
      />
      {grade.deCima.map((tipo) => casa(tipo, grade.largura))}
      {grade.deBaixo.map((tipo) => casa(tipo))}
    </div>
  );
}

// Um filtro: o nome em cima, o controle embaixo. Os filtros são separados
// por linhas finas.
function Grupo({ rotulo, ajuda, children }) {
  return (
    <div className="py-4 first:pt-1 last:pb-1 flex flex-col gap-3">
      <div className="flex items-center gap-1.5">
        <h3 className="text-[15px] font-bold text-[#1a1c1c]">{rotulo}</h3>
        {ajuda}
      </div>
      {children}
    </div>
  );
}

// O nome de um campo dentro de um filtro (Cidade, Bairro).
function Campo({ rotulo, children }) {
  return (
    <div className="flex flex-col gap-1.5">
      <p className="text-xs font-semibold text-[#5b403f]">{rotulo}</p>
      {children}
    </div>
  );
}

// `cidades` e `bairros` são os lugares onde há doadores (da API);
// `avisoLocais` explica quando eles não puderam ser carregados.
function FiltrosBusca({
  filtros,
  cidades,
  bairros,
  avisoLocais,
  onFiltrar,
  onLimpar,
  onEntenderValidacao,
}) {
  const [aberto, setAberto] = useState(false);
  const { especie, tipos, cidade, bairro, apenasValidados } = filtros;
  // A espécie sempre tem um valor; conta só o que estreita a busca.
  const ligados =
    tipos.length +
    (cidade ? 1 : 0) +
    (bairro ? 1 : 0) +
    (apenasValidados ? 1 : 0);

  return (
    <aside className="w-full lg:[@media(min-height:820px)]:sticky lg:top-24">
      <PainelSecao
        titulo={ligados > 0 ? `Filtros (${ligados})` : "Filtros"}
        nivel="h2"
        acao={
          <div className="flex items-center gap-2">
            {ligados > 0 && (
              <Botao variante="sobreVermelho" tamanho="xs" onClick={onLimpar}>
                Limpar
              </Botao>
            )}
            <Botao
              variante="claro"
              tamanho="xs"
              className="lg:hidden"
              aria-expanded={aberto}
              aria-controls="filtros-da-busca"
              onClick={() => setAberto((agora) => !agora)}
            >
              {aberto ? "Esconder" : "Mostrar"}
            </Botao>
          </div>
        }
        corpo={{
          id: "filtros-da-busca",
          exibicao: aberto ? "flex" : "hidden lg:flex",
        }}
      >
        <div className="flex flex-col divide-y divide-[#f1e7e7]">
          {/* Trocar de espécie zera os tipos (são outros). */}
          <Grupo rotulo="Espécie">
            <Segmentado
              rotulo="Espécie"
              opcoes={OPCOES_ESPECIE}
              valor={especie}
              altura="h-10"
              onEscolher={(nova) => onFiltrar({ especie: nova, tipos: [] })}
            />
          </Grupo>

          <Grupo
            rotulo="Tipo sanguíneo"
            ajuda={
              <Ajuda titulo="Qual tipo escolher?">
                {especie === "CAO" ? (
                  <p>
                    Selecione o tipo do cão que vai receber o sangue, se você
                    souber. Doadores DEA 1.1 negativo (DEA 1.1− e Universal)
                    podem doar para a maioria dos cães.
                  </p>
                ) : (
                  <p>
                    Gatos precisam receber sangue de um tipo compatível.
                    Selecione o tipo do gato que vai receber o sangue — o
                    hospital sempre confirma a compatibilidade.
                  </p>
                )}
                <p>
                  Dá para escolher mais de um tipo. Filtrar por tipo esconde os
                  doadores sem tipagem confirmada: o tipo deles só é conhecido
                  depois do exame, feito no hospital.
                </p>
              </Ajuda>
            }
          >
            <GradeTipos
              especie={especie}
              tipos={tipos}
              onMudar={(novos) => onFiltrar({ tipos: novos })}
            />
          </Grupo>

          {/* Onde o doador mora. Quem conhece a cidade sabe o que é perto do
              hospital melhor do que um raio em quilômetros, e ninguém precisa
              entregar o endereço exato de casa. O bairro espera a cidade. */}
          <Grupo rotulo="Onde o doador mora">
            <Campo rotulo="Cidade">
              <Selecao
                rotulo="Cidade"
                valor={cidade}
                onEscolher={(valor) =>
                  onFiltrar({ cidade: valor, bairro: "" })
                }
                placeholder="Todas as cidades"
                opcoes={cidades.map((c) => ({ valor: c, rotulo: c }))}
              />
            </Campo>
            <Campo rotulo="Bairro">
              <Selecao
                rotulo="Bairro"
                valor={bairro}
                onEscolher={(valor) => onFiltrar({ bairro: valor })}
                desabilitado={!cidade}
                placeholder={
                  cidade ? "Todos os bairros" : "Escolha a cidade"
                }
                opcoes={bairros.map((b) => ({ valor: b, rotulo: b }))}
              />
            </Campo>
            {avisoLocais && (
              <p role="alert" className="text-xs text-[#9e0a24]">
                {avisoLocais}
              </p>
            )}
          </Grupo>

          {/* O "?" abre a explicação da validação: é o único ponto de ajuda
              sobre o assunto na busca. */}
          <Grupo
            rotulo="Validação"
            ajuda={
              <BotaoAjuda
                rotulo="Como funciona a validação?"
                onClick={onEntenderValidacao}
              />
            }
          >
            <Segmentado
              rotulo="Validação"
              opcoes={OPCOES_VALIDACAO}
              valor={apenasValidados}
              altura="h-10"
              onEscolher={(valor) => onFiltrar({ apenasValidados: valor })}
            />
          </Grupo>
        </div>
      </PainelSecao>
    </aside>
  );
}

export default FiltrosBusca;
