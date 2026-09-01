import { healthPerLevelFor, VITALS } from "@/shared/constants/tuning/vitals";
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
  PET_ADOPTION_HUNTS,
  PET_RENAME_HUNTS,
  RENAME_COOLDOWN_DAYS,
  RENAME_HUNTS,
  STARTING_BRONZE,
} from "@/shared/constants/game";
import { SITE_EMAIL } from "@/shared/constants/site";
import { ECONOMY } from "@/shared/config/economy";
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
import { BAZAAR_FEE_RATIO, BAZAAR_LISTING_HUNTS, MIN_WITHDRAW_CENTS } from "../rules/bazaar";
import { BAZAAR_LISTING_DAYS, initialWallet } from "../entities/bazaar";
import { enhancementCost } from "../rules/forge";
import { experienceForLevel } from "../rules/progression";
import { MOON_PHASES, SYNODIC_MONTH_DAYS } from "../rules/moon";
import { FURY_ATTRIBUTE_BONUS } from "@/shared/constants/game";
import { miningNeeded } from "../rules/mining";
import { criticalMultiplierOf } from "../rules/combat";
import { VIP_DAYS, VIP_PRICE_CENTS } from "../rules/vip";
import { formatBronze, formatReais } from "@/shared/utils/format";
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
      return phase.label + ": Modo Fúria ativo (+" + FURY_ATTRIBUTE_BONUS + " em todos os atributos).";
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
    const total = EQUIPMENT_SLOTS.length * piecePrice(definition);
    return definition.label + " (" + formatBronze(total) + ", " + formatBronze(piecePrice(definition)) + " por peça)";
  });
  return "Um conjunto completo custa: " + parts.join("; ") + ".";
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
      "Você começa sem nada equipado, com " +
        STARTING_BRONZE +
        " WCoins e dez poções de vida. Escolha um território: a barra enche como \"Caçando...\" e só no último batimento a luta é decidida no servidor; depois o replay conta golpe a golpe. Parar na aproximação cancela; parar no replay aplica o resultado.",
      "Para encadear caçadas, treino, mina ou forja sem tocar em nada, ative a automação VIP nas configurações. Cada área tem dez criaturas de números fixos: você fica mais forte, elas não.",
      "O golpe crítico multiplica o dano por " +
        criticalMultiplierOf().toFixed(2).replace(".", ",") +
        ", fixo; Instinto sobe a chance de crítico e Agilidade, a de esquiva.",
      "Treine para acumular progresso de atributo; equipe o que serve, venda o que sobra e volte a caçar.",
      "Na forja, minere fragmentos e bata na peça que está na mochila, fora do corpo, para levantá-la de +1 em diante. No canil, adote um lobo: ele soma atributos enquanto estiver de pé. O ranking mostra onde você está entre os caçadores.",
    ],
  },
  {
    id: "vitals",
    title: "Vitais",
    summary: "Vida sobe com o nível, como no Tibia: Lumni e Luna ganham ritmos diferentes.",
    lines: [
      "Vida máxima: " +
        VITALS.baseVital +
        " no nível 1, mais " +
        healthPerLevelFor("male") +
        " por nível para Lumni e " +
        healthPerLevelFor("female") +
        " por nível para Luna. A Resistência não engorda a barra; ela só corta o dano que cada golpe do inimigo tira.",
      "Poções de vida curam um valor fixo e aleatório: pequena 150 a 200, média 200 a 300, grande 300 a 500. Recuperar-se devolve " +
        Math.round(REST_HEALTH_RATIO * 100) +
        "% do máximo a cada " +
        REST_TICK_MS / 1000 +
        " segundos. A poção é o atalho pago quando o número fixo ainda vale a pena.",
      "Zerou a vida na caçada, você escapa com 1 de vida e registra uma derrota.",
      "Com menos de 1 de vida, o chão recusa caçada: Recuperar-se ou use uma poção.",
      "Com menos de " +
        Math.round(MIN_HEALTH_RATIO_TO_ACT * 100) +
        "% de vida máxima, o chão recusa duelo: Recuperar-se primeiro.",
      "Luta que se arrasta até o teto de rodadas termina em recuo: a caçada conta, mas ninguém vence nem perde.",
    ],
  },
  {
    id: "fury",
    title: "Fúria",
    summary: "Modo Fúria: poção paga ou lua cheia, +10 em todos os atributos por um tempo.",
    lines: [
      "Não existe transformação: você caça, treina e duela direto, do jeito que está.",
      "Modo Fúria dá +" +
        FURY_ATTRIBUTE_BONUS +
        " em cada atributo enquanto durar; o ganho aparece na coluna Fúria da ficha e levanta dano, esquiva e crítico de uma vez. A barra de vida continua subindo só com o nível.",
      "A poção de fúria não devolve vida. A duração vem pelo tamanho do frasco: pequena 2,5 minutos, média 5, grande 7,5. Beber de novo reinicia o relógio cheio.",
      "Na lua cheia o céu mantém o Modo Fúria ativo sozinho enquanto durar a fase; a poção fica desabilitada nesse período, porque o céu já faz esse trabalho.",
      "É um atalho pago para uma janela de força: guarde a poção para uma banda dura ou um duelo que você não quer perder, fora da lua cheia.",
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
      "A lua cheia não dá bônus pela coluna Lua: ela liga o Modo Fúria (+" +
        FURY_ATTRIBUTE_BONUS +
        " em todos os atributos) enquanto durar a fase, cerca de " +
        (SYNODIC_MONTH_DAYS / 8).toFixed(1).replace(".", ",") +
        " dias.",
      "Durante a lua cheia a poção de fúria fica desabilitada na ficha; o relógio do Modo Fúria no menu lateral mostra quanto falta para a fase acabar.",
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
        " no 1, " +
        experienceForLevel(10) +
        " no 10 e " +
        experienceForLevel(100) +
        " no 100. A curva sobe mais rápido do que a presa paga: cerca de 5 caçadas no começo e 585 no teto.",
      "O teto é nível 1000 para personagem e atributo. Subir de nível não dá poder de graça: abre território, conjunto e veia; a força vem do treino e do que você veste. Nível não restaura vida.",
      "Atributo só sobe no treino, pela mesma curva da experiência: barato no começo, caríssimo perto do teto; um ponto pede poucas sessões no começo e centenas no fim.",
      "Cada sessão de treino cobra " +
        ECONOMY.trainingSessionHunts.toString().replace(".", ",") +
        " caçada da bolsa do seu nível; quanto mais alto o atributo, mais sessões cada ponto exige. Equipamento soma por cima do teto treinado.",
    ],
  },
  {
    id: "combat",
    title: "Combate",
    summary: "Resolvido em rodadas, sem entrada do jogador durante a luta.",
    lines: [
      "Cinco números e só: Força, Agilidade, Resistência, Instinto e Vontade. Dano = Força² ÷ (Força + Resistência do alvo), com 10% de variação na Força.",
      "Quem tem mais Agilidade começa. Esquiva e crítico sobem a vida toda sem teto: 35% e 45% no horizonte.",
      "Crítico multiplica por " +
        criticalMultiplierOf().toFixed(2).replace(".", ",") +
        ", fixo. Luta trava em 24 rodadas: recuo, sem vencedor.",
    ],
  },
  {
    id: "equipment",
    title: "Equipamento",
    summary: "Sete espaços, cinco conjuntos, um item por espaço.",
    lines: [
      "Espaços: gorro, colar, casaco, calças, botas, luvas e anel. " + setRequirementsLine(),
      "Toda peça dá atributo e nada além: luvas/anel = Força; casaco/calças/gorro = Resistência; botas = Agilidade; colar = Instinto e Vontade.",
      "Casaco tem corte de linhagem (Lumni/Luna). Mercado vende uma peça de cada; o que já está na mochila ou no corpo não se compra de novo.",
      "Nenhum equipamento cai na caça. Peça forjada na mochila carrega o +X; desequipe para forjar, equipe de novo para usar.",
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
      "Preço do próximo nível: a mesma curva da experiência do personagem, em fragmentos; subir a peça para +N custa o que o nível N custa de experiência, então +" +
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
        " e custa cerca de " +
        PET_ADOPTION_HUNTS +
        " caçadas do seu nível; soltar não paga. O lobo nasce com +" +
        PET_BASE_BONUS +
        " de Força, Agilidade e Instinto, +1 de cada por nível até " +
        PET_MAX_LEVEL +
        ".",
      "Rename custa cerca de " +
        PET_RENAME_HUNTS +
        " caçadas do seu nível. Só o pátio ensina o lobo; caçada ao lado não sobe nível dele.",
      "Energia é o único vital: começa em " +
        PET_BASE_ENERGY +
        ", +" +
        PET_ENERGY_PER_LEVEL +
        " por nível. Caçada cobra " +
        PET_ENERGY_PER_HUNT +
        " para entrar, " +
        PET_ENERGY_PER_BLOW +
        " por bote e " +
        PET_BITE_ENERGY +
        " quando mordem nele.",
      "Acompanhar entra na luta e empresta atributo; repouso devolve " +
        Math.round(PET_REST_RATIO * 100) +
        "% da energia a cada " +
        REST_TICK_MS / 1000 +
        " s. Alimento devolve 25% do fôlego na hora. Alimento automático e repouso automático cuidam disso nas configurações.",
    ],
  },
  {
    id: "ranking",
    title: "Ranking",
    summary: "Onde você está entre os caçadores que a lua conhece.",
    lines: [
      boardLine() +
        " Personagem filtra por linhagem sem renumerar; a busca mantém a posição real do quadro.",
      "Clicar em um nome abre a ficha de leitura; o seu leva para a ficha completa. Só entra caçador de verdade.",
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
      "Links de Wizold, Lumni, Twitch, YouTube, Instagram, Facebook, WhatsApp, TikTok e X passam; qualquer outro endereço é recusado.",
      "Nomes de caçador, mesa e mensagens passam por moderação: o que fere as regras é recusado na hora ou censurado depois do envio.",
      "Cada fala cabe em " +
        MESSAGE_MAX_LENGTH +
        " caracteres, e a mesa aceita uma sua a cada " +
        MESSAGE_COOLDOWN_MS / 1000 +
        " segundos: conversa tem compasso.",
      "Fechar a janela da conversa não é sair da mesa: o lugar continua seu e Sentar devolve a mesma cadeira.",
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
      "Anunciar tira as peças da mochila e cobra cerca de " +
        BAZAAR_LISTING_HUNTS +
        " caçadas do seu nível em WCoins; remover o anúncio devolve as peças, nunca a taxa.",
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
      "Qualquer dúvida com um pagamento, escreva para o suporte: " + SITE_EMAIL + ".",
    ],
  },
  {
    id: "store",
    title: "Wizold Store",
    summary: "WCoins por dinheiro, para quem quer pular a espera.",
    lines: [
      "Três pacotes ancorados no conjunto da faixa: uma peça, quase o conjunto inteiro, ou o conjunto com folga de bigorna.",
      ...STORE_PACKS.map(
        (pack) =>
          pack.name +
          ": ~" +
          Math.round(pack.setShare * 100) +
          "% do conjunto da faixa por " +
          formatReais(pack.priceCents) +
          ".",
      ),
      "Subir de faixa aumenta o WCoins que o mesmo pacote entrega, então comprar cedo nunca vira atalho: o que está à venda é tempo proporcional ao custo da faixa.",
      "A loja não vende nível, atributo nem equipamento: experiência só a caça dá, e ponto de atributo só o treino dá.",
      "O pagamento abre no checkout do Stripe e os WCoins caem na conta assim que ele confirma.",
      "O histórico de compras fica na própria loja, cinco por página: valor, data e o status de cada pacote, de aguardando pagamento a aprovado, expirado ou devolvido.",
      "Qualquer dúvida com um pagamento, escreva para o suporte: " + SITE_EMAIL + ".",
    ],
  },
  {
    id: "vip",
    title: "VIP",
    summary: "Assinatura mensal que libera a automação.",
    lines: [
      "Custa " +
        formatReais(VIP_PRICE_CENTS) +
        " por mês e mantém o VIP por " +
        VIP_DAYS +
        " dias a cada cobrança confirmada.",
      "Libera todos os interruptores de automação nas configurações: caçada, treino, mina, forja, descanso, fúria, poção e mascote.",
      "Sem VIP, cada clique faz um ciclo só; com VIP, a partida repete o trabalho sozinha enquanto houver recurso.",
      "Cancelar a assinatura mantém o VIP até o fim do período já pago; reativar antes do vencimento evita ficar sem o recurso.",
      "O pagamento abre no checkout do Stripe; a confirmação liga o VIP na hora.",
    ],
  },
  {
    id: "automation",
    title: "Automação",
    summary: "Interruptores VIP que repetem trabalho por você.",
    lines: [
      "Só quem tem VIP liga e desliga os interruptores nas configurações.",
      AUTOMATIONS.map((entry) => entry.label + ": " + entry.effect).join(" "),
      "Com VIP ativo, no chão de vida (" +
        Math.round(MIN_HEALTH_RATIO_TO_ACT * 100) +
        "%) bebe poção se houver, senão repousa; trabalho pausado por falta de recurso retoma quando der. Na lua cheia a fúria automática não bebe poção: o céu já mantém o Modo Fúria.",
    ],
  },
  {
    id: "economy",
    title: "Economia",
    summary: "WCoins entram pela caça e saem pelo mercado.",
    lines: [
      "A partida começa com " +
        STARTING_BRONZE +
        " WCoins. A caçada é a unidade de preço: treino, poção, arena e rename (" +
        RENAME_HUNTS +
        " caçadas do seu nível, a cada " +
        RENAME_COOLDOWN_DAYS +
        " dias) seguem a bolsa da faixa.",
      setCostRangeLine() +
        " Subir de nível dentro de uma faixa não enche o bolso: quem muda o tamanho da bolsa é abrir a faixa seguinte.",
      "O mercado vende pelo preço de tabela e recompra pela metade. Materiais só servem para venda; nenhum equipamento cai na caça.",
      "Poções de vida: pequena 50 WCoins, média 150, grande 300; fúria pequena 300, média 600, grande 900; ração do lobo, 1,5 caçada. A poção de fúria não se bebe na lua cheia: o céu já mantém o Modo Fúria. Fragmentos saem da mina e só alimentam a forja.",
      "Comprar e vender pedem confirmação e deixam escolher a quantidade.",
    ],
  },
];
