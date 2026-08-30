// Vitais: só a vida agora (a fúria deixou de ser um vital).
//   vida = baseVital + (Resistência - atributo base) x healthPerResistance + nível x healthPerLevel
// healthPerLevel começa em 0: o nível não dá vida direta, só o atributo. Suba-o
// para a vida crescer por nível também.
export const VITALS = {
  baseVital: 100,
  healthPerResistance: 14,
  healthPerLevel: 0,
};
