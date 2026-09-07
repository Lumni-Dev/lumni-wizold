import type { Locale } from "@/shared/i18n/locale";
import { translate } from "@/shared/i18n/dictionary";
import { healthPerLevelFor, VITALS } from "@/shared/constants/tuning/vitals";
import {
  ENHANCEMENT_STEP,
  FORGE_BRONZE_RATIO,
  FORGE_SUCCESS_RATIO,
  MAX_ENHANCEMENT,
  MINING_CYCLE_MAX_MS,
  MINING_CYCLE_MIN_MS,
  MINING_DAILY_MININGS,
  MINING_TICKS_MAX,
  MINING_TICKS_MIN,
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
  REST_WILLPOWER_MAX_BONUS,
  REST_WILLPOWER_HALF,
  PET_MIN_LEVEL,
  PET_PRICE,
  PET_RENAME_PRICE,
  RENAME_COOLDOWN_DAYS,
  RENAME_PRICE,
  STARTING_BRONZE,
  TRAINING_TICKS_MAX,
  TRAINING_TICKS_MIN,
  FURY_ATTRIBUTE_BONUS,
} from "@/shared/constants/game";
import { SITE_EMAIL } from "@/shared/constants/site";
import { SPECIES_LABEL, SPECIES_ORDER } from "../entities/creature";
import { TERRITORIES } from "./territories";
import { MAX_PACK } from "../entities/pack";
import {
  MAX_ROOM_MEMBERS,
  MAX_ROOM_MESSAGES,
  MEMBER_TIMEOUT_MS,
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
import { miningNeeded } from "../rules/mining";
import { criticalMultiplierOf } from "../rules/combat";
import { VIP_DAYS, VIP_PRICE_CENTS } from "../rules/vip";
import { formatBronze, formatReais } from "@/shared/utils/format";
import { EQUIPMENT_SETS, piecePrice } from "./equipment-sets";
import { EQUIPMENT_SLOTS } from "../entities/item";
import { STORE_PACKS } from "./store-packs";
import { AUTOMATIONS } from "../entities/automation";
import { WIKI_TOPICS, type WikiTopic } from "./wiki";

// English is the source in wiki.ts; these builders write the same lines in
// Portuguese and Spanish with the live numbers interpolated, so a tuning
// change never leaves a translation telling old values.

function decimal(value: string, locale: Locale): string {
  return locale === "pt" ? value.replace(".", ",") : value;
}

function critical(locale: Locale): string {
  return decimal(criticalMultiplierOf().toFixed(2), locale);
}

function setRequirementsLinePt(): string {
  const parts = EQUIPMENT_SETS.map(
    (definition) => translate(definition.label, "pt") + " (NV. " + definition.minLevel + ")",
  );
  return "Conjuntos, um por faixa de caça: " + parts.join(", ") + ".";
}

function setRequirementsLineEs(): string {
  const parts = EQUIPMENT_SETS.map(
    (definition) => translate(definition.label, "es") + " (NV. " + definition.minLevel + ")",
  );
  return "Conjuntos, uno por franja de caza: " + parts.join(", ") + ".";
}

function moonLinesPt(): string[] {
  return MOON_PHASES.map((phase) => {
    const perks: string[] = [];
    const experience = Math.round(phase.experienceBonus * 100);
    const training = Math.round(phase.trainingBonus * 100);
    const mining = Math.round(phase.miningBonus * 100);
    if (experience > 0) perks.push("+" + experience + "% de experiência na caça");
    if (training > 0) perks.push("+" + training + "% de progresso no treino");
    if (mining > 0) perks.push("+" + mining + "% de experiência de mineração");
    if (phase.key === "full") {
      perks.push("Modo Fúria ativo (+" + FURY_ATTRIBUTE_BONUS + " em todos os atributos)");
    }
    return translate(phase.label, "pt") + ": " + (perks.length > 0 ? perks.join(", ") + "." : "sem bônus.");
  });
}

function moonLinesEs(): string[] {
  return MOON_PHASES.map((phase) => {
    const perks: string[] = [];
    const experience = Math.round(phase.experienceBonus * 100);
    const training = Math.round(phase.trainingBonus * 100);
    const mining = Math.round(phase.miningBonus * 100);
    if (experience > 0) perks.push("+" + experience + "% de experiencia en la caza");
    if (training > 0) perks.push("+" + training + "% de progreso en el entrenamiento");
    if (mining > 0) perks.push("+" + mining + "% de experiencia de minería");
    if (phase.key === "full") {
      perks.push("Modo Furia activo (+" + FURY_ATTRIBUTE_BONUS + " a todos los atributos)");
    }
    return translate(phase.label, "es") + ": " + (perks.length > 0 ? perks.join(", ") + "." : "sin bono.");
  });
}

function oreLinesFor(locale: Locale): string[] {
  return ORES.map(
    (ore) =>
      translate(ore.label, locale) +
      (locale === "pt" ? ": mineração NV. " : ": minería NV. ") +
      ore.requiredLevel +
      (locale === "pt" ? ", de " : ", de ") +
      ore.minYield +
      " a " +
      ore.maxYield +
      (locale === "pt" ? " por mineração." : " por minería."),
  );
}

function boardLineFor(locale: Locale): string {
  const labels = RANKING_BOARDS.map((board) => translate(board.label, locale)).join(", ");
  return (locale === "pt" ? "Quadros: " : "Tableros: ") + labels + ".";
}

function bandLinesFor(locale: Locale): string[] {
  return SPECIES_ORDER.map((species) => {
    const areas = TERRITORIES.filter((territory) => territory.species === species);
    const min = areas.reduce((low, territory) => Math.min(low, territory.minLevel), areas[0]?.minLevel ?? 1);
    const max = areas.reduce((high, territory) => Math.max(high, territory.maxLevel), areas[0]?.maxLevel ?? 1);
    return translate(SPECIES_LABEL[species], locale) + ": NV. " + min + " a " + max + ".";
  });
}

function setCostRangeLineFor(locale: Locale): string {
  const parts = EQUIPMENT_SETS.map((definition) => {
    const total = EQUIPMENT_SLOTS.length * piecePrice(definition);
    return (
      translate(definition.label, locale) +
      " (" +
      formatBronze(total) +
      ", " +
      formatBronze(piecePrice(definition)) +
      (locale === "pt" ? " por peça)" : " por pieza)")
    );
  });
  return (locale === "pt" ? "Um conjunto completo custa: " : "Un conjunto completo cuesta: ") + parts.join("; ") + ".";
}

function forgeMultiplierAt(level: number, locale: Locale): string {
  return decimal((1 + ENHANCEMENT_STEP * level).toFixed(2), locale);
}

function automationLineFor(locale: Locale): string {
  return AUTOMATIONS.map(
    (entry) => translate(entry.label, locale) + ": " + translate(entry.effect, locale),
  ).join(" ");
}

function ptTopics(): readonly WikiTopic[] {
  return [
    {
      id: "loop",
      title: "Como jogar",
      summary: "O ciclo de uma noite qualquer em Wizold.",
      lines: [
        "Você começa sem nada equipado, com " +
          STARTING_BRONZE +
          " WCoins, dez poções de vida e dez poções de fúria pequena. Escolha um território e, na lista, a presa: a barra enche como \"Procurando criatura...\" e só no último batimento a luta é decidida no servidor; depois o replay conta golpe a golpe como \"Caçando...\". Parar na aproximação cancela; parar no replay aplica o resultado. Trocar de criatura no meio da caçada não muda a luta em curso, só a próxima volta.",
        "Para encadear caçadas, treino, mina ou forja sem tocar em nada, ative a automação VIP nas configurações. Cada área tem dez criaturas de números fixos: você fica mais forte, elas não.",
        "O golpe crítico multiplica o dano por " + critical("pt") + ", fixo; Instinto sobe a chance de crítico e Agilidade, a de esquiva.",
        "Treine para acumular progresso de atributo; equipe o que serve, venda o que sobra e volte a caçar.",
        "As barras contam o que muda na hora, ao lado do valor: experiência ganha em roxo, WCoins e fragmentos em âmbar, vida perdida em vermelho e o fôlego gasto da mina em azul. Cada aviso soma os ganhos do momento e se apaga sozinho em seguida.",
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
          " segundos sem Vontade, e sobe rumo a " +
          Math.round((REST_HEALTH_RATIO + REST_WILLPOWER_MAX_BONUS) * 100) +
          "% conforme a Vontade cresce, com metade desse ganho já em " +
          REST_WILLPOWER_HALF +
          " de Vontade: mais Vontade, menos tempo até ficar inteiro. A poção é o atalho pago quando o número fixo ainda vale a pena.",
        "Zerou a vida na caçada, você escapa com 1 de vida e registra uma derrota.",
        "Com menos de 1 de vida, o chão recusa caçada: Recuperar-se ou use uma poção.",
        "O fosso abre para qualquer corpo vivo: dá para descer ferido, e perder sangrando é o risco que você escolheu correr.",
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
        ...moonLinesPt(),
        "A fase vem de uma API pública de lua, com a fórmula astronômica como reserva quando não há rede.",
        "O mês lunar tem " + decimal(SYNODIC_MONTH_DAYS.toFixed(2), "pt") + " dias, então cada fase dura cerca de uma semana.",
        "Cada fase paga em um canto: a crescente rende mais na caça e no treino, a nova rende mais na mina, e a minguante não dá bônus algum.",
        "A lua cheia não dá bônus pela coluna Lua: ela liga o Modo Fúria (+" +
          FURY_ATTRIBUTE_BONUS +
          " em todos os atributos) enquanto durar a fase, cerca de " +
          decimal((SYNODIC_MONTH_DAYS / 8).toFixed(1), "pt") +
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
        "Treino é gratuito: cada exercício sobe um atributo (+1 Força, +1 Resistência, +1 Agilidade, +1 Instinto ou +1 Vontade por ponto). O progresso por sessão segue o valor atual daquele atributo. Equipamento soma por cima do teto treinado.",
        "Cada sessão sorteia de " +
          TRAINING_TICKS_MIN +
          " a " +
          TRAINING_TICKS_MAX +
          " passos, e o sorteio é só ritmo: o progresso que a sessão paga é o mesmo, curta ou longa.",
        "O pátio mostra o atributo exato, com a fração do ponto em andamento (20.33 em vez de 20), quanto cada sessão paga de ponto e de experiência, e quantas sessões faltam para o ponto fechar: uma contagem que cai a cada sessão concluída.",
      ],
    },
    {
      id: "combat",
      title: "Combate",
      summary: "Resolvido em rodadas, sem entrada do jogador durante a luta.",
      lines: [
        "Cinco números e só: Força, Agilidade, Resistência, Instinto e Vontade. Dano = Força² ÷ (Força + Resistência do alvo), com 10% de variação na Força.",
        "A Vontade não entra na conta da luta: ela estica a poção de fúria e acelera a recuperação de vida fora do combate. A fúria é que soma +" +
          FURY_ATTRIBUTE_BONUS +
          " em todos os atributos enquanto dura, e quanto mais Vontade, mais tempo cada frasco rende.",
        "Quem tem mais Agilidade começa. Esquiva e crítico sobem a vida toda sem teto: 35% e 45% no horizonte.",
        "Crítico multiplica por " + critical("pt") + ", fixo. Luta trava em 24 rodadas: recuo, sem vencedor.",
      ],
    },
    {
      id: "equipment",
      title: "Equipamento",
      summary: "Sete espaços, cinco conjuntos, um item por espaço.",
      lines: [
        "Espaços: gorro, colar, casaco, calças, botas, luvas e anel. " + setRequirementsLinePt(),
        "Toda peça dá atributo e nada além: luvas = Força; anel = Força e Vontade; casaco = Resistência; calças = Resistência e Agilidade; gorro = Resistência e Instinto; botas = Agilidade; colar = Instinto e Vontade. A Vontade do colar e do anel estica a poção de fúria e acelera a recuperação de vida.",
        "Casaco tem corte de linhagem (Lumni/Luna). Mercado vende uma peça de cada; o que já está na mochila ou no corpo não se compra de novo.",
        "Nenhum equipamento cai na caça. Peça forjada na mochila carrega o +X; desequipe para forjar, equipe de novo para usar.",
      ],
    },
    {
      id: "bestiary-rule",
      title: "Presas",
      summary: "Seis espécies repartem os mil níveis em faixas de tamanhos diferentes.",
      lines: [
        ...bandLinesFor("pt"),
        "Cada território tem dez criaturas fixas, em degraus de dez níveis dentro da faixa.",
        "Na lista da área você marca a presa. A luta que já começou fica com o bicho dela; a próxima volta usa o que você marcou.",
        "Todo requisito de nível do jogo termina em 0 ou 5.",
      ],
    },
    {
      id: "forge",
      title: "Forja e mina",
      summary: "A bigorna não faz peça nova: melhora a que está na mochila, fora do corpo.",
      lines: [
        "A mina rende a cada " +
          MINING_CYCLE_MIN_MS / 1000 +
          " a " +
          MINING_CYCLE_MAX_MS / 1000 +
          " segundos, porque cada golpe sorteia de " +
          MINING_TICKS_MIN +
          " a " +
          MINING_TICKS_MAX +
          " passadas: um clique vale um rendimento, e com a mineração automática ligada ela repete até você mandar parar.",
        "O sorteio das passadas é só ritmo: o punhado que a veia entrega, o progresso de mineração e a mineração descontada da cota são os mesmos, golpe curto ou longo.",
        "A picareta tem cota: " +
          MINING_DAILY_MININGS +
          " minerações por dia, contando a colheita e não cada batida. A cota zera às 06:00 de São Paulo, o mesmo horário para todo mundo.",
        ...oreLinesFor("pt"),
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
        "O que cada veia rende é fixo e está na lista acima: o nível de mineração abre veias mais fundas, nunca multiplica o punhado que sai da rocha.",
        "A forja só aceita peça desequipada, na mochila: tire do corpo para forjar. Cada peça come só o fragmento do conjunto dela.",
        "Preço do próximo nível: a mesma curva da experiência do personagem, em fragmentos; subir a peça para +N custa o que o nível N custa de experiência, então +5 custa " +
          enhancementCost(5) +
          " e +1000 custa " +
          enhancementCost(1000) +
          ".",
        "Cada nível forjado soma " +
          decimal((ENHANCEMENT_STEP * 100).toFixed(1), "pt") +
          "% ao valor original de cada atributo da peça. Em +1000 a peça vale " +
          forgeMultiplierAt(1000, "pt") +
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
          formatBronze(PET_PRICE) +
          "; soltar não paga. O lobo nasce com +" +
          PET_BASE_BONUS +
          " de Força, Agilidade e Instinto, +1 de cada por nível até " +
          PET_MAX_LEVEL +
          ".",
        "Renomear no canil custa " +
          formatBronze(PET_RENAME_PRICE) +
          ". Só o pátio ensina o lobo; caçada ao lado não sobe nível dele.",
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
        boardLineFor("pt") +
          " Personagem filtra por linhagem sem renumerar; a busca mantém a posição real do quadro.",
        "Clicar em um nome abre a ficha de leitura; o seu leva para a ficha completa. Entram caçadores de verdade e os NPCs da casa, estes com o selo NPC.",
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
          " ou VIP; com senha, qualquer nível.",
        "Cada mesa ganha um número #, que dá para copiar e buscar. Mesa reservada esconde o nome e exige senha: de fora só aparece o número.",
        "Cada nome na mesa ganha uma cor só sua. Quem chega pega a primeira livre; quem sai devolve a cor. Mesa reservada usa duas.",
        "Cada mesa guarda as últimas " +
          MAX_ROOM_MESSAGES +
          " falas: o que veio antes a noite leva.",
        "Links de Wizold, Lumni, Twitch, YouTube, Instagram, Facebook, WhatsApp, TikTok e X passam e abrem numa aba nova; qualquer outro endereço é recusado.",
        "E-mail passa inteiro na fala, mas fica como texto: ninguém clica nele por engano.",
        "Nomes de caçador e mesa passam por moderação na hora. A fala entra na mesa na hora; se a auditoria achar insulto, racismo ou pedofilia, vira Conteúdo impróprio. O aviso no aparelho nunca mostra a fala, só que chegou mensagem.",
        "Cada fala cabe em " +
          MESSAGE_MAX_LENGTH +
          " caracteres, e a mesa aberta aceita uma sua a cada " +
          MESSAGE_COOLDOWN_MS / 1000 +
          " segundos: conversa de muitos tem compasso.",
        "Na mesa reservada não há espera entre as falas: são duas pessoas, e ninguém precisa esperar a vez.",
        "Fechar a janela da conversa não é sair da mesa: o lugar continua seu e Sentar devolve a mesma cadeira.",
        "A mesa some do quadro quando a última pessoa sai, quando o dono a fecha, ou quando ninguém volta em " +
          MEMBER_TIMEOUT_MS / (60 * 60 * 1000) +
          " horas.",
        "A matilha guarda até " +
          MAX_PACK +
          " nomes: convite mútuo, enviado pelo perfil de um caçador ou pelo nick na taverna.",
        "Quem recebe vê o convite em Convites na taverna e aceita ou recusa; aceitar coloca os dois na matilha um do outro.",
        "Sair da matilha é mútuo: remover um nome apaga os dois lados.",
        "Chamar alguém da matilha abre uma mesa reservada para vocês dois, que só vocês veem.",
        "Uma fala nova na mesa em que você senta toca um aviso suave. O botão de som à esquerda do campo muta ou liga de novo; ligar toca o aviso para você ouvir.",
        "Passar o mouse no nick mostra o que a pessoa está fazendo: caçando, treinando, forjando, minerando, repousando ou parado.",
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
        "Três pacotes de WCoins, com a mesma quantia em qualquer nível.",
        ...STORE_PACKS.map(
          (pack) =>
            translate(pack.name, "pt") + ": " + formatBronze(pack.bronze) + " por " + formatReais(pack.priceCents) + ".",
        ),
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
        "Libera todos os interruptores de automação nas configurações: caçada, arena, treino, mina, forja, descanso, fúria, poção e mascote.",
        "Sem VIP, cada clique faz um ciclo só; com VIP, a partida repete o trabalho sozinha enquanto houver recurso.",
        "Cancele na Wizold Store: a cobrança para de renovar no Stripe e o VIP vale até o fim do período já pago; reative antes do vencimento para não perder o recurso.",
        "O pagamento abre no checkout do Stripe; a confirmação liga o VIP na hora.",
      ],
    },
    {
      id: "automation",
      title: "Automação",
      summary: "Interruptores VIP que repetem trabalho por você.",
      lines: [
        "Só quem tem VIP liga e desliga os interruptores nas configurações.",
        automationLineFor("pt"),
        "Nada liga sozinho: cada interruptor precisa estar ativado nas configurações. Trabalho pausado por falta de recurso retoma quando a chave daquele job estiver ligada. A fúria automática bebe na caçada sem precisar da caçada automática; na lua cheia ela não bebe, o céu já mantém o Modo Fúria.",
      ],
    },
    {
      id: "economy",
      title: "Economia",
      summary: "WCoins entram pela caça e saem pelo mercado.",
      lines: [
        "A partida começa com " +
          STARTING_BRONZE +
          " WCoins. Renomear o personagem custa " +
          formatBronze(RENAME_PRICE) +
          " a cada " +
          RENAME_COOLDOWN_DAYS +
          " dias; adoção do lobo " +
          formatBronze(PET_PRICE) +
          " e renomear o lobo " +
          formatBronze(PET_RENAME_PRICE) +
          ". Ração do lobo, arena e treino do mascote seguem a bolsa da faixa; a poção tem preço fixo.",
        setCostRangeLineFor("pt") +
          " Subir de nível dentro de uma faixa não enche o bolso: quem muda o tamanho da bolsa é abrir a faixa seguinte.",
        "O mercado vende pelo preço de tabela e recompra pela metade. Materiais só servem para venda; nenhum equipamento cai na caça.",
        "Poções de vida: pequena 50 WCoins, média 150, grande 300; fúria pequena 300, média 600, grande 900; ração do lobo, 1,5 caçada. A poção de fúria não se bebe na lua cheia: o céu já mantém o Modo Fúria. Fragmentos saem da mina e só alimentam a forja.",
        "Comprar e vender pedem confirmação e deixam escolher a quantidade.",
      ],
    },
  ];
}

function esTopics(): readonly WikiTopic[] {
  return [
    {
      id: "loop",
      title: "Cómo jugar",
      summary: "El ciclo de una noche cualquiera en Wizold.",
      lines: [
        "Empiezas sin nada equipado, con " +
          STARTING_BRONZE +
          " WCoins, diez pociones de vida y diez pociones de furia pequeñas. Elige un territorio y, en la lista, la presa: la barra se llena como \"Buscando criatura...\" y solo en el último latido la pelea se decide en el servidor; después el replay la cuenta golpe a golpe como \"Cazando...\". Parar en la aproximación cancela; parar en el replay aplica el resultado. Cambiar de criatura a mitad de la cacería no cambia la pelea en curso, solo la próxima vuelta.",
        "Para encadenar cacerías, entrenamiento, mina o forja sin tocar nada, activa la automatización VIP en la configuración. Cada área tiene diez criaturas de números fijos: tú te haces más fuerte, ellas no.",
        "El golpe crítico multiplica el daño por " + critical("es") + ", fijo; Instinto sube la probabilidad de crítico y Agilidad, la de esquiva.",
        "Entrena para acumular progreso de atributo; equipa lo que sirve, vende lo que sobra y vuelve a cazar.",
        "Las barras cuentan lo que cambia al momento, junto al valor: experiencia ganada en morado, WCoins y fragmentos en ámbar, vida perdida en rojo y el aliento gastado de la mina en azul. Cada aviso suma las ganancias del momento y se apaga solo enseguida.",
        "En la forja, mina fragmentos y golpea la pieza que está en la mochila, fuera del cuerpo, para subirla de +1 en adelante. En la perrera, adopta un lobo: suma atributos mientras esté en pie. La clasificación muestra dónde estás entre los cazadores.",
      ],
    },
    {
      id: "vitals",
      title: "Vitales",
      summary: "La vida sube con el nivel, al estilo Tibia: Lumni y Luna ganan a ritmos distintos.",
      lines: [
        "Vida máxima: " +
          VITALS.baseVital +
          " en el nivel 1, más " +
          healthPerLevelFor("male") +
          " por nivel para Lumni y " +
          healthPerLevelFor("female") +
          " por nivel para Luna. La Resistencia no engorda la barra; solo corta el daño que quita cada golpe del enemigo.",
        "Las pociones de vida curan un valor fijo y aleatorio: pequeña 150 a 200, media 200 a 300, grande 300 a 500. Recuperarse devuelve " +
          Math.round(REST_HEALTH_RATIO * 100) +
          "% del máximo cada " +
          REST_TICK_MS / 1000 +
          " segundos sin Voluntad, y sube hacia " +
          Math.round((REST_HEALTH_RATIO + REST_WILLPOWER_MAX_BONUS) * 100) +
          "% conforme la Voluntad crece, con la mitad de esa ganancia ya a " +
          REST_WILLPOWER_HALF +
          " de Voluntad: más Voluntad, menos tiempo hasta estar entero. La poción es el atajo pagado mientras el número fijo aún valga la pena.",
        "Si la vida llega a cero en la cacería, escapas con 1 de vida y registras una derrota.",
        "Con menos de 1 de vida, el suelo rechaza la cacería: Recupérate o usa una poción.",
        "El foso abre para cualquier cuerpo vivo: puedes bajar herido, y perder desangrado es el riesgo que elegiste correr.",
        "Una pelea que se arrastra hasta el techo de rondas termina en retirada: la cacería cuenta, pero nadie gana ni pierde.",
      ],
    },
    {
      id: "fury",
      title: "Furia",
      summary: "Modo Furia: poción pagada o luna llena, +10 a todos los atributos por un tiempo.",
      lines: [
        "No existe transformación: cazas, entrenas y duelas directo, tal como estás.",
        "El Modo Furia da +" +
          FURY_ATTRIBUTE_BONUS +
          " a cada atributo mientras dura; la ganancia aparece en la columna Furia de la ficha y levanta daño, esquiva y crítico a la vez. La barra de vida sigue subiendo solo con el nivel.",
        "La poción de furia no devuelve vida. La duración viene del tamaño del frasco: pequeña 2,5 minutos, media 5, grande 7,5. Beber de nuevo reinicia el reloj lleno.",
        "En luna llena el cielo mantiene el Modo Furia activo solo mientras dure la fase; la poción queda deshabilitada en ese período, porque el cielo ya hace ese trabajo.",
        "Es un atajo pagado hacia una ventana de fuerza: guarda la poción para una franja dura o un duelo que no quieres perder, fuera de la luna llena.",
      ],
    },
    {
      id: "moon",
      title: "Fases de la luna",
      summary: "La luna del juego es la luna de afuera, y cambia cuánto vale cada cacería.",
      lines: [
        ...moonLinesEs(),
        "La fase viene de una API pública de luna, con la fórmula astronómica como reserva cuando no hay red.",
        "El mes lunar tiene " + SYNODIC_MONTH_DAYS.toFixed(2) + " días, así que cada fase dura cerca de una semana.",
        "Cada fase paga en un rincón: la creciente rinde más en la caza y el entrenamiento, la nueva rinde más en la mina, y la menguante no da bono alguno.",
        "La luna llena no da bono por la columna Luna: enciende el Modo Furia (+" +
          FURY_ATTRIBUTE_BONUS +
          " a todos los atributos) mientras dura la fase, cerca de " +
          (SYNODIC_MONTH_DAYS / 8).toFixed(1) +
          " días.",
        "Durante la luna llena la poción de furia queda deshabilitada en la ficha; el reloj del Modo Furia en el menú lateral muestra cuánto falta para que la fase termine.",
        "La fase actual y su bono están al pie del menú lateral en escritorio y en la barra bajo la navegación en el móvil.",
      ],
    },
    {
      id: "progression",
      title: "Progresión",
      summary: "El nivel viene de la caza, el atributo viene del entrenamiento.",
      lines: [
        "Experiencia para el siguiente nivel: " +
          experienceForLevel(1) +
          " en el 1, " +
          experienceForLevel(10) +
          " en el 10 y " +
          experienceForLevel(100) +
          " en el 100. La curva sube más rápido de lo que paga la presa: cerca de 5 cacerías al comienzo y 585 en el techo.",
        "El techo es nivel 1000 para personaje y atributo. Subir de nivel no da poder gratis: abre territorio, conjunto y veta; la fuerza viene del entrenamiento y de lo que vistes. El nivel no restaura vida.",
        "El atributo solo sube en el entrenamiento, por la misma curva de la experiencia: barato al comienzo, carísimo cerca del techo; un punto pide pocas sesiones al inicio y cientos al final.",
        "Entrenar es gratis: cada ejercicio sube un atributo (+1 Fuerza, +1 Resistencia, +1 Agilidad, +1 Instinto o +1 Voluntad por punto). El progreso por sesión sigue el valor actual de ese atributo. El equipo suma por encima del techo entrenado.",
        "Cada sesión sortea de " +
          TRAINING_TICKS_MIN +
          " a " +
          TRAINING_TICKS_MAX +
          " pasos, y el sorteo es solo ritmo: el progreso que paga la sesión es el mismo, corta o larga.",
        "El patio muestra el atributo exacto, con la fracción del punto en marcha (20.33 en vez de 20), cuánto paga cada sesión en puntos y experiencia, y cuántas sesiones faltan para cerrar el punto: una cuenta que baja con cada sesión terminada.",
      ],
    },
    {
      id: "combat",
      title: "Combate",
      summary: "Resuelto en rondas, sin entrada del jugador durante la pelea.",
      lines: [
        "Cinco números y nada más: Fuerza, Agilidad, Resistencia, Instinto y Voluntad. Daño = Fuerza² ÷ (Fuerza + Resistencia del objetivo), con 10% de variación en la Fuerza.",
        "La Voluntad no entra en la cuenta de la pelea: estira la poción de furia y acelera la recuperación de vida fuera del combate. La furia es la que suma +" +
          FURY_ATTRIBUTE_BONUS +
          " a todos los atributos mientras dura, y a más Voluntad, más tiempo rinde cada frasco.",
        "Quien tiene más Agilidad empieza. Esquiva y crítico suben toda la vida sin techo: 35% y 45% en el horizonte.",
        "El crítico multiplica por " + critical("es") + ", fijo. La pelea se traba a las 24 rondas: retirada, sin ganador.",
      ],
    },
    {
      id: "equipment",
      title: "Equipo",
      summary: "Siete espacios, cinco conjuntos, un objeto por espacio.",
      lines: [
        "Espacios: gorro, collar, abrigo, pantalones, botas, guantes y anillo. " + setRequirementsLineEs(),
        "Toda pieza da atributos y nada más: guantes = Fuerza; anillo = Fuerza y Voluntad; abrigo = Resistencia; pantalones = Resistencia y Agilidad; gorro = Resistencia e Instinto; botas = Agilidad; collar = Instinto y Voluntad. La Voluntad del collar y del anillo estira la poción de furia y acelera la recuperación de vida.",
        "El abrigo tiene corte de linaje (Lumni/Luna). El mercado vende una pieza de cada; lo que ya está en la mochila o en el cuerpo no se compra de nuevo.",
        "Ningún equipo cae en la caza. La pieza forjada en la mochila carga su +X; desequipa para forjar, equipa de nuevo para usar.",
      ],
    },
    {
      id: "bestiary-rule",
      title: "Presas",
      summary: "Seis especies reparten los mil niveles en franjas de tamaños distintos.",
      lines: [
        ...bandLinesFor("es"),
        "Cada territorio tiene diez criaturas fijas, en escalones de diez niveles dentro de la franja.",
        "En la lista del área marcas la presa. La pelea ya empezada se queda con su bicho; la próxima vuelta usa lo que marcaste.",
        "Todo requisito de nivel del juego termina en 0 o 5.",
      ],
    },
    {
      id: "forge",
      title: "Forja y mina",
      summary: "El yunque no hace piezas nuevas: mejora la que está en la mochila, fuera del cuerpo.",
      lines: [
        "La mina rinde cada " +
          MINING_CYCLE_MIN_MS / 1000 +
          " a " +
          MINING_CYCLE_MAX_MS / 1000 +
          " segundos, porque cada golpe sortea de " +
          MINING_TICKS_MIN +
          " a " +
          MINING_TICKS_MAX +
          " pasadas: un clic vale un rendimiento, y con la minería automática activada repite hasta que mandes parar.",
        "El sorteo de las pasadas es solo ritmo: el puñado que entrega la veta, el progreso de minería y la minería descontada de la cuota son los mismos, golpe corto o largo.",
        "El pico tiene cuota: " +
          MINING_DAILY_MININGS +
          " minerías por día, contando la cosecha y no cada golpe. La cuota se reinicia a las 06:00 de São Paulo, la misma hora para todos.",
        ...oreLinesFor("es"),
        "La minería empieza en 1 y llega a " +
          MINING_MAX_LEVEL +
          ", el mismo techo del personaje: todo lo que evoluciona sube por la misma curva.",
        "El siguiente nivel de minería pide " +
          miningNeeded(1) +
          " de progreso en el nivel 1, " +
          miningNeeded(100) +
          " en el 100 y " +
          miningNeeded(1000) +
          " en el techo: la escalera de la mina es la misma de la experiencia.",
        "Lo que rinde cada veta es fijo y está en la lista de arriba: el nivel de minería abre vetas más hondas, nunca multiplica el puñado que sale de la roca.",
        "La forja solo acepta piezas desequipadas, en la mochila: sácala del cuerpo para forjar. Cada pieza come solo el fragmento de su conjunto.",
        "Precio del siguiente nivel: la misma curva de la experiencia del personaje, en fragmentos; subir la pieza a +N cuesta lo que el nivel N cuesta en experiencia, así que +5 cuesta " +
          enhancementCost(5) +
          " y +1000 cuesta " +
          enhancementCost(1000) +
          ".",
        "Cada nivel forjado suma " +
          (ENHANCEMENT_STEP * 100).toFixed(1) +
          "% del valor original de cada atributo de la pieza. En +1000 la pieza vale " +
          forgeMultiplierAt(1000, "es") +
          " veces lo que valía.",
        "El yunque acierta " +
          Math.round(FORGE_SUCCESS_RATIO * 100) +
          "% de los martillazos. Cuando falla, lo pagado se pierde y la pieza sigue como está: el riesgo es parte del precio.",
        "Cada martillazo también cobra WCoins: " +
          Math.round(FORGE_BRONZE_RATIO * 100) +
          "% de la bolsa de caza de tu nivel, más uno por nivel ya forjado de la pieza. El herrero no trabaja gratis.",
        "El techo es +" +
          MAX_ENHANCEMENT +
          ", y el nivel se queda con la pieza: forjada en la mochila, lleva la ganancia cuando vuelve al cuerpo.",
      ],
    },
    {
      id: "pet",
      title: "Compañero",
      summary: "Un lobo caza mejor acompañado, mientras esté en pie.",
      lines: [
        "La adopción exige NV " +
          PET_MIN_LEVEL +
          " y cuesta " +
          formatBronze(PET_PRICE) +
          "; soltarlo no paga. El lobo nace con +" +
          PET_BASE_BONUS +
          " de Fuerza, Agilidad e Instinto, +1 de cada por nivel hasta " +
          PET_MAX_LEVEL +
          ".",
        "Renombrar en la perrera cuesta " +
          formatBronze(PET_RENAME_PRICE) +
          ". Solo el patio enseña al lobo; cazar a tu lado no le sube el nivel.",
        "La energía es su único vital: empieza en " +
          PET_BASE_ENERGY +
          ", +" +
          PET_ENERGY_PER_LEVEL +
          " por nivel. La cacería cobra " +
          PET_ENERGY_PER_HUNT +
          " por entrar, " +
          PET_ENERGY_PER_BLOW +
          " por salto y " +
          PET_BITE_ENERGY +
          " cuando lo muerden.",
        "Acompañar entra en la pelea y presta atributos; el reposo devuelve " +
          Math.round(PET_REST_RATIO * 100) +
          "% de la energía cada " +
          REST_TICK_MS / 1000 +
          " s. La comida devuelve 25% del aliento al momento. El alimento automático y el reposo automático se ocupan en la configuración.",
      ],
    },
    {
      id: "ranking",
      title: "Clasificación",
      summary: "Dónde estás entre los cazadores que la luna conoce.",
      lines: [
        boardLineFor("es") +
          " Personaje filtra por linaje sin renumerar; la búsqueda mantiene la posición real del tablero.",
        "Hacer clic en un nombre abre la ficha de lectura; el tuyo lleva a la ficha completa. Entran cazadores de verdad y los NPC de la casa, estos con el sello NPC.",
      ],
    },
    {
      id: "arena",
      title: "Arena",
      summary: "El foso donde un hombre lobo desafía a otro.",
      lines: [
        "La arena solo marca peleas entre pares: " +
          Math.round(ARENA_BAND_RATIO * 100) +
          "% de tu nivel hacia cada lado, y nunca menos de " +
          ARENA_MIN_BAND +
          " niveles.",
        "Eliges el nombre por la búsqueda o pides un rival cualquiera de tu franja.",
        "Son " +
          ARENA_DAILY_ATTACKS +
          " ataques por día, y todos vuelven juntos a las 06:00, la misma hora en que reabre la mina.",
        "Quien enfrentaste descansa hasta las 06:00 antes de aceptar otro desafío tuyo.",
        "El foso tiene memoria: las últimas " +
          ARENA_HISTORY_SIZE +
          " peleas de tu nombre quedan registradas, las que marcaste y las que marcaron contra ti, con el resultado y los WCoins que cambiaron de manos.",
        "Los dos pelean con sus números actuales: atributos, equipo y compañero incluidos.",
        "El compañero baja también: activo y con aliento, muerde en el duelo como en la cacería, el tuyo y el del rival. Solo el tuyo gasta energía aquí; el del rival se cansa en los duelos de su propio dueño.",
        "El foso no paga experiencia: quien sube de nivel es quien caza. Lo que se gana aquí es la bolsa del otro.",
        "El ganador saca de la bolsa del vencido lo que pagan " +
          ARENA_SPOILS_MIN_HUNTS +
          " a " +
          ARENA_SPOILS_MAX_HUNTS +
          " cacerías de la franja, sorteado en cada duelo: la franja de nivel pone el piso y el techo.",
        "Nadie sale limpio del foso: esa tajada nunca pasa de " +
          Math.round(ARENA_SPOILS_MIN_SHARE * 100) +
          "% a " +
          Math.round(ARENA_SPOILS_MAX_SHARE * 100) +
          "% de lo que carga el perdedor, así que quien está sin nada paga poco.",
        "Perder cuesta lo mismo: sale de tu bolsa y va a la suya, y dejas el foso con 1 de vida.",
        "Un duelo que llega al techo de rondas termina empatado: nadie se lleva WCoins y nadie anota.",
        "Los duelos ganados tienen su propio tablero en la clasificación.",
      ],
    },
    {
      id: "tavern",
      title: "Taberna",
      summary: "Mesas de charla y los nombres que guardas.",
      lines: [
        "Una mesa abierta cabe " +
          MAX_ROOM_MEMBERS +
          " personas, con o sin contraseña, y mantienes una a la vez. La mesa abierta sin contraseña exige NV " +
          OPEN_ROOM_MIN_LEVEL +
          " o VIP; con contraseña, cualquier nivel.",
        "Cada mesa recibe un número #, que se puede copiar y buscar. La mesa reservada esconde el nombre y exige contraseña: desde afuera solo se ve el número.",
        "Cada nombre en la mesa recibe un color propio. Quien llega toma el primero libre; quien sale devuelve el color. La mesa reservada usa dos.",
        "Cada mesa guarda las últimas " +
          MAX_ROOM_MESSAGES +
          " líneas: lo que vino antes, la noche se lo lleva.",
        "Los enlaces de Wizold, Lumni, Twitch, YouTube, Instagram, Facebook, WhatsApp, TikTok y X pasan y abren en una pestaña nueva; cualquier otra dirección se rechaza.",
        "Un correo pasa entero en la línea, pero queda como texto: nadie lo clica por error.",
        "Los nombres de cazador y de mesa pasan moderación al momento. La línea entra a la mesa al instante; si la auditoría encuentra insulto, racismo o pedofilia, se vuelve Contenido inapropiado. El aviso en el dispositivo nunca muestra la línea, solo que llegó un mensaje.",
        "Cada línea cabe en " +
          MESSAGE_MAX_LENGTH +
          " caracteres, y la mesa abierta acepta una tuya cada " +
          MESSAGE_COOLDOWN_MS / 1000 +
          " segundos: una charla de muchos lleva compás.",
        "En la mesa reservada no hay espera entre líneas: son dos personas, y nadie necesita esperar turno.",
        "Cerrar la ventana de la charla no es dejar la mesa: el lugar sigue siendo tuyo y Sentarse devuelve la misma silla.",
        "La mesa sale del tablero cuando la última persona se va, cuando el dueño la cierra, o cuando nadie vuelve en " +
          MEMBER_TIMEOUT_MS / (60 * 60 * 1000) +
          " horas.",
        "La manada guarda hasta " +
          MAX_PACK +
          " nombres: invitación mutua, enviada desde el perfil de un cazador o por el nick en la taberna.",
        "Quien la recibe ve la invitación en Invitaciones en la taberna y acepta o rechaza; aceptar pone a los dos en la manada del otro.",
        "Dejar la manada es mutuo: quitar un nombre borra los dos lados.",
        "Llamar a alguien de la manada abre una mesa reservada para ustedes dos, que solo ustedes ven.",
        "Una línea nueva en la mesa donde te sientas toca un aviso suave. El botón de sonido a la izquierda del campo silencia o vuelve a activar; activar toca el aviso para que lo oigas.",
        "Pasar el mouse por el nick muestra qué hace la persona: cazando, entrenando, forjando, minando, reposando o quieto.",
        "Quien está en una mesa ahora responde primero a la búsqueda por nick; después responde el tablero de la clasificación.",
        "La mesa reservada nunca se barre: el mensaje espera hasta que el otro nombre aparezca.",
        "Borrar un nombre no cuesta nada y guardarlo de nuevo tampoco; la mesa reservada sigue hasta que alguien la cierre.",
        "Las mesas viven en el servidor: el tablero se actualiza en tiempo real por conexión continua, sin depender de refrescar la página.",
        "Con la Taberna activada en la configuración, los mensajes nuevos en tus mesas llegan por notificación del sistema, incluso con el juego cerrado.",
        "La contraseña de la mesa se guarda cifrada; aun así, inventa una solo para la mesa, nunca una contraseña que uses en otro lugar.",
      ],
    },
    {
      id: "bazaar",
      title: "Bazar",
      summary: "Piezas forjadas y fragmentos cambiando de dueño por dinero real.",
      lines: [
        "Solo entra lo que la forja tocó: piezas a +1 o más fuera del cuerpo, y fragmentos de la mina.",
        "Lo que el mercado vende igual no entra: la pieza sin forja queda fuera.",
        "Anunciar saca las piezas de la mochila y cobra cerca de " +
          BAZAAR_LISTING_HUNTS +
          " cacerías de tu nivel en WCoins; retirar el anuncio devuelve las piezas, nunca la tasa.",
        "Los compradores son gente de verdad: el anuncio queda en el tablero hasta que otro cazador pague por él, y el precio lo decides tú.",
        "Todo anuncio dura " +
          BAZAAR_LISTING_DAYS +
          " días: el tablero muestra cuántos faltan y la hora en que vence, y el vencido sale de la vitrina esperando que el dueño lo retire para recoger las piezas.",
        "La compra se paga en el checkout de Stripe, con dinero real; en cuanto el pago confirma, el objeto entra a la mochila y el vendedor recibe en la Alforja, ya sin la tasa de la casa.",
        "Lo que vino del bazar lleva la insignia Bazar en la mochila: una marca de origen, sin regla atada, y la pieza se vende en el mercado como cualquier otra.",
        "Nadie compra su propio anuncio.",
        "La casa se queda con " +
          Math.round(BAZAAR_FEE_RATIO * 100) +
          "% de cada venta; el resto cae en la Alforja, la cartera del bazar.",
        "La Alforja nace con " +
          formatReais(initialWallet().cents) +
          " y el retiro mínimo es " +
          formatReais(MIN_WITHDRAW_CENTS) +
          ", pedido con nombre completo, CPF y clave Pix.",
        "El retiro de esta versión es de demostración: el pedido queda registrado con los datos dados y nada se transfiere todavía.",
        "Comprar una pieza más forjada que la tuya sube la tuya a su nivel: la forja pertenece a la pieza.",
        "Cualquier duda con un pago, escribe a soporte: " + SITE_EMAIL + ".",
      ],
    },
    {
      id: "store",
      title: "Wizold Store",
      summary: "WCoins por dinero, para quien quiere saltarse la espera.",
      lines: [
        "Tres paquetes de WCoins, con la misma cantidad a cualquier nivel.",
        ...STORE_PACKS.map(
          (pack) =>
            translate(pack.name, "es") + ": " + formatBronze(pack.bronze) + " por " + formatReais(pack.priceCents) + ".",
        ),
        "La tienda no vende nivel, atributo ni equipo: la experiencia solo la da la caza, y el punto de atributo solo lo da el entrenamiento.",
        "El pago abre en el checkout de Stripe y los WCoins caen en la cuenta en cuanto confirma.",
        "El historial de compras vive en la propia tienda, cinco por página: importe, fecha y el estado de cada paquete, de esperando pago a aprobado, expirado o devuelto.",
        "Cualquier duda con un pago, escribe a soporte: " + SITE_EMAIL + ".",
      ],
    },
    {
      id: "vip",
      title: "VIP",
      summary: "Una suscripción mensual que desbloquea la automatización.",
      lines: [
        "Cuesta " +
          formatReais(VIP_PRICE_CENTS) +
          " por mes y mantiene el VIP por " +
          VIP_DAYS +
          " días por cada cobro confirmado.",
        "Desbloquea todos los interruptores de automatización en la configuración: cacería, arena, entrenamiento, mina, forja, descanso, furia, poción y compañero.",
        "Sin VIP, cada clic hace un solo ciclo; con VIP, la partida repite el trabajo sola mientras haya recursos.",
        "Cancela en la Wizold Store: el cobro deja de renovarse en Stripe y el VIP vale hasta el fin del período ya pagado; reactiva antes del vencimiento para no perder el recurso.",
        "El pago abre en el checkout de Stripe; la confirmación enciende el VIP al momento.",
      ],
    },
    {
      id: "automation",
      title: "Automatización",
      summary: "Interruptores VIP que repiten el trabajo por ti.",
      lines: [
        "Solo quien tiene VIP enciende y apaga los interruptores en la configuración.",
        automationLineFor("es"),
        "Nada se enciende solo: cada interruptor debe estar activado en la configuración. El trabajo pausado por falta de recursos retoma cuando la llave de ese trabajo esté encendida. La furia automática bebe en la cacería sin necesitar la cacería automática; en luna llena no bebe, el cielo ya mantiene el Modo Furia.",
      ],
    },
    {
      id: "economy",
      title: "Economía",
      summary: "Los WCoins entran por la caza y salen por el mercado.",
      lines: [
        "La partida empieza con " +
          STARTING_BRONZE +
          " WCoins. Renombrar el personaje cuesta " +
          formatBronze(RENAME_PRICE) +
          " cada " +
          RENAME_COOLDOWN_DAYS +
          " días; adoptar el lobo " +
          formatBronze(PET_PRICE) +
          " y renombrar el lobo " +
          formatBronze(PET_RENAME_PRICE) +
          ". La ración del lobo, la arena y el entrenamiento del compañero siguen la bolsa de la franja; la poción tiene precio fijo.",
        setCostRangeLineFor("es") +
          " Subir de nivel dentro de una franja no llena el bolsillo: lo que cambia el tamaño de la bolsa es abrir la franja siguiente.",
        "El mercado vende a precio de lista y recompra a la mitad. Los materiales solo sirven para vender; ningún equipo cae en la caza.",
        "Pociones de vida: pequeña 50 WCoins, media 150, grande 300; furia pequeña 300, media 600, grande 900; ración del lobo, 1,5 cacerías. La poción de furia no se bebe en luna llena: el cielo ya mantiene el Modo Furia. Los fragmentos salen de la mina y solo alimentan la forja.",
        "Comprar y vender piden confirmación y dejan elegir la cantidad.",
      ],
    },
  ];
}

export function wikiTopics(locale: Locale): readonly WikiTopic[] {
  if (locale === "pt") return ptTopics();
  if (locale === "es") return esTopics();
  return WIKI_TOPICS;
}
