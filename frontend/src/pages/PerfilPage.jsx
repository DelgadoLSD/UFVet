import { useEffect, useState } from "react";
import {
  Link,
  Navigate,
  useLocation,
  useParams,
  useSearchParams,
} from "react-router-dom";
import AvisoErro from "../components/AvisoErro";
import Botao from "../components/Botao";
import Header from "../components/Header";
import { useModalDaConta } from "../hooks/useModalDaConta";
import ModalComoFuncionaContato from "../components/ModalComoFuncionaContato";
import ModalPedirLiberacao from "../components/ModalPedirLiberacao";
import CartaoPerfil from "./perfil/CartaoPerfil";
import CartaoAnimal from "./perfil/CartaoAnimal";
import CarrosselAnimais from "./perfil/CarrosselAnimais";
import PainelNovoAnimal from "./perfil/PainelNovoAnimal";
import {
  NOVO_ANIMAL,
  idDaAba,
  idDoPainel,
  itemDoCentro,
  itensDoCarrossel,
} from "./perfil/animalEscolhido";
import { movimentoReduzido } from "../util/movimento";
import ModalAnimal from "./perfil/ModalAnimal";
import PainelAcessoContatos from "./perfil/PainelAcessoContatos";
import { useSessao } from "../servicos/sessao";
import { buscarPerfil } from "../servicos/pessoas";
import { confirmar } from "../hooks/confirmacoes";
import { finalDoGenero } from "../regras/doacao";
import { listarAnimais } from "../servicos/animais";
import { useAcessoContatos } from "../servicos/acessoContatos";
import { ehVeterinario, nomeCurto, nomeProfissional } from "../util/texto";

// Página de perfil, em duas rotas:
// - /meu-perfil: o perfil de quem está logado, com os próprios animais (e,
//   para o veterinário, o painel de acesso aos contatos);
// - /tutor/:codigo: o perfil de outra pessoa, aberto pela busca.
//
// As partes da página ficam em pages/perfil/.
//
// Os animais aparecem num carrossel centralizado e, embaixo, o cartão
// completo do animal do centro. A escolha fica no endereço (?animal=H4R8T2):
// o cartão da busca já abre o perfil no animal clicado, e recarregar a
// página mantém o mesmo animal aberto. No próprio perfil, o carrossel começa
// pelo cartão de cadastrar; com ele no centro, embaixo aparece o convite
// para cadastrar.
//
// A pessoa e os animais vêm da API nos dois casos, os animais com o
// histórico clínico. No perfil de outra pessoa, o contato não vem junto: ele
// é pedido à parte, por quem pode ver (ver perfil/BlocoContato.jsx).

// Os animais de uma pessoa, e como a página atualiza a lista depois de
// cadastrar, editar, excluir ou de um registro do veterinário. Cada resposta
// é guardada com o código (e a tentativa) que a pediu: até chegar a de agora,
// a lista está carregando, e nunca mostra os animais de outro perfil.
function useAnimais(codigo) {
  // Mudar este número faz a lista ser buscada de novo ("Tentar de novo").
  const [tentativa, setTentativa] = useState(0);
  const chave = `${codigo}#${tentativa}`;
  const [estado, setEstado] = useState({ chave: null, animais: [], erro: "" });

  useEffect(() => {
    if (!codigo) return;
    // A resposta de uma busca antiga (de outro perfil, ou anterior a uma
    // nova tentativa) é ignorada.
    let valendo = true;
    listarAnimais(codigo).then(
      (animais) => valendo && setEstado({ chave, animais, erro: "" }),
      (falha) =>
        valendo && setEstado({ chave, animais: [], erro: falha.message }),
    );
    return () => {
      valendo = false;
    };
  }, [codigo, chave]);

  const mudarLista = (mudar) =>
    setEstado((prev) => ({ ...prev, animais: mudar(prev.animais) }));
  const pronto = estado.chave === chave;

  return {
    animais: pronto ? estado.animais : [],
    erro: pronto ? estado.erro : "",
    carregando: !pronto,
    tentarDeNovo: () => setTentativa((n) => n + 1),
    adicionar: (animal) => mudarLista((lista) => [...lista, animal]),
    substituir: (animal) =>
      mudarLista((lista) =>
        lista.map((a) => (a.codigo === animal.codigo ? animal : a)),
      ),
    remover: (codigo) =>
      mudarLista((lista) => lista.filter((a) => a.codigo !== codigo)),
  };
}

