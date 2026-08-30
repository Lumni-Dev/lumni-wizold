// A poção de fúria virou um buff temporário: enquanto ativo, dá attributeBonus em
// TODOS os atributos. A duração vem pelo tamanho da poção (em minutos).
export const FURY = {
  attributeBonus: 10,
  durationMinutesBySize: {
    small: 2.5,
    medium: 5,
    large: 7.5,
  },
};
