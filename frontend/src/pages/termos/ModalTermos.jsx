import { useLayoutEffect, useRef, useState } from "react";
import Botao from "../../components/Botao";
import Modal from "../../components/Modal";
import { VERSAO } from "./indice";
import { NaJanela } from "./janela";
import Secoes from "./Secoes";

// Os termos de uso e privacidade numa janela por cima do cadastro e da
// página de entrar, em vez de outra aba. Em tela cheia (F11), o navegador
// esconde as abas: a aba nova parecia ter trocado a página, e quem estava
// no meio do cadastro não achava o caminho de volta. Na janela, o
// formulário continua atrás, do jeito que estava, e o único caminho é
// voltar para ele: pelo botão de baixo, pelo X, pelo Esc ou por um clique
// fora.
//
// `item`: o item dos termos que aparece primeiro (pages/termos/indice.js).
// `rotuloVoltar`: o botão diz para onde a pessoa volta.
function ModalTermos({ item, rotuloVoltar, onFechar }) {
  const textoRef = useRef(null);

  // Abre já no item pedido, com o título dele onde o texto começa. Só o
  // corpo da janela rola; a página atrás fica parada.
  useLayoutEffect(() => {
    const texto = textoRef.current;
    const alvo = texto?.querySelector(`#${item}`);
    const caixa = caixaQueRola(texto);
    if (!alvo || !caixa) return;
    const folga = parseFloat(getComputedStyle(caixa).paddingTop) || 0;
    caixa.scrollTop +=
      alvo.getBoundingClientRect().top -
      caixa.getBoundingClientRect().top -
      folga;
  }, [item]);

  return (
    <Modal
      titulo="Termos de uso e privacidade"
      subtitulo={`Versão ${VERSAO.numero}, de ${VERSAO.vigencia}`}
      largura="max-w-3xl"
      onFechar={onFechar}
      rodape={
        <div className="flex justify-end">
          <Botao icone="arrow_back" onClick={onFechar}>
            {rotuloVoltar}
          </Botao>
        </div>
      }
    >
      <div ref={textoRef} className="space-y-12 sm:space-y-16">
        <NaJanela value={true}>
          <Secoes />
        </NaJanela>
      </div>
    </Modal>
  );
}

// O corpo da janela: o primeiro ancestral com rolagem própria.
function caixaQueRola(elemento) {
  for (let pai = elemento?.parentElement; pai; pai = pai.parentElement) {
    if (/auto|scroll/.test(getComputedStyle(pai).overflowY)) return pai;
  }
  return null;
}

const LINK = "font-semibold text-[#9e0a24] hover:underline";

// "os Termos de uso e a Política de privacidade", para o fim de uma frase
// ("Li e aceito …", "Ao entrar, você concorda com …"). Os dois links abrem
// os termos na janela; o da privacidade abre direto no item dela. O
// endereço continua no link: quem pede outra aba de propósito (Ctrl, Shift,
// o botão do meio ou o menu do botão direito) vai para /termos.
export function TermosEPrivacidade({ rotuloVoltar }) {
  const [item, setItem] = useState(null);

  const abrir = (qual) => (e) => {
    if (e.ctrlKey || e.metaKey || e.shiftKey || e.altKey) return;
    e.preventDefault();
    setItem(qual);
  };

  return (
    <>
      os{" "}
      <a
        href="/termos"
        aria-haspopup="dialog"
        onClick={abrir("o-que-e")}
        className={LINK}
      >
        Termos de uso
      </a>{" "}
      e a{" "}
      <a
        href="/termos#privacidade"
        aria-haspopup="dialog"
        onClick={abrir("privacidade")}
        className={LINK}
      >
        Política de privacidade
      </a>
      {item && (
        <ModalTermos
          item={item}
          rotuloVoltar={rotuloVoltar}
          onFechar={() => setItem(null)}
        />
      )}
    </>
  );
}

export default ModalTermos;