// Lugar dos cartões enquanto a lista não chega, ou quando ela não veio.
function EstadoDaLista({ erro, ehProprio, onTentarDeNovo }) {
  if (erro) {
    return (
      <div className="flex flex-col items-start gap-3">
        <AvisoErro>{erro}</AvisoErro>
        <Botao variante="secundario" icone="refresh" onClick={onTentarDeNovo}>
          Tentar de novo
        </Botao>
      </div>
    );
  }
  return (
    <p role="status" className="text-sm text-[#5f5e5e] py-10 text-center">
      {ehProprio ? "Carregando seus animais…" : "Carregando os animais…"}
    </p>
  );
}

// A pessoa do perfil de outra pessoa, pela API, do mesmo jeito que os
// animais: até chegar a resposta do código de agora, nada aparece. Sem
// código (o próprio perfil), não busca nada.
function usePessoa(codigo) {
  const [tentativa, setTentativa] = useState(0);
  const chave = `${codigo}#${tentativa}`;
  const [estado, setEstado] = useState({
    chave: null,
    perfil: null,
    erro: null,
  });

  useEffect(() => {
    if (!codigo) return;
    let valendo = true;
    buscarPerfil(codigo).then(
      (perfil) => valendo && setEstado({ chave, perfil, erro: null }),
      (falha) => valendo && setEstado({ chave, perfil: null, erro: falha }),
    );
    return () => {
      valendo = false;
    };
  }, [codigo, chave]);

  const pronto = estado.chave === chave;
  return {
    perfil: pronto ? estado.perfil : null,
    erro: pronto ? estado.erro : null,
    carregando: !pronto,
    tentarDeNovo: () => setTentativa((n) => n + 1),
  };
}

// O lugar do perfil de outra pessoa enquanto ele não chega, ou quando não
// veio: o código que ninguém usa diz isso e leva à busca; uma falha diz o
// motivo e deixa tentar de novo.
function EstadoDoPerfil({ codigo, pessoa }) {
  if (pessoa.carregando) {
    return (
      <p role="status" className="text-sm text-[#5f5e5e] py-16 text-center">
        Carregando o perfil…
      </p>
    );
  }
  if (pessoa.erro?.status === 404) {
    return (
      <div className="flex flex-col items-start gap-4 py-10">
        <h1 className="text-2xl font-bold text-[#1a1c1c]">
          Perfil não encontrado
        </h1>
        <p className="text-sm text-[#5b403f] max-w-md leading-relaxed">
          Ninguém no UFVet usa o código #{codigo}. Confira o código, ou procure
          o doador pela busca.
        </p>
        <Botao as={Link} to="/buscar" icone="search">
          Ir para a busca
        </Botao>
      </div>
    );
  }
  return (
    <div className="flex flex-col items-start gap-3 py-10">
      <AvisoErro>{pessoa.erro.message}</AvisoErro>
      <Botao
        variante="secundario"
        icone="refresh"
        onClick={pessoa.tentarDeNovo}
      >
        Tentar de novo
      </Botao>
    </div>
  );
}

// Faixa para o veterinário que visita o perfil de um tutor: lembra o que ele
// pode fazer ali e que a assinatura dele fica visível.
function AvisoVeterinario({ usuario }) {
  return (
    <div className="mb-8 bg-[#fdecee] rounded-2xl px-6 py-4">
      <div className="flex flex-col gap-0.5">
        <span className="font-bold text-[#9e0a24] text-sm">
          Você está acessando como veterinário
        </span>
        <span className="text-[#5b403f] text-xs leading-relaxed">
          Você pode validar os critérios de doação e registrar observações para
          a coleta. Sua assinatura ({nomeProfissional(usuario)}, CRMV{" "}
          {usuario.crmv}) fica visível aos tutores.
        </span>
      </div>
    </div>
  );
}

// Sem nenhum animal ainda, o cadastro ocupa a largura toda: o lugar do
// primeiro cartão, tracejado, com o "+" vermelho. Com algum animal, ele é
// o primeiro cartão do carrossel.
function BotaoCadastrarAnimal({ onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="group w-full py-9 px-6 flex flex-col items-center justify-center gap-3 rounded-2xl border-2 border-dashed border-[#e2cfcf] bg-white hover:border-[#9e0a24]/60 hover:bg-[#fffafa] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#9e0a24]"
    >
      <span
        aria-hidden="true"
        className="w-12 h-12 rounded-full bg-[#9e0a24] flex items-center justify-center text-white transition-transform group-hover:scale-110 motion-reduce:group-hover:scale-100"
      >
        <span className="material-symbols-outlined text-[28px]">add</span>
      </span>
      <span className="text-lg font-extrabold tracking-tight text-[#1a1c1c]">
        Cadastrar novo animal
      </span>
      <span className="text-sm text-[#5f5e5e]">
        Cada doador cadastrado pode ajudar a salvar uma vida
      </span>
    </button>
  );
}

