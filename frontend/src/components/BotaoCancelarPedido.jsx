import { useState } from "react";
import AvisoErro from "./AvisoErro";
import Botao from "./Botao";
import { cancelarPedido } from "../servicos/acessoContatos";
import { useSessao } from "../servicos/sessao";
import { confirmar } from "../hooks/confirmacoes";
import { nomeProfissionalCurto } from "../util/texto";

// O tutor desiste do pedido de liberação que espera resposta (NF27.5), para
// poder pedir a outro veterinário. Aparece na busca e no perfil de outro tutor.
// Se der certo, a tela troca este botão por "Pedir liberação".
function BotaoCancelarPedido({
  pedido,
  variante = "secundario",
  className = "",
}) {
  const usuario = useSessao();
  const [cancelando, setCancelando] = useState(false);
  const [erro, setErro] = useState("");

  const cancelar = async () => {
    setCancelando(true);
    setErro("");
    try {
      await cancelarPedido(usuario.codigo, pedido);
      confirmar(
        `Pedido para ${nomeProfissionalCurto(pedido.veterinario)} cancelado`,
        "Você pode pedir de novo, ao mesmo ou a outro veterinário.",
      );
    } catch (falha) {
      setErro(falha.message);
      setCancelando(false);
    }
  };

  return (
    <div className={`flex flex-col gap-2 ${className}`}>
      <Botao
        variante={variante}
        icone="close"
        className="w-full max-sm:h-11"
        carregando={cancelando}
        onClick={cancelar}
      >
        {cancelando ? "Cancelando…" : "Cancelar pedido"}
      </Botao>
      <AvisoErro>{erro}</AvisoErro>
    </div>
  );
}

export default BotaoCancelarPedido;
