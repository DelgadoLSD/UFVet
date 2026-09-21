import { useState } from "react";
import { useNavigate } from "react-router-dom";
import Modal from "./Modal";
import Botao from "./Botao";
import Campo from "./Campo";

// Encerrar conta é a única ação do site que ninguém desfaz. Então a tela faz
// três coisas, nesta ordem: oferece a saída mais leve, diz o que se perde com
// as palavras do próprio site, e só então pede a senha.

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

const CONSEQUENCIAS_VET = [
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

function ModalEncerrarConta({ usuario, onClose, onEncerrar }) {
  const [senha, setSenha] = useState("");
  const navegar = useNavigate();

  const ehVet = usuario.role === "vet";
  const consequencias = ehVet ? CONSEQUENCIAS_VET : CONSEQUENCIAS_TUTOR;

  return (
    <Modal
      titulo="Encerrar sua conta"
      subtitulo={`${usuario.nomeCompleto} · #${usuario.codigo}`}
      onClose={onClose}
      rodape={
        <div className="flex justify-end gap-2">
          <Botao variante="secundario" onClick={onClose}>
            Cancelar
          </Botao>
          <Botao
            variante="perigoSolido"
            disabled={!senha}
            onClick={() => {
              onEncerrar();
              onClose();
            }}
          >
            Encerrar conta
          </Botao>
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
              onClose();
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
              <li key={item.icone} className="flex items-start gap-3">
                <span className="material-symbols-outlined text-[20px] text-[#8e001b] shrink-0">
                  {item.icone}
                </span>
                <span className="text-sm text-[#5b403f] leading-relaxed">
                  {item.texto}
                </span>
              </li>
            ))}
            <li className="flex items-start gap-3">
              <span className="material-symbols-outlined text-[20px] text-[#8e001b] shrink-0">
                delete_forever
              </span>
              <span className="text-sm text-[#5b403f] leading-relaxed">
                Seus dados pessoais saem do UFVet e não há como recuperar
                depois.
              </span>
            </li>
          </ul>
        </div>

        <div className="border-t border-[#f0e6e6] pt-5">
          <Campo
            id="senha-encerrar"
            rotulo="Digite sua senha para confirmar"
            senha
            autoComplete="current-password"
            placeholder="Sua senha"
            value={senha}
            onChange={(e) => setSenha(e.target.value)}
          />
        </div>
      </div>
    </Modal>
  );
}

export default ModalEncerrarConta;
