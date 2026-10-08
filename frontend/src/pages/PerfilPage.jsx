import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import AvisoErro from "../components/AvisoErro";
import Botao from "../components/Botao";
import Header from "../components/Header";
import ModalComoFuncionaContato from "../components/ModalComoFuncionaContato";
import ModalPedirLiberacao from "../components/ModalPedirLiberacao";
import CartaoPerfil from "./perfil/CartaoPerfil";
import CartaoAnimal from "./perfil/CartaoAnimal";
import ModalAnimal from "./perfil/ModalAnimal";
import PainelAcessoContatos from "./perfil/PainelAcessoContatos";
import { useSessao } from "../servicos/sessao";
import { perfilVisitado } from "../servicos/pessoas";
import { confirmar } from "../hooks/confirmacoes";
import { finalDoGenero } from "../regras/doacao";
import { animaisDeExemplo, listarAnimais } from "../servicos/animais";
import { acessoDe, useAcessoContatos } from "../servicos/acessoContatos";
import { ehVeterinario, nomeCurto, nomeProfissional } from "../util/texto";

// Página de perfil, em duas rotas:
// - /meu-perfil: o perfil de quem está logado, com os próprios animais (e,
//   para o veterinário, o painel de acesso aos contatos);
// - /tutor/:codigo: o perfil de outra pessoa, aberto pela busca.
//
// As partes da página ficam em pages/perfil/.
//
// Os animais do próprio perfil vêm da API. O perfil de outra pessoa ainda
// mostra pessoa e animais de exemplo, até a busca e os perfis visitados virem
// da API (ver servicos/pessoas.js e servicos/animais.js).

// Os animais de quem está logado, da API, e como a página atualiza a lista
// depois de cadastrar, editar ou excluir. Sem `codigo` (perfil de outra
// pessoa), não busca nada.
function useMeusAnimais(codigo) {
  const [estado, setEstado] = useState({
    carregando: true,
    animais: [],
    erro: "",
  });
  // Mudar este número faz a lista ser buscada de novo ("Tentar de novo").
  const [tentativa, setTentativa] = useState(0);

  useEffect(() => {
    if (!codigo) return undefined;
    // A resposta de uma busca antiga (de outra conta, ou anterior a uma nova
    // tentativa) é ignorada.
    let valendo = true;
    listarAnimais(codigo).then(
      (animais) =>
        valendo && setEstado({ carregando: false, animais, erro: "" }),
      (falha) =>
        valendo &&
        setEstado({ carregando: false, animais: [], erro: falha.message }),
    );
    return () => {
      valendo = false;
    };
  }, [codigo, tentativa]);

  const mudarLista = (mudar) =>
    setEstado((prev) => ({ ...prev, animais: mudar(prev.animais) }));

  return {
    ...estado,
    tentarDeNovo: () => {
      setEstado({ carregando: true, animais: [], erro: "" });
      setTentativa((n) => n + 1);
    },
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
function EstadoDaLista({ erro, onTentarDeNovo }) {
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
      Carregando seus animais…
    </p>
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

// Fim da lista dos próprios animais: o lugar do próximo cartão, tracejado,
// com as fotos dos animais já cadastrados em fila e o "+" vermelho como o
// próximo da fila. Sem nenhum animal ainda, fica só o "+".
function BotaoCadastrarAnimal({ animais, onClick }) {
  const fotos = animais
    .filter((animal) => animal.fotos.length > 0)
    .slice(0, 3)
    .map((animal) => ({ url: animal.fotos[0].url, nome: animal.nome }));

  return (
    <button
      type="button"
      onClick={onClick}
      className="group w-full py-9 px-6 flex flex-col items-center justify-center gap-3 rounded-2xl border-2 border-dashed border-[#e2cfcf] bg-white hover:border-[#9e0a24]/60 hover:bg-[#fffafa] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#9e0a24]"
    >
      <span aria-hidden="true" className="flex items-center -space-x-3">
        {fotos.map((foto) => (
          <img
            key={foto.url}
            src={foto.url}
            alt=""
            className="w-12 h-12 rounded-full object-cover ring-4 ring-white"
          />
        ))}
        <span className="w-12 h-12 rounded-full bg-[#9e0a24] ring-4 ring-white flex items-center justify-center text-white transition-transform group-hover:scale-110 motion-reduce:group-hover:scale-100">
          <span className="material-symbols-outlined text-[28px]">add</span>
        </span>
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
  const usuario = useSessao();
  const acesso = acessoDe(usuario, useAcessoContatos());
  // Modal aberto no nível da página: "cadastrar", "pedido", "comoFunciona"
  // ou null.
  const [modal, setModal] = useState(null);
  const fecharModal = () => setModal(null);

  const ehProprio = !codigo;
  const ehVet = ehVeterinario(usuario);
  const perfil = ehProprio ? usuario : perfilVisitado(usuario);
  const meus = useMeusAnimais(ehProprio ? usuario.codigo : null);
  const animais = ehProprio ? meus.animais : animaisDeExemplo(perfil.codigo);
  const listaPronta = !ehProprio || (!meus.carregando && !meus.erro);

  return (
    <>
      <Header />
      {modal === "cadastrar" && (
        <ModalAnimal
          onFechar={fecharModal}
          onSalvo={(animal) => {
            meus.adicionar(animal);
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
            <PainelAcessoContatos
              onComoFunciona={() => setModal("comoFunciona")}
            />
          </section>
        )}

        {ehVet && !ehProprio && <AvisoVeterinario usuario={usuario} />}

        <div className="flex flex-wrap justify-between items-end gap-x-4 gap-y-1 mb-6">
          <h2 className="text-2xl font-bold text-[#1a1c1c]">
            {ehProprio ? "Meus animais" : `Animais de ${nomeCurto(perfil)}`}
          </h2>
          {listaPronta && (
            <span className="text-sm text-[#5f5e5e] whitespace-nowrap">
              {animais.length}{" "}
              {animais.length === 1
                ? "animal cadastrado"
                : "animais cadastrados"}
            </span>
          )}
        </div>

        <section className="space-y-6">
          {listaPronta ? (
            animais.map((animal) => (
              <CartaoAnimal
                key={animal.codigo}
                animal={animal}
                ehDono={ehProprio}
                ehVet={ehVet}
                nomeTutor={perfil.nomeCompleto}
                onAlterado={meus.substituir}
                onExcluido={meus.remover}
              />
            ))
          ) : (
            <EstadoDaLista
              erro={meus.erro}
              onTentarDeNovo={meus.tentarDeNovo}
            />
          )}
          {ehProprio && listaPronta && (
            <BotaoCadastrarAnimal
              animais={animais}
              onClick={() => setModal("cadastrar")}
            />
          )}
        </section>
      </main>
    </>
  );
}

export default PerfilPage;
