import { formatReais } from "@/shared/utils/format";
import {
  ENHANCEMENT_STEP,
  FORGE_BRONZE_RATIO,
  FORGE_SUCCESS_RATIO,
  MAX_ENHANCEMENT,
  MINING_CYCLE_MS,
  MINING_DAILY_MININGS,
  MIN_HEALTH_RATIO_TO_ACT,
  PET_BASE_BONUS,
  PET_BASE_ENERGY,
  PET_BITE_ENERGY,
  PET_ENERGY_PER_BLOW,
  PET_ENERGY_PER_LEVEL,
  PET_MAX_LEVEL,
  PET_ENERGY_PER_HUNT,
  PET_REST_RATIO,
  REST_TICK_MS,
  REST_HEALTH_RATIO,
  PET_MIN_LEVEL,
  PET_PRICE,
  PET_RENAME_PRICE,
  RENAME_COOLDOWN_DAYS,
} from "@/shared/constants/game";
import { SPECIES_LABEL, SPECIES_ORDER } from "../entities/creature";
import { TERRITORIES } from "./territories";
import { MAX_PACK } from "../entities/pack";
import {
  MAX_ROOM_MEMBERS,
  MAX_ROOM_MESSAGES,
  MESSAGE_COOLDOWN_MS,
  MESSAGE_MAX_LENGTH,
  OPEN_ROOM_MIN_LEVEL,
} from "../entities/tavern";
import { ARENA_HISTORY_SIZE } from "../entities/arena";
import {
  ARENA_BAND_RATIO,
  ARENA_DAILY_ATTACKS,
  ARENA_MIN_BAND,
  ARENA_SPOILS_MAX_HUNTS,
  ARENA_SPOILS_MAX_SHARE,
  ARENA_SPOILS_MIN_HUNTS,
  ARENA_SPOILS_MIN_SHARE,
} from "../rules/arena";
import { MINING_MAX_LEVEL, ORES } from "./ores";
import { RANKING_BOARDS } from "../entities/ranking";
import { BAZAAR_FEE_RATIO, BAZAAR_LISTING_FEE, MIN_WITHDRAW_CENTS } from "../rules/bazaar";
import { BAZAAR_LISTING_DAYS, initialWallet } from "../entities/bazaar";
import { enhancementCost } from "../rules/forge";
import { experienceForLevel } from "../rules/progression";
import { FULL_MOON_ATTRIBUTE_BONUS, MOON_PHASES, SYNODIC_MONTH_DAYS } from "../rules/moon";
import { miningNeeded } from "../rules/mining";
import { criticalMultiplierOf } from "../rules/combat";
import { huntPurse } from "../rules/economy";
import { EQUIPMENT_SETS, piecePrice } from "./equipment-sets";
import { EQUIPMENT_SLOTS } from "../entities/item";
import { STORE_PACKS } from "./store-packs";
import { AUTOMATIONS } from "../entities/automation";

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
  return ORES.map((ore) => ore.label + ": mineração NV. " + ore.requiredLevel + ".");
}

function boardLine(): string {
  return "Quadros: " + RANKING_BOARDS.map((board) => board.label).join(", ") + ".";
}

function bandLines(): string[] {
  return SPECIES_ORDER.map((species) => {
    const areas = TERRITORIES.filter((territory) => territory.species === species);
    const min = areas.reduce((low, territory) => Math.min(low, territory.minLevel), areas[0]?.minLevel ?? 1);
    const max = areas.reduce((high, territory) => Math.max(high, territory.maxLevel), areas[0]?.maxLevel ?? 1);
    return SPECIES_LABEL[species] + ": NV. " + min + " a " + max + ".";
  });
}

function setCostRangeLine(): string {
  const parts = EQUIPMENT_SETS.map((definition) => {
    const bronze = EQUIPMENT_SLOTS.reduce(
      (sum, slot) => sum + piecePrice(definition, slot),
      0,
    );
    const hunts = Math.round(bronze / huntPurse(definition.minLevel));
    return definition.label + " (~" + hunts + " caçadas na faixa NV. " + definition.minLevel + ")";
  });
  return "Um conjunto completo custa cerca de: " + parts.join("; ") + ".";
}

function forgeMultiplierAt(level: number): string {
  return (1 + ENHANCEMENT_STEP * level).toFixed(2).replace(".", ",");
}

