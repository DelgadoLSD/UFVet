import { useEffect, useId, useRef, useState } from "react";
import Modal from "../../components/Modal";
import Ajuda from "../../components/Ajuda";
import AvisoErro from "../../components/AvisoErro";
import Botao from "../../components/Botao";
import PainelSecao from "./PainelSecao";
import { confirmar } from "../../hooks/confirmacoes";
import { baixarExame } from "../../servicos/animais";
import { CRITERIOS_DOACAO, TIPOS_DOCUMENTO } from "../../regras/doacao";
import {
  AVISO_DE_ENVIO,
  TIPOS_ACEITOS_EXAME,
  erroDoExame,
} from "../../regras/documentos";
import { formatarData } from "../../util/datas";

// Exames e documentos do animal: hemograma, sorologias e carteira de
// vacinação (F14). O dono envia e atualiza. Um exame refeito não substitui o
// anterior: entra como versão nova, e o histórico fica, para o veterinário
// comparar (F15). O dono também apaga uma versão que mandou (o arquivo
// errado); se a validação em vigor tinha conferido aquele arquivo, o critério
// que ele comprova perde o efeito (F21), e a confirmação avisa antes.
//
// Todos veem que exames existem e quando foram enviados. O arquivo só abre
// para o dono e para os veterinários, porque um laudo costuma trazer o nome,
// o telefone e o endereço do tutor: a API só manda o endereço do arquivo
// (arquivoUrl) para eles, e confere de novo quando o arquivo é pedido.

// O arquivo de uma versão, baixado da API: { endereco } pronto para mostrar,
// { erro } com a mensagem da API, ou { carregando }. O endereço é do próprio
// navegador (blob:) e é liberado quando a versão sai da tela.
function useArquivoDoExame(arquivoUrl) {
  const [estado, setEstado] = useState({ carregando: true });
  useEffect(() => {
    let ativo = true;
    let endereco = null;
    baixarExame({ arquivoUrl }).then(
      (arquivo) => {
        endereco = URL.createObjectURL(arquivo);
        if (ativo) setEstado({ endereco });
        else URL.revokeObjectURL(endereco);
      },
      (falha) => {
        if (ativo) setEstado({ erro: falha.message });
      },
    );
    return () => {
      ativo = false;
      if (endereco) URL.revokeObjectURL(endereco);
    };
  }, [arquivoUrl]);
  return estado;
}

// O arquivo de uma versão na janela do exame. A imagem aparece ali mesmo. O
// PDF abre no leitor do navegador, numa aba nova: dentro de uma janela fixa
// sobre a página, o Edge deixa o PDF em branco quando a página está rolada
// para baixo (e a seção de exames fica embaixo), e o leitor dos celulares só
// abre PDF à parte. Na aba nova, o leitor tem zoom, impressão e o nome certo
// do arquivo para salvar. O arquivo é baixado antes mesmo assim: se ele não
// abrir (a sessão terminou, o arquivo sumiu), a janela já diz por quê.
function ArquivoDoExame({ versao, nome }) {
  const arquivo = useArquivoDoExame(versao.arquivoUrl);
  const descricao = `${nome}, enviado em ${formatarData(versao.enviadoEm)}`;

  if (arquivo.erro) return <AvisoErro>{arquivo.erro}</AvisoErro>;
  if (arquivo.carregando) {
    return (
      <div className="h-[40vh] rounded-xl border border-[#eadede] flex items-center justify-center gap-2 text-sm text-[#5f5e5e]">
        <span
          aria-hidden="true"
          className="material-symbols-outlined text-[18px] animate-spin"
        >
          progress_activity
        </span>
        Abrindo o arquivo…
      </div>
    );
  }
  if (versao.formato === "pdf") {
    return (
      <div className="rounded-xl border border-[#eadede] flex flex-col items-center gap-3 px-6 py-12 text-center">
        <span
          aria-hidden="true"
          className="material-symbols-outlined text-[44px] text-[#9e0a24]"
        >
          picture_as_pdf
        </span>
        <p className="text-sm text-[#5f5e5e] max-w-sm">
          Este exame é um PDF. Ele abre no leitor do navegador, numa aba nova.
        </p>
        <Botao
          as="a"
          href={versao.arquivoUrl}
          target="_blank"
          rel="noreferrer"
          icone="open_in_new"
        >
          Abrir o PDF
        </Botao>
      </div>
    );
  }
  return (
    <div className="w-full rounded-xl border border-[#e4bebc] bg-[#2a2a2a] overflow-auto max-h-[65vh]">
      <img src={arquivo.endereco} alt={descricao} className="w-full h-auto" />
    </div>
  );
}

