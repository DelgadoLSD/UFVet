import { Link } from "react-router-dom";
import QuemVe from "./QuemVe";
import {
  Aviso,
  Cartoes,
  Item,
  Linhas,
  Lista,
  Par,
  Secao,
  Subtitulo,
  Texto,
} from "./blocos";
import { CONTATO, VERSAO } from "./indice";

// O texto dos termos de uso e privacidade, item por item. Cada afirmação
// aqui descreve o que o sistema faz de verdade; ao mudar uma regra do site
// (quem vê o quê, prazos, o que é apagado), este texto muda junto, e a
// VERSAO também (pages/termos/indice.js).
//
// Na escrita: uma ideia por item, frases inteiras com sujeito claro, e
// sempre do ponto de vista de quem lê.

const LINK =
  "font-semibold text-[#9e0a24] underline decoration-[#9e0a24]/30 underline-offset-4 hover:decoration-[#9e0a24]";

function Email({ claro = true }) {
  return (
    <a
      href={`mailto:${CONTATO}`}
      className={
        claro ? LINK : "font-semibold text-white underline underline-offset-4"
      }
    >
      {CONTATO}
    </a>
  );
}

const Forte = ({ children }) => (
  <strong className="font-semibold text-[#1a1c1c]">{children}</strong>
);

function OQueE() {
  return (
    <Secao id="o-que-e">
      <Texto>
        O UFVet é um Trabalho de Conclusão de Curso da Universidade Federal de
        Viçosa e está em fase de testes. Ele foi criado para ajudar a encontrar,
        com rapidez, um doador de sangue para um cão ou gato que precisa de
        transfusão.
      </Texto>
      <Par
        claro={{
          titulo: "O UFVet é",
          itens: [
            "Um cadastro de cães e gatos que podem doar sangue, com o histórico registrado por veterinários.",
            "Uma busca de doadores por espécie, tipo sanguíneo e localização.",
            "Um meio de chegar até o tutor de um doador, com a liberação de um veterinário.",
          ],
        }}
        vermelho={{
          titulo: "O UFVet não é",
          itens: [
            "Um hospital ou serviço veterinário: ele não atende, não diagnostica e não indica tratamento.",
            "Um banco de sangue: ele não guarda nem transporta sangue.",
            "Uma garantia de doador: encontrar um depende de haver alguém disponível e compatível.",
            "Um serviço de emergência: o site pode ficar fora do ar e não deve ser o único recurso numa urgência.",
          ],
        }}
      />
      <Aviso icone="emergency" titulo="Numa emergência, procure um veterinário">
        Se o seu animal está passando mal, leve-o a um atendimento veterinário
        imediatamente. Use o UFVet ao mesmo tempo, nunca no lugar do
        atendimento.
      </Aviso>
    </Secao>
  );
}

function QuemUsa() {
  return (
    <Secao id="quem-usa">
      <Cartoes
        itens={[
          {
            titulo: "Visitante",
            texto:
              "Quem acessa o site sem conta. Pode usar a busca e ver os perfis públicos, mas não vê o e-mail nem o telefone de ninguém.",
          },
          {
            titulo: "Tutor",
            texto:
              "Quem tem um cão ou gato. Cadastra os seus animais como doadores e, se um animal seu precisar de sangue, pode pedir a um veterinário acesso aos contatos dos doadores.",
          },
          {
            titulo: "Veterinário",
            texto:
              "Só cria conta com um convite, pedido pela direção do hospital. Valida os doadores, registra as doações e as observações e libera o acesso aos contatos para quem precisa.",
          },
          {
            titulo: "Hospital",
            texto:
              "Não usa o site diretamente. A direção informa quem são os seus veterinários, e cada um recebe um convite pessoal.",
          },
        ]}
      />
    </Secao>
  );
}

function QuemVeOsDados() {
  return (
    <Secao id="quem-ve">
      <Texto>
        Cada informação sua tem um nível de acesso. O perfil é público, para que
        quem procura um doador saiba com quem vai falar. O e-mail, o telefone e
        os arquivos dos exames ficam protegidos.
      </Texto>
      <QuemVe />
    </Secao>
  );
}

