// A calibração do combate, num lugar só. Com a vida fixa em 100, quem te defende é
// a Resistência dos itens (e da forja) mitigando cada golpe, nunca uma barra de vida
// que cresce. Estes números dizem como cada criatura é construída contra o caçador
// de referência do nível dela: alguém com o treino daquele nível, vestindo o set da
// faixa, forjado num ramp que abre em 0 quando o set libera e chega ao teto (+1000)
// no fim das duas áreas daquele set. Editar aqui muda a dificuldade do jogo inteiro;
// rode a bancada (node scripts/balance.mjs) depois de mexer.
export const BALANCE = {
  // Treino que o caçador de referência tem por nível (o resto vem do equipamento).
  trainedPerLevel: 0.55,

  // O bronze que uma carcaça paga, por NÍVEL, não pelo poder do equipamento (que é
  // enorme para o combate e estouraria o baú): huntPurse = bronzeBase + nível x
  // bronzePerLevel. Assim a economia inteira (venda, treino, poção, forja, drops,
  // arena, loja) fica limitada e cabe no baú de 1M. No teto (NV 1000) rende ~810: renda
  // enxuta de propósito, o monstro paga pouco e os preços sobem quase até o teto do baú.
  bronzeBase: 10,
  bronzePerLevel: 0.8,

  // Dano que uma criatura crava por golpe no caçador de 100 de vida. A Força da
  // criatura sai de sqrt(creatureHit x Resistência do caçador), então o dano por
  // golpe fica ~constante em toda faixa em vez de te matar de um golpe quando os
  // números crescem. Suba para o jogo ficar mais letal.
  creatureHit: 3.0,

  // Resistência da criatura como fração da Força do caçador: o quanto ela absorve,
  // que decide quantos golpes o caçador precisa para derrubá-la.
  creatureResRatio: 1.0,

  // Golpes que o caçador de referência (forjado para o nível) precisa para matar a
  // criatura. Mais golpes = luta mais longa = mais dano recebido = mais difícil.
  creatureKillRounds: 10,

  // Da metade da trajetória (esta área em diante) a referência conta com o lobo: a
  // criatura ganha este tanto de corpo extra, então um caçador sem mascote fica sem
  // golpes antes de derrubá-la. É o que torna o mascote necessário no fim do jogo.
  petFromArea: 5,
  petKillBoost: 0.33,
};
