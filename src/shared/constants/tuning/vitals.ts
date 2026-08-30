// Vitais: só a vida, e agora ela é fixa em 100 para todo mundo.
//   vida = baseVital + (Resistência - atributo base) x healthPerResistance + nível x healthPerLevel
// healthPerResistance e healthPerLevel começam em 0: nem o nível nem a Resistência
// dão vida. A Resistência agora só mitiga dano (Força²/(Força+RES)), então quem te
// defende são os itens e suas forjas, nunca uma barra de vida que cresce. Suba
// qualquer um dos dois para a vida voltar a crescer.
export const VITALS = {
  baseVital: 100,
  healthPerResistance: 0,
  healthPerLevel: 0,
};