function Compromissos() {
  return (
    <Secao id="compromissos">
      <Texto>Ao usar o UFVet, você se compromete a:</Texto>
      <Lista>
        <Item>Ter 18 anos ou mais.</Item>
        <Item>
          Informar dados verdadeiros e seus. Não crie conta com o nome, o e-mail
          ou o telefone de outra pessoa.
        </Item>
        <Item>
          Manter o seu telefone atualizado, porque é por ele que vão procurar
          você numa emergência.
        </Item>
        <Item>
          Usar o contato de outra pessoa apenas para tratar de doação de sangue.
          Não envie propaganda nem correntes, não ofereça vendas e não insista
          depois de uma recusa.
        </Item>
        <Item>
          Tratar todos com respeito, inclusive nos pedidos e nas observações que
          escrever.
        </Item>
        <Item>
          Proteger a sua conta: não compartilhe a sua senha e saia do site ao
          usar um computador compartilhado.
        </Item>
      </Lista>
      <Texto>Quem descumprir estes termos pode ter a conta removida.</Texto>
    </Secao>
  );
}

function Doador() {
  return (
    <Secao id="doador">
      <Lista>
        <Item>
          <Forte>Doar é sempre uma escolha sua.</Forte> Você pode recusar
          qualquer pedido, a qualquer momento, sem precisar explicar o motivo.
        </Item>
        <Item>
          Mantenha a disponibilidade do animal atualizada. Marque-o como
          indisponível se ele adoecer, estiver em tratamento, gestante ou
          viajando.
        </Item>
        <Item>
          Informe o peso, a idade e a saúde do animal com verdade, e envie
          apenas exames verdadeiros. A validação do veterinário se baseia nessas
          informações.
        </Item>
        <Item>
          Se você alterar o peso ou a idade do animal no site, a validação deixa
          de valer, e um veterinário precisa conferir o animal de novo. Isso
          protege o seu animal.
        </Item>
        <Item>
          Depois de uma doação, o animal precisa descansar: a próxima só pode
          acontecer depois de 90 dias.
        </Item>
        <Item>
          A coleta é feita no hospital, depois da avaliação de um veterinário, e
          só acontece se ele considerar seguro para o seu animal.
        </Item>
        <Item>Ninguém pode cobrar nem pagar pela doação.</Item>
      </Lista>
    </Secao>
  );
}

function Receptor() {
  return (
    <Secao id="receptor">
      <Lista>
        <Item>
          <Forte>Procure atendimento veterinário primeiro.</Forte> O UFVet ajuda
          a encontrar um doador, mas não garante que haverá um disponível e
          compatível a tempo.
        </Item>
        <Item>
          Para ver o e-mail e o telefone dos doadores, peça a liberação a um
          veterinário. Ela vale por 24 horas, 3 dias ou 7 dias. Use esses
          contatos apenas para o caso que motivou o pedido.
        </Item>
        <Item>
          O tutor do doador pode recusar o pedido. Respeite a resposta.
        </Item>
        <Item>
          A decisão de fazer a transfusão é do veterinário que atende o seu
          animal, depois dos exames de compatibilidade.
        </Item>
        <Item>
          O sangue é doado de graça, mas os custos do hospital com a transfusão,
          como a bolsa de coleta e os exames, são pagos por você, como você
          confirmou no cadastro. Esses valores são definidos pelo hospital, não
          pelo UFVet.
        </Item>
      </Lista>
    </Secao>
  );
}

function Veterinarios() {
  return (
    <Secao id="veterinarios" escura>
      <Texto escura>
        Tudo o que o veterinário registra no UFVet leva o nome e o CRMV dele.
        Por isso, este item explica o que cada registro significa e até onde vai
        a responsabilidade do veterinário.
      </Texto>
      <Cartoes
        escura
        itens={[
          {
            titulo: "Sua conta",
            texto:
              "É pessoal e só existe por convite, ligado ao seu CRMV. Não compartilhe o acesso, porque tudo o que for registrado levará o seu nome.",
          },
          {
            titulo: "O que a validação registra",
            texto:
              "A validação registra que, naquela data, você conferiu os critérios marcados, com base no exame do animal e nas informações e exames apresentados pelo tutor. Ela vale por um ano.",
          },
          {
            titulo: "O que a validação não garante",
            texto:
              "A validação não garante a saúde futura do animal e não substitui a avaliação antes de cada coleta. Ela deixa de valer sozinha se o tutor alterar o peso ou a idade do animal, ou apagar um exame que foi conferido.",
          },
          {
            titulo: "A decisão clínica",
            texto:
              "Coletar, transfundir ou recusar é sempre decisão do veterinário que está com o animal, seguindo os protocolos do hospital. As informações do site servem de apoio e não obrigam ninguém.",
          },
          {
            titulo: "Os dados do tutor",
            texto:
              "O tutor é responsável pelos dados e exames que envia. Se um exame for falso ou um dado estiver errado, a responsabilidade é de quem o informou.",
          },
          {
            titulo: "A liberação de contatos",
            texto:
              "Você libera o acesso de boa-fé, para uma emergência e por um prazo, e pode encerrá-lo antes. Se alguém usar mal um contato, a responsabilidade é de quem o usou.",
          },
          {
            titulo: "Os registros permanentes",
            texto:
              "Validações, doações e observações ficam no histórico do animal com o seu nome e o seu CRMV, e não podem ser editadas. Se você encerrar a sua conta, elas continuam no histórico.",
          },
          {
            titulo: "O seu contato",
            texto:
              "Seu e-mail e seu telefone aparecem para os outros veterinários e para os tutores com uma liberação ativa, como acontece com qualquer pessoa cadastrada.",
          },
        ]}
      />
    </Secao>
  );
}

