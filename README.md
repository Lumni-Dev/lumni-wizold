# Lumni Wizold

Jogo de navegador de lobisomem. O jogador cria um personagem masculino ou feminino,
treina atributos, caça criaturas em territórios cada vez mais perigosos e negocia o
que trouxe de volta. Tudo roda no cliente e a partida fica salva no `localStorage`.

Stack: **Next.js 16 (App Router) + TypeScript + Tailwind CSS v4**, com arquitetura **MVC**.

> O código é escrito em inglês (identificadores, arquivos, pastas, rotas e comentários).
> Os textos de jogo continuam em português.

## Como rodar

```bash
npm install
npm run dev     # http://localhost:3000
```

Outros comandos:

```bash
npm run build     # build de produção
npm run lint      # eslint
npx tsc --noEmit  # checagem de tipos
```

## Páginas

O aside dá acesso a cinco páginas, e a wiki fica separada no rodapé do aside:

| Rota         | Página      | O que faz                                                         |
| ------------ | ----------- | ----------------------------------------------------------------- |
| `/`          | Criação     | Nome e escolha entre personagem masculino ou feminino             |
| `/character` | Personagem  | Ficha, vitais, atributos, distribuição de pontos, forma e combate |
| `/inventory` | Inventário  | Equipar, consumir e descartar itens                               |
| `/training`  | Treinamento | Exercícios que gastam energia e evoluem atributos                 |
| `/hunt`      | Caça        | Territórios, combate por rodadas e relatório da caçada            |
| `/market`    | Mercado     | Compra pelo preço de tabela e venda pela metade                   |
| `/tavern`    | Taverna     | Salas de conversa com ou sem senha, até 10 pessoas                |
| `/wiki`      | Wiki        | Regras, fórmulas, bestiário e catálogo completo de itens          |

## Arquitetura MVC

```
src/
  models/        (M) dominio puro
    entities/      character, item, creature, territory, game state
    data/          catalogos fixos: itens, criaturas, territorios, exercicios, wiki
    rules/         formulas: stats derivados, progressao, combate por rodadas
    repositories/  unico ponto que fala com o localStorage
    factories/     criacao de personagem e de partida nova
  controllers/   (C) casos de uso, funcoes puras sem React
    character, inventory, training, hunt, market, log
    game.context.tsx  adaptador React que liga controllers as views
  views/         (V) tudo que desenha
    components/    panel, bar, button, tag, item card, activity log
    layout/        sidebar, resource bar, frame, toast
    screens/       uma tela por pagina
    presenters/    formatacao de dominio para exibicao
  shared/        constantes e utilitarios sem dependencia de camada
  app/           roteamento: cada page.tsx so monta a tela correspondente
```

Regras de dependência:

- `models` não conhece nenhuma outra camada.
- `controllers` usa `models` e `shared`, nunca `views`.
- `views` chama os casos de uso pelo hook `useGame()` e não implementa regra de jogo.
- `app` apenas compõe metadata e a tela.

Cada caso de uso devolve `Result<T>` com `{ ok, message, state, data? }`.
Erro de regra de jogo não lança exceção: devolve `failure(...)` com a mensagem que a
interface mostra no aviso flutuante.

## Sistema de jogo

- **Início**: sem nada equipado, 100 de prata, 10 poções de vida e 10 de energia,
  com 100/100 de vida, energia e fúria.
- **Atributos**: Força, Agilidade, Resistência, Instinto e Vontade. Sobem por pontos
  de nível ou por progresso acumulado no treinamento.
- **Vitais**: começam em 100 e crescem com nível, Resistência e Vontade.
- **Experiência**: o próximo nível pede 100 vezes o nível atual (100, 200, 300...),
  até o teto do nível 1000. Cada atributo também para em 1000, contando o valor
  treinado (o equipamento soma por cima).
- **Fases da lua**: a lua do jogo é a lua real. O estado atual vem de uma API pública
  (`/api/moon`, que consulta o serviço no servidor e guarda a resposta por uma hora),
  com a fórmula astronômica como reserva quando não há rede. Lua Nova 0%,
  Crescente +5%, Cheia +10% e Minguante 0% de experiência, valendo para caça e treino.
  A fase e a iluminação do disco ficam no rodapé do aside.
- **Formas**: humano e lobisomem. Um único botão comanda o corpo: descansa enquanto
  há o que recuperar, transforma quando você está inteiro (40 de fúria) e recolhe a
  fera quando já está transformado.
- **Equipamento**: sete espaços (capacete, colar, armadura, calças, botas, garras e
  anel) e cinco conjuntos, um por faixa de caça: bronze (nível 1), prata (170),
  ouro (340), diamante (505) e lunar (670). O lunar é o teto, vendido caro e também
  sorteado de vampiros e unicórnios, e é o conjunto com que se enfrenta a última faixa.
