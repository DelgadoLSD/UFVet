import { useState } from "react";
import { useNavigate } from "react-router-dom";
import AvisoErro from "../../components/AvisoErro";
import Modal from "../../components/Modal";
import Botao from "../../components/Botao";
import Campo from "../../components/Campo";
import { encerrarConta } from "../../servicos/sessao";
import { ehVeterinario } from "../../util/texto";

// Encerrar a conta é a única ação do site que ninguém desfaz. Por isso a tela
// faz três coisas, nesta ordem: oferece a saída mais leve (NF5.3), diz o que
// se perde com as palavras do próprio site (NF5.2) e só então pede a senha
// (NF5.1).

const CONSEQUENCIAS_TUTOR = [
  {
    icone: "search_off",
    texto:
      "Seus animais saem da busca na hora e deixam de aparecer como doadores.",
  },
  {
    icone: "delete",
    texto:
      "O cadastro deles é apagado junto: fotos, exames, validações e o histórico de doações.",
  },
  {
    icone: "lock",
    texto:
      "Quem tinha liberação para ver seu telefone perde o acesso imediatamente.",
  },
];

const CONSEQUENCIAS_VETERINARIO = [
  {
    icone: "lock",
    texto:
      "Os tutores que você liberou perdem o acesso aos contatos na hora, e os pedidos em aberto são cancelados.",
  },
  {
    icone: "verified",
    texto:
      "As validações que você assinou continuam nos perfis dos animais, com seu CRMV: elas são documento clínico, e o tutor precisa saber quem assinou.",
  },
  {
    icone: "delete",
    texto:
      "Seus animais, se você tiver algum cadastrado, são apagados com o seu cadastro.",
  },
];

// Vale para todo mundo, e por isso fecha a lista.
const DADOS_PESSOAIS = {
  icone: "delete_forever",
  texto: "Seus dados pessoais saem do UFVet e não há como recuperar depois.",
};

function ModalEncerrarConta({ usuario, onFechar, onEncerrada }) {
  const [senha, setSenha] = useState("");
  const [erro, setErro] = useState("");
  const [erroGeral, setErroGeral] = useState("");
  const [enviando, setEnviando] = useState(false);
  const navegar = useNavigate();

  const encerrar = async (e) => {
    e.preventDefault();
    // O botão fica ligado: sem a senha, o campo diz o que falta.
    if (!senha) {
      setErro("Digite a sua senha para confirmar o encerramento.");
      return;
    }
    setEnviando(true);
    setErroGeral("");
    try {
      await encerrarConta(senha);
      onEncerrada();
    } catch (falha) {
      if (falha.campos?.senhaAtual) setErro(falha.campos.senhaAtual);
      else setErroGeral(falha.message);
      setEnviando(false);
    }
  };

  const ehVet = ehVeterinario(usuario);
  const consequencias = [
    ...(ehVet ? CONSEQUENCIAS_VETERINARIO : CONSEQUENCIAS_TUTOR),
    DADOS_PESSOAIS,
  ];

  return (
    <Modal
      titulo="Encerrar sua conta"
      subtitulo={`${usuario.nomeCompleto} · #${usuario.codigo}`}
      onFechar={onFechar}
      rodape={
        <div className="flex flex-col gap-3">
          {/* Acima dos botões, sempre à vista. */}
          <AvisoErro>{erroGeral}</AvisoErro>
          <div className="flex justify-end gap-2">
            <Botao variante="secundario" onClick={onFechar} disabled={enviando}>
              Cancelar
            </Botao>
            {/* Envia o formulário da senha, que fica no corpo da janela. */}
            <Botao
              type="submit"
              form="form-encerrar-conta"
              variante="perigoSolido"
              disabled={enviando}
            >
              {enviando ? "Encerrando…" : "Encerrar conta"}
            </Botao>
          </div>
        </div>
      }
    >
      <div className="flex flex-col gap-6">
        {/* A saída mais leve vem antes: quase sempre é o que a pessoa queria. */}
        <div className="rounded-xl border border-[#e4bebc] bg-[#fdf7f7] p-5">
          <p className="font-bold text-[#1a1c1c]">
            Só quer parar de receber pedidos?
          </p>
          <p className="text-sm text-[#5b403f] mt-1 leading-relaxed">
            {ehVet
              ? "Encerrar as liberações ativas já interrompe os contatos, e sua conta continua com o histórico de validações."
              : "Marque seus animais como indisponíveis. Eles saem da busca, sua conta continua aqui e você volta quando quiser."}
          </p>
          <Botao
            variante="secundario"
            tamanho="sm"
            className="mt-3"
            onClick={() => {
              onFechar();
              navegar("/meu-perfil");
            }}
          >
            {ehVet ? "Ver liberações ativas" : "Ir para meus animais"}
          </Botao>
        </div>

        <div>
          <p className="font-bold text-[#1a1c1c] mb-3">
            O que acontece ao encerrar
          </p>
          <ul className="flex flex-col gap-3">
            {consequencias.map((item) => (
              <li key={item.texto} className="flex items-start gap-3">
                <span
                  aria-hidden="true"
                  className="material-symbols-outlined text-[20px] text-[#9e0a24] shrink-0"
                >
                  {item.icone}
                </span>
                <span className="text-sm text-[#5b403f] leading-relaxed">
                  {item.texto}
                </span>
              </li>
            ))}
          </ul>
        </div>

        <form
          id="form-encerrar-conta"
          onSubmit={encerrar}
          className="border-t border-[#f0e6e6] pt-5 flex flex-col gap-4"
        >
          <Campo
            id="senha-encerrar"
            rotulo="Digite sua senha para confirmar"
            senha
            autoComplete="current-password"
            placeholder="Sua senha"
            value={senha}
            onChange={(e) => {
              setSenha(e.target.value);
              setErro("");
            }}
            erro={erro}
          />
        </form>
      </div>
    </Modal>
  );
}

export default ModalEncerrarConta;
