import { useState } from "react";
import Botao from "../../components/Botao";
import Campo from "../../components/Campo";
import { TAMANHO_MINIMO_SENHA } from "../../regras/conta";

// Troca de senha na página da conta: a senha atual, a nova e a repetição. Só
// libera o botão quando a nova tem o tamanho mínimo e as duas batem.
function FormularioSenha({ onSalvar, onCancelar }) {
  const [atual, setAtual] = useState("");
  const [nova, setNova] = useState("");
  const [confirmacao, setConfirmacao] = useState("");

  const curta = nova.length > 0 && nova.length < TAMANHO_MINIMO_SENHA;
  const diferentes = confirmacao.length > 0 && nova !== confirmacao;
  const pronto =
    atual && nova.length >= TAMANHO_MINIMO_SENHA && nova === confirmacao;

  return (
    <form
      className="flex flex-col gap-5 max-w-md"
      onSubmit={(e) => {
        e.preventDefault();
        onSalvar();
      }}
    >
      <Campo
        id="senha-atual"
        rotulo="Senha atual"
        senha
        autoComplete="current-password"
        value={atual}
        onChange={(e) => setAtual(e.target.value)}
      />
      <div>
        <Campo
          id="senha-nova"
          rotulo="Nova senha"
          senha
          autoComplete="new-password"
          value={nova}
          onChange={(e) => setNova(e.target.value)}
        />
        <p
          className={`text-xs mt-2 ${curta ? "text-red-600" : "text-[#5f5e5e]"}`}
        >
          Pelo menos {TAMANHO_MINIMO_SENHA} caracteres.
        </p>
      </div>
      <div>
        <Campo
          id="senha-confirmacao"
          rotulo="Repita a nova senha"
          senha
          autoComplete="new-password"
          value={confirmacao}
          onChange={(e) => setConfirmacao(e.target.value)}
        />
        {diferentes && (
          <p className="text-xs text-red-600 mt-2">
            As duas senhas estão diferentes.
          </p>
        )}
      </div>
      <div className="flex gap-2">
        <Botao type="submit" disabled={!pronto}>
          Salvar senha
        </Botao>
        <Botao variante="secundario" onClick={onCancelar}>
          Cancelar
        </Botao>
      </div>
    </form>
  );
}

export default FormularioSenha;
