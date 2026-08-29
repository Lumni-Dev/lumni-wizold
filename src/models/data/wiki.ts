import { formatReais } from "@/shared/utils/format";
import {
  ENHANCEMENT_STEP,
  MAX_ENHANCEMENT,
  RAGE_CRITICAL_DAMAGE_BONUS,
  MINING_CYCLE_MS,
  PET_BASE_ENERGY,
  PET_BITE_ENERGY,
  PET_ENERGY_PER_BLOW,
  PET_ENERGY_PER_LEVEL,
  PET_MAX_LEVEL,
  PET_ENERGY_PER_HUNT,
  PET_REST_RATIO,
  REST_TICK_MS,
  PET_PRICE,
  PET_RENAME_PRICE,
  TRANSFORM_DURATION_MS,
} from "@/shared/constants/game";
import { SPECIES_LABEL } from "../entities/creature";
import { MAX_PACK } from "../entities/pack";
import { MAX_ROOM_MEMBERS } from "../entities/tavern";
import {
  ARENA_BAND_RATIO,
  ARENA_COOLDOWN_HOURS,
  ARENA_DAILY_ATTACKS,
  ARENA_MIN_BAND,
  ARENA_SPOILS_MAX_HUNTS,
  ARENA_SPOILS_MAX_SHARE,
  ARENA_SPOILS_MIN_HUNTS,
  ARENA_SPOILS_MIN_SHARE,
} from "../rules/arena";
import { MINING_MAX_LEVEL, ORES } from "../entities/mining";
import { RANKING_BOARDS } from "../entities/ranking";
import { BAZAAR_FEE_RATIO, MIN_WITHDRAW_CENTS } from "../rules/bazaar";
import { initialWallet } from "../entities/bazaar";
import { enhancementCost } from "../rules/forge";
import { experienceForLevel } from "../rules/progression";
import { FULL_MOON_ATTRIBUTE_BONUS, MOON_PHASES, SYNODIC_MONTH_DAYS } from "../rules/moon";
import { miningNeeded } from "../rules/mining";
import { PET_HUNT_SHARE } from "../rules/pet";
import { EQUIPMENT_SETS } from "./equipment-sets";
import { STORE_PACKS } from "./store-packs";
import { bandOf, SPECIES } from "./species";

export interface WikiTopic {
  id: string;
  title: string;
  summary: string;
  lines: readonly string[];
}

function setRequirementsLine(): string {
  const parts = EQUIPMENT_SETS.map(
    (definition) => definition.label + " (NV. " + definition.minLevel + ")",
  );
  return "Conjuntos, um por faixa de caça: " + parts.join(", ") + ".";
}

function moonLines(): string[] {
  return MOON_PHASES.map((phase) => {
    const bonus = Math.round(phase.experienceBonus * 100);
    if (bonus > 0) return phase.label + ": +" + bonus + "% de experiência.";
    if (phase.key === "full") {
      return phase.label + ": +" + FULL_MOON_ATTRIBUTE_BONUS + " em todos os atributos.";
    }
    return phase.label + ": sem bônus.";
  });
}

function oreLines(): string[] {
  return ORES.map(
    (ore) =>
      ore.label +
      ": mineração NV. " +
      ore.requiredLevel +
      " e " +
      ore.progress +
      " de progresso por golpe.",
  );
}

function boardLine(): string {
  return "Quadros: " + RANKING_BOARDS.map((board) => board.label).join(", ") + ".";
}

function bandLines(): string[] {
  return SPECIES.map((definition) => {
    const band = bandOf(definition.key);
    return SPECIES_LABEL[definition.key] + ": NV. " + band.start + " a " + band.end + ".";
  });
}

