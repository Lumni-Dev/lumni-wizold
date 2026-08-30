// O baú: o teto de bronze que o jogador pode acumular. A barra do topo enche rumo
// a esse limite e o bronze não passa dele. A economia inteira foi calibrada para
// caber sob ele: o set mais caro (Lunar) sai por ~600k, e o resto (venda, treino,
// poção, forja, drops, arena, loja) escala com o huntPurse, que também é limitado.
// Edite bronzeLimit para apertar ou afrouxar (e reveja os preços se mexer muito).
export const VAULT = {
  bronzeLimit: 1_000_000,
};