function Limites() {
  return (
    <Secao id="limites">
      <Texto>
        O UFVet aproxima pessoas, mas o que acontece fora do site é
        responsabilidade de quem participa. Por isso, o UFVet não responde por:
      </Texto>
      <Lista>
        <Item>
          O resultado das doações e das transfusões e a saúde dos animais.
        </Item>
        <Item>
          A veracidade do que cada pessoa informa sobre si e sobre os seus
          animais.
        </Item>
        <Item>
          Combinações, encontros, deslocamentos e custos acertados entre as
          pessoas.
        </Item>
        <Item>O uso indevido de um contato por quem o recebeu.</Item>
        <Item>
          Períodos fora do ar, lentidão ou perda de dados por falha técnica. Por
          estar em fase de testes, o site pode mudar, ficar instável ou ser
          interrompido.
        </Item>
      </Lista>
      <Aviso vermelho icone="report" titulo="Cuidado com golpes">
        O UFVet nunca pede senha, dados bancários ou pagamento, e a doação é
        sempre gratuita. Desconfie de quem pedir dinheiro para doar ou para
        &ldquo;liberar&rdquo; um doador, e avise pelo e-mail{" "}
        <Email claro={false} />.
      </Aviso>
    </Secao>
  );
}

function Privacidade() {
  return (
    <Secao id="privacidade">
      <Texto>
        O UFVet segue a Lei Geral de Proteção de Dados (LGPD). Este item explica
        quais dados guardamos, por que os guardamos e como você pode
        controlá-los.
      </Texto>

      <Subtitulo>Quais dados guardamos e por quê</Subtitulo>
      <Linhas
        linhas={[
          {
            dado: "Nome completo",
            para: "Para que quem procura um doador saiba com quem vai falar.",
          },
          {
            dado: "E-mail",
            para: "Para você entrar no site e para ser contatado por quem tem acesso aos contatos.",
          },
          {
            dado: "Telefone",
            para: "Para ser contatado numa emergência por quem tem acesso aos contatos.",
          },
          {
            dado: "Cidade e bairro",
            para: "Para a busca mostrar doadores perto de quem precisa.",
          },
          {
            dado: "Foto de perfil",
            para: "Para o seu perfil. É opcional.",
          },
          {
            dado: "Animais e exames",
            para: "Para saber se cada animal pode doar.",
          },
          {
            dado: "Registros dos veterinários",
            para: "Para manter o histórico de validações, doações e observações de cada animal.",
          },
          {
            dado: "Seus aceites",
            para: "Para comprovar que você concordou com estes termos, com a data e a versão.",
          },
          {
            dado: "Registros de segurança",
            para: "Para proteger as contas: anotamos as entradas no site e as tentativas suspeitas. O endereço de internet só é anotado nas tentativas suspeitas, e esses registros nunca guardam senhas nem contatos.",
          },
        ]}
      />
      <Texto>
        O UFVet não pede CPF, RG nem o endereço da sua casa: guardamos só o que
        o serviço usa.
      </Texto>

      <Subtitulo>Como protegemos os seus dados</Subtitulo>
      <Lista>
        <Item>
          O e-mail e o telefone são guardados cifrados, ou seja, embaralhados
          com uma chave que fica fora do banco de dados.
        </Item>
        <Item>
          A senha é guardada de um jeito que não tem volta: nem o UFVet consegue
          lê-la.
        </Item>
        <Item>A conexão com o site é sempre protegida (HTTPS).</Item>
        <Item>
          Os contatos só aparecem com liberação, e os arquivos dos exames só
          aparecem para o tutor do animal e para veterinários.
        </Item>
        <Item>
          O site limita as tentativas de entrar, para impedir que alguém
          descubra uma senha por tentativa e erro.
        </Item>
      </Lista>
      <Texto>
        Nenhum sistema é totalmente seguro. Se acontecer um incidente que afete
        os seus dados, avisaremos você e a Autoridade Nacional de Proteção de
        Dados (ANPD).
      </Texto>

      <Subtitulo>Onde os dados ficam</Subtitulo>
      <Lista>
        <Item>
          Os dados ficam nos servidores das empresas que mantêm o site no ar:
          Render (o site), Neon (o banco de dados) e Cloudflare (a conexão).
          Esses servidores ficam nos Estados Unidos.
        </Item>
        <Item>
          As fontes e os ícones do site são carregados do Google Fonts, que
          recebe o endereço de internet do seu aparelho.
        </Item>
        <Item>
          Não vendemos os seus dados nem os usamos para propaganda. O site não
          tem anúncios nem rastreadores.
        </Item>
        <Item>
          O site usa um único cookie, que mantém você conectado. Ele vence em 8
          horas.
        </Item>
      </Lista>

      <Subtitulo>Por quanto tempo</Subtitulo>
      <Lista>
        <Item>Guardamos os seus dados enquanto a sua conta existir.</Item>
        <Item>
          Quando você encerra a conta, apagamos os seus dados, os seus animais,
          as fotos, os exames, os pedidos e as liberações.
        </Item>
        <Item>
          Se um veterinário encerrar a conta, as validações, doações e
          observações que ele registrou nos animais de outras pessoas continuam
          no histórico desses animais, com o nome e o CRMV dele.
        </Item>
        <Item>
          Cópias de segurança e registros técnicos do servidor podem manter os
          dados por mais alguns dias.
        </Item>
      </Lista>

      <Subtitulo>Seus direitos</Subtitulo>
      <Lista>
        <Item>
          <Forte>Corrigir os seus dados:</Forte> você mesmo faz isso, em{" "}
          <Link to="/conta" className={LINK}>
            Minha conta
          </Link>
          .
        </Item>
        <Item>
          <Forte>Apagar tudo:</Forte> encerre a conta em Minha conta, informando
          a sua senha. Como o UFVet não funciona sem esses dados, encerrar a
          conta também é a forma de retirar o seu consentimento.
        </Item>
        <Item>
          <Forte>Saber quais dados guardamos e receber uma cópia:</Forte> peça
          pelo e-mail <Email />. Respondemos em até 15 dias.
        </Item>
        <Item>
          <Forte>Reclamar:</Forte> se não resolvermos o seu pedido, você pode
          procurar a ANPD pelo site gov.br/anpd.
        </Item>
      </Lista>
      <Texto>
        Quem participar da avaliação do UFVet no TCC vai receber um termo de
        consentimento próprio, separado destes termos.
      </Texto>
    </Secao>
  );
}

