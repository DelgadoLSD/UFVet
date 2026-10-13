// "Quem vê os seus dados": uma escada do mais aberto (qualquer pessoa, mesmo
// sem conta) ao mais fechado (a senha, que ninguém vê). Cada degrau diz quem
// vê e lista o que essa pessoa vê de você, sempre do ponto de vista de quem
// lê ("seu e-mail", "seus animais"). O nível está escrito: não depende da
// cor para ser entendido. É o retrato fiel das regras da API
// (modelos/usuario.js, podeVerContato; modelos/animal.js, podeAbrirExames).

const NIVEIS = [
  {
    quem: "Qualquer pessoa",
    detalhe: "Mesmo quem não tem conta.",
    icone: "public",
    estilo: "aberto",
    itens: [
      "Seu nome completo, sua cidade, seu bairro, sua foto de perfil e a data em que você entrou no UFVet.",
      "Os dados dos seus animais: fotos, espécie, raça, sexo, se é castrado, idade, peso, tipo sanguíneo e se está disponível para doar.",
      "O histórico dos seus animais registrado por veterinários (validações, doações e observações), com o nome e o CRMV de quem registrou.",
      "Quais exames os seus animais têm e quando foram enviados. O arquivo do exame não aparece.",
      "Se você é veterinário: seu CRMV, o local onde você atua e quantas validações você já fez.",
    ],
  },
  {
    quem: "Veterinários cadastrados",
    icone: "stethoscope",
    estilo: "restrito",
    itens: [
      "Seu e-mail e seu telefone.",
      "Os arquivos dos exames dos seus animais.",
    ],
  },
  {
    quem: "Tutores com liberação",
    detalhe: "Só enquanto a liberação durar.",
    icone: "key",
    estilo: "restrito",
    itens: ["Seu e-mail e seu telefone."],
    nota: "Um veterinário pode liberar para o tutor de um animal em emergência o acesso aos contatos de todas as pessoas cadastradas. A liberação dura 24 horas, 3 dias ou 7 dias e termina sozinha.",
  },
  {
    quem: "Ninguém, nem o UFVet",
    icone: "lock",
    estilo: "nenhum",
    itens: [
      "Sua senha. Ela é guardada embaralhada, de um jeito que não tem volta.",
    ],
  },
];

const ESTILOS = {
  aberto: {
    caixa: "bg-white border border-[#eadede]",
    quem: "text-[#1a1c1c]",
    detalhe: "text-[#5f5e5e]",
    texto: "text-[#5b403f]",
    marcador: "bg-[#9e0a24]",
    icone: "bg-[#fdecee] text-[#9e0a24]",
  },
  restrito: {
    caixa: "bg-white border border-[#eadede] border-l-4 border-l-[#9e0a24]",
    quem: "text-[#1a1c1c]",
    detalhe: "text-[#5f5e5e]",
    texto: "text-[#5b403f]",
    marcador: "bg-[#9e0a24]",
    icone: "bg-[#9e0a24] text-white",
  },
  nenhum: {
    caixa: "bg-[#9e0a24]",
    quem: "text-white",
    detalhe: "text-white/80",
    texto: "text-white/90",
    marcador: "bg-white/70",
    icone: "bg-white text-[#9e0a24]",
  },
};

// O ícone num círculo. O círculo é uma caixa à parte: os ícones têm a
// largura presa a 1em (index.css), e o círculo sairia cortado.
function Icone({ nome, cores }) {
  return (
    <span
      aria-hidden="true"
      className={`shrink-0 w-11 h-11 rounded-full flex items-center justify-center ${cores}`}
    >
      <span className="material-symbols-outlined text-[22px]">{nome}</span>
    </span>
  );
}

// Um degrau: quem vê (à esquerda no computador, em cima no celular) e o que
// essa pessoa vê de você.
function Nivel({ nivel }) {
  const estilo = ESTILOS[nivel.estilo];
  return (
    <li
      className={`rounded-3xl p-6 md:grid md:grid-cols-[13rem_minmax(0,1fr)] md:gap-8 ${estilo.caixa}`}
    >
      <div className="flex items-center gap-3 md:items-start md:flex-col">
        <Icone nome={nivel.icone} cores={estilo.icone} />
        <div>
          <p className={`text-xl font-extrabold tracking-tight ${estilo.quem}`}>
            {nivel.quem}
          </p>
          {nivel.detalhe && (
            <p className={`mt-0.5 text-base ${estilo.detalhe}`}>
              {nivel.detalhe}
            </p>
          )}
        </div>
      </div>
      <div className="mt-5 md:mt-0">
        <ul className="space-y-3">
          {nivel.itens.map((texto) => (
            <li
              key={texto}
              className={`flex gap-3.5 text-lg leading-relaxed ${estilo.texto}`}
            >
              <span
                aria-hidden="true"
                className={`shrink-0 mt-[0.65em] w-2 h-2 rounded-full ${estilo.marcador}`}
              />
              <span>{texto}</span>
            </li>
          ))}
        </ul>
        {nivel.nota && (
          <p className="mt-4 text-base leading-relaxed text-[#5f5e5e]">
            {nivel.nota}
          </p>
        )}
      </div>
    </li>
  );
}

function QuemVe() {
  return (
    <ul className="space-y-3">
      {NIVEIS.map((nivel) => (
        <Nivel key={nivel.quem} nivel={nivel} />
      ))}
    </ul>
  );
}

export default QuemVe;
