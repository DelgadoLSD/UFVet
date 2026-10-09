import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Header from "../components/Header";
import AvisoErro from "../components/AvisoErro";
import Botao from "../components/Botao";
import ModalComoFuncionaValidacao from "../components/ModalComoFuncionaValidacao";
import ModalComoFuncionaContato from "../components/ModalComoFuncionaContato";
import ModalPedirLiberacao from "../components/ModalPedirLiberacao";
import CartaoDoador from "./busca/CartaoDoador";
import FaixaAcessoContatos from "./busca/FaixaAcessoContatos";
import FiltrosBusca from "./busca/FiltrosBusca";
import LegendaValidacao from "./busca/LegendaValidacao";
import {
  FILTROS_INICIAIS,
  ORDENACOES,
  TAMANHO_MAXIMO_BUSCA,
  consultaDaBusca,
} from "./busca/filtros";
import { useSessao } from "../servicos/sessao";
import { buscarDoadores, listarLocais } from "../servicos/doadores";
import { acessoDe, useAcessoContatos } from "../servicos/acessoContatos";

// Busca de doadores: filtros à esquerda, resultados em grade à direita. As
// partes da página ficam em pages/busca/.
//
// A busca é feita pela API (F16 a F18): a página manda os filtros e recebe
// uma página de 6 doadores de cada vez, com o total. Só aparece quem pode
// doar agora; o pausado pelo tutor e o que está se recuperando de uma coleta
// ficam de fora.

function CampoBuscaTexto({ valor, onMudar }) {
  return (
    <div className="relative">
      <span className="absolute inset-y-0 left-0 flex items-center pl-4 pointer-events-none">
        <span
          aria-hidden="true"
          className="material-symbols-outlined text-[#8f6f6e]"
        >
          search
        </span>
      </span>
      <input
        type="text"
        aria-label="Buscar doadores"
        value={valor}
        maxLength={TAMANHO_MAXIMO_BUSCA}
        onChange={(e) => onMudar(e.target.value)}
        placeholder="Buscar por nome, raça, bairro ou código (#)..."
        className="w-full pl-12 pr-12 py-3.5 bg-white border border-[#dccfcf] rounded-2xl text-sm shadow-[0_1px_2px_rgba(26,28,28,0.04)] transition-colors hover:border-[#c9b6b6] focus:outline-none focus:border-[#9e0a24] focus:ring-4 focus:ring-[#9e0a24]/10"
      />
      {valor && (
        <button
          type="button"
          onClick={() => onMudar("")}
          aria-label="Limpar busca"
          className="absolute inset-y-0 right-0 flex items-center pr-4"
        >
          <span
            aria-hidden="true"
            className="material-symbols-outlined text-[#8f6f6e] hover:text-[#7d0a1d]"
          >
            close
          </span>
        </button>
      )}
    </div>
  );
}

function SemResultados({ onLimpar }) {
  return (
    <div className="flex flex-col items-center justify-center py-24 text-center">
      <div className="w-24 h-24 rounded-full bg-[#fdecee] flex items-center justify-center mb-6">
        <span
          aria-hidden="true"
          className="material-symbols-outlined text-[#9e0a24] text-6xl"
        >
          pets
        </span>
      </div>
      <h3 className="text-xl font-bold text-[#1a1c1c] mb-2">
        Nenhum doador encontrado
      </h3>
      <p className="text-[#5f5e5e] text-sm max-w-xs leading-relaxed mb-8">
        Nenhum animal que pode doar agora corresponde aos filtros ou à busca.
        Tente ampliar os critérios.
      </p>
      <Botao icone="filter_alt_off" onClick={onLimpar}>
        Limpar filtros
      </Botao>
    </div>
  );
}

// O valor só depois de a pessoa parar de mexer nele por `ms` milissegundos.
function useAdiado(valor, ms) {
  const [adiado, setAdiado] = useState(valor);
  useEffect(() => {
    const espera = setTimeout(() => setAdiado(valor), ms);
    return () => clearTimeout(espera);
  }, [valor, ms]);
  return adiado;
}