export const WIKI_TOPICS: readonly WikiTopic[] = [
  {
    id: "loop",
    title: "Como jogar",
    summary: "O ciclo de uma noite qualquer em Wizold.",
    lines: [
      "Você começa sem nada equipado, com 100 de bronze e dez poções de vida.",
      "Só a fera caça: transforme-se antes de subir a trilha, porque em forma humana o território recusa.",
      "Escolha um território e a caça roda sozinha: a barra conta a luta e dura o que ela durar.",
      "Cada clique vale uma luta. Para encadear caçadas sem tocar em nada, ligue a caçada automática nas configurações; o mesmo vale para treino, mina e forja.",
      "A presa acompanha o seu nível dentro da banda do território: a caçada nunca fica banal.",
      "A fúria não muda a chance de crítico: cheia, ela aumenta o dano do golpe crítico em +" +
        Math.round(RAGE_CRITICAL_DAMAGE_BONUS * 100) +
        "%, e transformar gasta parte dela.",
      "Treine para acumular progresso de atributo.",
      "Equipe o que serve, venda o que sobra e volte a caçar.",
      "Na forja, minere fragmentos e bata na peça equipada para levantá-la de +1 em diante.",
      "No canil, adote um lobo: ele soma atributos enquanto estiver de pé.",
      "O ranking mostra onde você está entre os caçadores, quadro por quadro.",
    ],
  },
  {
    id: "vitals",
    title: "Vitais",
    summary: "Todo personagem nasce com 100 de vida e 100 de fúria.",
    lines: [
      "Vida: 100, mais 14 por ponto de Resistência acima de 4. O nível não entra aqui: quem engorda a barra é a Resistência, venha ela do treino, do equipamento, do mascote ou da lua.",
      "Fúria: 100, mais 2 por ponto de Vontade acima de 4. Sobe no combate e no descanso, e paga a transformação.",
      "Um poço fundo de fúria segura o bônus de dano do crítico mesmo depois de transformar: é para isso que serve a Vontade.",
      "Poções de vida e fúria recuperam uma porcentagem do próprio máximo.",
      "Zerou a vida na caçada, você escapa com 1 de vida, registra uma derrota e a fera não se sustenta: derrotado, você volta à forma humana na hora.",
      "Luta que se arrasta até o teto de rodadas termina em recuo: a caçada conta, mas ninguém vence nem perde.",
    ],
  },
  {
    id: "forms",
    title: "Formas",
    summary: "Humano por padrão, lobisomem por escolha.",
    lines: [
      "Transformar custa 40 de fúria e só é possível na forma humana.",
      "Caçar exige estar transformado. O jogo inteiro gira em torno disso: junte fúria, vire, cace enquanto a fera dura, e volte a juntar.",
      "Como lobisomem, a Força sobe 35%. Só a Força: o resto do corpo é o mesmo, e a barra de vida não muda no meio da virada.",
      "Quando o tempo acaba no meio de uma caçada, o corpo volta ao humano e a trilha para: a próxima lapada da barra é recusada.",
      "A fúria dura " +
        TRANSFORM_DURATION_MS / 60_000 +
        " minutos: passado o tempo, o corpo volta sozinho à forma humana.",
      "Voltar ao humano é gratuito e não devolve a fúria gasta.",
      "Perder uma caçada ou um duelo recolhe a fera sozinho: a derrota devolve a forma humana e apaga o selo da fúria.",
      "Um botão só comanda o corpo: Recuperar-se para todas as atividades e devolve um décimo da vida e da fúria a cada " +
        REST_TICK_MS / 1000 +
        " segundos; o corpo inteiro volta em " +
        (REST_TICK_MS / 1000) * 10 +
        " segundos, em qualquer nível. Inteiro, o botão vira Transformar; transformado, recolhe a fera.",
    ],
  },
  {
    id: "moon",
    title: "Fases da lua",
    summary: "A lua do jogo é a lua lá fora, e ela muda quanto vale cada caçada.",
    lines: [
      ...moonLines(),
      "A fase vem de uma API pública de lua, com a fórmula astronômica como reserva quando não há rede.",
      "O mês lunar tem " +
        SYNODIC_MONTH_DAYS.toFixed(2) +
        " dias, então cada fase dura cerca de uma semana.",
      "O bônus de experiência vale para a caça, a única fonte de experiência: o treino move só os atributos.",
      "A lua cheia não ensina mais rápido: ela levanta o corpo, e o ganho aparece somado nos atributos da ficha.",
      "A fase atual e o bônus dela ficam no rodapé do menu.",
    ],
  },
  {
    id: "progression",
    title: "Progressão",
    summary: "O nível vem da caça, o atributo vem do treino.",
    lines: [
      "Experiência para o próximo nível: " +
        experienceForLevel(1) +
        " no nível 1, " +
        experienceForLevel(10) +
        " no 10 e " +
        experienceForLevel(100) +
        " no 100.",
      "A curva sobe mais rápido do que a experiência que a presa dá, então cada nível custa mais caçadas que o anterior: cerca de 4 no começo e 293 no teto.",
      "O teto da progressão é o nível 1000, e cada atributo treinado também para em 1000.",
      "Subir de nível não dá poder nenhum de graça: o que o nível abre é o próximo território, o próximo conjunto e a próxima veia da mina. A força vem do treino e do que você veste.",
      "Subir de nível restaura a vida por completo.",
      "Atributo não se distribui: só o treino levanta um ponto.",
      "Treinar acumula progresso: o próximo ponto custa 10 + valor atual x 4.",
      "Um exercício por atributo, e o rendimento da sessão cresce junto com o nível: um ponto fica perto de cinco sessões a corrida inteira.",
      "Só a fera treina: em forma humana o pátio recusa a sessão, a sua e a do lobo. Transforme-se antes de subir.",
      "O ponto é pago adiantado, na primeira sessão: custa o que três caçadas da sua faixa pagam, do primeiro nível ao último, e as sessões seguintes enchem a barra de graça até fechar. É a caça que paga o corpo, sempre.",
      "Equipamento soma por cima do teto: o limite vale para o valor treinado.",
    ],
  },
  {
    id: "combat",
    title: "Combate",
    summary: "Resolvido em rodadas, sem entrada do jogador durante a luta.",
    lines: [
      "O jogo tem cinco números e só: Força, Agilidade, Resistência, Instinto e Vontade. Não existe força de combate nem resistência de combate por trás deles.",
      "Dano de um golpe: Força x Força dividido por Força mais a Resistência do alvo, com variação de 15% na Força.",
      "A fórmula vale em qualquer escala: Resistência alta reduz muito, mas nunca zera o golpe.",
      "Quem tem mais Agilidade começa a rodada.",
      "Esquiva e crítico sobem a vida toda sem nunca encostar no teto: 35% de esquiva e 45% de crítico ficam no horizonte, e cada ponto de Agilidade ou Instinto ainda compra alguma coisa no nível 1000.",
      "Crítico multiplica o dano por 1,7; com a fúria cheia, o multiplicador sobe até 2,2.",
      "A luta trava em 24 rodadas: ninguém morre e a caçada termina em recuo.",
    ],
  },
  {
    id: "equipment",
    title: "Equipamento",
    summary: "Sete espaços, cinco conjuntos, um item por espaço.",
    lines: [
      "Espaços: gorro, colar, casaco, calças, botas, garras e anel.",
      setRequirementsLine(),
      "Toda peça dá atributo, e nada além de atributo: o que o card promete é exatamente o que soma na ficha.",
      "Garras e anel dão Força; casaco, calças e gorro dão Resistência; botas dão Agilidade; colar dá Instinto e Vontade.",
      "O casaco tem corte de linhagem: o de Lumni veste Lumni, o de Luna veste Luna. O mercado mostra os dois e o botão avisa qual é o seu.",
      "Equipar um item com o espaço ocupado devolve o anterior ao inventário.",
      "O conjunto lunar é o teto: caro no mercado e também sorteado de vampiros e unicórnios.",
      "Cada peça equipada pode ser forjada, e o +X viaja com ela para dentro e fora do inventário.",
    ],
  },
  {
    id: "bestiary-rule",
    title: "Presas",
    summary: "Seis espécies dividem os mil níveis em faixas iguais.",
    lines: [
      ...bandLines(),
      "Cada espécie tem cinco variantes espalhadas dentro da própria faixa.",
      "O território sorteia entre as variantes que você já alcançou, sempre as mais próximas do seu nível.",
      "Todo requisito de nível do jogo termina em 0 ou 5.",
    ],
  },
  {
    id: "forge",
    title: "Forja e mina",
    summary: "A bigorna não faz peça nova: melhora a que já está no corpo.",
    lines: [
      "A mina rende a cada " +
        (MINING_CYCLE_MS / 1000).toFixed(1).replace(".", ",") +
        " segundos: um clique vale um rendimento, e com a mineração automática ligada ela repete até você mandar parar.",
      ...oreLines(),
      "Mineração começa em 1 e para em " +
        MINING_MAX_LEVEL +
        ", o nível do veio mais fundo: acima disso não há o que destravar.",
      "O próximo nível de mineração pede " +
        miningNeeded(1) +
        " de progresso no nível 1, " +
        miningNeeded(25) +
        " no 25 e " +
        miningNeeded(69) +
        " no último: a escada da mina sobe como a de nível.",
      "A cada 20 níveis de mineração cada golpe rende um múltiplo a mais de fragmentos, então a forja continua alimentada.",
      "A forja só aceita a peça equipada, e só o fragmento do conjunto dela.",
      "Preço do próximo nível: um fragmento a cada cinco níveis, então +" +
        5 +
        " custa " +
        enhancementCost(5) +
        " e +100 custa " +
        enhancementCost(100) +
        ".",
      "Cada nível soma um ponto em cada atributo da peça, mais " +
        (ENHANCEMENT_STEP * 100).toFixed(1).replace(".", ",") +
        "% do valor original. Em +1000 a peça vale três vezes o que valia.",
      "O teto é +" + MAX_ENHANCEMENT + ", e o nível fica com a peça, não com o espaço.",
    ],
  },
  {
    id: "pet",
    title: "Mascote",
    summary: "Um lobo caça melhor acompanhado, enquanto estiver de pé.",
    lines: [
      "A adoção custa " + PET_PRICE + " de bronze. Soltar o lobo não paga nada: ele só parte.",
      "O lobo chega zerado: a linhagem é só identidade, e todo bônus nasce do treino.",
      "Trocar o apelido custa " +
        PET_RENAME_PRICE +
        " de bronze: o canil cobra caro pelos papéis novos.",
      "O lobo sobe o próprio nível, até " +
        PET_MAX_LEVEL +
        ": cada nível soma 1 de Força, 1 de Agilidade e 1 de Instinto ao que ele empresta.",
      "São dois caminhos para a mesma barra: a sessão no pátio, com o nível pago adiantado na primeira, e a caçada ao seu lado, que rende " +
        Math.round(PET_HUNT_SHARE * 100) +
        "% de uma sessão. São cinco sessões por nível, ou cerca de quatorze caçadas.",
      "A experiência dele só entra acompanhando: em repouso ele não arrisca nada, não empresta nada e não aprende nada.",
      "Energia é o único vital do lobo: começa em " +
        PET_BASE_ENERGY +
        " e ganha " +
        PET_ENERGY_PER_LEVEL +
        " por nível, então quanto mais treinado, mais noites ele aguenta.",
      "Acompanhando, ele entra na luta como um turno de ataque. A caçada em si cobra " +
        PET_ENERGY_PER_HUNT +
        " de energia, cada bote gasta " +
        PET_ENERGY_PER_BLOW +
        ", e a mordida que ele leva no lugar do seu ombro gasta " +
        PET_BITE_ENERGY +
        ".",
      "Sem energia ele para: sai da luta, não empresta nada e espera comida ou repouso.",
      "Acompanhar e Repousar, na página do mascote, é o que decide se ele desce com você. Em repouso ele devolve " +
        Math.round(PET_REST_RATIO * 100) +
        "% da energia a cada " +
        REST_TICK_MS / 1000 +
        " segundos, de graça: " +
        Math.round(1 / PET_REST_RATIO) * (REST_TICK_MS / 1000) +
        " segundos do zero ao cheio em qualquer nível, e o alimento faz o mesmo na hora.",
      "Nas configurações, alimento automático e repouso automático cuidam disso sozinhos: come se houver comida na mochila, deita se não houver.",
    ],
  },
  {
    id: "ranking",
    title: "Ranking",
    summary: "Onde você está entre os caçadores que a lua conhece.",
    lines: [
      boardLine(),
      "A busca filtra pelo nome sem renumerar: a posição é sempre a do quadro inteiro.",
      "Clicar em um nome abre a ficha de leitura dele: atributos, equipamento com o +X de cada peça, mascote e posições.",
      "O seu nome leva para a sua própria ficha, que é a mesma pessoa com mais detalhe.",
      "O quadro só tem gente de verdade: cada linha é um caçador que entrou pela mesma porta que você, e o quadro cresce a cada novo nome que a lua conhece.",
    ],
  },
  {
    id: "arena",
    title: "Arena",
    summary: "O fosso onde um lobisomem desafia outro.",
    lines: [
      "A arena só marca luta entre pares: " +
        Math.round(ARENA_BAND_RATIO * 100) +
        "% do seu nível para cada lado, e nunca menos que " +
        ARENA_MIN_BAND +
        " níveis.",
      "Você escolhe o nome pela busca ou pede um adversário qualquer da sua faixa.",
      "São " +
        ARENA_DAILY_ATTACKS +
        " ataques por dia: cada duelo gasta um, e cada um volta " +
        ARENA_COOLDOWN_HOURS +
        " horas depois de gasto.",
      "Quem você enfrentou descansa as mesmas " +
        ARENA_COOLDOWN_HOURS +
        " horas antes de aceitar outro desafio seu.",
      "Só a fera desce ao fosso: sem se transformar a arena recusa o duelo, e os dois lutam com a Força da fera.",
      "Os lobos ficam de fora: o duelo é entre os dois que desceram.",
      "O fosso não paga experiência: quem sobe de nível é quem caça. O que se ganha aqui é a bolsa do outro.",
      "Quem vence tira da bolsa do vencido o que " +
        ARENA_SPOILS_MIN_HUNTS +
        " a " +
        ARENA_SPOILS_MAX_HUNTS +
        " caçadas da faixa rendem, sorteado a cada duelo: a faixa de nível é que põe o piso e o teto.",
      "Ninguém sai limpo do fosso: esse pedaço nunca passa de " +
        Math.round(ARENA_SPOILS_MIN_SHARE * 100) +
        "% a " +
        Math.round(ARENA_SPOILS_MAX_SHARE * 100) +
        "% do que o perdedor carrega, então quem está duro paga pouco.",
      "Perder custa a mesma coisa: sai da sua bolsa e vai para a dele, e você deixa o fosso com 1 de vida e de volta à forma humana.",
      "Duelo que chega ao teto de rodadas termina empatado: ninguém leva bronze e ninguém marca ponto.",
      "Os duelos ganhos têm quadro próprio no ranking.",
    ],
  },
  {
    id: "tavern",
    title: "Taverna",
    summary: "Mesas de conversa e os nomes que você guarda.",
    lines: [
      "Uma mesa aberta cabe " +
        MAX_ROOM_MEMBERS +
        " pessoas, com ou sem senha, e você mantém uma por vez.",
      "Fechar a janela da conversa não é sair da mesa: o lugar continua seu e Entrar devolve a mesma cadeira.",
      "A mesa some do quadro quando a última pessoa sai, ou quando o dono a fecha.",
      "A matilha guarda até " +
        MAX_PACK +
        " nomes: de dentro de uma mesa, pelo botão ao lado do nome, ou pelo nick.",
      "Quem está numa mesa agora responde primeiro à busca por nick; depois responde o quadro do ranking.",
      "Chamar alguém da matilha abre uma mesa reservada para vocês dois, que só vocês veem.",
      "A mesa reservada nunca é varrida: a mensagem espera até que o outro nome apareça.",
      "Excluir um nome não custa nada e guardar de novo também não; a mesa reservada continua até alguém fechá-la.",
      "As salas vivem no servidor: quem estiver jogando, de qualquer máquina, senta nas mesmas mesas e lê as mesmas falas.",
      "A senha da mesa fica guardada cifrada; ainda assim, invente uma só para a mesa, nunca uma senha que você usa em outro lugar.",
    ],
  },
  {
    id: "bazaar",
    title: "Bazar",
    summary: "Peça forjada e fragmento trocando de dono por dinheiro de verdade.",
    lines: [
      "Só entra o que a forja tocou: peça +1 ou mais fora do corpo, e fragmentos da mina.",
      "O que o mercado vende igual não entra: peça sem forja fica de fora.",
      "Anunciar tira as peças da mochila; remover o anúncio devolve tudo.",
      "Quem compra é gente de verdade: o anúncio fica no quadro até outro caçador pagar por ele, e o preço é você quem decide.",
      "A compra é paga no checkout do Stripe, com dinheiro de verdade; assim que o pagamento confirma, o item entra na mochila e o vendedor recebe no Alforje, já sem a taxa da casa.",
      "O que veio do bazar carrega a insígnia Bazar na mochila: uma marca de origem, sem regra presa a ela, e a peça vende no mercado ou se descarta como qualquer outra.",
      "Ninguém compra o próprio anúncio.",
      "A casa fica com " +
        Math.round(BAZAAR_FEE_RATIO * 100) +
        "% de cada venda; o resto cai no Alforje, a carteira do bazar.",
      "O Alforje nasce com " +
        formatReais(initialWallet().cents) +
        " e o saque mínimo é " +
        formatReais(MIN_WITHDRAW_CENTS) +
        ", pedido com nome completo, CPF e chave Pix.",
      "O saque desta versão é de demonstração: o pedido fica registrado com os dados informados e nada é transferido ainda.",
      "Comprar uma peça mais forjada que a sua eleva a sua ao nível dela: a forja pertence à peça.",
      "Qualquer dúvida com um pagamento, escreva para o suporte: wizold@lumni.dev.br.",
    ],
  },
  {
    id: "store",
    title: "Wizold Store",
    summary: "Bronze por dinheiro, para quem quer pular a espera.",
    lines: [
      "Três pacotes, e cada um vale um número de caçadas da sua faixa, não um número solto de bronze.",
      ...STORE_PACKS.map(
        (pack) =>
          pack.name + ": " + pack.hunts + " caçadas por " + formatReais(pack.priceCents) + ".",
      ),
      "Subir de faixa aumenta o que o mesmo pacote entrega, então comprar cedo nunca vira atalho: o que está à venda é tempo, sempre o mesmo tempo.",
      "A loja não vende nível, atributo nem equipamento: experiência só a caça dá, e ponto de atributo só o treino dá.",
      "O pagamento abre no checkout do Stripe e o bronze cai na conta assim que ele confirma.",
      "O histórico de compras fica na própria loja, cinco por página: valor, data e o status de cada pacote, de aguardando pagamento a aprovado, expirado ou devolvido.",
      "Qualquer dúvida com um pagamento, escreva para o suporte: wizold@lumni.dev.br.",
    ],
  },
  {
    id: "economy",
    title: "Economia",
    summary: "Bronze entra pela caça e sai pelo mercado.",
    lines: [
      "A partida começa com 100 de bronze.",
      "A caçada é a unidade de preço do jogo: uma presa paga conforme a faixa em que ela vive, e treino, poção, nome novo e bolsa da arena são todos contados em caçadas dessa mesma faixa.",
      "Subir de nível dentro de uma faixa não enche o bolso: o que muda o tamanho da bolsa é abrir a faixa seguinte, com presas mais caras e conjunto mais caro.",
      "Um conjunto novo custa entre 150 e 330 caçadas da faixa que o abriu: é a poupança da faixa inteira.",
      "O mercado vende pelo preço de tabela e recompra pela metade.",
      "Materiais não têm uso além da venda: são a renda estável da caçada.",
      "Peça lunar cai de vampiro e de unicórnio, mas raramente: menos de uma em cada duzentas caçadas, para ser noite de sorte e não salário.",
      "Fragmentos não são vendidos no mercado: saem da mina e servem só para a forja.",
      "O alimento para mascote é a única compra que não é sua: cuida do lobo.",
      "Comprar e vender sempre pedem confirmação, e a compra deixa você escolher a quantidade.",
    ],
  },
];
