import { useRef, useState } from "react";
import Avatar from "../../components/Avatar";
import AvisoErro from "../../components/AvisoErro";
import Botao from "../../components/Botao";
import { confirmar } from "../../hooks/confirmacoes";
import { TIPOS_ACEITOS, erroDoArquivo } from "../../regras/fotos";
import { removerFotoDePerfil, trocarFotoDePerfil } from "../../servicos/sessao";

// A foto de perfil na página da conta (F3). Trocar e remover gravam na hora,
// sem esperar o "Salvar alterações": a foto não depende dos outros campos. A
// API confere a imagem, reduz e apaga a localização guardada pelo celular.
//
// Os botões são os mesmos dos cartões dos animais: o neutro, com ícone, para
// mudar, e o quadrado da lixeira para remover.
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
    <div className="flex items-start gap-5 pb-6 mb-6 border-b border-[#f0e6e6]">
      <div className="relative shrink-0">
        <Avatar
          pessoa={usuario}
          tamanho="w-20 h-20 sm:w-24 sm:h-24"
          fundo="bg-[#b7102a]"
          formato="rounded-2xl"
          textoIniciais="text-2xl"
        />
        {/* Enquanto envia, a própria foto mostra que está carregando. */}
        {enviando && (
          <span
            aria-hidden="true"
            className="absolute inset-0 rounded-2xl bg-[#1a1a1a]/75 flex items-center justify-center"
          >
            <span className="w-7 h-7 rounded-full border-[3px] border-white border-t-transparent animate-spin motion-reduce:animate-none" />
          </span>
        )}
      </div>

      <div className="min-w-0">
        <p className="font-semibold text-[#1a1c1c]">Foto de perfil</p>
        <p className="text-sm text-[#5f5e5e] mt-0.5 leading-relaxed">
          Quem recebe seu contato vê essa foto.
        </p>
        <div className="flex items-center gap-2 mt-3">
          <Botao
            variante="editar"
            icone="photo_camera"
            disabled={enviando}
            onClick={() => entrada.current.click()}
          >
            {enviando
              ? "Enviando…"
              : temFoto
                ? "Trocar foto"
                : "Adicionar foto"}
          </Botao>
          {temFoto && (
            <Botao
              variante="perigo"
              icone="delete"
              aria-label="Remover foto de perfil"
              title="Remover foto"
              disabled={enviando}
              onClick={() => executar(removerFotoDePerfil, "Foto removida")}
            />
          )}
          <input
            ref={entrada}
            type="file"
            accept={TIPOS_ACEITOS.join(",")}
            aria-label="Foto de perfil"
            className="hidden"
            onChange={escolher}
          />
        </div>
        {erro && (
          <div className="mt-3">
            <AvisoErro>{erro}</AvisoErro>
          </div>
        )}
      </div>
    </div>
  );
}

export default FotoDePerfil;