function PerfilPage() {
  // Sem :codigo na rota, é o próprio perfil de quem está logado.
  const { codigo } = useParams();
  const local = useLocation();
  const [parametros, setParametros] = useSearchParams();
  const usuario = useSessao();
  const acesso = useAcessoContatos();
  // Modal aberto no nível da página: "cadastrar", "pedido", "comoFunciona"
  // ou null.
  // Fecha sozinho se a aba passar para outra conta.
  const [modal, setModal] = useModalDaConta();
  const fecharModal = () => setModal(null);

  const ehProprio = !codigo;
  const codigoVisitado = codigo?.trim().toUpperCase();
  // O próprio código aberto pela busca vira o próprio perfil, onde dá para
  // editar.
  const ehMeuCodigo = !ehProprio && codigoVisitado === usuario?.codigo;
  const ehVet = ehVeterinario(usuario);
  const pessoa = usePessoa(ehProprio || ehMeuCodigo ? null : codigoVisitado);
  const perfil = ehProprio ? usuario : pessoa.perfil;
  const lista = useAnimais(
    ehProprio ? usuario.codigo : ehMeuCodigo ? null : codigoVisitado,
  );
  const animais = lista.animais;
  const listaPronta = !lista.carregando && !lista.erro;

  // O animal aberto embaixo do carrossel. A escolha começa pelo endereço
  // (?animal=...) e é guardada na própria página: o roteador só atualiza o
  // endereço um instante depois, e dois cliques seguidos na seta precisam
  // contar a partir do último. O endereço acompanha, para recarregar e
  // compartilhar o link no mesmo animal; trocar o substitui, sem criar um
  // passo novo no "voltar" do navegador a cada clique.
  const [codigoEscolhido, setCodigoEscolhido] = useState(() =>
    parametros.get("animal"),
  );
  // A fila do carrossel e o que está no centro dela: um animal ou, no
  // próprio perfil, o cartão de cadastrar (NOVO_ANIMAL).
  const itens = itensDoCarrossel(animais, ehProprio);
  const centro = itemDoCentro(animais, codigoEscolhido, ehProprio);
  // O cartão que está saindo na troca, e para que lado o carrossel andou
  // (1, para a direita; -1, para a esquerda): ele desliza para fora por um
  // lado enquanto o novo entra pelo outro, como duas páginas lado a lado.
  const [saida, setSaida] = useState(null);
  // O cartão que sai some no fim da animação (onAnimationEnd); se ela não
  // rodar por algum motivo, some mesmo assim, logo depois do tempo dela,
  // para nunca ficar preso na tela.
  useEffect(() => {
    if (!saida) return;
    const espera = setTimeout(() => setSaida(null), 700);
    return () => clearTimeout(espera);
  }, [saida]);
  // Troca o que está no centro (o código de um animal, ou NOVO_ANIMAL). O
  // cartão de cadastrar não vai para o endereço: recarregar a página volta
  // ao último animal.
  const escolher = (codigo) => {
    if (centro && codigo !== centro) {
      const de = itens.indexOf(centro);
      const para = itens.indexOf(codigo);
      // Um animal recém-cadastrado ainda não está na lista: entra pela
      // direita, como o último dela.
      const lado = para === -1 || para > de ? 1 : -1;
      setSaida(movimentoReduzido() ? null : { codigo: centro, lado });
    }
    setCodigoEscolhido(codigo);
    if (codigo !== NOVO_ANIMAL) {
      setParametros({ animal: codigo }, { replace: true });
    }
  };
  // O carrossel aparece quando há o que escolher: dois animais ou mais, ou,
  // no próprio perfil, um animal e o cartão de cadastrar. Sem nenhum animal,
  // o cadastro é o espaço grande embaixo.
  const comCarrossel =
    listaPronta && (animais.length > 1 || (ehProprio && animais.length > 0));
  const resumoAnimais =
    animais.length === 1
      ? "1 animal cadastrado"
      : `${animais.length} animais cadastrados`;
  const tituloAnimais = ehProprio
    ? "Meus animais"
    : perfil
      ? `Animais de ${nomeCurto(perfil)}`
      : "";

  // Mantém o animal pedido (?animal=...) ao trocar para o próprio perfil.
  if (ehMeuCodigo) {
    return (
      <Navigate
        to={{ pathname: "/meu-perfil", search: local.search }}
        replace
      />
    );
  }

  if (!perfil) {
    return (
      <>
        <Header />
        <main className="pb-20 px-5 md:px-16 max-w-[1200px] mx-auto pt-28">
          <EstadoDoPerfil codigo={codigoVisitado} pessoa={pessoa} />
        </main>
      </>
    );
  }

  return (
    <>
      <Header />
      {modal === "cadastrar" && (
        <ModalAnimal
          onFechar={fecharModal}
          onSalvo={(animal) => {
            lista.adicionar(animal);
            escolher(animal.codigo);
            confirmar(`${animal.nome} cadastrad${finalDoGenero(animal)}`);
            fecharModal();
          }}
        />
      )}
      {modal === "pedido" && <ModalPedirLiberacao onFechar={fecharModal} />}
      {modal === "comoFunciona" && (
        <ModalComoFuncionaContato onFechar={fecharModal} />
      )}

      <main className="pb-20 px-5 md:px-16 max-w-[1200px] mx-auto pt-28 selection:bg-[#fdecee] selection:text-[#9e0a24]">
        <section className="mb-10">
          <CartaoPerfil
            perfil={perfil}
            animais={listaPronta ? animais : null}
            ehProprio={ehProprio}
            acesso={acesso}
            meuCodigo={usuario?.codigo}
            onPedirLiberacao={() => setModal("pedido")}
            onComoFuncionaContato={() => setModal("comoFunciona")}
          />
        </section>

        {ehProprio && ehVet && (
          <section className="mb-10">
            {/* Recomeça do zero se a aba passar para outra conta. */}
            <PainelAcessoContatos
              key={usuario.codigo}
              onComoFunciona={() => setModal("comoFunciona")}
            />
          </section>
        )}

        {ehVet && !ehProprio && <AvisoVeterinario usuario={usuario} />}

        {comCarrossel ? (
          <CarrosselAnimais
            titulo={tituloAnimais}
            resumo={resumoAnimais}
            animais={animais}
            itens={itens}
            centro={centro}
            onEscolher={escolher}
            onCadastrar={() => setModal("cadastrar")}
          />
        ) : (
          <div className="flex flex-wrap justify-between items-center gap-x-4 gap-y-3">
            <h2 className="text-2xl font-bold text-[#1a1c1c]">
              {tituloAnimais}
            </h2>
            {listaPronta && (
              <span className="text-sm text-[#5f5e5e] whitespace-nowrap">
                {resumoAnimais}
              </span>
            )}
          </div>
        )}

        {/* O corte nas laterais esconde os cartões enquanto deslizam, sem
            a página ganhar rolagem para o lado. */}
        <section className="relative mt-6 overflow-x-clip">
          {!listaPronta ? (
            <EstadoDaLista
              erro={lista.erro}
              ehProprio={ehProprio}
              onTentarDeNovo={lista.tentarDeNovo}
            />
          ) : animais.length > 0 ? (
            // Todos os cartões ficam montados e só o do centro aparece: o
            // que cada um guarda enquanto a página está aberta (os exames
            // enviados, por exemplo) não se perde ao trocar de animal. Na
            // troca, o que sai fica por cima, solto, deslizando para fora,
            // até a animação acabar. Com o cartão de cadastrar no centro,
            // aparece o que o cadastro pede (PainelNovoAnimal).
            itens.map((item) => {
              const aberto = item === centro;
              const saindo = !aberto && saida?.codigo === item;
              const movimento = saindo
                ? `absolute inset-x-0 top-0 ${
                    saida.lado > 0
                      ? "animate-sair-para-esquerda"
                      : "animate-sair-para-direita"
                  }`
                : aberto && saida
                  ? saida.lado > 0
                    ? "animate-entrar-pela-direita"
                    : "animate-entrar-pela-esquerda"
                  : "";
              const animal = animais.find((a) => a.codigo === item);
              return (
                <div
                  key={item}
                  id={idDoPainel(item)}
                  role={comCarrossel ? "tabpanel" : undefined}
                  aria-labelledby={comCarrossel ? idDaAba(item) : undefined}
                  hidden={!aberto && !saindo}
                  // O que sai não recebe mais cliques nem foco.
                  inert={saindo || undefined}
                  onAnimationEnd={(e) => {
                    if (saindo && e.target === e.currentTarget) setSaida(null);
                  }}
                  className={movimento}
                >
                  {item === NOVO_ANIMAL ? (
                    <PainelNovoAnimal
                      onCadastrar={() => setModal("cadastrar")}
                    />
                  ) : (
                    <CartaoAnimal
                      animal={animal}
                      ehDono={ehProprio}
                      ehVet={ehVet}
                      nomeTutor={perfil.nomeCompleto}
                      onAlterado={lista.substituir}
                      onExcluido={lista.remover}
                    />
                  )}
                </div>
              );
            })
          ) : ehProprio ? (
            <BotaoCadastrarAnimal onClick={() => setModal("cadastrar")} />
          ) : (
            <p className="text-sm text-[#5f5e5e] py-6">
              Nenhum animal cadastrado ainda.
            </p>
          )}
        </section>
      </main>
    </>
  );
}

export default PerfilPage;