// A confirmação de apagar a versão aberta, logo abaixo dela. Quando a
// validação em vigor conferiu este arquivo (`criterioAfetado`, que a API
// calcula), o aviso diz o que se perde, como o aviso do formulário do animal
// (NF9.1): sem o arquivo, ninguém mais consegue conferir aquele critério.
function ConfirmarApagar({
  versao,
  validacao,
  apagando,
  erro,
  onApagar,
  onCancelar,
}) {
  const caixa = useRef(null);
  const tituloId = useId();
  // O foco vai para a pergunta, para o leitor de tela anunciá-la.
  useEffect(() => {
    caixa.current?.focus();
  }, []);
  const criterio = CRITERIOS_DOACAO.find(
    (c) => c.chave === versao.criterioAfetado,
  );

  return (
    <div
      ref={caixa}
      tabIndex={-1}
      role="group"
      aria-labelledby={tituloId}
      className="rounded-xl border border-[#eadede] p-4 flex flex-col gap-3 focus:outline-none"
    >
      <div>
        <p id={tituloId} className="text-sm font-bold text-[#1a1c1c]">
          Apagar a versão de {formatarData(versao.enviadoEm)}?
        </p>
        <p className="mt-0.5 text-sm text-[#5b403f]">
          O arquivo sai do site e não tem como voltar.
        </p>
      </div>
      {criterio && (
        <div className="flex items-start gap-2 bg-[#fdecee] border border-[#9e0a24]/25 rounded-lg px-3 py-2.5">
          <span
            aria-hidden="true"
            className="material-symbols-outlined text-[#9e0a24] text-[18px] shrink-0"
          >
            release_alert
          </span>
          <p className="text-xs text-[#5b403f] leading-relaxed">
            Apagar desfaz a validação de{" "}
            <strong className="font-semibold text-[#9e0a24]">
              {criterio.rotulo.toLowerCase()}
            </strong>
            , assinada por {validacao.veterinarioNome} em{" "}
            {formatarData(validacao.realizadaEm)}: este arquivo já estava aqui
            quando ela foi feita. Um veterinário precisa conferir de novo.
          </p>
        </div>
      )}
      <AvisoErro>{erro}</AvisoErro>
      <div className="flex justify-end gap-2">
        <Botao
          variante="secundario"
          tamanho="sm"
          onClick={onCancelar}
          disabled={apagando}
        >
          Cancelar
        </Botao>
        <Botao
          variante="perigoSolido"
          tamanho="sm"
          icone="delete"
          onClick={onApagar}
          disabled={apagando}
        >
          {apagando ? "Apagando…" : "Apagar versão"}
        </Botao>
      </div>
    </div>
  );
}

