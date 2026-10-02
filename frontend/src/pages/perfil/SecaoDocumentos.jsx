import { useState } from "react";
import Modal from "../../components/Modal";
import Ajuda from "../../components/Ajuda";
import Botao from "../../components/Botao";
import { TIPOS_DOCUMENTO } from "../../regras/doacao";
import { formatarData } from "../../util/datas";

// Exames e documentos do animal: hemograma, sorologias e carteira de
// vacinação. O tutor envia e atualiza; todos que veem o perfil podem abrir.
// Um exame refeito não substitui o anterior: entra como versão nova, e o
// histórico fica, para o veterinário comparar.

// Visualizador de um documento, com a lista de versões quando há mais de uma.
// Abre na versão mais recente.
function ModalDocumento({ tipo, versoes, onFechar }) {
  const [indice, setIndice] = useState(versoes.length - 1);
  const versao = versoes[indice];
  const nome = TIPOS_DOCUMENTO[tipo];
  const ultima = versoes.length - 1;
  const temVarias = versoes.length > 1;

  return (
    <Modal
      titulo={nome}
      subtitulo={`${versoes.length} ${versoes.length === 1 ? "versão enviada" : "versões enviadas"}`}
      largura="max-w-6xl"
      altura="h-[95vh]"
      onFechar={onFechar}
    >
      <div className="flex flex-col gap-5">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-2">
            <span className="text-sm font-bold text-[#1a1c1c]">
              {formatarData(versao.enviadoEm)}
            </span>
            {temVarias && indice === ultima && (
              <span className="text-[11px] font-semibold text-[#8e001b] bg-[#faf0f0] px-2 py-0.5 rounded-full">
                Mais recente
              </span>
            )}
            <span className="text-xs text-[#5f5e5e]">
              Enviado por {versao.enviadoPorNome}
            </span>
          </div>
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
        </div>

        <div className="w-full rounded-xl border border-[#e4bebc] bg-[#2a2a2a] overflow-auto max-h-[65vh]">
          <img
            src={versao.arquivoUrl}
            alt={`${nome} — ${formatarData(versao.enviadoEm)}`}
            className="w-full h-auto"
          />
        </div>

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
                    key={v.i}
                    type="button"
                    onClick={() => setIndice(v.i)}
                    aria-pressed={v.i === indice}
                    className={`w-full flex items-center justify-between gap-3 text-left px-4 py-2.5 rounded-xl border transition-colors ${
                      v.i === indice
                        ? "border-[#8e001b] bg-[#faf0f0]"
                        : "border-[#e4bebc] hover:border-[#8e001b]/50"
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

// Uma linha por tipo de documento. `podeEnviar` é só para o dono do animal;
// `onEnviar` recebe o tipo e o arquivo escolhido.
function SecaoDocumentos({ documentos, podeEnviar, onEnviar }) {
  const [tipoAberto, setTipoAberto] = useState(null);
  const documentoAberto = documentos.find((d) => d.tipo === tipoAberto);

  return (
    <section className="border border-[#f0e6e6] bg-[#fafafa] rounded-xl p-5 flex flex-col gap-4">
      <div>
        <h4 className="flex items-center gap-1.5 text-base font-bold text-[#1a1c1c]">
          Exames e documentos
          <Ajuda titulo="Por que enviar documentos?">
            <p>
              Com exames recentes e a carteira de vacinação em mãos, um
              veterinário consegue validar o animal sem pedir que os exames
              sejam refeitos.
            </p>
            <p>
              Sem eles, o hospital pode precisar repetir esses exames antes da
              coleta — o que leva mais tempo e pode ter custo.
            </p>
          </Ajuda>
        </h4>
        <p className="text-xs text-[#5f5e5e] mt-1">
          Evitam que exames sejam refeitos no hospital
        </p>
      </div>

      <ul className="divide-y divide-[#f0e6e6] bg-white border border-[#f0e6e6] rounded-xl">
        {documentos.map((doc) => {
          const ultima = doc.versoes.at(-1);
          const qtd = doc.versoes.length;
          return (
            <li key={doc.tipo} className="flex items-center gap-2 px-4 py-3">
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-[#1a1c1c] truncate">
                  {TIPOS_DOCUMENTO[doc.tipo]}
                </p>
                <p
                  className={`text-xs mt-0.5 ${ultima ? "text-[#5f5e5e]" : "text-[#c9a5a5] italic"}`}
                >
                  {ultima
                    ? `Enviado em ${formatarData(ultima.enviadoEm)}${qtd > 1 ? `, ${qtd} versões` : ""}`
                    : "Não enviado"}
                </p>
              </div>

              {/* Colunas de ação com largura fixa: cada botão cai sempre no
                  mesmo lugar, tenha o documento sido enviado ou não. */}
              <div className="w-[4.5rem] flex justify-end">
                {ultima && (
                  <Botao
                    variante="fantasma"
                    tamanho="sm"
                    onClick={() => setTipoAberto(doc.tipo)}
                  >
                    Abrir
                  </Botao>
                )}
              </div>

              {podeEnviar && (
                <div className="w-[6.75rem] flex justify-end">
                  <Botao
                    as="label"
                    variante={ultima ? "secundario" : "primario"}
                    tamanho="sm"
                    icone="upload"
                  >
                    {ultima ? "Atualizar" : "Enviar"}
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => {
                        onEnviar(doc.tipo, e.target.files[0]);
                        // Limpa a escolha para o mesmo arquivo poder ser
                        // enviado de novo.
                        e.target.value = "";
                      }}
                    />
                  </Botao>
                </div>
              )}
            </li>
          );
        })}
      </ul>

      {documentoAberto && (
        <ModalDocumento
          tipo={documentoAberto.tipo}
          versoes={documentoAberto.versoes}
          onFechar={() => setTipoAberto(null)}
        />
      )}
    </section>
  );
}

export default SecaoDocumentos;
