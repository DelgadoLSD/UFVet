import { useState } from "react";
import Modal from "../../components/Modal";
import Botao from "../../components/Botao";
import Campo from "../../components/Campo";
import Avatar from "../../components/Avatar";
import CampoCodigo from "../../components/CampoCodigo";
import EtiquetaCodigo from "../../components/EtiquetaCodigo";
import Segmentado from "../../components/Segmentado";
import { useSessao } from "../../servicos/sessao";
import { acharTutor } from "../../servicos/pessoas";
import {
  liberacoesAtivas,
  liberarAcesso,
  useAcessoContatos,
} from "../../servicos/acessoContatos";
import {
  DURACAO_PADRAO_HORAS,
  DURACOES_LIBERACAO,
} from "../../regras/acessoContatos";
import { mesAno, tempoRestante } from "../../util/datas";
import { LIMITES } from "../../regras/limites";
import { TAMANHO_CODIGO } from "../../util/texto";

// O veterinário libera um tutor pelo código dele: nomes se repetem, códigos
// não. A foto e os dados do tutor aparecem antes de confirmar, para quem
// libera ver se digitou o código errado.

// Dados do tutor encontrado. Se ele já tem acesso (liberado por este ou por
// outro veterinário), o cartão avisa, e o botão de liberar fica desligado.
function CartaoTutor({ tutor, liberacaoAtiva }) {
  return (
    <div className="rounded-xl border border-[#eadede] bg-white p-4 flex items-center gap-4">
      <Avatar
        pessoa={tutor}
        tamanho="w-16 h-16"
        fundo="bg-[#9e0a24]"
        formato="rounded-xl"
        textoIniciais="text-lg"
      />
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2 flex-wrap">
          <p className="font-bold text-[#1a1c1c]">{tutor.nomeCompleto}</p>
          <EtiquetaCodigo codigo={tutor.codigo} />
        </div>
        <p className="text-sm text-[#5f5e5e] mt-0.5 leading-snug">
          {tutor.cidade}. {tutor.animaisResumo}.
        </p>
        {tutor.membroDesde && (
          <p className="text-xs text-[#8f6f6e] mt-0.5">
            No UFVet desde {mesAno(tutor.membroDesde)}
          </p>
        )}
        {liberacaoAtiva && (
          <p className="mt-2 text-sm font-semibold text-[#9e0a24]">
            Já está com acesso liberado,{" "}
            {tempoRestante(liberacaoAtiva.expiraEm)}.
          </p>
        )}
      </div>
    </div>
  );
}

// Caixa tracejada no lugar do cartão, enquanto não há tutor para mostrar.
// `alerta` é o caso do código completo que não existe.
function Vazio({ children, alerta = false }) {
  return (
    <div
      className={`rounded-xl border border-dashed px-4 py-6 text-center text-sm ${
        alerta
          ? "border-[#e9aab3] bg-[#fff7f7] text-[#9e0a24]"
          : "border-[#e2cfcf] text-[#8f6f6e]"
      }`}
    >
      {children}
    </div>
  );
}

function ModalLiberarAcesso({ onFechar }) {
  const usuario = useSessao();
  const { liberacoes } = useAcessoContatos();
  const [codigo, setCodigo] = useState("");
  const [duracaoHoras, setDuracaoHoras] = useState(DURACAO_PADRAO_HORAS);
  const [caso, setCaso] = useState("");

  const completo = codigo.length === TAMANHO_CODIGO;
  const tutor = completo ? acharTutor(codigo) : null;
  // Confere entre todas as liberações ativas, não só as deste veterinário: o
  // tutor que já tem acesso dado por um colega não precisa de outro.
  const liberacaoAtiva =
    tutor &&
    liberacoesAtivas(liberacoes).find((l) => l.tutorCodigo === tutor.codigo);

  const liberar = () => {
    liberarAcesso({
      tutorCodigo: tutor.codigo,
      tutorNome: tutor.nomeCompleto,
      veterinarioCodigo: usuario.codigo,
      duracaoHoras,
      caso: caso.trim(),
    });
    onFechar();
  };

  return (
    <Modal
      titulo="Liberar acesso aos contatos"
      subtitulo="Enquanto a liberação estiver ativa, o tutor vê telefone e e-mail dos doadores"
      onFechar={onFechar}
      rodape={
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <p className="text-xs text-[#5f5e5e] leading-snug max-w-xs">
            A liberação fica no seu perfil, com o seu nome, até o prazo
            terminar.
          </p>
          <div className="flex gap-2">
            <Botao variante="secundario" onClick={onFechar}>
              Cancelar
            </Botao>
            <Botao disabled={!tutor || !!liberacaoAtiva} onClick={liberar}>
              Liberar acesso
            </Botao>
          </div>
        </div>
      }
    >
      <div className="flex flex-col gap-6">
        <CampoCodigo
          id="codigo-tutor"
          rotulo="Código do tutor"
          dica="Aparece ao lado do nome, no perfil"
          placeholder="T3M8P1"
          valor={codigo}
          onMudar={setCodigo}
        />

        {tutor ? (
          <CartaoTutor tutor={tutor} liberacaoAtiva={liberacaoAtiva} />
        ) : completo ? (
          <Vazio alerta>
            Nenhum tutor com o código #{codigo}. Confira com a pessoa que está
            no atendimento.
          </Vazio>
        ) : (
          <Vazio>
            Digite os {TAMANHO_CODIGO} caracteres do código para ver de quem é.
          </Vazio>
        )}

        <div>
          <p className="text-sm font-semibold text-[#1a1c1c] mb-2">
            Por quanto tempo
          </p>
          <Segmentado
            rotulo="Por quanto tempo"
            altura="h-10"
            opcoes={DURACOES_LIBERACAO}
            valor={duracaoHoras}
            onEscolher={setDuracaoHoras}
          />
          <p className="text-xs text-[#5f5e5e] mt-2">
            O acesso expira sozinho. Você pode renovar ou encerrar antes.
          </p>
        </div>

        <Campo
          id="caso-atendimento"
          rotulo="Caso (opcional)"
          placeholder="Ex.: Luna, transfusão hoje"
          maxLength={LIMITES.casoLiberacao}
          value={caso}
          onChange={(e) => setCaso(e.target.value)}
        />
      </div>
    </Modal>
  );
}

export default ModalLiberarAcesso;