// Visualizador de um documento, com a lista de versões quando há mais de uma.
// Abre na versão mais recente. O dono apaga a versão aberta (o arquivo
// errado, por exemplo), depois de confirmar; apagada a única versão, a janela
// fecha (ver SecaoDocumentos).
function ModalDocumento({
  tipo,
  versoes,
  validacao,
  ehDono,
  onApagar,
  onFechar,
}) {
  const [idAberto, setIdAberto] = useState(versoes.at(-1).id);
  const [confirmando, setConfirmando] = useState(false);
  const [apagando, setApagando] = useState(false);
  const [erro, setErro] = useState("");
  const botaoApagar = useRef(null);
  // A versão aberta; se ela acabou de ser apagada, a mais recente.
  const achada = versoes.findIndex((v) => v.id === idAberto);
  const indice = achada === -1 ? versoes.length - 1 : achada;
  const versao = versoes[indice];
  const nome = TIPOS_DOCUMENTO[tipo];
  const ultima = versoes.length - 1;
  const temVarias = versoes.length > 1;

  const abrirVersao = (id) => {
    setIdAberto(id);
    setConfirmando(false);
    setErro("");
  };
  const cancelar = () => {
    setConfirmando(false);
    setErro("");
    botaoApagar.current?.focus();
  };
  const apagar = async () => {
    setApagando(true);
    setErro("");
    try {
      await onApagar(versao);
      setConfirmando(false);
      confirmar("Versão apagada");
      // O botão clicado sumiu com a confirmação: o foco volta ao de apagar,
      // dentro da janela (senão o Esc deixaria de fechá-la).
      botaoApagar.current?.focus();
    } catch (falha) {
      setErro(falha.message);
    } finally {
      setApagando(false);
    }
  };

  return (
    <Modal
      titulo={nome}
      subtitulo={`${versoes.length} ${versoes.length === 1 ? "versão enviada" : "versões enviadas"}`}
      largura="max-w-6xl"
      altura="max-h-[95vh]"
      onFechar={onFechar}
    >
      <div className="flex flex-col gap-5">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-2">
            <span className="text-sm font-bold text-[#1a1c1c]">
              {formatarData(versao.enviadoEm)}
            </span>
            {temVarias && indice === ultima && (
              <span className="text-[11px] font-semibold text-[#9e0a24] bg-[#faf0f0] px-2 py-0.5 rounded-full">
                Mais recente
              </span>
            )}
            <span className="text-xs text-[#5f5e5e]">
              Enviado por {versao.enviadoPorNome}
            </span>
          </div>
          <div className="flex items-center gap-2">
            {/* O PDF já tem o próprio botão, no lugar do arquivo. */}
            {versao.formato === "imagem" && (
              <Botao
                as="a"
                href={versao.arquivoUrl}
                target="_blank"
                rel="noreferrer"
                variante="secundario"
                tamanho="sm"
                icone="open_in_new"
              >
                Abrir em nova aba
              </Botao>
            )}
            {ehDono && (
              <Botao
                ref={botaoApagar}
                variante="perigo"
                tamanho="sm"
                icone="delete"
                aria-label="Apagar esta versão"
                title="Apagar esta versão"
                aria-expanded={confirmando}
                onClick={() => setConfirmando(true)}
              />
            )}
          </div>
        </div>

        {confirmando && (
          <ConfirmarApagar
            versao={versao}
            validacao={validacao}
            apagando={apagando}
            erro={erro}
            onApagar={apagar}
            onCancelar={cancelar}
          />
        )}

        {/* Um por versão: trocar de versão baixa o arquivo dela. */}
        <ArquivoDoExame key={versao.id} versao={versao} nome={nome} />

        {temVarias && (
          <div>
            <p className="text-sm font-semibold text-[#1a1c1c] mb-3">
              Versões enviadas
            </p>
            {/* Da mais recente para a mais antiga. */}
            <div className="space-y-2">
              {versoes
                .map((v, i) => ({ ...v, i }))
                .reverse()
                .map((v) => (
                  <button
                    key={v.id}
                    type="button"
                    onClick={() => abrirVersao(v.id)}
                    aria-pressed={v.i === indice}
                    className={`w-full flex items-center justify-between gap-3 text-left px-4 py-2.5 rounded-xl border transition-colors ${
                      v.i === indice
                        ? "border-[#9e0a24] bg-[#faf0f0]"
                        : "border-[#e4bebc] hover:border-[#7d0a1d]/50"
                    }`}
                  >
                    <span className="text-sm font-semibold text-[#1a1c1c]">
                      {formatarData(v.enviadoEm)}
                      {v.i === ultima && " (mais recente)"}
                    </span>
                    <span className="text-[11px] text-[#5f5e5e]">
                      Enviado por {v.enviadoPorNome}
                    </span>
                  </button>
                ))}
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
}

// Uma linha por tipo de documento: o nome, quando foi enviado e as ações. O
// arquivo escolhido é conferido antes de ir (formato e tamanho); o que der
// errado, aqui ou na API, aparece embaixo da própria linha.
function LinhaDocumento({
  documento,
  podeEnviar,
  onEnviar,
  onAbrir,
  refEnviar,
}) {
  const [enviando, setEnviando] = useState(false);
  const [erro, setErro] = useState("");
  const entrada = useRef(null);
  const { tipo, versoes } = documento;
  const nome = TIPOS_DOCUMENTO[tipo];
  const ultima = versoes.at(-1);
  const acao = enviando ? "Enviando" : ultima ? "Atualizar" : "Enviar";

  const enviar = async (arquivo) => {
    const problema = erroDoExame(arquivo);
    setErro(problema ?? "");
    if (problema) return;
    setEnviando(true);
    try {
      await onEnviar(tipo, arquivo);
      confirmar(AVISO_DE_ENVIO[tipo]);
    } catch (falha) {
      setErro(falha.campos?.arquivo ?? falha.message);
    } finally {
      setEnviando(false);
    }
  };

  return (
    <li className="flex flex-wrap items-center gap-x-2 gap-y-2 px-4 py-3">
      {/* O nome nunca encolhe abaixo de uma largura legível: no celular
          estreito, os botões descem para a linha de baixo. */}
      <div className="flex-1 min-w-[9.5rem]">
        <p className="text-sm font-semibold text-[#1a1c1c]">{nome}</p>
        <p
          className={`text-xs mt-0.5 ${ultima ? "text-[#5f5e5e]" : "text-[#8f6f6e] italic"}`}
        >
          {ultima
            ? `Enviado em ${formatarData(ultima.enviadoEm)}${versoes.length > 1 ? `, ${versoes.length} versões` : ""}`
            : "Não enviado"}
        </p>
      </div>

      {/* Colunas de ação com largura fixa: cada botão cai sempre no mesmo
          lugar, tenha o documento sido enviado ou não. */}
      <div className="flex items-center gap-2 ml-auto">
        <div className="w-[4.5rem] flex justify-end">
          {ultima?.arquivoUrl && (
            <Botao
              variante="fantasma"
              tamanho="sm"
              aria-label={`Abrir ${nome.toLowerCase()}`}
              onClick={onAbrir}
            >
              Abrir
            </Botao>
          )}
        </div>

        {podeEnviar && (
          <div className="w-[6.75rem] flex justify-end">
            <Botao
              ref={refEnviar}
              variante={ultima ? "secundario" : "primario"}
              tamanho="sm"
              icone={enviando ? undefined : "upload"}
              disabled={enviando}
              aria-label={`${acao} ${nome.toLowerCase()}`}
              onClick={() => entrada.current.click()}
            >
              {enviando && (
                <span
                  aria-hidden="true"
                  className="material-symbols-outlined text-[16px] animate-spin"
                >
                  progress_activity
                </span>
              )}
              {acao}
            </Botao>
            <input
              ref={entrada}
              type="file"
              accept={TIPOS_ACEITOS_EXAME.join(",")}
              tabIndex={-1}
              aria-hidden="true"
              className="hidden"
              onChange={(e) => {
                const arquivo = e.target.files[0];
                // Para o mesmo arquivo poder ser escolhido de novo.
                e.target.value = "";
                if (arquivo) enviar(arquivo);
              }}
            />
          </div>
        )}
      </div>

      {erro && (
        <div className="basis-full">
          <AvisoErro>{erro}</AvisoErro>
        </div>
      )}
    </li>
  );
}

// - `ehDono`: o perfil é do dono do animal, que envia e apaga versões;
// - `onEnviar(tipo, arquivo)` grava um exame (o erro aparece na linha dele);
// - `onApagar(versao)` apaga uma versão e devolve o animal atualizado (o erro
//   aparece na janela do exame);
// - `validacao`: a validação mais recente, para o aviso de quem a assinou.
function SecaoDocumentos({
  documentos,
  validacao,
  ehDono,
  onEnviar,
  onApagar,
}) {
  const [tipoAberto, setTipoAberto] = useState(null);
  const documentoAberto = documentos.find((d) => d.tipo === tipoAberto);
  // O botão de enviar de cada linha, pelo tipo.
  const botoesEnviar = useRef({});
  // Apagada a última versão, a janela fecha: o exame volta a "Não enviado",
  // e o foco vai para o botão de enviar daquela linha (o "Abrir", que abriu a
  // janela, não existe mais).
  const apagarVersao = async (versao) => {
    const tipo = tipoAberto;
    const animal = await onApagar(versao);
    const restantes = animal.documentos.find((d) => d.tipo === tipo);
    if (!restantes?.versoes.length) {
      setTipoAberto(null);
      requestAnimationFrame(() => botoesEnviar.current[tipo]?.focus());
    }
  };
  // Há exame enviado, mas quem vê não pode abrir: um aviso diz por quê, em
  // vez de o botão simplesmente não estar ali.
  const fechados = documentos.some(
    (d) => d.versoes.length > 0 && !d.versoes.at(-1).arquivoUrl,
  );

  return (
    <PainelSecao
      titulo="Exames e documentos"
      ajuda={
        <Ajuda titulo="Por que enviar documentos?" claro>
          <p>
            Com exames recentes e a carteira de vacinação em mãos, um
            veterinário consegue validar o animal sem pedir que os exames sejam
            refeitos.
          </p>
          <p>
            Sem eles, o hospital pode precisar repetir esses exames antes da
            coleta — o que leva mais tempo e pode ter custo.
          </p>
          <p>
            Os arquivos só abrem para o tutor do animal e para os veterinários:
            um laudo costuma trazer o nome, o telefone e o endereço do tutor.
          </p>
        </Ajuda>
      }
      subtitulo="Evitam que exames sejam refeitos no hospital"
    >
      {/* As linhas vão de borda a borda do painel, com divisões finas. */}
      <div className="-mx-4 -mb-4 border-t border-[#f0e6e6]">
        <ul className="divide-y divide-[#f0e6e6]">
          {documentos.map((documento) => (
            <LinhaDocumento
              key={documento.tipo}
              documento={documento}
              podeEnviar={ehDono}
              onEnviar={onEnviar}
              onAbrir={() => setTipoAberto(documento.tipo)}
              refEnviar={(botao) => {
                botoesEnviar.current[documento.tipo] = botao;
              }}
            />
          ))}
        </ul>
        {fechados && (
          <p className="flex items-center gap-1.5 border-t border-[#f0e6e6] px-4 py-3 text-xs text-[#5f5e5e]">
            <span
              aria-hidden="true"
              className="material-symbols-outlined text-[16px]"
            >
              lock
            </span>
            Os arquivos abrem só para o tutor e para os veterinários.
          </p>
        )}
      </div>

      {documentoAberto?.versoes.length > 0 && (
        <ModalDocumento
          tipo={documentoAberto.tipo}
          versoes={documentoAberto.versoes}
          validacao={validacao}
          ehDono={ehDono}
          onApagar={apagarVersao}
          onFechar={() => setTipoAberto(null)}
        />
      )}
    </PainelSecao>
  );
}

export default SecaoDocumentos;
