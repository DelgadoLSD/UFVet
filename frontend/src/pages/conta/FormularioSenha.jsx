import { useState } from "react";
import AvisoErro from "../../components/AvisoErro";
import Botao from "../../components/Botao";
import Campo from "../../components/Campo";
import { TAMANHO_MINIMO_SENHA } from "../../regras/conta";
import { trocarSenha } from "../../servicos/sessao";

// Troca de senha na página da conta (F4): a senha atual, a nova e a
// repetição (NF4.2). O botão fica sempre ligado: ao salvar, o que falta
// aparece embaixo de cada campo. A API confere a senha atual e derruba os
// outros aparelhos.

// O que falta para trocar a senha, campo a campo.
function errosDaSenha(atual, nova, confirmacao) {
  const erros = {};
  if (!atual) erros.senhaAtual = "Digite a sua senha atual.";
  if (nova.length < TAMANHO_MINIMO_SENHA) {
    erros.senhaNova = `A nova senha precisa ter pelo menos ${TAMANHO_MINIMO_SENHA} caracteres.`;
  } else if (!confirmacao) {
    erros.confirmacao = "Repita a nova senha para confirmar.";
  } else if (confirmacao !== nova) {
    erros.confirmacao = "As duas senhas estão diferentes: repita a mesma.";
  }
  return erros;
}

function FormularioSenha({ onSalvar, onCancelar }) {
  const [atual, setAtual] = useState("");
  const [nova, setNova] = useState("");
  const [confirmacao, setConfirmacao] = useState("");
  const [erros, setErros] = useState({});
  const [erroGeral, setErroGeral] = useState("");
  const [enviando, setEnviando] = useState(false);

  const curta = nova.length > 0 && nova.length < TAMANHO_MINIMO_SENHA;
  const diferentes = confirmacao.length > 0 && nova !== confirmacao;

  const salvar = async (e) => {
    e.preventDefault();
    const problemas = errosDaSenha(atual, nova, confirmacao);
    if (Object.keys(problemas).length > 0) {
      setErros(problemas);
      return;
    }
    setEnviando(true);
    setErroGeral("");
    try {
      await trocarSenha(atual, nova);
      onSalvar();
    } catch (falha) {
      // "Senha incorreta" aparece embaixo da senha atual; o resto, acima
      // dos botões.
      if (falha.campos) setErros(falha.campos);
      else setErroGeral(falha.message);
      setEnviando(false);
    }
  };

  return (
    <form className="flex flex-col gap-5 max-w-md" onSubmit={salvar}>
      <Campo
        id="senha-atual"
        rotulo="Senha atual"
        senha
        autoComplete="current-password"
        value={atual}
        onChange={(e) => {
          setAtual(e.target.value);
          setErros((prev) => ({ ...prev, senhaAtual: undefined }));
        }}
        erro={erros.senhaAtual}
      />
      <div>
        <Campo
          id="senha-nova"
          rotulo="Nova senha"
          senha
          autoComplete="new-password"
          value={nova}
          onChange={(e) => {
            setNova(e.target.value);
            setErros((prev) => ({ ...prev, senhaNova: undefined }));
          }}
          erro={erros.senhaNova}
        />
        {!erros.senhaNova && (
          <p
            className={`text-xs mt-2 ${curta ? "text-[#9e0a24]" : "text-[#5f5e5e]"}`}
          >
            Pelo menos {TAMANHO_MINIMO_SENHA} caracteres.
          </p>
        )}
      </div>
      <div>
        <Campo
          id="senha-confirmacao"
          rotulo="Repita a nova senha"
          senha
          autoComplete="new-password"
          value={confirmacao}
          onChange={(e) => {
            setConfirmacao(e.target.value);
            setErros((prev) => ({ ...prev, confirmacao: undefined }));
          }}
          erro={erros.confirmacao}
        />
        {diferentes && !erros.confirmacao && (
          <p className="text-xs text-[#9e0a24] mt-2">
            As duas senhas estão diferentes.
          </p>
        )}
      </div>
      <p className="text-sm text-[#5f5e5e] leading-relaxed">
        Ao salvar, a conta sai dos outros aparelhos em que estiver aberta. Este
        continua conectado.
      </p>
      <AvisoErro>{erroGeral}</AvisoErro>
      <div className="flex gap-2">
        <Botao type="submit" disabled={enviando}>
          {enviando ? "Salvando…" : "Salvar senha"}
        </Botao>
        <Botao variante="secundario" onClick={onCancelar} disabled={enviando}>
          Cancelar
        </Botao>
      </div>
    </form>
  );
}

export default FormularioSenha;