- **Poções**: três linhas (vida, energia e fúria) em três tamanhos, recuperando 25%,
  50% ou 100% do medidor, então continuam úteis em qualquer nível.
- **Presas**: seis espécies dividem os mil níveis em faixas iguais. Coelhos 1 a 165,
  veados 170 a 335, ursos 340 a 500, humanos 505 a 665, vampiros 670 a 835 e
  unicórnios 840 a 1000, com cinco variantes por espécie.
- **Dificuldade**: cada faixa pesa mais que a anterior. Com o conjunto da própria
  faixa, a caçada custa cerca de 4% da vida no nível 1, 22% no 170, 30% no 340,
  39% no 505, 50% no 670 e 83% no 1000. Os números saíram de simulação, não de
  chute, e o teto de 20 rodadas nunca é ultrapassado.
- **Treinamento**: três degraus por atributo, liberados nos níveis 1, 340 e 670,
  calibrados para um ponto de atributo custar cerca de cinco sessões em qualquer
  altura da progressão.
- **Caça**: a caçada roda em ciclo. Você escolhe o território, uma barra enche a cada
  dois segundos, cada ciclo resolve um combate e custa 1 de energia, e a caça só para
  quando você mandar parar (ou quando a energia ou a vida acabam).
- **Combate**: rodadas com iniciativa, esquiva e crítico. Dano é ataque² dividido por
  (ataque + defesa), fórmula que se mantém justa do nível 1 ao 1000.
- **Economia**: prata vem das caçadas e da venda de despojos.

A wiki dentro do jogo (`/wiki`) documenta tudo isso com os números reais, lidos dos
mesmos catálogos que o jogo usa.

## Taverna

Salas de conversa com nome, senha opcional e limite de dez pessoas. As salas ficam
no `localStorage` e são sincronizadas entre abas e janelas do mesmo navegador por
`BroadcastChannel`, então duas janelas realmente conversam. Falar com jogadores em
outras máquinas exige um servidor: o único ponto a trocar é
`models/repositories/tavern.repository.ts`, que é a fronteira do armazenamento.
A senha da sala é uma combinação entre jogadores, guardada em texto puro, e não
serve como segurança.

## Visual

Paleta restrita a preto, cinza e branco, definida em `@theme` no `globals.css`.
Nenhuma cor é escrita solta nos componentes.

Os cards saem todos do mesmo componente (`views/components/card.tsx`), com a altura
como configuração: `height="fill"` nas páginas de caça, mercado, treinamento,
inventário, taverna e wiki, onde a descrição cresce e todos os cards da linha
terminam juntos, e `height="content"` na ficha do personagem, onde cada painel
mantém a própria altura.

## Arte

A arte é adicionada aos poucos, um arquivo por vez, sem mexer em código. Para um
item aparecer, basta salvar a imagem em `public/assets` com o nome igual ao id do
item:

```
public/assets/
  inventory/
    equipment/
      bronze_set/    bronze-helmet, bronze-armor, bronze-claw...
      silver_set/
      gold_set/      gold-armor.png, gold-helmet.png, gold-pants.png, gold-boots.png
      diamond_set/
      lunar_set/
    potions/         health-potion-small, energy-potion-media...
    materials/       bear-claw, soft-fur...
  hunt/
    creatures/       rabbit, deer, bear, human, vampire, unicorn
```

O leitor é tolerante com o nome do arquivo. Ele aceita maiúsculas, espaço e
sublinhado, entende o nome do conjunto escrito de outro jeito e conhece os apelidos
mais comuns de cada espaço. Todos estes viram o item `gold-necklace`:

```
gold-necklace.png   gold_necklace.png   golden_amulet.png   Golden Amulet.png
gold_set/amulet.png   gold_set/pendant.png
```

Os apelidos reconhecidos: `golden` para ouro e `moon` para lunar; `amulet` e
`pendant` para colar; `helm` e `head` para capacete; `chest`, `chestplate`,
`cuirass` e `armour` para armadura; `legs` e `greaves` para calças; `claws`,
`gauntlet` e `gauntlets` para garras.

Qualquer extensão de imagem serve (png, webp, jpg, gif, svg, avif) e as subpastas
são livres: o leitor percorre tudo abaixo de `inventory` e de `hunt`.

O jogo lê essas pastas no servidor e monta um manifesto, conferindo cada nome contra
o catálogo real. Arquivo que não corresponde a nenhum item é ignorado, e item sem
desenho continua mostrando as iniciais dentro de uma moldura com a cor da raridade.
Nenhuma tela quebra e nenhuma requisição é feita à toa.