export const WIKI_TOPICS: readonly WikiTopic[] = [
  {
    id: "loop",
    title: "Como jogar",
    summary: "O ciclo de uma noite qualquer em Wizold.",
    lines: [
      "Você começa sem nada equipado, com 100 WCoins e dez poções de vida.",
      "Escolha um território: a barra enche como \"Caçando...\" e só no último batimento a luta é decidida no servidor; depois o replay conta golpe a golpe. Parar na aproximação cancela; parar no replay aplica o resultado.",
      "Cada clique vale uma luta. Para encadear caçadas sem tocar em nada, ligue a caçada automática nas configurações; o mesmo vale para treino, mina e forja.",
      "Cada área tem dez criaturas de números fixos: você fica mais forte, elas não, então subir de área é o que renova o desafio.",
      "O golpe crítico multiplica o dano por " +
        criticalMultiplierOf().toFixed(2).replace(".", ",") +
        ", fixo. Instinto sobe a chance de crítico; Agilidade, a de esquiva.",
      "Treine para acumular progresso de atributo.",
      "Equipe o que serve, venda o que sobra e volte a caçar.",
      "Na forja, minere fragmentos e bata na peça que está na mochila, fora do corpo, para levantá-la de +1 em diante.",
      "No canil, adote um lobo: ele soma atributos enquanto estiver de pé.",
      "O ranking mostra onde você está entre os caçadores, quadro por quadro.",
    ],
  },
  {
    id: "vitals",
    title: "Vitais",
    summary: "Todo personagem nasce com 100 de vida.",
    lines: [
      "Vida: 100 para todo mundo, fixa. Nem o nível nem a Resistência engordam a barra; a Resistência agora só corta o dano que cada golpe do inimigo tira.",
      "Poções de vida recuperam uma porcentagem do máximo. Recuperar-se devolve só vida: a cada " +
        REST_TICK_MS / 1000 +
        " segundos, " +
        Math.round(REST_HEALTH_RATIO * 100) +
        "% do máximo, então o corpo inteiro volta em " +
        Math.round(REST_TICK_MS / 1000 / REST_HEALTH_RATIO) +
        " segundos, em qualquer nível. A poção é o atalho pago.",
      "Zerou a vida na caçada, você escapa com 1 de vida e registra uma derrota.",
      "Com menos de " +
        Math.round(MIN_HEALTH_RATIO_TO_ACT * 100) +
        "% de vida máxima, o chão recusa caçada e duelo: Recuperar-se primeiro.",
      "Luta que se arrasta até o teto de rodadas termina em recuo: a caçada conta, mas ninguém vence nem perde.",
    ],
  },
  {
    id: "fury",
    title: "Fúria",
    summary: "A poção de fúria: um empurrão temporário em todos os atributos.",
    lines: [
      "Não existe transformação: você caça, treina e duela direto, do jeito que está.",
      "A poção de fúria não devolve vida. Enquanto dura, dá +10 em cada atributo, o que levanta dano, esquiva e crítico de uma vez; a barra de vida continua fixa em 100.",
      "A duração vem pelo tamanho do frasco: pequena 2,5 minutos, média 5, grande 7,5. Beber de novo reinicia o relógio cheio.",
      "É um atalho pago para uma janela de força: guarde para uma banda dura ou um duelo que você não quer perder.",
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
      "A fase atual e o bônus dela ficam no rodapé do menu lateral no desktop e na barra abaixo da navegação no celular.",
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
      "A curva sobe mais rápido do que a experiência que a presa dá, então cada nível custa mais caçadas que o anterior: cerca de 5 no começo e 585 no teto.",
      "O teto da progressão é o nível 1000, e cada atributo treinado também para em 1000.",
      "Subir de nível não dá poder nenhum de graça: o que o nível abre é o próximo território, o próximo conjunto e a próxima veia da mina. A força vem do treino e do que você veste.",
      "Subir de nível não restaura a vida: só poção ou repouso enchem o corpo.",
      "Atributo não se distribui: só o treino levanta um ponto.",
      "Treinar acumula progresso, e o próximo ponto sobe pela mesma curva da experiência: barato no começo, caríssimo perto do teto.",
      "Um exercício por atributo, e tanto a exigência quanto o rendimento da sessão crescem com o valor do atributo: um ponto sai em cerca de cinco sessões no começo e algumas centenas perto do teto, a mesma dificuldade de subir um nível.",
      "O pátio treina você e o lobo direto: uma sessão paga progresso de atributo, e o excedente carrega para o próximo ponto, como a experiência.",
      "Cada treino é pago na hora: o preço do ponto da sua faixa dividido pelas sessões que ele leva, cobrado no primeiro turno de cada volta. Um ponto custa cerca de três caçadas de bronze em qualquer faixa, e é a caça que paga esse corpo.",
      "Equipamento soma por cima do teto: o limite vale para o valor treinado.",
    ],
  },
  {
    id: "combat",
    title: "Combate",
    summary: "Resolvido em rodadas, sem entrada do jogador durante a luta.",
    lines: [
      "O jogo tem cinco números e só: Força, Agilidade, Resistência, Instinto e Vontade. Não existe força de combate nem resistência de combate por trás deles.",
      "Dano de um golpe: Força x Força dividido por Força mais a Resistência do alvo, com variação de 10% na Força.",
      "A fórmula vale em qualquer escala: Resistência alta reduz muito, mas nunca zera o golpe.",
      "Quem tem mais Agilidade começa a rodada.",
      "Esquiva e crítico sobem a vida toda sem nunca encostar no teto: 35% de esquiva e 45% de crítico ficam no horizonte, e cada ponto de Agilidade ou Instinto ainda compra alguma coisa no nível 1000.",
      "Crítico multiplica o dano por " +
        criticalMultiplierOf().toFixed(2).replace(".", ",") +
        ", fixo, sem depender de nada que você acumule.",
      "A luta trava em 24 rodadas: ninguém morre e a caçada termina em recuo.",
    ],
  },
  {
    id: "equipment",
    title: "Equipamento",
    summary: "Sete espaços, cinco conjuntos, um item por espaço.",
    lines: [
      "Espaços: gorro, colar, casaco, calças, botas, luvas e anel.",
      setRequirementsLine(),
      "Toda peça dá atributo, e nada além de atributo: o que o card promete é exatamente o que soma na ficha.",
      "Luvas e anel dão Força; casaco, calças e gorro dão Resistência; botas dão Agilidade; colar dá Instinto e Vontade.",
      "O casaco tem corte de linhagem: o de Lumni veste Lumni, o de Luna veste Luna. O mercado mostra os dois e o botão avisa qual é o seu.",
      "Equipar um item com o espaço ocupado devolve o anterior ao inventário.",
      "O conjunto lunar é o teto: o mais forte e o mais caro, e só sai do mercado, nunca da caça.",
      "O mercado vende uma peça de cada: o que já está na mochila ou no corpo não se compra de novo.",
      "Nenhum equipamento cai na caça: conjunto só se compra no mercado.",
      "Cada peça forjada na mochila carrega o +X consigo; desequipe para forjar, equipe de novo para usar o ganho.",
    ],
  },
  {
    id: "bestiary-rule",
    title: "Presas",
    summary: "Seis espécies dividem os mil níveis em faixas iguais.",
    lines: [
      ...bandLines(),
      "Cada território tem dez criaturas fixas, em degraus de dez níveis dentro da faixa.",
      "A caçada sempre enfrenta a criatura mais forte que você já alcançou na área, não sorteia entre elas.",
      "Todo requisito de nível do jogo termina em 0 ou 5.",
    ],
  },
  {
    id: "forge",
    title: "Forja e mina",
    summary: "A bigorna não faz peça nova: melhora a que está na mochila, fora do corpo.",
    lines: [
      "A mina rende a cada " +
        (MINING_CYCLE_MS / 1000).toFixed(1).replace(".", ",") +
        " segundos: um clique vale um rendimento, e com a mineração automática ligada ela repete até você mandar parar.",
      "A picareta tem cota: " +
        MINING_DAILY_MININGS +
        " minerações por dia, contando a colheita e não cada batida. A cota zera às 06:00 de São Paulo, o mesmo horário para todo mundo.",
      ...oreLines(),
      "Mineração começa em 1 e vai até " +
        MINING_MAX_LEVEL +
        ", o mesmo teto do personagem: tudo que evolui sobe pela mesma curva.",
      "O próximo nível de mineração pede " +
        miningNeeded(1) +
        " de progresso no nível 1, " +
        miningNeeded(100) +
        " no 100 e " +
        miningNeeded(1000) +
        " no teto: a escada da mina é a mesma da experiência.",
      "A cada 40 níveis de mineração cada golpe rende um múltiplo a mais de fragmentos, então a forja continua alimentada sem virar chuva de fragmento.",
      "A forja só aceita peça desequipada, na mochila: tire do corpo para forjar. Cada peça come só o fragmento do conjunto dela.",
      "Preço do próximo nível: metade da curva da experiência em fragmentos, então +" +
        5 +
        " custa " +
        enhancementCost(5) +
        " e +1000 custa " +
        enhancementCost(1000) +
        ".",
      "Cada nível forja soma " +
        (ENHANCEMENT_STEP * 100).toFixed(1).replace(".", ",") +
        "% ao valor original de cada atributo da peça. Em +1000 a peça vale " +
        forgeMultiplierAt(1000) +
        " vezes o que valia.",
      "A bigorna acerta " +
        Math.round(FORGE_SUCCESS_RATIO * 100) +
        "% das marteladas. Quando falha, o que foi pago se perde e a peça segue como está: o risco faz parte do preço.",
      "Cada martelada também cobra WCoins: " +
        Math.round(FORGE_BRONZE_RATIO * 100) +
        "% da bolsa de caçada do seu nível, mais um por nível já forjado da peça. O ferreiro não trabalha de graça.",
      "O teto é +" +
        MAX_ENHANCEMENT +
        ", e o nível fica com a peça: forjada na mochila, ela leva o ganho quando volta ao corpo.",
    ],
  },
  {
    id: "pet",
    title: "Mascote",
    summary: "Um lobo caça melhor acompanhado, enquanto estiver de pé.",
    lines: [
      "A adoção exige NV " +
        PET_MIN_LEVEL +
        " e custa " +
        PET_PRICE +
        " WCoins fixos. Soltar o lobo não paga nada: ele só parte.",
      "O lobo já nasce com +" +
        PET_BASE_BONUS +
        " de Força, Agilidade e Instinto; cada nível dele soma mais 1 em cada um desses três.",
      "Trocar o apelido custa " +
        PET_RENAME_PRICE +
        " WCoins: o canil cobra caro pelos papéis novos.",
      "O lobo sobe o próprio nível, até " +
        PET_MAX_LEVEL +
        ": cada nível soma 1 de Força, 1 de Agilidade e 1 de Instinto ao que ele empresta.",
      "O lobo sobe de nível só no pátio: cada sessão paga o progresso dele, e a caçada ao seu lado não ensina mais nada.",
      "Acompanhando, ele arrisca e empresta atributo; em repouso não arrisca nada e não empresta nada. De um jeito ou de outro, quem ensina o lobo é o treino.",
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
      "Personagem filtra o quadro: todos, Lumni, Luna ou a sua linhagem, sem renumerar as posições.",
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
        " ataques por dia, e todos voltam juntos às 06:00, a mesma hora que a mina reabre.",
      "Quem você enfrentou descansa até as 06:00 antes de aceitar outro desafio seu.",
      "O fosso tem memória: as " +
        ARENA_HISTORY_SIZE +
        " últimas lutas do seu nome ficam registradas, as que você marcou e as que marcaram contra você, com o resultado e os WCoins que mudaram de mãos.",
      "Os dois lutam com seus números atuais: atributos, equipamento e mascote incluídos.",
      "O mascote desce junto: ativo e com fôlego, ele morde no duelo como na caçada, o seu e o do rival. Só o seu gasta energia aqui; o do rival se cansa nos duelos do próprio dono.",
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
      "Perder custa a mesma coisa: sai da sua bolsa e vai para a dele, e você deixa o fosso com 1 de vida.",
      "Duelo que chega ao teto de rodadas termina empatado: ninguém leva WCoins e ninguém marca ponto.",
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
        " pessoas, com ou sem senha, e você mantém uma por vez. Mesa aberta sem senha exige NV " +
        OPEN_ROOM_MIN_LEVEL +
        "; com senha, qualquer nível.",
      "Cada mesa guarda as últimas " +
        MAX_ROOM_MESSAGES +
        " falas: o que veio antes a noite leva.",
      "A taverna não aceita links: fala que carrega endereço volta recusada.",
      "Cada fala cabe em " +
        MESSAGE_MAX_LENGTH +
        " caracteres, e a mesa aceita uma sua a cada " +
        MESSAGE_COOLDOWN_MS / 1000 +
        " segundos: conversa tem compasso.",
      "Fechar a janela da conversa não é sair da mesa: o lugar continua seu e Entrar devolve a mesma cadeira.",
      "A mesa some do quadro quando a última pessoa sai, ou quando o dono a fecha.",
      "A matilha guarda até " +
        MAX_PACK +
        " nomes: convite mútuo, enviado pelo perfil de um caçador ou pelo nick na taverna.",
      "Quem recebe vê o convite em Convites na taverna e aceita ou recusa; aceitar coloca os dois na matilha um do outro.",
      "Sair da matilha é mútuo: remover um nome apaga os dois lados.",
      "Chamar alguém da matilha abre uma mesa reservada para vocês dois, que só vocês veem.",
      "Quem está numa mesa agora responde primeiro à busca por nick; depois responde o quadro do ranking.",
      "A mesa reservada nunca é varrida: a mensagem espera até que o outro nome apareça.",
      "Excluir um nome não custa nada e guardar de novo também não; a mesa reservada continua até alguém fechá-la.",
      "As mesas vivem no servidor: o quadro atualiza em tempo real por conexão contínua, sem depender de ficar atualizando a página.",
      "Com a Taverna ligada nas configurações, mensagens novas nas mesas em que você senta chegam por notificação do sistema, mesmo com o jogo fechado.",
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
      "Anunciar tira as peças da mochila e cobra " +
        BAZAAR_LISTING_FEE +
        " WCoins; remover o anúncio devolve as peças, nunca a taxa.",
      "Quem compra é gente de verdade: o anúncio fica no quadro até outro caçador pagar por ele, e o preço é você quem decide.",
      "Todo anúncio dura " +
        BAZAAR_LISTING_DAYS +
        " dias: o quadro mostra quantos faltam e a hora em que vence, e o vencido sai da vitrine esperando o dono remover para recolher as peças.",
      "A compra é paga no checkout do Stripe, com dinheiro de verdade; assim que o pagamento confirma, o item entra na mochila e o vendedor recebe no Alforje, já sem a taxa da casa.",
      "O que veio do bazar carrega a insígnia Bazar na mochila: uma marca de origem, sem regra presa a ela, e a peça vende no mercado como qualquer outra.",
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
    summary: "WCoins por dinheiro, para quem quer pular a espera.",
    lines: [
      "Três pacotes, e cada um vale um número de caçadas da sua faixa, não um número solto de WCoins.",
      ...STORE_PACKS.map(
        (pack) =>
          pack.name + ": " + pack.hunts + " caçadas por " + formatReais(pack.priceCents) + ".",
      ),
      "Subir de faixa aumenta o que o mesmo pacote entrega, então comprar cedo nunca vira atalho: o que está à venda é tempo, sempre o mesmo tempo.",
      "A loja não vende nível, atributo nem equipamento: experiência só a caça dá, e ponto de atributo só o treino dá.",
      "O pagamento abre no checkout do Stripe e os WCoins caem na conta assim que ele confirma.",
      "O histórico de compras fica na própria loja, cinco por página: valor, data e o status de cada pacote, de aguardando pagamento a aprovado, expirado ou devolvido.",
      "Qualquer dúvida com um pagamento, escreva para o suporte: wizold@lumni.dev.br.",
    ],
  },
  {
    id: "automation",
    title: "Automação",
    summary: "O jogo pode repetir trabalho por você, nas configurações.",
    lines: [
      "Cada interruptor nas configurações decide se caçada, treino, mina ou forja encadeiam sozinhos até você mandar parar.",
      ...AUTOMATIONS.map((entry) => entry.label + ": " + entry.effect),
      "No chão de vida, a poção de vida é sempre automática: bebe se houver na mochila, senão repousa, mesmo com tudo desligado.",
      "Com automação ligada, um trabalho pausado por falta de vida, WCoins ou fragmentos espera e retoma quando der.",
    ],
  },
  {
    id: "economy",
    title: "Economia",
    summary: "WCoins entram pela caça e saem pelo mercado.",
    lines: [
      "A partida começa com 100 WCoins.",
      "A caçada é a unidade de preço do jogo: uma presa paga conforme a faixa em que ela vive, e treino, poção e bolsa da arena são todos contados em caçadas dessa mesma faixa. Trocar de nome foge à regra: custa 50 mil WCoins fixos e só pode repetir a cada " +
        RENAME_COOLDOWN_DAYS +
        " dias.",
      "Subir de nível dentro de uma faixa não enche o bolso: o que muda o tamanho da bolsa é abrir a faixa seguinte, com presas mais caras e conjunto mais caro.",
      setCostRangeLine(),
      "O mercado vende pelo preço de tabela e recompra pela metade.",
      "Materiais não têm uso além da venda: são a renda estável da caçada.",
      "Nenhum equipamento cai na caça: conjunto só se compra. A carcaça larga materiais, e é isso que a caça rende além dos WCoins.",
      "Poções de vida e fúria no mercado: pequena 3 caçadas (25%), média 6 (50%), grande 12 (75%) do corpo; ração do lobo, 1,5 caçada.",
      "Fragmentos não são vendidos no mercado: saem da mina e servem só para a forja.",
      "O alimento para mascote é a única compra que não é sua: cuida do lobo.",
      "Comprar e vender sempre pedem confirmação, e a compra deixa você escolher a quantidade.",
    ],
  },
];