// Os resultados da busca na API, de página em página. Cada resposta é
// guardada com a consulta que a pediu: enquanto a da tela é outra (a pessoa
// mudou um filtro, ou pediu para tentar de novo), a página está carregando,
// e uma resposta atrasada de uma consulta antiga é descartada.
function useBusca(filtros, ordem) {
  const consulta = consultaDaBusca(filtros, ordem);
  const [tentativa, setTentativa] = useState(0);
  const chave = `${consulta}#${tentativa}`;
  const [estado, setEstado] = useState({
    chave: null,
    doadores: [],
    total: 0,
    pagina: 1,
    porPagina: 6,
    erro: "",
  });
  const [mais, setMais] = useState({ carregando: false, erro: "" });

  useEffect(() => {
    let valendo = true;
    buscarDoadores(consulta).then(
      (resposta) =>
        valendo &&
        setEstado({
          chave,
          doadores: resposta.doadores,
          total: resposta.total,
          pagina: 1,
          porPagina: resposta.porPagina,
          erro: "",
        }),
      (falha) =>
        valendo &&
        setEstado({
          chave,
          doadores: [],
          total: 0,
          pagina: 1,
          porPagina: 6,
          erro: falha.message,
        }),
    );
    return () => {
      valendo = false;
    };
  }, [consulta, chave]);

  const carregarMais = async () => {
    const pedida = estado.chave;
    const pagina = estado.pagina + 1;
    setMais({ carregando: true, erro: "" });
    try {
      const resposta = await buscarDoadores(
        consultaDaBusca(filtros, ordem, pagina),
      );
      setEstado((atual) =>
        atual.chave === pedida
          ? {
              ...atual,
              doadores: [...atual.doadores, ...resposta.doadores],
              total: resposta.total,
              pagina,
            }
          : atual,
      );
      setMais({ carregando: false, erro: "" });
    } catch (falha) {
      setMais({ carregando: false, erro: falha.message });
    }
  };

  return {
    ...estado,
    carregando: estado.chave !== chave,
    primeiraVez: estado.chave === null,
    mais: estado.chave === chave ? mais : { carregando: false, erro: "" },
    carregarMais,
    tentarDeNovo: () => setTentativa((n) => n + 1),
  };
}

// As cidades e os bairros dos filtros, por espécie. Se não vierem, os
// filtros de lugar ficam vazios e um aviso diz o motivo.
function useLocais(especie) {
  const [locais, setLocais] = useState({
    especie: null,
    cidades: [],
    erro: "",
  });
  useEffect(() => {
    let valendo = true;
    listarLocais(especie).then(
      (cidades) => valendo && setLocais({ especie, cidades, erro: "" }),
      () =>
        valendo &&
        setLocais({
          especie,
          cidades: [],
          erro: "Não foi possível carregar as cidades. Recarregue a página para tentar de novo.",
        }),
    );
    return () => {
      valendo = false;
    };
  }, [especie]);
  return locais;
}

// A lista de opções, com o valor escolhido sempre presente: mesmo que ele
// tenha saído da lista (outra espécie, sem doadores ali), o seletor continua
// mostrando o que está filtrando.
const comEscolhido = (lista, escolhido) =>
  escolhido && !lista.includes(escolhido) ? [escolhido, ...lista] : lista;

