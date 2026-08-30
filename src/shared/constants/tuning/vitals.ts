// Vitais: como vida e fúria são formados.
//   vida  = baseVital + (Resistência - atributo base) x healthPerResistance + nível x healthPerLevel
//   fúria = baseVital + (Vontade   - atributo base) x ragePerWillpower   + nível x ragePerLevel
// healthPerLevel e ragePerLevel começam em 0: hoje o nível não dá vital direto,
// só o atributo. Suba um deles para a vida ou a fúria crescerem por nível também.
export const VITALS = {
  baseVital: 100,
  healthPerResistance: 14,
  healthPerLevel: 0,
  ragePerWillpower: 2,
  ragePerLevel: 0,
};
