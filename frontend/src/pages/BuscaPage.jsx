import { useState } from "react";
import { useNavigate } from "react-router-dom";
import Header from "../components/Header";
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
  bairrosDe,
  cidadesDe,
  filtrarDoadores,
} from "./busca/filtros";
import { useSessao } from "../servicos/sessao";
import { listarDoadores } from "../servicos/doadores";
import { acessoDe, useAcessoContatos } from "../servicos/acessoContatos";

// Busca de doadores: filtros à esquerda, resultados em grade à direita. As
// partes da página ficam em pages/busca/.

// Os resultados aparecem aos poucos, de tantos em tantos.
const POR_PAGINA = 6;

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
        onChange={(e) => onMudar(e.target.value)}
        placeholder="Buscar por nome, raça, bairro ou código (#)..."
        className="w-full pl-12 pr-12 py-3.5 bg-white border border-[#dccfcf] rounded-2xl text-sm shadow-[0_1px_2px_rgba(26,28,28,0.04)] transition-colors hover:border-[#c9b6b6] focus:outline-none focus:border-[#b7102a] focus:ring-4 focus:ring-[#b7102a]/10"
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
            className="material-symbols-outlined text-[#8f6f6e] hover:text-[#8e001b]"
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
          className="material-symbols-outlined text-[#8e001b] text-6xl"
        >
          pets
        </span>
      </div>
      <h3 className="text-xl font-bold text-[#1a1c1c] mb-2">
        Nenhum doador encontrado
      </h3>
      <p className="text-[#5f5e5e] text-sm max-w-xs leading-relaxed mb-8">
        Nenhum animal corresponde aos filtros ou à busca. Tente ampliar os
        critérios.
      </p>
      <Botao icone="filter_alt_off" onClick={onLimpar}>
        Limpar filtros
      </Botao>
    </div>
  );
}

function BuscaPage() {
  const navegar = useNavigate();
  const usuario = useSessao();
  const acesso = acessoDe(usuario, useAcessoContatos());

  const [filtros, setFiltros] = useState(FILTROS_INICIAIS);
  const [ordem, setOrdem] = useState("validados");
  const [visiveis, setVisiveis] = useState(POR_PAGINA);
  // Modal aberto: "validacao", "contato", "pedido" ou null.
  const [modal, setModal] = useState(null);
  const fecharModal = () => setModal(null);

  // Mudar qualquer filtro volta para a primeira página de resultados.
  const filtrar = (mudancas) => {
    setFiltros((atuais) => ({ ...atuais, ...mudancas }));
    setVisiveis(POR_PAGINA);
  };

  const limparFiltros = () => {
    setFiltros(FILTROS_INICIAIS);
    setVisiveis(POR_PAGINA);
  };

  const doadores = listarDoadores();
  const encontrados = filtrarDoadores(doadores, filtros, ordem);
  const restantes = encontrados.length - visiveis;

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
          cidades={cidadesDe(doadores)}
          bairros={filtros.cidade ? bairrosDe(doadores, filtros.cidade) : []}
          onFiltrar={filtrar}
          onLimpar={limparFiltros}
        />

        <section className="flex-1 min-w-0 flex flex-col gap-5">
          <CampoBuscaTexto
            valor={filtros.busca}
            onMudar={(busca) => filtrar({ busca })}
          />

          <div className="flex flex-col lg:flex-row items-start lg:items-end justify-between gap-3">
            <div>
              <h1 className="text-2xl font-bold text-[#1a1c1c]">
                Doadores encontrados
              </h1>
              <p className="text-[#5f5e5e] text-sm mt-0.5">
                {encontrados.length > 0
                  ? `${encontrados.length} ${encontrados.length === 1 ? "doador" : "doadores"} com esses filtros`
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
                  className={`px-3.5 py-1.5 rounded-full text-xs font-semibold transition-colors border ${ordem === o.valor ? "bg-[#8e001b] text-white border-[#8e001b]" : "bg-white text-[#5f5e5e] border-[#e2d6d6] hover:border-[#8e001b] hover:text-[#8e001b]"}`}
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

          {encontrados.length === 0 ? (
            <SemResultados onLimpar={limparFiltros} />
          ) : (
            <>
              {/* auto-fill: o número de colunas se ajusta à largura
                  disponível sem que um cartão fique estreito demais. */}
              <div className="grid grid-cols-[repeat(auto-fill,minmax(270px,1fr))] gap-5">
                {encontrados.slice(0, visiveis).map((doador) => (
                  <CartaoDoador
                    key={doador.id}
                    doador={doador}
                    onVerPerfil={() => navegar(`/tutor/${doador.tutorCodigo}`)}
                  />
                ))}
              </div>

              {restantes > 0 && (
                <div className="flex flex-col items-center gap-2 pt-2">
                  <Botao
                    variante="secundario"
                    icone="expand_more"
                    onClick={() => setVisiveis((prev) => prev + POR_PAGINA)}
                    className="px-6"
                  >
                    Carregar mais {Math.min(POR_PAGINA, restantes)}
                  </Botao>
                  <p className="text-xs text-[#5f5e5e]">
                    Mostrando {visiveis} de {encontrados.length} doadores
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
