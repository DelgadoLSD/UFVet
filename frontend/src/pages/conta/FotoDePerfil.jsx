import { useRef, useState } from "react";
import Avatar from "../../components/Avatar";
import AvisoErro from "../../components/AvisoErro";
import { confirmar } from "../../hooks/confirmacoes";
import { TIPOS_ACEITOS, erroDoArquivo } from "../../regras/fotos";
import { removerFotoDePerfil, trocarFotoDePerfil } from "../../servicos/sessao";
import { Girando } from "../../components/Carregando";

// A foto de perfil na página da conta (F3). Trocar e remover gravam na hora,
// sem esperar o "Salvar alterações": a foto não depende dos outros campos. A
// API confere a imagem, reduz e apaga a localização guardada pelo celular.
//
// A foto vem grande, num cartão com os botões presos embaixo dela, como uma
// peça só: fica claro que "Trocar" e "Remover" mexem na foto, e em nada mais.
// No celular, o cartão fica no meio; na tela larga, à esquerda, alinhado
// com os campos.

// Enquanto a foto vai, "Trocar" vira "Enviando…" e gira, sem ficar apagado
// como um botão desligado; só "Remover" fica apagado.
const CLASSE_BOTAO =
  "flex-1 h-11 flex items-center justify-center gap-1.5 text-[13px] font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[#9e0a24] disabled:pointer-events-none";

function FotoDePerfil({ usuario }) {
  const entrada = useRef(null);
  const [enviando, setEnviando] = useState(false);
  const [erro, setErro] = useState("");
  const temFoto = !!usuario.foto;

  const executar = async (acao, confirmacao) => {
    setEnviando(true);
    setErro("");
    try {
      await acao();
      confirmar(confirmacao);
    } catch (falha) {
      setErro(falha.campos?.foto ?? falha.message);
    } finally {
      setEnviando(false);
    }
  };

  const escolher = (e) => {
    const arquivo = e.target.files[0];
    // Para a mesma foto poder ser escolhida de novo.
    e.target.value = "";
    if (!arquivo) return;
    const problema = erroDoArquivo(arquivo);
    if (problema) setErro(problema);
    else executar(() => trocarFotoDePerfil(arquivo), "Foto atualizada");
  };

  return (
    <div className="flex flex-col items-center sm:items-start gap-3 pb-6 mb-6 border-b border-[#f0e6e6]">
      <div className="w-48 rounded-2xl border border-[#eadede] bg-white overflow-hidden">
        <div className="relative">
          <Avatar
            pessoa={usuario}
            tamanho="w-full aspect-square"
            fundo="bg-[#9e0a24]"
            formato="rounded-none"
            textoIniciais="text-5xl"
          />
          {/* Enquanto envia, a própria foto mostra que está carregando. */}
          {enviando && (
            <span
              aria-hidden="true"
              className="absolute inset-0 bg-white/75 flex items-center justify-center"
            >
              <Girando className="w-10 h-10" />
            </span>
          )}
        </div>

        <div className="flex border-t border-[#eadede] divide-x divide-[#eadede]">
          <button
            type="button"
            disabled={enviando}
            onClick={() => entrada.current.click()}
            aria-label={
              temFoto && !enviando ? "Trocar foto de perfil" : undefined
            }
            className={`${CLASSE_BOTAO} text-[#1a1c1c] hover:bg-[#faf6f6]`}
          >
            {enviando ? (
              <Girando className="w-[18px] h-[18px]" />
            ) : (
              <span
                aria-hidden="true"
                className="material-symbols-outlined text-[18px] text-[#9e0a24]"
              >
                photo_camera
              </span>
            )}
            {enviando ? "Enviando…" : temFoto ? "Trocar" : "Adicionar foto"}
          </button>
          {temFoto && (
            <button
              type="button"
              disabled={enviando}
              onClick={() => executar(removerFotoDePerfil, "Foto removida")}
              aria-label="Remover foto de perfil"
              className={`${CLASSE_BOTAO} disabled:opacity-50 text-[#5f5e5e] hover:bg-[#fdecee] hover:text-[#9e0a24]`}
            >
              <span
                aria-hidden="true"
                className="material-symbols-outlined text-[18px]"
              >
                delete
              </span>
              Remover
            </button>
          )}
        </div>
      </div>

      <input
        ref={entrada}
        type="file"
        accept={TIPOS_ACEITOS.join(",")}
        aria-label="Foto de perfil"
        className="hidden"
        onChange={escolher}
      />
      {erro && (
        <div className="w-full">
          <AvisoErro>{erro}</AvisoErro>
        </div>
      )}
    </div>
  );
}

export default FotoDePerfil;