function Contato() {
  return (
    <Secao id="contato">
      <Texto>
        Estes termos podem mudar junto com o site. A versão em vigor fica sempre
        nesta página, com a data. Se uma mudança for importante, avisaremos no
        site e pediremos que você aceite os termos de novo.
      </Texto>
      <div className="rounded-3xl border border-[#eadede] p-6 sm:p-7">
        <p className="text-base text-[#5f5e5e]">
          Responsável pelo UFVet e pelos dados (o controlador, na LGPD)
        </p>
        <p className="mt-2 text-2xl font-extrabold tracking-tight text-[#1a1c1c]">
          Lucas Silva Delgado
        </p>
        <p className="mt-1 text-lg leading-relaxed text-[#5b403f]">
          Estudante de Ciência da Computação da UFV e autor do Trabalho de
          Conclusão de Curso.
        </p>
        <p className="mt-4 text-lg text-[#5b403f]">
          E-mail para contato:{" "}
          <span className="font-semibold text-[#1a1c1c] select-all">
            {CONTATO}
          </span>
        </p>
        <p className="mt-5 text-base text-[#5f5e5e]">
          Versão {VERSAO.numero}, em vigor desde {VERSAO.vigencia}.
        </p>
      </div>
    </Secao>
  );
}

// Os dez itens, na ordem do índice (pages/termos/indice.js).
function Secoes() {
  return (
    <>
      <OQueE />
      <QuemUsa />
      <QuemVeOsDados />
      <Compromissos />
      <Doador />
      <Receptor />
      <Veterinarios />
      <Limites />
      <Privacidade />
      <Contato />
    </>
  );
}

export default Secoes;