function BuscaPage() {
  const navegar = useNavigate();
  const usuario = useSessao();
  const acesso = acessoDe(usuario, useAcessoContatos());

  const [filtros, setFiltros] = useState(FILTROS_INICIAIS);
  const [ordem, setOrdem] = useState("validados");
  // Modal aberto: "validacao", "contato", "pedido" ou null.
  const [modal, setModal] = useState(null);
  const fecharModal = () => setModal(null);

  // A busca espera a pessoa parar de mexer em qualquer filtro (digitar,
  // arrastar o peso, marcar tipos) antes de ir à API: arrastar o controle de
  // peso, por exemplo, não vira uma busca por quilo.
  const filtrosAdiados = useAdiado(filtros, 400);
  const resultado = useBusca(filtrosAdiados, ordem);
  const locais = useLocais(filtros.especie);

  const filtrar = (mudancas) =>
    setFiltros((atuais) => ({ ...atuais, ...mudancas }));
  const limparFiltros = () => setFiltros(FILTROS_INICIAIS);

  const cidades = comEscolhido(
    locais.cidades.map((c) => c.nome),
    filtros.cidade,
  );
  const bairros = filtros.cidade
    ? comEscolhido(
        locais.cidades.find((c) => c.nome === filtros.cidade)?.bairros ?? [],
        filtros.bairro,
      )
    : [];

  const { doadores, total, porPagina, erro } = resultado;
  // Enquanto a pessoa ainda mexe nos filtros, a tela já trata como busca em
  // andamento.
  const carregando = resultado.carregando || filtros !== filtrosAdiados;
  const restantes = total - doadores.length;

  return (
    <>
      <Header />
      {modal === "validacao" && (
        <ModalComoFuncionaValidacao onFechar={fecharModal} />
      )}
      {modal === "contato" && (
        <ModalComoFuncionaContato onFechar={fecharModal} />
      )}
      {modal === "pedido" && <ModalPedirLiberacao onFechar={fecharModal} />}

      <main className="max-w-[1536px] mx-auto flex flex-col md:flex-row gap-6 px-5 md:px-16 py-12 pt-28">
        <FiltrosBusca
          filtros={filtros}
          cidades={cidades}
          bairros={bairros}
          avisoLocais={locais.erro}
          onFiltrar={filtrar}
          onLimpar={limparFiltros}
        />

        <section className="flex-1 min-w-0 flex flex-col gap-5">
          <CampoBuscaTexto
            valor={filtros.busca}
            onMudar={(texto) => filtrar({ busca: texto })}
          />

          <div className="flex flex-col lg:flex-row items-start lg:items-end justify-between gap-3">
            <div>
              <h1 className="text-2xl font-bold text-[#1a1c1c]">
                Doadores encontrados
              </h1>
              {/* Anunciado ao leitor de tela a cada busca. */}
              <p aria-live="polite" className="text-[#5f5e5e] text-sm mt-0.5">
                {carregando
                  ? "Buscando doadores…"
                  : erro
                    ? "A busca não foi concluída"
                    : total > 0
                      ? `${total} ${total === 1 ? "doador pode doar agora" : "doadores podem doar agora"} com esses filtros`
                      : "Nenhum doador com esses filtros"}
              </p>
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs text-[#5f5e5e] font-semibold">
                Ordenar por:
              </span>
              {ORDENACOES.map((o) => (
                <button
                  key={o.valor}
                  type="button"
                  onClick={() => setOrdem(o.valor)}
                  aria-pressed={ordem === o.valor}
                  className={`px-3.5 py-1.5 rounded-full text-xs font-semibold transition-colors border ${ordem === o.valor ? "bg-[#9e0a24] text-white border-[#9e0a24]" : "bg-white text-[#5f5e5e] border-[#e2d6d6] hover:border-[#7d0a1d] hover:text-[#7d0a1d]"}`}
                >
                  {o.rotulo}
                </button>
              ))}
            </div>
          </div>

          <FaixaAcessoContatos
            acesso={acesso}
            onPedirLiberacao={() => setModal("pedido")}
            onComoFunciona={() => setModal("contato")}
          />

          <LegendaValidacao onEntender={() => setModal("validacao")} />

          {erro && !carregando ? (
            <div className="flex flex-col items-start gap-3 py-6">
              <AvisoErro>{erro}</AvisoErro>
              <Botao
                variante="secundario"
                icone="refresh"
                onClick={resultado.tentarDeNovo}
              >
                Tentar de novo
              </Botao>
            </div>
          ) : resultado.primeiraVez ? (
            <p
              role="status"
              className="text-sm text-[#5f5e5e] py-16 text-center"
            >
              Buscando doadores…
            </p>
          ) : total === 0 && !carregando ? (
            <SemResultados onLimpar={limparFiltros} />
          ) : (
            <>
              {/* auto-fill: o número de colunas se ajusta à largura
                  disponível sem que um cartão fique estreito demais. Enquanto
                  uma busca nova carrega, os resultados anteriores ficam
                  esmaecidos, em vez de a grade piscar. */}
              <div
                aria-busy={carregando}
                className={`grid grid-cols-[repeat(auto-fill,minmax(270px,1fr))] gap-5 transition-opacity ${
                  carregando ? "opacity-50" : ""
                }`}
              >
                {doadores.map((doador) => (
                  <CartaoDoador
                    key={doador.codigo}
                    doador={doador}
                    onVerPerfil={() => navegar(`/tutor/${doador.tutorCodigo}`)}
                  />
                ))}
              </div>

              {restantes > 0 && !carregando && (
                <div className="flex flex-col items-center gap-2 pt-2">
                  <AvisoErro>{resultado.mais.erro}</AvisoErro>
                  <Botao
                    variante="secundario"
                    icone="expand_more"
                    disabled={resultado.mais.carregando}
                    onClick={resultado.carregarMais}
                    className="px-6"
                  >
                    {resultado.mais.carregando
                      ? "Carregando…"
                      : `Carregar mais ${Math.min(porPagina, restantes)}`}
                  </Botao>
                  <p className="text-xs text-[#5f5e5e]">
                    Mostrando {doadores.length} de {total} doadores
                  </p>
                </div>
              )}
            </>
          )}
        </section>
      </main>
    </>
  );
}

export default BuscaPage;