Para descobrir o id de um item, a wiki lista o catálogo inteiro por conjunto e por
categoria: o id é exatamente o nome de arquivo esperado.

Prefira exportar com fundo transparente. Imagem com fundo branco vira um quadrado
branco no tema escuro.

## Taverna

Salas de conversa com nome, senha opcional e limite de dez pessoas. As salas ficam
no `localStorage` e são sincronizadas entre abas e janelas do mesmo navegador por
`BroadcastChannel`, então duas janelas realmente conversam. Falar com jogadores em
outras máquinas exige um servidor: o único ponto a trocar é
`models/repositories/tavern.repository.ts`, que é a fronteira do armazenamento.
A senha da sala é uma combinação entre jogadores, guardada em texto puro, e não
serve como segurança.

## Visual

Paleta restrita a preto, cinza e branco, definida em `@theme` no `globals.css`.
Nenhuma cor é escrita solta nos componentes.

Os cards saem todos do mesmo componente (`views/components/card.tsx`), com a altura
como configuração: `height="fill"` nas páginas de caça, mercado, treinamento,
inventário, taverna e wiki, onde a descrição cresce e todos os cards da linha
terminam juntos, e `height="content"` na ficha do personagem, onde cada painel
mantém a própria altura.

## Arte

A arte é adicionada aos poucos, um arquivo por vez. Para um item aparecer, basta
colocar a imagem em `public/assets`, com o nome igual ao id do item:

```
public/assets/
  inventory/equipment/   <conjunto>-<espaço>   ex.: gold-armor.png
  inventory/potions/     <linha>-potion-<tamanho>
  inventory/materials/   <id do material>
  hunt/creatures/        <espécie>             ex.: rabbit.png
```

Qualquer extensão de imagem serve (png, webp, jpg, gif, svg, avif). O jogo lê a
pasta no servidor e monta um manifesto, então nenhuma tela pede um arquivo que não
existe: o que ainda não tem desenho continua mostrando as iniciais dentro de uma
moldura com a cor da raridade, e nada quebra.

Para descobrir o id de um item, a wiki lista o catálogo inteiro por conjunto e por
categoria, e o id é o nome do arquivo esperado.

Prefira exportar com fundo transparente. Imagem com fundo branco vira um quadrado
branco no tema escuro.

## Taverna

Salas de conversa com nome, senha opcional e limite de dez pessoas. As salas ficam
no `localStorage` e são sincronizadas entre abas e janelas do mesmo navegador por
`BroadcastChannel`, então duas janelas realmente conversam. Falar com jogadores em
outras máquinas exige um servidor: o único ponto a trocar é
`models/repositories/tavern.repository.ts`, que é a fronteira do armazenamento.
A senha da sala é uma combinação entre jogadores, guardada em texto puro, e não
serve como segurança.

## Visual

Paleta restrita a preto, cinza e branco, definida em `@theme` no `globals.css`.
Nenhuma cor é escrita solta nos componentes.

Os cards saem todos do mesmo componente (`views/components/card.tsx`), com a altura
como configuração: `height="fill"` nas páginas de caça, mercado, treinamento,
inventário, taverna e wiki, onde a descrição cresce e todos os cards da linha
terminam juntos, e `height="content"` na ficha do personagem, onde cada painel
mantém a própria altura.

## Arte

Os 62 ícones do jogo são gerados por `npm run assets`, que roda
`scripts/generate-assets.mjs` e escreve SVG em `public/assets`, separado por página:

```
public/assets/
  inventory/equipment/   35 peças: <conjunto>-<espaço>.svg
  inventory/potions/      9 poções: <linha>-potion-<tamanho>.svg
  inventory/materials/   12 materiais
  hunt/creatures/         6 espécies
```

Os arquivos têm o mesmo nome do id do item, então um item novo só precisa do
sprite para aparecer na interface. Se o arquivo faltar, o ícone cai de volta nas
iniciais dentro de uma moldura e nada quebra.

O estilo é o de ícone de jogo 2D: a peça sobre uma moldura pintada, luz radial
atrás, brilho diagonal na moldura, contorno escuro e sombra embaixo. O fundo da
moldura é tingido pelo conjunto (bronze, prata, ouro, diamante, lunar) ou pelo
líquido da poção, então a raridade se lê de longe. O equipamento é uma matriz de
sete formas por cinco paletas, igual aos dados do jogo: peça nenhuma destoa do
próprio conjunto.

A arte é original. O estilo é inspirado em ícones de RPG 2D, sem cópia de nenhum
material existente. O personagem continua sem imagem, com as iniciais na ficha.
#   l u m n i - w i z o l d  
 