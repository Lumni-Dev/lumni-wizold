import { BASE } from "./base";
import { ES } from "./es";
import { PT } from "./pt";
import type { Locale } from "./locale";

interface PatternRule {
  pattern: RegExp;
  en?: string;
  es: string;
  pt?: string;
}

// Legacy interpolated strings cannot match by exact key, so the common shapes
// are translated by pattern, keeping the numbers where they are. These
// patterns read the legacy Portuguese sources; strings born in English need no
// rule for the English side and translate to pt/es by exact key.
const RULES: readonly PatternRule[] = [
  {
    pattern: /^Experiência \(NV\. (.+)\)$/,
    en: "Experience (LV. $1)",
    es: "Experiencia (NV. $1)",
  },
  {
    pattern: /^Mascote - Experiência \(NV\. (.+)\)$/,
    en: "Companion - Experience (LV. $1)",
    es: "Compañero - Experiencia (NV. $1)",
  },
  { pattern: /^Parar \((\d+)\)$/, en: "Stop ($1)", es: "Parar ($1)" },
  { pattern: /^Parar em (\d+)s$/, en: "Stop in $1s", es: "Parar en $1s" },
  { pattern: /^(\d+) \/ (\d+) pessoa(s?)$/, en: "$1 / $2 people", es: "$1 / $2 personas" },
  { pattern: /^Forjar custa (.+)$/, en: "Forging costs $1", es: "Forjar cuesta $1" },
  {
    pattern: /^Reseta às (\d{2}:\d{2}), faltam (.+)$/,
    en: "Resets at $1, $2 left",
    es: "Reinicia a las $1, faltan $2",
  },
  { pattern: /^Continuar com (.+)$/, en: "Continue as $1", es: "Continuar con $1" },
  { pattern: /^(\d[\d.,]*) itens$/, en: "$1 items", es: "$1 objetos" },
  {
    pattern: /^Mesas de conversa para até (\d+) pessoas, com ou sem senha\. A mesa fecha sozinha quando a última pessoa sai\.$/,
    en: "Chat tables for up to $1 people, with or without a password. A table closes itself when the last person leaves.",
    es: "Mesas de charla para hasta $1 personas, con o sin contraseña. La mesa se cierra sola cuando sale la última persona.",
  },
  {
    pattern: /^Recursos esgotados, voltam em (.+)$/,
    en: "Resources spent, back in $1",
    es: "Recursos agotados, vuelven en $1",
  },
  {
    pattern: /^\+(.+) a (.+) fragmentos por mineração$/,
    en: "+$1 to $2 fragments per mining",
    es: "+$1 a $2 fragmentos por minado",
  },
  {
    pattern: /^Treino gratuito para sempre: um exercício por atributo, cada barra cheia vira \+1 permanente\. Cada sessão sorteia de (\d+) a (\d+) passos, então uma sai rápida e a seguinte cobra paciência\. Não dá para parar no meio de uma sessão, mas entre uma e outra sobram três segundos para você mandar parar\.$/,
    en: "Training is free forever: one exercise per attribute, every full bar becomes a permanent +1. Each session draws $1 to $2 steps, so one goes fast and the next asks for patience. You cannot stop mid-session, but between one and the next there are three seconds to call it off.",
    es: "Entrenamiento gratis para siempre: un ejercicio por atributo, cada barra llena se vuelve +1 permanente. Cada sesión sortea de $1 a $2 pasos, así que una sale rápida y la siguiente pide paciencia. No se puede parar a mitad de una sesión, pero entre una y otra quedan tres segundos para mandarla parar.",
  },
  {
    pattern: /^O treino repete sozinho até você mandar parar, e o teto de cada atributo é (.+)\.$/,
    en: "Training repeats on its own until you say stop, and each attribute caps at $1.",
    es: "El entrenamiento se repite solo hasta que mandes parar, y el techo de cada atributo es $1.",
  },
  {
    pattern: /^Cada clique treina uma sessão, e o teto de cada atributo é (.+)\.$/,
    en: "Each click trains one session, and each attribute caps at $1.",
    es: "Cada clic entrena una sesión, y el techo de cada atributo es $1.",
  },
  { pattern: /^Ouvir sobre (.+)$/, en: "Hear about $1", es: "Escuchar sobre $1" },
  { pattern: /^Aceitar (.+)$/, en: "Accept $1", es: "Aceptar $1" },
  { pattern: /^Recusar (.+)$/, en: "Decline $1", es: "Rechazar $1" },
  { pattern: /^Falar com (.+)$/, en: "Talk to $1", es: "Hablar con $1" },
  { pattern: /^Sair da matilha com (.+)$/, en: "Leave the pack with $1", es: "Salir de la manada con $1" },
  { pattern: /^Quantidade de (.+)$/, en: "Quantity of $1", es: "Cantidad de $1" },
  { pattern: /^Você tem (.+)$/, en: "You have $1", es: "Tienes $1" },
  { pattern: /^Você consegue pagar por (.+)$/, en: "You can pay for $1", es: "Puedes pagar $1" },
  { pattern: /^O mínimo é (.+)$/, en: "The minimum is $1", es: "El mínimo es $1" },
  { pattern: /^Disponíveis: (.+)$/, en: "Available: $1", es: "Disponibles: $1" },
  { pattern: /^Ativo até (.+)$/, en: "Active until $1", es: "Activo hasta $1" },
  { pattern: /^Melhor em (.+)$/, en: "Best at $1", es: "Mejor en $1" },
  { pattern: /^Senha da mesa (.+)$/, en: "Password of table $1", es: "Contraseña de la mesa $1" },
  {
    pattern: /^A arena só marca luta entre NV\. (.+) e NV\. (.+): (.+) caçadores nessa faixa\. Não se ganha experiência aqui: quem vence tira da bolsa do perdedor de (.+) a (.+) WCoins, sorteadas, e nunca mais que um quarto do que ele carrega\. Quem perde paga pela mesma régua\. Quem já duelou com você descansa até as 06:00 antes de subir de novo\.$/,
    en: "The arena only books fights between LV. $1 and LV. $2: $3 hunters in that band. No experience is earned here: the winner draws $4 to $5 WCoins from the loser's purse, never more than a quarter of what they carry. The loser pays by the same rule. Whoever already dueled you rests until 06:00 before climbing again.",
    es: "La arena solo marca peleas entre NV. $1 y NV. $2: $3 cazadores en esa franja. Aquí no se gana experiencia: quien vence saca de la bolsa del perdedor de $4 a $5 WCoins, sorteadas, y nunca más de un cuarto de lo que lleva. Quien pierde paga con la misma regla. Quien ya se batió contigo descansa hasta las 06:00 antes de volver a subir.",
  },
  {
    pattern: /^Você contra (.+)\. Em jogo, um pedaço da bolsa de quem cair: de (.+) a (.+)\.$/,
    en: "You against $1. At stake, a piece of the fallen one's purse: $2 to $3.",
    es: "Tú contra $1. En juego, un pedazo de la bolsa de quien caiga: de $2 a $3.",
  },
  {
    pattern: /^Fora da sua faixa: a arena só marca luta entre NV\. (.+) e NV\. (.+)\.$/,
    en: "Out of your band: the arena only books fights between LV. $1 and LV. $2.",
    es: "Fuera de tu franja: la arena solo marca peleas entre NV. $1 y NV. $2.",
  },
  {
    pattern: /^Vocês já duelaram hoje: o próximo desafio a ele reabre às 06:00\. Faltam (.+)\.$/,
    en: "You two already dueled today: the next challenge to them reopens at 06:00. $1 left.",
    es: "Ustedes ya se batieron hoy: el próximo desafío se reabre a las 06:00. Faltan $1.",
  },
  { pattern: /^Vitória sobre (.+)$/, en: "Victory over $1", es: "Victoria sobre $1" },
  { pattern: /^Derrota para (.+)$/, en: "Defeat to $1", es: "Derrota ante $1" },
  { pattern: /^Empate com (.+)$/, en: "Draw with $1", es: "Empate con $1" },
  { pattern: /^Ataque seu - (.+)$/, en: "Your attack - $1", es: "Ataque tuyo - $1" },
  { pattern: /^Ataque recebido - (.+)$/, en: "Attack received - $1", es: "Ataque recibido - $1" },
  { pattern: /^Volta em (.+)$/, en: "Back in $1", es: "Vuelve en $1" },
  { pattern: /^(\d[\d.,]*) de (\d+) ataques$/, en: "$1 of $2 attacks", es: "$1 de $2 ataques" },
  {
    pattern: /^(.+) ficou no chão, e a bolsa é sua\.$/,
    en: "$1 stayed on the ground, and the purse is yours.",
    es: "$1 quedó en el suelo, y la bolsa es tuya.",
  },
  {
    pattern: /^(.+) levou a melhor\. Você sai por baixo, mas sai\.$/,
    en: "$1 got the better of it. You leave beaten, but you leave.",
    es: "$1 se llevó la mejor parte. Sales por abajo, pero sales.",
  },
  { pattern: /^\+(\d+)% de experiência na caça$/, en: "+$1% hunt experience", es: "+$1% de experiencia de caza" },
  { pattern: /^\+(\d+)% no treino$/, en: "+$1% in training", es: "+$1% en el entrenamiento" },
  { pattern: /^\+(\d+)% na mineração$/, en: "+$1% in mining", es: "+$1% en la minería" },
  {
    pattern: /^Modo Fúria: \+(\d+) em todos os atributos$/,
    en: "Fury Mode: +$1 to all attributes",
    es: "Modo Furia: +$1 a todos los atributos",
  },
  { pattern: /^Fechar aviso de (.+)$/, en: "Close notice from $1", es: "Cerrar aviso de $1" },
  { pattern: /^Fechar chat de (.+)$/, en: "Close chat of $1", es: "Cerrar chat de $1" },
  { pattern: /^Fechar (.+)$/, en: "Close $1", es: "Cerrar $1" },
  { pattern: /^Mensagem na mesa (.+)$/, en: "Message at table $1", es: "Mensaje en la mesa $1" },
  { pattern: /^Sua mesa: (.+)$/, en: "Your table: $1", es: "Tu mesa: $1" },
  { pattern: /^A mesa está cheia: (.+)$/, en: "The table is full: $1", es: "La mesa está llena: $1" },
  {
    pattern: /^Mesa sem senha é só a partir do NV (\d+), ou com VIP\. Ponha uma senha para abrir em qualquer nível\.$/,
    en: "A table without a password takes LV $1 and up, or VIP. Set a password to open at any level.",
    es: "Una mesa sin contraseña es solo desde NV $1, o con VIP. Pon una contraseña para abrir a cualquier nivel.",
  },
  {
    pattern: /^Sem senha, NV (\d+)\+ ou VIP\. Com senha, qualquer nível\. Mesa reservada sempre com senha\.$/,
    en: "Without a password, LV $1+ or VIP. With a password, any level. Reserved tables always take a password.",
    es: "Sin contraseña, NV $1+ o VIP. Con contraseña, cualquier nivel. La mesa reservada siempre con contraseña.",
  },
  { pattern: /^Convidar (.+)$/, en: "Invite $1", es: "Invitar a $1" },
  { pattern: /^Copiar o (.+)$/, en: "Copy the $1", es: "Copiar el $1" },
  { pattern: /^Copiar (.+)$/, en: "Copy $1", es: "Copiar $1" },
  { pattern: /^Nenhum item de (.+)$/, en: "No items of $1", es: "Ningún objeto de $1" },
  { pattern: /^Requer NV\. (.+)$/, en: "Requires LV. $1", es: "Requiere NV. $1" },
  { pattern: /^Tirar \((.+)\)$/, en: "Take off ($1)", es: "Quitar ($1)" },
  { pattern: /^Pagar (.+)$/, en: "Pay $1", es: "Pagar $1" },
  { pattern: /^Vender por (.+)$/, en: "Sell for $1", es: "Vender por $1" },
  { pattern: /^Comprar por (.+)$/, en: "Buy for $1", es: "Comprar por $1" },
  { pattern: /^Adotar por (.+)$/, en: "Adopt for $1", es: "Adoptar por $1" },
  { pattern: /^Alterar por (.+)$/, en: "Change for $1", es: "Cambiar por $1" },
  { pattern: /^A troca custa (.+)$/, en: "The change costs $1", es: "El cambio cuesta $1" },
  { pattern: /^Exige NV (.+)$/, en: "Requires LV $1", es: "Exige NV $1" },
  { pattern: /^(\d[\d.,]*) no inventário$/, en: "$1 in the bag", es: "$1 en la mochila" },
  { pattern: /^Apenas (.+)$/, en: "Only $1", es: "Solo $1" },
  {
    pattern: /^Os sete espaços, do elmo ao anel, somando \+(.+)$/,
    en: "The seven slots, helm to ring, adding +$1",
    es: "Los siete espacios, del yelmo al anillo, sumando +$1",
  },
  {
    pattern: /^Onde você aparece em cada quadro, entre (.+)$/,
    en: "Where you stand on every board, among $1",
    es: "Dónde apareces en cada tablero, entre $1",
  },
  {
    pattern: /^Onde aparece em cada quadro, entre (.+)$/,
    en: "Where they stand on every board, among $1",
    es: "Dónde aparece en cada tablero, entre $1",
  },
  { pattern: /^Recupera entre (.+)$/, en: "Restores between $1", es: "Recupera entre $1" },
  {
    pattern: /^Recupera parte da vida a cada (.+)$/,
    en: "Restores part of the health every $1",
    es: "Recupera parte de la vida cada $1",
  },
  {
    pattern: /^O corpo se recompõe a cada (.+)$/,
    en: "The body mends itself every $1",
    es: "El cuerpo se recompone cada $1",
  },
  {
    pattern: /^(.+) está inteiro, esperando ser chamado\.$/,
    en: "$1 is whole, waiting to be called.",
    es: "$1 está entero, esperando ser llamado.",
  },
  {
    pattern: /^(.+) foi fiel, mas agora estará livre na floresta\. Nada é devolvido, e o apelido fica livre para um próximo lobo, adotado no canil pelo preço cheio\.$/,
    en: "$1 was loyal, but will now be free in the forest. Nothing is returned, and the name is freed for a next wolf, adopted at the kennel for the full price.",
    es: "$1 fue fiel, pero ahora estará libre en el bosque. Nada se devuelve, y el nombre queda libre para un próximo lobo, adoptado en la perrera por el precio completo.",
  },
  {
    pattern: /^O alimento devolve um quarto do fôlego na hora\. Sem ele, o repouso faz o mesmo de graça, um passo a cada (.+)\.$/,
    en: "Food returns a quarter of the breath at once. Without it, rest does the same for free, one step every $1.",
    es: "El alimento devuelve un cuarto del aliento al instante. Sin él, el reposo hace lo mismo gratis, un paso cada $1.",
  },
  {
    pattern: /^O apelido é dado na porta; trocar depois custa (.+) no canil\. A adoção exige NV (\d+) e custa (.+)\.$/,
    en: "The name is given at the door; changing it later costs $1 at the kennel. Adoption asks for LV $2 and costs $3.",
    es: "El nombre se da en la puerta; cambiarlo después cuesta $1 en la perrera. La adopción exige NV $2 y cuesta $3.",
  },
  {
    pattern: /^Adotar é compromisso: soltar depois não devolve WCoin nenhuma, e trocar o apelido custa (.+) no canil\.$/,
    en: "Adopting is a commitment: releasing later returns no WCoin, and changing the name costs $1 at the kennel.",
    es: "Adoptar es un compromiso: soltar después no devuelve ninguna WCoin, y cambiar el nombre cuesta $1 en la perrera.",
  },
  {
    pattern: /^(.+) caça com você\.$/,
    en: "$1 hunts with you.",
    es: "$1 caza contigo.",
  },
  {
    pattern: /^(.+) recupera (.+) de energia a cada (.+) segundos em repouso\.$/,
    en: "$1 recovers $2 energy every $3 seconds at rest.",
    es: "$1 recupera $2 de energía cada $3 segundos en reposo.",
  },
  {
    pattern: /^A bolsa de couro onde cai o dinheiro das suas vendas, já sem a parte da casa\. O saque sai a partir de (.+)\.$/,
    en: "The leather purse where your sale money lands, already net of the house's cut. Withdrawals start at $1.",
    es: "La bolsa de cuero donde cae el dinero de tus ventas, ya sin la parte de la casa. El retiro sale a partir de $1.",
  },
  {
    pattern: /^x(\d[\d.,]*) - sugestão (.+)$/,
    en: "x$1 - suggested $2",
    es: "x$1 - sugerido $2",
  },
  {
    pattern: /^As (\d+) mais recentes do seu nome no fosso: as que você marcou e as que marcaram contra você\.$/,
    en: "The $1 most recent under your name in the pit: the ones you booked and the ones booked against you.",
    es: "Las $1 más recientes de tu nombre en el foso: las que marcaste y las que marcaron contra ti.",
  },
  { pattern: /^Inserir (.+)$/, en: "Insert $1", es: "Insertar $1" },
  { pattern: /^(.+) de duração$/, en: "$1 long", es: "$1 de duración" },
  {
    pattern: /^O apelido é dado na porta; trocar depois custa (.+)$/,
    en: "The name is given at the door; changing it later costs $1",
    es: "El nombre se da en la puerta; cambiarlo después cuesta $1",
  },
  {
    pattern: /^As WCoins saem na hora e o novo nome fica travado por (.+)$/,
    en: "The WCoins leave on the spot and the new name is locked for $1",
    es: "Las WCoins salen al instante y el nuevo nombre queda bloqueado por $1",
  },
  { pattern: /^Assinatura ativa, renova em (.+)$/, en: "Active subscription, renews on $1", es: "Suscripción activa, se renueva el $1" },
  { pattern: /^VIP ativo até (.+)$/, en: "VIP active until $1", es: "VIP activo hasta $1" },
  { pattern: /^O nome pode mudar uma vez a cada (.+)$/, en: "The name can change once every $1", es: "El nombre puede cambiar una vez cada $1" },
  { pattern: /^O próximo ajuste só em (.+)$/, en: "The next change only on $1", es: "El próximo ajuste solo el $1" },
  { pattern: /^Pode trocar de novo em (.+)$/, en: "Can change again on $1", es: "Puede cambiar de nuevo el $1" },
  { pattern: /^Faltam (.+)$/, en: "$1 left", es: "Faltan $1" },
  { pattern: /^Expira em (.+)$/, en: "Expires in $1", es: "Expira en $1" },
  {
    pattern: /^O jogo é para maiores de (\d+) anos: tem sangue na caça, duelo entre jogadores, mesa de conversa aberta e compra com dinheiro de verdade\.$/,
    en: "The game is for ages $1 and up: there is blood on the hunt, player duels, open chat tables and purchases with real money.",
    es: "El juego es para mayores de $1 años: hay sangre en la caza, duelos entre jugadores, mesas de charla abiertas y compras con dinero real.",
  },
  { pattern: /^A caçada é para maiores de (.+)$/, en: "The hunt is for ages $1 and up", es: "La cacería es para mayores de $1" },
  { pattern: /^(\d[\d.,]*) caçadores com esse nome\.$/, en: "$1 hunters with that name.", es: "$1 cazadores con ese nombre." },
  {
    pattern: /^(\d+) criaturas em seis espécies, ordenadas por nível\. Números fixos por variant\.$/,
    en: "$1 creatures in six species, ordered by level. Fixed numbers per variant.",
    es: "$1 criaturas en seis especies, ordenadas por nivel. Números fijos por variante.",
  },
  {
    pattern: /^(\d+) peças em cinco conjuntos, do bronze ao lunar\. Cada linha traz a peça, o bônus e o preço no mercado\.$/,
    en: "$1 pieces in five sets, bronze to lunar. Each row carries the piece, the bonus and the market price.",
    es: "$1 piezas en cinco conjuntos, del bronce al lunar. Cada línea trae la pieza, el bono y el precio en el mercado.",
  },
  {
    pattern: /^(\d+) lascas da mina, uma por conjunto\. Só alimentam a forja; não caem na caça nem entram no mercado\.$/,
    en: "$1 shards from the mine, one per set. They only feed the forge; they do not drop on the hunt nor enter the market.",
    es: "$1 esquirlas de la mina, una por conjunto. Solo alimentan la forja; no caen en la caza ni entran al mercado.",
  },
  {
    pattern: /^(\d+) poções de vida e fúria vendidas no mercado\.$/,
    en: "$1 health and fury potions sold at the market.",
    es: "$1 pociones de vida y furia vendidas en el mercado.",
  },
  {
    pattern: /^(\d+) materiais de caça e suprimentos de mascote no catálogo\.$/,
    en: "$1 hunt materials and companion supplies in the catalog.",
    es: "$1 materiales de caza y suministros de compañero en el catálogo.",
  },
  {
    pattern: /^(Atacando|Preparando|Aguardando) · (.+)$/,
    en: "$1 · $2",
    es: "$1 · $2",
  },
  {
    pattern: /^(.+) - (.+) \(NV\. (.+)\)$/,
    en: "$1 - $2 (LV. $3)",
    es: "$1 - $2 (NV. $3)",
  },
  {
    pattern: /^Você subiu (\d+) nível\(is\) nesta caçada\.$/,
    en: "You climbed $1 level(s) on this hunt.",
    es: "Subiste $1 nivel(es) en esta cacería.",
  },
  // Combat narration: full sentences first, then the damage suffixes, then the verbs.
  {
    pattern: /^(.+) acerta (.+) em cheio, que sai da luta sem fôlego\.$/,
    en: "$1 hits $2 square on, and it leaves the fight out of breath.",
    es: "$1 acierta de lleno a $2, que sale de la pelea sin aliento.",
  },
  {
    pattern: /^(.+) investe contra (.+), que gane e volta ao combate\.$/,
    en: "$1 charges at $2, which yelps and returns to the fight.",
    es: "$1 embiste a $2, que gañe y vuelve al combate.",
  },
  {
    pattern: /^(.+) desvia do golpe de (.+)\.$/,
    en: "$1 dodges $2's strike.",
    es: "$1 esquiva el golpe de $2.",
  },
  {
    pattern: /^(.+) escapa por um fio das garras de (.+)\.$/,
    en: "$1 escapes $2's claws by a hair.",
    es: "$1 escapa por un pelo de las garras de $2.",
  },
  {
    pattern: /^O bote de (.+) passa raspando por (.+)\.$/,
    en: "$1's lunge grazes past $2.",
    es: "El zarpazo de $1 pasa rozando a $2.",
  },
  {
    pattern: /^(.+) escapa do bote de (.+)\.$/,
    en: "$1 escapes $2's lunge.",
    es: "$1 escapa del zarpazo de $2.",
  },
  {
    pattern: /^(.+) rola para longe do ataque de (.+)\.$/,
    en: "$1 rolls away from $2's attack.",
    es: "$1 rueda lejos del ataque de $2.",
  },
  {
    pattern: /^O golpe de (.+) corta só o vento\.$/,
    en: "$1's blow cuts only wind.",
    es: "El golpe de $1 corta solo el viento.",
  },
  {
    pattern: /^(.+) se esquiva do bote de (.+)\.$/,
    en: "$1 dodges $2's lunge.",
    es: "$1 esquiva el zarpazo de $2.",
  },
  {
    pattern: /^(.+) tomba e não levanta mais\.$/,
    en: "$1 falls and does not rise again.",
    es: "$1 se desploma y no se levanta más.",
  },
  {
    pattern: /^(.+) cai\. A noite fica quieta\.$/,
    en: "$1 falls. The night goes quiet.",
    es: "$1 cae. La noche queda quieta.",
  },
  {
    pattern: /^(.+) aguenta firme\. Melhor voltar\.$/,
    en: "$1 holds firm. Better to turn back.",
    es: "$1 aguanta firme. Mejor volver.",
  },
  {
    pattern: /^(.+) leva a melhor desta vez\.$/,
    en: "$1 gets the better of it this time.",
    es: "$1 se lleva la mejor parte esta vez.",
  },
  {
    pattern: /^Ferido, resta escapar de (.+)\.$/,
    en: "Wounded, all that is left is to escape $1.",
    es: "Herido, solo queda escapar de $1.",
  },
  {
    pattern: /^(.+) causando (\d+) de dano crítico\.$/,
    en: "$1 dealing $2 critical damage.",
    es: "$1 causando $2 de daño crítico.",
  },
  {
    pattern: /^(.+) causando (\d+) de dano\.$/,
    en: "$1 dealing $2 damage.",
    es: "$1 causando $2 de daño.",
  },
  { pattern: /^(.+) rasga o flanco de ([^.]+)$/, en: "$1 tears the flank of $2", es: "$1 rasga el flanco de $2" },
  { pattern: /^(.+) crava as garras em ([^.]+)$/, en: "$1 sinks its claws into $2", es: "$1 clava las garras en $2" },
  { pattern: /^(.+) crava os dentes em ([^.]+)$/, en: "$1 sinks its teeth into $2", es: "$1 clava los dientes en $2" },
  { pattern: /^(.+) se lança sobre ([^.]+)$/, en: "$1 lunges at $2", es: "$1 se lanza sobre $2" },
  { pattern: /^(.+) acerta ([^.]+)$/, en: "$1 strikes $2", es: "$1 golpea a $2" },
  { pattern: /^(.+) morde ([^.]+)$/, en: "$1 bites $2", es: "$1 muerde a $2" },
  { pattern: /^(.+) golpeia ([^.]+)$/, en: "$1 batters $2", es: "$1 aporrea a $2" },
  { pattern: /^(.+) rasga ([^.]+)$/, en: "$1 tears into $2", es: "$1 desgarra a $2" },
  { pattern: /^(.+) despedaça ([^.]+)$/, en: "$1 shatters $2", es: "$1 despedaza a $2" },
  { pattern: /^(.+) abre ([^.]+)$/, en: "$1 rips open $2", es: "$1 abre en canal a $2" },
  { pattern: /^(.+) atinge ([^.]+)$/, en: "$1 hits $2", es: "$1 alcanza a $2" },
  { pattern: /^(.+) dilacera ([^.]+)$/, en: "$1 rends $2", es: "$1 dilacera a $2" },

  // Server result messages
  {
    pattern: /^(.+) caiu em (.+)\. Conquistas: (.+)\.$/,
    en: "$1 fell in $2. Spoils: $3.",
    es: "$1 cayó en $2. Conquistas: $3.",
  },
  {
    pattern: /^A luta contra (.+) se arrastou e você recuou de (.+)\. Pelo esforço: (.+) de experiência\.$/,
    en: "The fight against $1 dragged on and you fell back from $2. For the effort: $3 experience.",
    es: "La pelea contra $1 se alargó y te retiraste de $2. Por el esfuerzo: $3 de experiencia.",
  },
  {
    pattern: /^(.+) venceu a disputa\. Você escapou por pouco de (.+)\. Pelo esforço: (.+) de experiência\.$/,
    en: "$1 won the contest. You barely escaped $2. For the effort: $3 experience.",
    es: "$1 ganó la disputa. Escapaste por poco de $2. Por el esfuerzo: $3 de experiencia.",
  },
  {
    pattern: /^(\d+) de (.+) e (\d+) de experiência de mineração saem da rocha\.$/,
    en: "$1 $2 and $3 mining experience come out of the rock.",
    es: "$1 de $2 y $3 de experiencia de minería salen de la roca.",
  },
  {
    pattern: /^(\d+) de (.+) e (\d+) de experiência de mineração\. A mineração subiu para (\d+)\.$/,
    en: "$1 $2 and $3 mining experience. Mining rose to $4.",
    es: "$1 de $2 y $3 de experiencia de minería. La minería subió a $4.",
  },
  {
    pattern: /^(\d+) de (.+) sai da rocha\.$/,
    en: "$1 $2 comes out of the rock.",
    es: "$1 de $2 sale de la roca.",
  },
  {
    pattern: /^Você já minerou o limite de hoje\. A veia reabre em (.+)\.$/,
    en: "You already mined today's limit. The vein reopens in $1.",
    es: "Ya minaste el límite de hoy. La veta reabre en $1.",
  },
  {
    pattern: /^(.+) sai da bigorna em \+(\d+)\.$/,
    en: "$1 leaves the anvil at +$2.",
    es: "$1 sale del yunque en +$2.",
  },
  {
    pattern: /^A martelada falha e os fragmentos se perdem: (.+) segue em \+(\d+)\.$/,
    en: "The strike fails and the fragments are lost: $1 stays at +$2.",
    es: "El golpe falla y los fragmentos se pierden: $1 sigue en +$2.",
  },
  {
    pattern: /^A martelada falha e os fragmentos se perdem: (.+) segue como estava\.$/,
    en: "The strike fails and the fragments are lost: $1 stays as it was.",
    es: "El golpe falla y los fragmentos se pierden: $1 sigue como estaba.",
  },
  {
    pattern: /^Faltam (\d+) (.+) para o próximo nível\.$/,
    en: "$1 $2 short of the next level.",
    es: "Faltan $1 de $2 para el próximo nivel.",
  },
  {
    pattern: /^A martelada pede (.+) e a bolsa não cobre\.$/,
    en: "The strike asks for $1 and the purse does not cover it.",
    es: "El golpe pide $1 y la bolsa no alcanza.",
  },
  {
    pattern: /^(.+) não está na mochila\.$/,
    en: "$1 is not in the bag.",
    es: "$1 no está en la mochila.",
  },
  {
    pattern: /^(.+) já está no teto de \+(\d+)\.$/,
    en: "$1 is already at the +$2 cap.",
    es: "$1 ya está en el techo de +$2.",
  },
  {
    pattern: /^(.+) já está no teto de (\d+)\.$/,
    en: "$1 is already at the cap of $2.",
    es: "$1 ya está en el techo de $2.",
  },
  { pattern: /^(.+) não aceita forja\.$/, en: "$1 takes no forging.", es: "$1 no acepta forja." },
  {
    pattern: /^(.+) concluído\. (.+) subiu para (\d+)\.$/,
    en: "$1 complete. $2 rose to $3.",
    es: "$1 completado. $2 subió a $3.",
  },
  {
    pattern: /^(.+) concluído\. O corpo registra o esforço\.$/,
    en: "$1 complete. The body records the effort.",
    es: "$1 completado. El cuerpo registra el esfuerzo.",
  },
  {
    pattern: /^(.+) exige mineração NV\. (\d+)\.$/,
    en: "$1 asks for mining LV. $2.",
    es: "$1 exige minería NV. $2.",
  },
  { pattern: /^Requer mineração NV\. (\d+)$/, en: "Requires mining LV. $1", es: "Requiere minería NV. $1" },

  // Tavern lines
  { pattern: /^(.+) entrou na mesa\.$/, en: "$1 joined the table.", es: "$1 entró a la mesa." },
  { pattern: /^(.+) retornou à mesa\.$/, en: "$1 returned to the table.", es: "$1 volvió a la mesa." },
  { pattern: /^(.+) saiu da mesa\.$/, en: "$1 left the table.", es: "$1 salió de la mesa." },
  { pattern: /^(.+) foi buscar uma bebida\.$/, en: "$1 went to get a drink.", es: "$1 fue por una bebida." },
  { pattern: /^Você entrou em (.+)\.$/, en: "You joined $1.", es: "Entraste en $1." },
  { pattern: /^Você saiu de (.+)\.$/, en: "You left $1.", es: "Saliste de $1." },
  {
    pattern: /^Abrir mesa sem senha é só a partir do NV (\d+)(.*)$/,
    en: "Opening a table without a password takes LV $1 and up$2",
    es: "Abrir una mesa sin contraseña es solo desde NV $1$2",
  },
  {
    pattern: /^Sentar em mesa aberta é só a partir do NV (\d+)(.*)$/,
    en: "Sitting at an open table takes LV $1 and up$2",
    es: "Sentarse en una mesa abierta es solo desde NV $1$2",
  },
  {
    pattern: /^Uma fala a cada (\d+)s\.(.*)$/,
    en: "One line every $1s.$2",
    es: "Una línea cada $1s.$2",
  },

  // Market and inventory results
  { pattern: /^(.+) comprado por (.+)\.$/, en: "$1 bought for $2.", es: "$1 comprado por $2." },
  { pattern: /^(.+) vendido por (.+)\.$/, en: "$1 sold for $2.", es: "$1 vendido por $2." },
  { pattern: /^(.+) equipado em (.+)\.$/, en: "$1 equipped on the $2.", es: "$1 equipado en $2." },
  {
    pattern: /^(.+) guardado no inventário\.$/,
    en: "$1 stored in the bag.",
    es: "$1 guardado en la mochila.",
  },
  {
    pattern: /^(.+) consumida: \+(\d+) vida\.$/,
    en: "$1 consumed: +$2 health.",
    es: "$1 consumida: +$2 de vida.",
  },
  {
    pattern: /^(.+) consumida: \+10 em todos os atributos por (.+)\.$/,
    en: "$1 consumed: +10 to all attributes for $2.",
    es: "$1 consumida: +10 a todos los atributos por $2.",
  },
  { pattern: /^Nada equipado em (.+)\.$/, en: "Nothing equipped on the $1.", es: "Nada equipado en $1." },
  { pattern: /^Nada a recuperar com (.+)\.$/, en: "Nothing to restore with $1.", es: "Nada que recuperar con $1." },
  {
    pattern: /^Você não tem essa quantidade de (.+)\.$/,
    en: "You do not have that many $1.",
    es: "No tienes esa cantidad de $1.",
  },
  { pattern: /^WCoins insuficientes para (.+)$/, en: "Not enough WCoins for $1", es: "WCoins insuficientes para $1" },

  // Character, rest and rename
  { pattern: /^Você regenerou (\d+) de vida\.$/, en: "You regenerated $1 health.", es: "Regeneraste $1 de vida." },
  { pattern: /^A matilha agora responde por (.+)\.$/, en: "The pack now answers to $1.", es: "La manada ahora responde por $1." },
  { pattern: /^O nome só pode trocar de novo em (.+)$/, en: "The name can only change again on $1", es: "El nombre solo puede cambiar de nuevo el $1" },
  { pattern: /^A troca de nome custa (.+)$/, en: "The name change costs $1", es: "El cambio de nombre cuesta $1" },

  // Pet results
  { pattern: /^O mascote agora atende por (.+)\.$/, en: "The companion now answers to $1.", es: "El compañero ahora atiende por $1." },
  {
    pattern: /^O mascote termina a sessão maior do que entrou: NV\. (\d+)\.$/,
    en: "The companion ends the session bigger than it entered: LV. $1.",
    es: "El compañero termina la sesión más grande de lo que entró: NV. $1.",
  },
  {
    pattern: /^O mascote já está no teto de NV\. (\d+)\.$/,
    en: "The companion is already at the LV. $1 cap.",
    es: "El compañero ya está en el techo de NV. $1.",
  },
  {
    pattern: /^O lobo só caça ao lado de um NV (\d+) ou mais\.$/,
    en: "The wolf only hunts beside a LV $1 or higher.",
    es: "El lobo solo caza junto a un NV $1 o más.",
  },
  {
    pattern: /^Cada treino é pago na hora: custa (.+)$/,
    en: "Each training is paid on the spot: it costs $1",
    es: "Cada entrenamiento se paga al momento: cuesta $1",
  },

  // Arena
  {
    pattern: /^Os ataques do dia acabaram: o próximo volta em (.+)\.$/,
    en: "The day's attacks are spent: the next returns in $1.",
    es: "Los ataques del día se acabaron: el próximo vuelve en $1.",
  },

  // English-keyed precise rules for shapes whose generated twin would swallow
  // a tail into the capture.
  {
    pattern: /^The body mends itself every (\d+) seconds\. Click to interrupt\.$/,
    pt: "O corpo se recompõe a cada $1 segundos. Clique para interromper.",
    es: "El cuerpo se recompone cada $1 segundos. Haz clic para interrumpir.",
  },
  {
    pattern: /^Restores part of the health every (\d+) seconds\.$/,
    pt: "Recupera parte da vida a cada $1 segundos.",
    es: "Recupera parte de la vida cada $1 segundos.",
  },
  {
    pattern: /^The seven slots, helm to ring, adding \+(\d[\d.,]*) of forge\.$/,
    pt: "Os sete espaços, do elmo ao anel, somando +$1 de forja.",
    es: "Los siete espacios, del yelmo al anillo, sumando +$1 de forja.",
  },
  {
    pattern: /^Choose a piece under Available and it goes on the anvil\. Each level adds 0\.3% of the original piece's attributes, so a strong set pays a lot and a cheap piece climbs slowly, up to \+(\d[\d.,]*)\.$/,
    pt: "Escolha uma peça em Disponíveis e ela entra na bigorna. Cada nível soma 0,3% dos atributos da peça original, então um set forte rende muito e uma peça barata sobe devagar, até +$1.",
    es: "Elige una pieza en Disponibles y entra al yunque. Cada nivel suma 0,3% de los atributos de la pieza original, así que un conjunto fuerte rinde mucho y una pieza barata sube despacio, hasta +$1.",
  },
  {
    pattern: /^Quantity of (.+) to buy$/,
    pt: "Quantidade de $1 para comprar",
    es: "Cantidad de $1 para comprar",
  },
  {
    pattern: /^Quantity of (.+) to sell$/,
    pt: "Quantidade de $1 para vender",
    es: "Cantidad de $1 para vender",
  },
  {
    pattern: /^Quantity of (.+) to announce$/,
    pt: "Quantidade de $1 para anunciar",
    es: "Cantidad de $1 para anunciar",
  },
  {
    pattern: /^No items of (.+) right now\.$/,
    pt: "Nenhum item de $1 no momento.",
    es: "Ningún objeto de $1 por ahora.",
  },
  {
    pattern: /^The name can change once every (\d+) days, and the change costs (.+) WCoins\.$/,
    pt: "O nome pode mudar uma vez a cada $1 dias, e a troca custa $2 WCoins.",
    es: "El nombre puede cambiar una vez cada $1 días, y el cambio cuesta $2 WCoins.",
  },
  {
    pattern: /^The next change only in (\d+) days\.$/,
    pt: "O próximo ajuste só em $1 dias.",
    es: "El próximo ajuste solo en $1 días.",
  },
  {
    pattern: /^Can change again in 1 day\.$/,
    pt: "Pode trocar de novo em 1 dia.",
    es: "Puede cambiar de nuevo en 1 día.",
  },
  {
    pattern: /^Can change again in (\d[\d.,]*) days\.$/,
    pt: "Pode trocar de novo em $1 dias.",
    es: "Puede cambiar de nuevo en $1 días.",
  },
  {
    pattern: /^VIP active until (.+), not renewing\.$/,
    pt: "VIP ativo até $1, sem renovar.",
    es: "VIP activo hasta $1, sin renovar.",
  },
  {
    pattern: /^(\d[\d.,]*) of (\d[\d.,]*) hunters with that name\.$/,
    pt: "$1 de $2 caçadores com esse nome.",
    es: "$1 de $2 cazadores con ese nombre.",
  },
  {
    pattern: /^(\d+) open tables$/,
    pt: "$1 mesas abertas",
    es: "$1 mesas abiertas",
  },
  {
    pattern: /^The table is full: (\d+) people$/,
    pt: "A mesa está cheia: $1 pessoas",
    es: "La mesa está llena: $1 personas",
  },
  {
    pattern: /^(.+) short$/,
    pt: "Faltam $1",
    es: "Faltan $1",
  },
  {
    pattern: /^\+(\d[\d.,]*) energy$/,
    pt: "+$1 de energia",
    es: "+$1 de energía",
  },
  {
    pattern: /^The change costs (.+) WCoins on the spot\.$/,
    pt: "A troca custa $1 WCoins na hora.",
    es: "El cambio cuesta $1 WCoins al instante.",
  },
  { pattern: /^\+(\d+) health$/, pt: "+$1 vida", es: "+$1 de vida" },
  { pattern: /^\+(\d+) to (\d+) health$/, pt: "+$1 a $2 vida", es: "+$1 a $2 de vida" },
  {
    pattern: /^\+(\d+)% of the companion's energy$/,
    pt: "+$1% da energia do mascote",
    es: "+$1% de la energía del compañero",
  },
  { pattern: /^\+(\d+)% of the health$/, pt: "+$1% da vida", es: "+$1% de la vida" },
  {
    pattern: /^\+(\d+) to all attributes$/,
    pt: "+$1 em todos os atributos",
    es: "+$1 a todos los atributos",
  },
  { pattern: /^(\d[\dms ]*) long$/, pt: "$1 de duração", es: "$1 de duración" },
  { pattern: /^\+(\d+)s of willpower$/, pt: "+$1s de vontade", es: "+$1s de voluntad" },
  {
    pattern: /^Experience \(LV\. (.+)\) - cap$/,
    pt: "Experiência (NV. $1) - teto",
    es: "Experiencia (NV. $1) - techo",
  },
  {
    pattern: /^Restores between (\d+) and (\d+) health$/,
    pt: "Recupera entre $1 e $2 de vida",
    es: "Recupera entre $1 y $2 de vida",
  },
  {
    pattern: /^The wolf only hunts beside a LV (\d+) or higher\.$/,
    pt: "O lobo só caça ao lado de um NV $1 ou mais.",
    es: "El lobo solo caza junto a un NV $1 o más.",
  },
  {
    pattern: /^Invite (.+) to the pack$/,
    pt: "Convidar $1 para a matilha",
    es: "Invitar a $1 a la manada",
  },
  {
    pattern: /^The hunt is for ages (\d+) and up\.$/,
    pt: "A caçada é para maiores de $1 anos.",
    es: "La cacería es para mayores de $1 años.",
  },
  {
    pattern: /^The game is for ages (\d+) and up: there is blood on the hunt, player duels, open chat tables and purchases with real money\.$/,
    pt: "O jogo é para maiores de $1 anos: tem sangue na caça, duelo entre jogadores, mesa de conversa aberta e compra com dinheiro de verdade.",
    es: "El juego es para mayores de $1 años: hay sangre en la caza, duelos entre jugadores, mesas de charla abiertas y compras con dinero real.",
  },
  {
    pattern: /^The WCoins leave on the spot and the new name is locked for (\d+) days, on the ranking, in the tavern and in the bazaar\.$/,
    pt: "As WCoins saem na hora e o novo nome fica travado por $1 dias, no ranking, na taverna e no bazar.",
    es: "Las WCoins salen al instante y el nuevo nombre queda bloqueado por $1 días, en la clasificación, en la taberna y en el bazar.",
  },

  // English-keyed twins of the legacy rules (generated): they translate
  // English-born interpolated strings into pt/es, and re-translate any
  // embedded legacy names for the English side.
  {
    pattern: /^(Attacking|Preparing|Waiting) · (.+)$/,
    en: "$1 · $2",
    pt: "$1 · $2",
    es: "$1 · $2",
  },
  {
    pattern: /^Experience \(LV\. (.+)\)$/,
    en: "Experience (LV. $1)",
    pt: "Experiência (NV. $1)",
    es: "Experiencia (NV. $1)",
  },
  {
    pattern: /^Companion - Experience \(LV\. (.+)\)$/,
    en: "Companion - Experience (LV. $1)",
    pt: "Mascote - Experiência (NV. $1)",
    es: "Compañero - Experiencia (NV. $1)",
  },
  {
    pattern: /^Resets at (\d{2}:\d{2}), (.+) left$/,
    en: "Resets at $1, $2 left",
    pt: "Reseta às $1, faltam $2",
    es: "Reinicia a las $1, faltan $2",
  },
  {
    pattern: /^Chat tables for up to (\d+) people, with or without a password\. A table closes itself when the last person leaves\.$/,
    en: "Chat tables for up to $1 people, with or without a password. A table closes itself when the last person leaves.",
    pt: "Mesas de conversa para até $1 pessoas, com ou sem senha. A mesa fecha sozinha quando a última pessoa sai.",
    es: "Mesas de charla para hasta $1 personas, con o sin contraseña. La mesa se cierra sola cuando sale la última persona.",
  },
  {
    pattern: /^Resources spent, back in (.+)$/,
    en: "Resources spent, back in $1",
    pt: "Recursos esgotados, voltam em $1",
    es: "Recursos agotados, vuelven en $1",
  },
  {
    pattern: /^\+(.+) to (.+) fragments per mining$/,
    en: "+$1 to $2 fragments per mining",
    pt: "+$1 a $2 fragmentos por mineração",
    es: "+$1 a $2 fragmentos por minado",
  },
  {
    pattern: /^Training is free forever: one exercise per attribute, every full bar becomes a permanent \+1\. Each session draws (\d+) to (\d+) steps, so one goes fast and the next asks for patience\. You cannot stop mid-session, but between one and the next there are three seconds to call it off\.$/,
    en: "Training is free forever: one exercise per attribute, every full bar becomes a permanent +1. Each session draws $1 to $2 steps, so one goes fast and the next asks for patience. You cannot stop mid-session, but between one and the next there are three seconds to call it off.",
    pt: "Treino gratuito para sempre: um exercício por atributo, cada barra cheia vira +1 permanente. Cada sessão sorteia de $1 a $2 passos, então uma sai rápida e a seguinte cobra paciência. Não dá para parar no meio de uma sessão, mas entre uma e outra sobram três segundos para você mandar parar.",
    es: "Entrenamiento gratis para siempre: un ejercicio por atributo, cada barra llena se vuelve +1 permanente. Cada sesión sortea de $1 a $2 pasos, así que una sale rápida y la siguiente pide paciencia. No se puede parar a mitad de una sesión, pero entre una y otra quedan tres segundos para mandarla parar.",
  },
  {
    pattern: /^Training repeats on its own until you say stop, and each attribute caps at (.+)\.$/,
    en: "Training repeats on its own until you say stop, and each attribute caps at $1.",
    pt: "O treino repete sozinho até você mandar parar, e o teto de cada atributo é $1.",
    es: "El entrenamiento se repite solo hasta que mandes parar, y el techo de cada atributo es $1.",
  },
  {
    pattern: /^Each click trains one session, and each attribute caps at (.+)\.$/,
    en: "Each click trains one session, and each attribute caps at $1.",
    pt: "Cada clique treina uma sessão, e o teto de cada atributo é $1.",
    es: "Cada clic entrena una sesión, y el techo de cada atributo es $1.",
  },
  {
    pattern: /^The arena only books fights between LV\. (.+) and LV\. (.+): (.+) hunters in that band\. No experience is earned here: the winner draws (.+) to (.+) WCoins from the loser's purse, never more than a quarter of what they carry\. The loser pays by the same rule\. Whoever already dueled you rests until 06:00 before climbing again\.$/,
    en: "The arena only books fights between LV. $1 and LV. $2: $3 hunters in that band. No experience is earned here: the winner draws $4 to $5 WCoins from the loser's purse, never more than a quarter of what they carry. The loser pays by the same rule. Whoever already dueled you rests until 06:00 before climbing again.",
    pt: "A arena só marca luta entre NV. $1 e NV. $2: $3 caçadores nessa faixa. Não se ganha experiência aqui: quem vence tira da bolsa do perdedor de $4 a $5 WCoins, sorteadas, e nunca mais que um quarto do que ele carrega. Quem perde paga pela mesma régua. Quem já duelou com você descansa até as 06:00 antes de subir de novo.",
    es: "La arena solo marca peleas entre NV. $1 y NV. $2: $3 cazadores en esa franja. Aquí no se gana experiencia: quien vence saca de la bolsa del perdedor de $4 a $5 WCoins, sorteadas, y nunca más de un cuarto de lo que lleva. Quien pierde paga con la misma regla. Quien ya se batió contigo descansa hasta las 06:00 antes de volver a subir.",
  },
  {
    pattern: /^You against (.+)\. At stake, a piece of the fallen one's purse: (.+) to (.+)\.$/,
    en: "You against $1. At stake, a piece of the fallen one's purse: $2 to $3.",
    pt: "Você contra $1. Em jogo, um pedaço da bolsa de quem cair: de $2 a $3.",
    es: "Tú contra $1. En juego, un pedazo de la bolsa de quien caiga: de $2 a $3.",
  },
  {
    pattern: /^Out of your band: the arena only books fights between LV\. (.+) and LV\. (.+)\.$/,
    en: "Out of your band: the arena only books fights between LV. $1 and LV. $2.",
    pt: "Fora da sua faixa: a arena só marca luta entre NV. $1 e NV. $2.",
    es: "Fuera de tu franja: la arena solo marca peleas entre NV. $1 y NV. $2.",
  },
  {
    pattern: /^You two already dueled today: the next challenge to them reopens at 06:00\. (.+) left\.$/,
    en: "You two already dueled today: the next challenge to them reopens at 06:00. $1 left.",
    pt: "Vocês já duelaram hoje: o próximo desafio a ele reabre às 06:00. Faltam $1.",
    es: "Ustedes ya se batieron hoy: el próximo desafío se reabre a las 06:00. Faltan $1.",
  },
  {
    pattern: /^(.+) stayed on the ground, and the purse is yours\.$/,
    en: "$1 stayed on the ground, and the purse is yours.",
    pt: "$1 ficou no chão, e a bolsa é sua.",
    es: "$1 quedó en el suelo, y la bolsa es tuya.",
  },
  {
    pattern: /^(.+) got the better of it\. You leave beaten, but you leave\.$/,
    en: "$1 got the better of it. You leave beaten, but you leave.",
    pt: "$1 levou a melhor. Você sai por baixo, mas sai.",
    es: "$1 se llevó la mejor parte. Sales por abajo, pero sales.",
  },
  {
    pattern: /^Fury Mode: \+(\d+) to all attributes$/,
    en: "Fury Mode: +$1 to all attributes",
    pt: "Modo Fúria: +$1 em todos os atributos",
    es: "Modo Furia: +$1 a todos los atributos",
  },
  {
    pattern: /^A table without a password takes LV (\d+) and up, or VIP\. Set a password to open at any level\.$/,
    en: "A table without a password takes LV $1 and up, or VIP. Set a password to open at any level.",
    pt: "Mesa sem senha é só a partir do NV $1, ou com VIP. Ponha uma senha para abrir em qualquer nível.",
    es: "Una mesa sin contraseña es solo desde NV $1, o con VIP. Pon una contraseña para abrir a cualquier nivel.",
  },
  {
    pattern: /^Without a password, LV (\d+)\+ or VIP\. With a password, any level\. Reserved tables always take a password\.$/,
    en: "Without a password, LV $1+ or VIP. With a password, any level. Reserved tables always take a password.",
    pt: "Sem senha, NV $1+ ou VIP. Com senha, qualquer nível. Mesa reservada sempre com senha.",
    es: "Sin contraseña, NV $1+ o VIP. Con contraseña, cualquier nivel. La mesa reservada siempre con contraseña.",
  },
  {
    pattern: /^The seven slots, helm to ring, adding \+(.+)$/,
    en: "The seven slots, helm to ring, adding +$1",
    pt: "Os sete espaços, do elmo ao anel, somando +$1",
    es: "Los siete espacios, del yelmo al anillo, sumando +$1",
  },
  {
    pattern: /^Where you stand on every board, among (.+)$/,
    en: "Where you stand on every board, among $1",
    pt: "Onde você aparece em cada quadro, entre $1",
    es: "Dónde apareces en cada tablero, entre $1",
  },
  {
    pattern: /^Where they stand on every board, among (.+)$/,
    en: "Where they stand on every board, among $1",
    pt: "Onde aparece em cada quadro, entre $1",
    es: "Dónde aparece en cada tablero, entre $1",
  },
  {
    pattern: /^Restores part of the health every (.+)$/,
    en: "Restores part of the health every $1",
    pt: "Recupera parte da vida a cada $1",
    es: "Recupera parte de la vida cada $1",
  },
  {
    pattern: /^The body mends itself every (.+)$/,
    en: "The body mends itself every $1",
    pt: "O corpo se recompõe a cada $1",
    es: "El cuerpo se recompone cada $1",
  },
  {
    pattern: /^(.+) is whole, waiting to be called\.$/,
    en: "$1 is whole, waiting to be called.",
    pt: "$1 está inteiro, esperando ser chamado.",
    es: "$1 está entero, esperando ser llamado.",
  },
  {
    pattern: /^(.+) was loyal, but will now be free in the forest\. Nothing is returned, and the name is freed for a next wolf, adopted at the kennel for the full price\.$/,
    en: "$1 was loyal, but will now be free in the forest. Nothing is returned, and the name is freed for a next wolf, adopted at the kennel for the full price.",
    pt: "$1 foi fiel, mas agora estará livre na floresta. Nada é devolvido, e o apelido fica livre para um próximo lobo, adotado no canil pelo preço cheio.",
    es: "$1 fue fiel, pero ahora estará libre en el bosque. Nada se devuelve, y el nombre queda libre para un próximo lobo, adoptado en la perrera por el precio completo.",
  },
  {
    pattern: /^Food returns a quarter of the breath at once\. Without it, rest does the same for free, one step every (.+)\.$/,
    en: "Food returns a quarter of the breath at once. Without it, rest does the same for free, one step every $1.",
    pt: "O alimento devolve um quarto do fôlego na hora. Sem ele, o repouso faz o mesmo de graça, um passo a cada $1.",
    es: "El alimento devuelve un cuarto del aliento al instante. Sin él, el reposo hace lo mismo gratis, un paso cada $1.",
  },
  {
    pattern: /^The name is given at the door; changing it later costs (.+) at the kennel\. Adoption asks for LV (\d+) and costs (.+)\.$/,
    en: "The name is given at the door; changing it later costs $1 at the kennel. Adoption asks for LV $2 and costs $3.",
    pt: "O apelido é dado na porta; trocar depois custa $1 no canil. A adoção exige NV $2 e custa $3.",
    es: "El nombre se da en la puerta; cambiarlo después cuesta $1 en la perrera. La adopción exige NV $2 y cuesta $3.",
  },
  {
    pattern: /^Adopting is a commitment: releasing later returns no WCoin, and changing the name costs (.+) at the kennel\.$/,
    en: "Adopting is a commitment: releasing later returns no WCoin, and changing the name costs $1 at the kennel.",
    pt: "Adotar é compromisso: soltar depois não devolve WCoin nenhuma, e trocar o apelido custa $1 no canil.",
    es: "Adoptar es un compromiso: soltar después no devuelve ninguna WCoin, y cambiar el nombre cuesta $1 en la perrera.",
  },
  {
    pattern: /^(.+) hunts with you\.$/,
    en: "$1 hunts with you.",
    pt: "$1 caça com você.",
    es: "$1 caza contigo.",
  },
  {
    pattern: /^(.+) recovers (.+) energy every (.+) seconds at rest\.$/,
    en: "$1 recovers $2 energy every $3 seconds at rest.",
    pt: "$1 recupera $2 de energia a cada $3 segundos em repouso.",
    es: "$1 recupera $2 de energía cada $3 segundos en reposo.",
  },
  {
    pattern: /^The leather purse where your sale money lands, already net of the house's cut\. Withdrawals start at (.+)\.$/,
    en: "The leather purse where your sale money lands, already net of the house's cut. Withdrawals start at $1.",
    pt: "A bolsa de couro onde cai o dinheiro das suas vendas, já sem a parte da casa. O saque sai a partir de $1.",
    es: "La bolsa de cuero donde cae el dinero de tus ventas, ya sin la parte de la casa. El retiro sale a partir de $1.",
  },
  {
    pattern: /^x(\d[\d.,]*) - suggested (.+)$/,
    en: "x$1 - suggested $2",
    pt: "x$1 - sugestão $2",
    es: "x$1 - sugerido $2",
  },
  {
    pattern: /^The (\d+) most recent under your name in the pit: the ones you booked and the ones booked against you\.$/,
    en: "The $1 most recent under your name in the pit: the ones you booked and the ones booked against you.",
    pt: "As $1 mais recentes do seu nome no fosso: as que você marcou e as que marcaram contra você.",
    es: "Las $1 más recientes de tu nombre en el foso: las que marcaste y las que marcaron contra ti.",
  },
  {
    pattern: /^The name is given at the door; changing it later costs (.+)$/,
    en: "The name is given at the door; changing it later costs $1",
    pt: "O apelido é dado na porta; trocar depois custa $1",
    es: "El nombre se da en la puerta; cambiarlo después cuesta $1",
  },
  {
    pattern: /^The WCoins leave on the spot and the new name is locked for (.+)$/,
    en: "The WCoins leave on the spot and the new name is locked for $1",
    pt: "As WCoins saem na hora e o novo nome fica travado por $1",
    es: "Las WCoins salen al instante y el nuevo nombre queda bloqueado por $1",
  },
  {
    pattern: /^The game is for ages (\d+) and up: there is blood on the hunt, player duels, open chat tables and purchases with real money\.$/,
    en: "The game is for ages $1 and up: there is blood on the hunt, player duels, open chat tables and purchases with real money.",
    pt: "O jogo é para maiores de $1 anos: tem sangue na caça, duelo entre jogadores, mesa de conversa aberta e compra com dinheiro de verdade.",
    es: "El juego es para mayores de $1 años: hay sangre en la caza, duelos entre jugadores, mesas de charla abiertas y compras con dinero real.",
  },
  {
    pattern: /^(\d+) creatures in six species, ordered by level\. Fixed numbers per variant\.$/,
    en: "$1 creatures in six species, ordered by level. Fixed numbers per variant.",
    pt: "$1 criaturas em seis espécies, ordenadas por nível. Números fixos por variant.",
    es: "$1 criaturas en seis especies, ordenadas por nivel. Números fijos por variante.",
  },
  {
    pattern: /^(\d+) pieces in five sets, bronze to lunar\. Each row carries the piece, the bonus and the market price\.$/,
    en: "$1 pieces in five sets, bronze to lunar. Each row carries the piece, the bonus and the market price.",
    pt: "$1 peças em cinco conjuntos, do bronze ao lunar. Cada linha traz a peça, o bônus e o preço no mercado.",
    es: "$1 piezas en cinco conjuntos, del bronce al lunar. Cada línea trae la pieza, el bono y el precio en el mercado.",
  },
  {
    pattern: /^(\d+) shards from the mine, one per set\. They only feed the forge; they do not drop on the hunt nor enter the market\.$/,
    en: "$1 shards from the mine, one per set. They only feed the forge; they do not drop on the hunt nor enter the market.",
    pt: "$1 lascas da mina, uma por conjunto. Só alimentam a forja; não caem na caça nem entram no mercado.",
    es: "$1 esquirlas de la mina, una por conjunto. Solo alimentan la forja; no caen en la caza ni entran al mercado.",
  },
  {
    pattern: /^(\d+) health and fury potions sold at the market\.$/,
    en: "$1 health and fury potions sold at the market.",
    pt: "$1 poções de vida e fúria vendidas no mercado.",
    es: "$1 pociones de vida y furia vendidas en el mercado.",
  },
  {
    pattern: /^(\d+) hunt materials and companion supplies in the catalog\.$/,
    en: "$1 hunt materials and companion supplies in the catalog.",
    pt: "$1 materiais de caça e suprimentos de mascote no catálogo.",
    es: "$1 materiales de caza y suministros de compañero en el catálogo.",
  },
  {
    pattern: /^(.+) - (.+) \(LV\. (.+)\)$/,
    en: "$1 - $2 (LV. $3)",
    pt: "$1 - $2 (NV. $3)",
    es: "$1 - $2 (NV. $3)",
  },
  {
    pattern: /^You climbed (\d+) level\(s\) on this hunt\.$/,
    en: "You climbed $1 level(s) on this hunt.",
    pt: "Você subiu $1 nível(is) nesta caçada.",
    es: "Subiste $1 nivel(es) en esta cacería.",
  },
  {
    pattern: /^(.+) hits (.+) square on, and it leaves the fight out of breath\.$/,
    en: "$1 hits $2 square on, and it leaves the fight out of breath.",
    pt: "$1 acerta $2 em cheio, que sai da luta sem fôlego.",
    es: "$1 acierta de lleno a $2, que sale de la pelea sin aliento.",
  },
  {
    pattern: /^(.+) charges at (.+), which yelps and returns to the fight\.$/,
    en: "$1 charges at $2, which yelps and returns to the fight.",
    pt: "$1 investe contra $2, que gane e volta ao combate.",
    es: "$1 embiste a $2, que gañe y vuelve al combate.",
  },
  {
    pattern: /^(.+) dodges (.+)'s strike\.$/,
    en: "$1 dodges $2's strike.",
    pt: "$1 desvia do golpe de $2.",
    es: "$1 esquiva el golpe de $2.",
  },
  {
    pattern: /^(.+) escapes (.+)'s claws by a hair\.$/,
    en: "$1 escapes $2's claws by a hair.",
    pt: "$1 escapa por um fio das garras de $2.",
    es: "$1 escapa por un pelo de las garras de $2.",
  },
  {
    pattern: /^(.+)'s lunge grazes past (.+)\.$/,
    en: "$1's lunge grazes past $2.",
    pt: "O bote de $1 passa raspando por $2.",
    es: "El zarpazo de $1 pasa rozando a $2.",
  },
  {
    pattern: /^(.+) escapes (.+)'s lunge\.$/,
    en: "$1 escapes $2's lunge.",
    pt: "$1 escapa do bote de $2.",
    es: "$1 escapa del zarpazo de $2.",
  },
  {
    pattern: /^(.+) rolls away from (.+)'s attack\.$/,
    en: "$1 rolls away from $2's attack.",
    pt: "$1 rola para longe do ataque de $2.",
    es: "$1 rueda lejos del ataque de $2.",
  },
  {
    pattern: /^(.+)'s blow cuts only wind\.$/,
    en: "$1's blow cuts only wind.",
    pt: "O golpe de $1 corta só o vento.",
    es: "El golpe de $1 corta solo el viento.",
  },
  {
    pattern: /^(.+) dodges (.+)'s lunge\.$/,
    en: "$1 dodges $2's lunge.",
    pt: "$1 se esquiva do bote de $2.",
    es: "$1 esquiva el zarpazo de $2.",
  },
  {
    pattern: /^(.+) falls and does not rise again\.$/,
    en: "$1 falls and does not rise again.",
    pt: "$1 tomba e não levanta mais.",
    es: "$1 se desploma y no se levanta más.",
  },
  {
    pattern: /^(.+) falls\. The night goes quiet\.$/,
    en: "$1 falls. The night goes quiet.",
    pt: "$1 cai. A noite fica quieta.",
    es: "$1 cae. La noche queda quieta.",
  },
  {
    pattern: /^(.+) holds firm\. Better to turn back\.$/,
    en: "$1 holds firm. Better to turn back.",
    pt: "$1 aguenta firme. Melhor voltar.",
    es: "$1 aguanta firme. Mejor volver.",
  },
  {
    pattern: /^(.+) gets the better of it this time\.$/,
    en: "$1 gets the better of it this time.",
    pt: "$1 leva a melhor desta vez.",
    es: "$1 se lleva la mejor parte esta vez.",
  },
  {
    pattern: /^Wounded, all that is left is to escape (.+)\.$/,
    en: "Wounded, all that is left is to escape $1.",
    pt: "Ferido, resta escapar de $1.",
    es: "Herido, solo queda escapar de $1.",
  },
  {
    pattern: /^(.+) dealing (\d+) critical damage\.$/,
    en: "$1 dealing $2 critical damage.",
    pt: "$1 causando $2 de dano crítico.",
    es: "$1 causando $2 de daño crítico.",
  },
  {
    pattern: /^(.+) dealing (\d+) damage\.$/,
    en: "$1 dealing $2 damage.",
    pt: "$1 causando $2 de dano.",
    es: "$1 causando $2 de daño.",
  },
  {
    pattern: /^(.+) fell in (.+)\. Spoils: (.+)\.$/,
    en: "$1 fell in $2. Spoils: $3.",
    pt: "$1 caiu em $2. Conquistas: $3.",
    es: "$1 cayó en $2. Conquistas: $3.",
  },
  {
    pattern: /^The fight against (.+) dragged on and you fell back from (.+)\. For the effort: (.+) experience\.$/,
    en: "The fight against $1 dragged on and you fell back from $2. For the effort: $3 experience.",
    pt: "A luta contra $1 se arrastou e você recuou de $2. Pelo esforço: $3 de experiência.",
    es: "La pelea contra $1 se alargó y te retiraste de $2. Por el esfuerzo: $3 de experiencia.",
  },
  {
    pattern: /^(.+) won the contest\. You barely escaped (.+)\. For the effort: (.+) experience\.$/,
    en: "$1 won the contest. You barely escaped $2. For the effort: $3 experience.",
    pt: "$1 venceu a disputa. Você escapou por pouco de $2. Pelo esforço: $3 de experiência.",
    es: "$1 ganó la disputa. Escapaste por poco de $2. Por el esfuerzo: $3 de experiencia.",
  },
  {
    pattern: /^(\d+) (.+) and (\d+) mining experience come out of the rock\.$/,
    en: "$1 $2 and $3 mining experience come out of the rock.",
    pt: "$1 de $2 e $3 de experiência de mineração saem da rocha.",
    es: "$1 de $2 y $3 de experiencia de minería salen de la roca.",
  },
  {
    pattern: /^(\d+) (.+) and (\d+) mining experience\. Mining rose to (\d+)\.$/,
    en: "$1 $2 and $3 mining experience. Mining rose to $4.",
    pt: "$1 de $2 e $3 de experiência de mineração. A mineração subiu para $4.",
    es: "$1 de $2 y $3 de experiencia de minería. La minería subió a $4.",
  },
  {
    pattern: /^(\d+) (.+) comes out of the rock\.$/,
    en: "$1 $2 comes out of the rock.",
    pt: "$1 de $2 sai da rocha.",
    es: "$1 de $2 sale de la roca.",
  },
  {
    pattern: /^You already mined today's limit\. The vein reopens in (.+)\.$/,
    en: "You already mined today's limit. The vein reopens in $1.",
    pt: "Você já minerou o limite de hoje. A veia reabre em $1.",
    es: "Ya minaste el límite de hoy. La veta reabre en $1.",
  },
  {
    pattern: /^(.+) leaves the anvil at \+(\d+)\.$/,
    en: "$1 leaves the anvil at +$2.",
    pt: "$1 sai da bigorna em +$2.",
    es: "$1 sale del yunque en +$2.",
  },
  {
    pattern: /^The strike fails and the fragments are lost: (.+) stays at \+(\d+)\.$/,
    en: "The strike fails and the fragments are lost: $1 stays at +$2.",
    pt: "A martelada falha e os fragmentos se perdem: $1 segue em +$2.",
    es: "El golpe falla y los fragmentos se pierden: $1 sigue en +$2.",
  },
  {
    pattern: /^The strike fails and the fragments are lost: (.+) stays as it was\.$/,
    en: "The strike fails and the fragments are lost: $1 stays as it was.",
    pt: "A martelada falha e os fragmentos se perdem: $1 segue como estava.",
    es: "El golpe falla y los fragmentos se pierden: $1 sigue como estaba.",
  },
  {
    pattern: /^(\d+) (.+) short of the next level\.$/,
    en: "$1 $2 short of the next level.",
    pt: "Faltam $1 $2 para o próximo nível.",
    es: "Faltan $1 de $2 para el próximo nivel.",
  },
  {
    pattern: /^The strike asks for (.+) and the purse does not cover it\.$/,
    en: "The strike asks for $1 and the purse does not cover it.",
    pt: "A martelada pede $1 e a bolsa não cobre.",
    es: "El golpe pide $1 y la bolsa no alcanza.",
  },
  {
    pattern: /^(.+) is not in the bag\.$/,
    en: "$1 is not in the bag.",
    pt: "$1 não está na mochila.",
    es: "$1 no está en la mochila.",
  },
  {
    pattern: /^(.+) is already at the \+(\d+) cap\.$/,
    en: "$1 is already at the +$2 cap.",
    pt: "$1 já está no teto de +$2.",
    es: "$1 ya está en el techo de +$2.",
  },
  {
    pattern: /^(.+) is already at the cap of (\d+)\.$/,
    en: "$1 is already at the cap of $2.",
    pt: "$1 já está no teto de $2.",
    es: "$1 ya está en el techo de $2.",
  },
  {
    pattern: /^(.+) complete\. (.+) rose to (\d+)\.$/,
    en: "$1 complete. $2 rose to $3.",
    pt: "$1 concluído. $2 subiu para $3.",
    es: "$1 completado. $2 subió a $3.",
  },
  {
    pattern: /^(.+) complete\. The body records the effort\.$/,
    en: "$1 complete. The body records the effort.",
    pt: "$1 concluído. O corpo registra o esforço.",
    es: "$1 completado. El cuerpo registra el esfuerzo.",
  },
  {
    pattern: /^(.+) asks for mining LV\. (\d+)\.$/,
    en: "$1 asks for mining LV. $2.",
    pt: "$1 exige mineração NV. $2.",
    es: "$1 exige minería NV. $2.",
  },
  {
    pattern: /^Opening a table without a password takes LV (\d+) and up(.*)$/,
    en: "Opening a table without a password takes LV $1 and up$2",
    pt: "Abrir mesa sem senha é só a partir do NV $1$2",
    es: "Abrir una mesa sin contraseña es solo desde NV $1$2",
  },
  {
    pattern: /^Sitting at an open table takes LV (\d+) and up(.*)$/,
    en: "Sitting at an open table takes LV $1 and up$2",
    pt: "Sentar em mesa aberta é só a partir do NV $1$2",
    es: "Sentarse en una mesa abierta es solo desde NV $1$2",
  },
  {
    pattern: /^One line every (\d+)s\.(.*)$/,
    en: "One line every $1s.$2",
    pt: "Uma fala a cada $1s.$2",
    es: "Una línea cada $1s.$2",
  },
  {
    pattern: /^(.+) stored in the bag\.$/,
    en: "$1 stored in the bag.",
    pt: "$1 guardado no inventário.",
    es: "$1 guardado en la mochila.",
  },
  {
    pattern: /^(.+) consumed: \+(\d+) health\.$/,
    en: "$1 consumed: +$2 health.",
    pt: "$1 consumida: +$2 vida.",
    es: "$1 consumida: +$2 de vida.",
  },
  {
    pattern: /^(.+) consumed: \+10 to all attributes for (.+)\.$/,
    en: "$1 consumed: +10 to all attributes for $2.",
    pt: "$1 consumida: +10 em todos os atributos por $2.",
    es: "$1 consumida: +10 a todos los atributos por $2.",
  },
  {
    pattern: /^You do not have that many (.+)\.$/,
    en: "You do not have that many $1.",
    pt: "Você não tem essa quantidade de $1.",
    es: "No tienes esa cantidad de $1.",
  },
  {
    pattern: /^The companion ends the session bigger than it entered: LV\. (\d+)\.$/,
    en: "The companion ends the session bigger than it entered: LV. $1.",
    pt: "O mascote termina a sessão maior do que entrou: NV. $1.",
    es: "El compañero termina la sesión más grande de lo que entró: NV. $1.",
  },
  {
    pattern: /^The companion is already at the LV\. (\d+) cap\.$/,
    en: "The companion is already at the LV. $1 cap.",
    pt: "O mascote já está no teto de NV. $1.",
    es: "El compañero ya está en el techo de NV. $1.",
  },
  {
    pattern: /^The wolf only hunts beside a LV (\d+) or higher\.$/,
    en: "The wolf only hunts beside a LV $1 or higher.",
    pt: "O lobo só caça ao lado de um NV $1 ou mais.",
    es: "El lobo solo caza junto a un NV $1 o más.",
  },
  {
    pattern: /^Each training is paid on the spot: it costs (.+)$/,
    en: "Each training is paid on the spot: it costs $1",
    pt: "Cada treino é pago na hora: custa $1",
    es: "Cada entrenamiento se paga al momento: cuesta $1",
  },
  {
    pattern: /^The day's attacks are spent: the next returns in (.+)\.$/,
    en: "The day's attacks are spent: the next returns in $1.",
    pt: "Os ataques do dia acabaram: o próximo volta em $1.",
    es: "Los ataques del día se acabaron: el próximo vuelve en $1.",
  },

  // English-source shapes added with the Stage C flip (tavern, arena, bazaar,
  // engine notices, combat narration, routes). Captures translate recursively,
  // so names and amounts ride through untouched while verbs and labels resolve.
  { pattern: /^(.+) joined the table\.$/, en: "$1 joined the table.", pt: "$1 entrou na mesa.", es: "$1 entró a la mesa." },
  { pattern: /^(.+) returned to the table\.$/, en: "$1 returned to the table.", pt: "$1 retornou à mesa.", es: "$1 volvió a la mesa." },
  { pattern: /^(.+) left the table\.$/, en: "$1 left the table.", pt: "$1 saiu da mesa.", es: "$1 salió de la mesa." },
  { pattern: /^(.+) went to get a drink\.$/, en: "$1 went to get a drink.", pt: "$1 foi buscar uma bebida.", es: "$1 fue por una bebida." },
  { pattern: /^(.+) opened the table\.$/, en: "$1 opened the table.", pt: "$1 abriu a mesa.", es: "$1 abrió la mesa." },
  { pattern: /^(.+) abriu a mesa\.$/, en: "$1 opened the table.", es: "$1 abrió la mesa." },
  { pattern: /^You joined (.+)\.$/, en: "You joined $1.", pt: "Você entrou em $1.", es: "Entraste en $1." },
  { pattern: /^You left (.+)\.$/, en: "You left $1.", pt: "Você saiu de $1.", es: "Saliste de $1." },
  { pattern: /^Table with (.+) open\.$/, en: "Table with $1 open.", pt: "Mesa com $1 aberta.", es: "Mesa con $1 abierta." },
  { pattern: /^Table reserved for (.+) and (.+)\.$/, en: "Table reserved for $1 and $2.", pt: "Mesa reservada para $1 e $2.", es: "Mesa reservada para $1 y $2." },
  { pattern: /^Mesa reservada para (.+) e (.+)\.$/, en: "Table reserved for $1 and $2.", es: "Mesa reservada para $1 y $2." },
  { pattern: /^The table is full \((\d+) people\)\.$/, en: "The table is full ($1 people).", pt: "A mesa está cheia ($1 pessoas).", es: "La mesa está llena ($1 personas)." },
  { pattern: /^One line every (\d+) seconds: wait (\d+)s\.$/, en: "One line every $1 seconds: wait $2s.", pt: "Uma fala a cada $1 segundos: espere $2s.", es: "Una línea cada $1 segundos: espera $2s." },
  { pattern: /^The table name needs at least (\d+) letters\.$/, en: "The table name needs at least $1 letters.", pt: "O nome da mesa precisa de pelo menos $1 letras.", es: "El nombre de la mesa necesita al menos $1 letras." },
  { pattern: /^The table name can have at most (\d+) letters\.$/, en: "The table name can have at most $1 letters.", pt: "O nome da mesa pode ter no máximo $1 letras.", es: "El nombre de la mesa puede tener como máximo $1 letras." },
  {
    pattern: /^Opening a table without a password takes LV (\d+), or with VIP\. Set a password to open at any level\.$/,
    en: "Opening a table without a password takes LV $1, or with VIP. Set a password to open at any level.",
    pt: "Abrir mesa sem senha é só a partir do NV $1, ou com VIP. Ponha uma senha para abrir em qualquer nível.",
    es: "Abrir una mesa sin contraseña es solo desde NV $1, o con VIP. Pon una contraseña para abrir a cualquier nivel.",
  },
  { pattern: /^Sitting at an open table takes LV (\d+)\.$/, en: "Sitting at an open table takes LV $1.", pt: "Sentar em mesa aberta é só a partir do NV $1.", es: "Sentarse en una mesa abierta es solo desde NV $1." },
  { pattern: /^A reserved table is only within the pack\. Invite (.+) and wait for the acceptance\.$/, en: "A reserved table is only within the pack. Invite $1 and wait for the acceptance.", pt: "Mesa reservada é só entre a matilha. Convide $1 e espere aceitar.", es: "La mesa reservada es solo entre la manada. Invita a $1 y espera a que acepte." },
  { pattern: /^(.+) does not enter the bazaar\.$/, en: "$1 does not enter the bazaar.", pt: "$1 não entra no bazar.", es: "$1 no entra al bazar." },
  { pattern: /^You do not have (\d+) of (.+) in the bag\.$/, en: "You do not have $1 of $2 in the bag.", pt: "Você não tem $1 de $2 na mochila.", es: "No tienes $1 de $2 en la mochila." },
  { pattern: /^The minimum listing is (.+)\.$/, en: "The minimum listing is $1.", pt: "O anúncio mínimo é $1.", es: "El anuncio mínimo es $1." },
  { pattern: /^The board takes no listing above (.+)\.$/, en: "The board takes no listing above $1.", pt: "O quadro não aceita anúncio acima de $1.", es: "El tablero no acepta anuncios por encima de $1." },
  { pattern: /^(.+) short for the listing fee\.$/, en: "$1 short for the listing fee.", pt: "Faltam $1 para a taxa do anúncio.", es: "Faltan $1 para la tasa del anuncio." },
  { pattern: /^(.+) announced for (.+) each\. Fee of (.+) paid\.$/, en: "$1 announced for $2 each. Fee of $3 paid.", pt: "$1 anunciado por $2 cada. Taxa de $3 paga.", es: "$1 anunciado por $2 cada uno. Tasa de $3 pagada." },
  { pattern: /^(.+) announced for (.+)\. Fee of (.+) paid\.$/, en: "$1 announced for $2. Fee of $3 paid.", pt: "$1 anunciado por $2. Taxa de $3 paga.", es: "$1 anunciado por $2. Tasa de $3 pagada." },
  { pattern: /^Listing removed: (.+) returned to the bag\.$/, en: "Listing removed: $1 returned to the bag.", pt: "Anúncio removido: $1 voltou para a mochila.", es: "Anuncio retirado: $1 volvió a la mochila." },
  { pattern: /^Only (\d+) left in that listing\.$/, en: "Only $1 left in that listing.", pt: "Só restam $1 nesse anúncio.", es: "Solo quedan $1 en ese anuncio." },
  { pattern: /^(.+) demands LV\. (\d+)\.$/, en: "$1 demands LV. $2.", pt: "$1 exige NV. $2.", es: "$1 exige NV. $2." },
  { pattern: /^(.+) arrived from the bazaar: (.+) paid at checkout\.$/, en: "$1 arrived from the bazaar: $2 paid at checkout.", pt: "$1 chegou do bazar: $2 pagos no checkout.", es: "$1 llegó del bazar: $2 pagados en el checkout." },
  { pattern: /^The minimum withdrawal is (.+): gather more before asking\.$/, en: "The minimum withdrawal is $1: gather more before asking.", pt: "O saque mínimo é $1: junte mais antes de pedir.", es: "El retiro mínimo es $1: junta más antes de pedir." },
  { pattern: /^Withdrawal of (.+) requested: the order was recorded, and in this version nothing is transferred yet\.$/, en: "Withdrawal of $1 requested: the order was recorded, and in this version nothing is transferred yet.", pt: "Saque de $1 solicitado: o pedido ficou registrado, e nesta versão nada é transferido ainda.", es: "Retiro de $1 solicitado: el pedido quedó registrado, y en esta versión nada se transfiere todavía." },
  { pattern: /^That listing expired: the bazaar keeps each offer for (\d+) days\.$/, en: "That listing expired: the bazaar keeps each offer for $1 days.", pt: "Esse anúncio venceu: o bazar guarda cada oferta por $1 dias.", es: "Ese anuncio venció: el bazar guarda cada oferta por $1 días." },
  { pattern: /^The Saddlebag received (.+) from bazaar sales\.$/, en: "The Saddlebag received $1 from bazaar sales.", pt: "O Alforje recebeu $1 de vendas no bazar.", es: "La Alforja recibió $1 de ventas en el bazar." },
  { pattern: /^The arena only marks fights between LV\. (.+) and LV\. (.+)\.$/, en: "The arena only marks fights between LV. $1 and LV. $2.", pt: "A arena só marca luta entre NV. $1 e NV. $2.", es: "La arena solo marca peleas entre NV. $1 y NV. $2." },
  { pattern: /^(.+) is still recovering from the last duel: (.+) left\.$/, en: "$1 is still recovering from the last duel: $2 left.", pt: "$1 ainda se recupera do último duelo: faltam $2.", es: "$1 aún se recupera del último duelo: faltan $2." },
  { pattern: /^(.+) falls in the pit, and the purse comes along: (.+)\.$/, en: "$1 falls in the pit, and the purse comes along: $2.", pt: "$1 cai no fosso, e a bolsa vem junto: $2.", es: "$1 cae al foso, y la bolsa viene junto: $2." },
  { pattern: /^(.+) cai no fosso, e a bolsa vem junto: (.+)\.$/, en: "$1 falls in the pit, and the purse comes along: $2.", es: "$1 cae al foso, y la bolsa viene junto: $2." },
  { pattern: /^(.+) falls in the pit, but went down without a coin in the pocket\.$/, en: "$1 falls in the pit, but went down without a coin in the pocket.", pt: "$1 cai no fosso, mas desceu sem uma moeda no bolso.", es: "$1 cae al foso, pero bajó sin una moneda en el bolsillo." },
  { pattern: /^(.+) cai no fosso, mas desceu sem uma moeda no bolso\.$/, en: "$1 falls in the pit, but went down without a coin in the pocket.", es: "$1 cae al foso, pero bajó sin una moneda en el bolsillo." },
  { pattern: /^The duel with (.+) dragged on and both fell back\. Nobody took anything\.$/, en: "The duel with $1 dragged on and both fell back. Nobody took anything.", pt: "O duelo com $1 se arrastou e os dois recuaram. Ninguém levou nada.", es: "El duelo con $1 se alargó y los dos retrocedieron. Nadie se llevó nada." },
  { pattern: /^O duelo com (.+) se arrastou e os dois recuaram\. Ninguém levou nada\.$/, en: "The duel with $1 dragged on and both fell back. Nobody took anything.", es: "El duelo con $1 se alargó y los dos retrocedieron. Nadie se llevó nada." },
  { pattern: /^(.+) gets the better of the pit, and also takes (.+) from your purse\.$/, en: "$1 gets the better of the pit, and also takes $2 from your purse.", pt: "$1 leva a melhor no fosso, e leva também $2 da sua bolsa.", es: "$1 se lleva la mejor parte en el foso, y también se lleva $2 de tu bolsa." },
  { pattern: /^(.+) leva a melhor no fosso, e leva também (.+) da sua bolsa\.$/, en: "$1 gets the better of the pit, and also takes $2 from your purse.", es: "$1 se lleva la mejor parte en el foso, y también se lleva $2 de tu bolsa." },
  { pattern: /^(.+) gets the better of the pit\. Your purse was empty, and that is what they took\.$/, en: "$1 gets the better of the pit. Your purse was empty, and that is what they took.", pt: "$1 leva a melhor no fosso. Sua bolsa estava vazia, e foi o que ele levou.", es: "$1 se lleva la mejor parte en el foso. Tu bolsa estaba vacía, y eso fue lo que se llevó." },
  { pattern: /^(.+) leva a melhor no fosso\. Sua bolsa estava vazia, e foi o que ele levou\.$/, en: "$1 gets the better of the pit. Your purse was empty, and that is what they took.", es: "$1 se lleva la mejor parte en el foso. Tu bolsa estaba vacía, y eso fue lo que se llevó." },
  { pattern: /^(.+) felled: \+(.+) WCoins and \+(.+) experience\. Spoils: (.+)\. You leveled up!$/, en: "$1 felled: +$2 WCoins and +$3 experience. Spoils: $4. You leveled up!", pt: "$1 abatido: +$2 WCoins e +$3 de experiência. Espólio: $4. Você subiu de nível!", es: "$1 abatido: +$2 WCoins y +$3 de experiencia. Botín: $4. ¡Subiste de nivel!" },
  { pattern: /^(.+) felled: \+(.+) WCoins and \+(.+) experience\. Spoils: (.+)\.$/, en: "$1 felled: +$2 WCoins and +$3 experience. Spoils: $4.", pt: "$1 abatido: +$2 WCoins e +$3 de experiência. Espólio: $4.", es: "$1 abatido: +$2 WCoins y +$3 de experiencia. Botín: $4." },
  { pattern: /^(.+) felled: \+(.+) WCoins and \+(.+) experience\. You leveled up!$/, en: "$1 felled: +$2 WCoins and +$3 experience. You leveled up!", pt: "$1 abatido: +$2 WCoins e +$3 de experiência. Você subiu de nível!", es: "$1 abatido: +$2 WCoins y +$3 de experiencia. ¡Subiste de nivel!" },
  { pattern: /^(.+) felled: \+(.+) WCoins and \+(.+) experience\.$/, en: "$1 felled: +$2 WCoins and +$3 experience.", pt: "$1 abatido: +$2 WCoins e +$3 de experiência.", es: "$1 abatido: +$2 WCoins y +$3 de experiencia." },
  { pattern: /^The hunt with (.+) dragged on and both fell back\.$/, en: "The hunt with $1 dragged on and both fell back.", pt: "A caçada com $1 se arrastou e os dois recuaram.", es: "La cacería con $1 se alargó y los dos retrocedieron." },
  { pattern: /^(.+) got the better of it: the hunt paid nothing\.$/, en: "$1 got the better of it: the hunt paid nothing.", pt: "$1 levou a melhor: a caçada não pagou nada.", es: "$1 se llevó la mejor parte: la cacería no pagó nada." },
  { pattern: /^Level \+(\d+) → \+(\d+)$/, en: "Level +$1 → +$2", pt: "Nível +$1 → +$2", es: "Nivel +$1 → +$2" },
  { pattern: /^The nick needs at least (\d+) letters\.$/, en: "The nick needs at least $1 letters.", pt: "O nick precisa de pelo menos $1 letras.", es: "El nick necesita al menos $1 letras." },
  { pattern: /^The nick can have at most (\d+) letters\.$/, en: "The nick can have at most $1 letters.", pt: "O nick pode ter no máximo $1 letras.", es: "El nick puede tener como máximo $1 letras." },
  { pattern: /^The name can only change again in (\d+) days\.$/, en: "The name can only change again in $1 days.", pt: "O nome só pode trocar de novo em $1 dias.", es: "El nombre solo puede cambiar de nuevo en $1 días." },
  { pattern: /^The name can only change again in (\d+) day\.$/, en: "The name can only change again in $1 day.", pt: "O nome só pode trocar de novo em $1 dia.", es: "El nombre solo puede cambiar de nuevo en $1 día." },
  { pattern: /^The name change costs (.+) and you are (.+) short\.$/, en: "The name change costs $1 and you are $2 short.", pt: "A troca de nome custa $1 e faltam $2.", es: "El cambio de nombre cuesta $1 y te faltan $2." },
  { pattern: /^Level (\d+) reached\.$/, en: "Level $1 reached.", pt: "Nível $1 alcançado.", es: "Nivel $1 alcanzado." },
  { pattern: /^Nível (\d+) alcançado\.$/, en: "Level $1 reached.", es: "Nivel $1 alcanzado." },
  { pattern: /^You regenerated (\d+) health\.$/, en: "You regenerated $1 health.", pt: "Você regenerou $1 de vida.", es: "Regeneraste $1 de vida." },
  { pattern: /^(.+) is not sold here\.$/, en: "$1 is not sold here.", pt: "$1 não é vendido aqui.", es: "$1 no se vende aquí." },
  { pattern: /^(.+) is a piece for (.+)\.$/, en: "$1 is a piece for $2.", pt: "$1 é peça para $2.", es: "$1 es una pieza para $2." },
  { pattern: /^Only (Lumni|Luna)$/, en: "Only $1", pt: "Apenas $1", es: "Solo $1" },
  { pattern: /^Requires LV\. (\d+)$/, en: "Requires LV. $1", pt: "Requer NV. $1", es: "Requiere NV. $1" },
  { pattern: /^Requires mining LV\. (\d+)$/, en: "Requires mining LV. $1", pt: "Requer mineração NV. $1", es: "Requiere minería NV. $1" },
  { pattern: /^Not enough WCoins for (.+)\.$/, en: "Not enough WCoins for $1.", pt: "WCoins insuficientes para $1.", es: "WCoins insuficientes para $1." },
  { pattern: /^(.+) bought for (.+)\.$/, en: "$1 bought for $2.", pt: "$1 comprado por $2.", es: "$1 comprado por $2." },
  { pattern: /^(.+) sold for (.+)\.$/, en: "$1 sold for $2.", pt: "$1 vendido por $2.", es: "$1 vendido por $2." },
  { pattern: /^You do not have that many (.+)\.$/, en: "You do not have that many $1.", pt: "Você não tem tantos $1.", es: "No tienes tantos $1." },
  { pattern: /^(.+) equipped on the (.+)\.$/, en: "$1 equipped on the $2.", pt: "$1 equipado: $2.", es: "$1 equipado: $2." },
  { pattern: /^Nothing equipped on the (.+)\.$/, en: "Nothing equipped on the $1.", pt: "Nada equipado: $1.", es: "Nada equipado: $1." },
  { pattern: /^(.+) stored in the bag\.$/, en: "$1 stored in the bag.", pt: "$1 guardado na mochila.", es: "$1 guardado en la mochila." },
  { pattern: /^(.+) cannot be equipped\.$/, en: "$1 cannot be equipped.", pt: "$1 não pode ser equipado.", es: "$1 no se puede equipar." },
  { pattern: /^(.+) is not consumable\.$/, en: "$1 is not consumable.", pt: "$1 não é consumível.", es: "$1 no es consumible." },
  { pattern: /^Nothing to restore with (.+) right now\.$/, en: "Nothing to restore with $1 right now.", pt: "Nada para restaurar com $1 agora.", es: "Nada que restaurar con $1 ahora." },
  { pattern: /^(.+) consumed: \+(\d+) health\.$/, en: "$1 consumed: +$2 health.", pt: "$1 consumido: +$2 de vida.", es: "$1 consumido: +$2 de vida." },
  { pattern: /^(.+) joined your pack\.$/, en: "$1 joined your pack.", pt: "$1 entrou para a sua matilha.", es: "$1 entró a tu manada." },
  { pattern: /^(.+) left your pack\.$/, en: "$1 left your pack.", pt: "$1 saiu da sua matilha.", es: "$1 salió de tu manada." },
  { pattern: /^(.+) is already in your pack\.$/, en: "$1 is already in your pack.", pt: "$1 já está na sua matilha.", es: "$1 ya está en tu manada." },
  { pattern: /^(.+) already runs in your pack\.$/, en: "$1 already runs in your pack.", pt: "$1 já corre na sua matilha.", es: "$1 ya corre en tu manada." },
  { pattern: /^The pack already has (\d+) names\. Remove one before keeping another\.$/, en: "The pack already has $1 names. Remove one before keeping another.", pt: "A matilha já tem $1 nomes. Remova um antes de guardar outro.", es: "La manada ya tiene $1 nombres. Quita uno antes de guardar otro." },
  { pattern: /^(\d+) names with that piece\. Write the whole nick\.$/, en: "$1 names with that piece. Write the whole nick.", pt: "$1 nomes com esse pedaço. Escreva o nick inteiro.", es: "$1 nombres con ese pedazo. Escribe el nick entero." },
  { pattern: /^(.+) is online\.$/, en: "$1 is online.", pt: "$1 está online.", es: "$1 está en línea." },
  { pattern: /^You already invited (.+) to the pack\.$/, en: "You already invited $1 to the pack.", pt: "Você já chamou $1 para a matilha.", es: "Ya invitaste a $1 a la manada." },
  { pattern: /^Invite sent to (.+)\.$/, en: "Invite sent to $1.", pt: "Convite enviado a $1.", es: "Invitación enviada a $1." },
  { pattern: /^(.+) short for the adoption\.$/, en: "$1 short for the adoption.", pt: "Faltam $1 para a adoção.", es: "Faltan $1 para la adopción." },
  { pattern: /^(.+) is no use to the companion\.$/, en: "$1 is no use to the companion.", pt: "$1 não serve para o mascote.", es: "$1 no le sirve al compañero." },
  { pattern: /^The companion takes (.+) and mends itself\.$/, en: "The companion takes $1 and mends itself.", pt: "O mascote toma $1 e se recompõe.", es: "El compañero toma $1 y se recompone." },
  { pattern: /^(.+) takes no forging\.$/, en: "$1 takes no forging.", pt: "$1 não aceita forja.", es: "$1 no acepta forja." },
  { pattern: /^At the \+(\d+) cap$/, en: "At the +$1 cap", pt: "No teto de +$1", es: "En el techo de +$1" },
  { pattern: /^(.+) is already at the \+(\d+) cap\.$/, en: "$1 is already at the +$2 cap.", pt: "$1 já está no teto de +$2.", es: "$1 ya está en el techo de +$2." },
  { pattern: /^(\d+) (.+) short of the next level\.$/, en: "$1 $2 short of the next level.", pt: "Faltam $1 $2 para o próximo nível.", es: "Faltan $1 $2 para el siguiente nivel." },
  { pattern: /^The strike asks for (.+) and the purse does not cover it\.$/, en: "The strike asks for $1 and the purse does not cover it.", pt: "A martelada pede $1 e a bolsa não cobre.", es: "El martillazo pide $1 y la bolsa no lo cubre." },
  { pattern: /^You already mined today's limit\. The vein reopens in (.+)\.$/, en: "You already mined today's limit. The vein reopens in $1.", pt: "Você já minerou o limite de hoje. O veio reabre em $1.", es: "Ya minaste el límite de hoy. La veta reabre en $1." },
  { pattern: /^(.+) asks for mining LV\. (\d+)\.$/, en: "$1 asks for mining LV. $2.", pt: "$1 pede mineração NV. $2.", es: "$1 pide minería NV. $2." },
  { pattern: /^The hunt is for ages (\d+) and up\.$/, en: "The hunt is for ages $1 and up.", pt: "A caçada é para maiores de $1 anos.", es: "La caza es para mayores de $1 años." },
  { pattern: /^(.+) is standing, whole and ready\.$/, en: "$1 is standing, whole and ready.", pt: "$1 está de pé, inteiro e pronto.", es: "$1 está de pie, entero y listo." },
  { pattern: /^(.+) is not resting\.$/, en: "$1 is not resting.", pt: "$1 não está em repouso.", es: "$1 no está en reposo." },
  { pattern: /^(.+): wait for the lap to finish\.$/, en: "$1: wait for the lap to finish.", pt: "$1: espere a volta terminar.", es: "$1: espera a que termine la vuelta." },
  {
    pattern: /^(.+?)( strikes | bites | sinks its claws into | sinks its teeth into | batters | tears the flank of | tears into | shreds | rips open | hits | mauls | lunges at )(.+) dealing (\d+) critical damage\.$/,
    en: "$1$2$3 dealing $4 critical damage.",
    pt: "$1$2$3 causando $4 de dano crítico.",
    es: "$1$2$3 causando $4 de daño crítico.",
  },
  {
    pattern: /^(.+?)( strikes | bites | sinks its claws into | sinks its teeth into | batters | tears the flank of | tears into | shreds | rips open | hits | mauls | lunges at )(.+) dealing (\d+) damage\.$/,
    en: "$1$2$3 dealing $4 damage.",
    pt: "$1$2$3 causando $4 de dano.",
    es: "$1$2$3 causando $4 de daño.",
  },
  { pattern: /^(.+) dodges the blow of (.+)\.$/, en: "$1 dodges the blow of $2.", pt: "$1 desvia do golpe de $2.", es: "$1 esquiva el golpe de $2." },
  { pattern: /^(.+) escapes the claws of (.+) by a hair\.$/, en: "$1 escapes the claws of $2 by a hair.", pt: "$1 escapa por um fio das garras de $2.", es: "$1 escapa por un pelo de las garras de $2." },
  { pattern: /^The pounce of (.+) grazes past (.+)\.$/, en: "The pounce of $1 grazes past $2.", pt: "O bote de $1 passa raspando por $2.", es: "El salto de $1 pasa rozando a $2." },
  { pattern: /^(.+) escapes the pounce of (.+)\.$/, en: "$1 escapes the pounce of $2.", pt: "$1 escapa do bote de $2.", es: "$1 escapa del salto de $2." },
  { pattern: /^(.+) rolls away from the attack of (.+)\.$/, en: "$1 rolls away from the attack of $2.", pt: "$1 rola para longe do ataque de $2.", es: "$1 rueda lejos del ataque de $2." },
  { pattern: /^The blow of (.+) cuts only wind\.$/, en: "The blow of $1 cuts only wind.", pt: "O golpe de $1 corta só o vento.", es: "El golpe de $1 corta solo el viento." },
  { pattern: /^(.+) sidesteps the pounce of (.+)\.$/, en: "$1 sidesteps the pounce of $2.", pt: "$1 se esquiva do bote de $2.", es: "$1 se aparta del salto de $2." },
  { pattern: /^(.+) hits (.+) square on, and it leaves the fight out of breath\.$/, en: "$1 hits $2 square on, and it leaves the fight out of breath.", pt: "$1 acerta $2 em cheio, que sai da luta sem fôlego.", es: "$1 golpea de lleno a $2, que sale de la pelea sin aliento." },
  { pattern: /^(.+) charges at (.+), which yelps and returns to the fight\.$/, en: "$1 charges at $2, which yelps and returns to the fight.", pt: "$1 investe contra $2, que gane e volta ao combate.", es: "$1 embiste a $2, que gañe y vuelve al combate." },
  { pattern: /^(.+) falls back panting, no breath left to stay in the fight\.$/, en: "$1 falls back panting, no breath left to stay in the fight.", pt: "$1 recua ofegante, sem fôlego para seguir na luta.", es: "$1 retrocede jadeando, sin aliento para seguir en la pelea." },
  { pattern: /^(.+) is (hunting|training|mining|forging|resting|idle)$/, en: "$1 is $2", pt: "$1 está $2", es: "$1 está $2" },
  {
    pattern: /^A shard torn from the (.+) vein\. No use as a weapon or an ornament: it is for the forge to strike again at the piece you already wear, until it answers better than the body\.$/,
    en: "A shard torn from the $1 vein. No use as a weapon or an ornament: it is for the forge to strike again at the piece you already wear, until it answers better than the body.",
    pt: "Lasca arrancada do veio de $1. Não serve de arma nem de enfeite: serve para a forja bater de novo na peça que você já usa, até ela responder melhor do que o corpo.",
    es: "Esquirla arrancada de la veta de $1. No sirve de arma ni de adorno: sirve para que la forja golpee de nuevo la pieza que ya usas, hasta que responda mejor que el cuerpo.",
  },
  // Equipment descriptions are the slot flavor joined to the set flavor; each
  // half has its own exact entry, so the rule splits on the slot's last period.
  {
    pattern: /^(Fur-lined leather with the flaps tied under the chin\. It hides what the face gives away when the beast starts to rise, and on a full night that spares explanations\.) (.+)$/,
    en: "$1 $2",
    pt: "$1 $2",
    es: "$1 $2",
  },
  {
    pattern: /^(It hangs over the chest and keeps the instinct awake even far from the trail\. The metal warms an instant before the prey appears, and the pack learned to trust that\.) (.+)$/,
    en: "$1 $2",
    pt: "$1 $2",
    es: "$1 $2",
  },
  {
    pattern: /^(Heavy leather and a fur collar covering the torso, which is where a beast aims when it recognizes another\. It is the piece that decides whether the bite becomes a scar to tell\.) (.+)$/,
    en: "$1 $2",
    pt: "$1 $2",
    es: "$1 $2",
  },
  {
    pattern: /^(Reinforced legs for the four-pawed run and the two-legged fall\. In a long chase, what gives first is never the arm\.) (.+)$/,
    en: "$1 $2",
    pt: "$1 $2",
    es: "$1 $2",
  },
  {
    pattern: /^(A firm sole for stone, mud and wet rooftops, loose enough for the foot that grows in the turning\. Reaching is half the hunt\.) (.+)$/,
    en: "$1 $2",
    pt: "$1 $2",
    es: "$1 $2",
  },
  {
    pattern: /^(Metal fangs for the fingers, useful on nights when yours have not come out yet\. It is the pack's blow, and the hand forgets it is armed until it sees the damage\.) (.+)$/,
    en: "$1 $2",
    pt: "$1 $2",
    es: "$1 $2",
  },
  {
    pattern: /^(Small, discreet, and still heavy in the hand\. It squeezes the finger when the fury climbs, like a short collar reminding who commands whom\.) (.+)$/,
    en: "$1 $2",
    pt: "$1 $2",
    es: "$1 $2",
  },
  { pattern: /^Potion \+ (.+)$/, en: "Potion + $1", pt: "Poção + $1", es: "Poción + $1" },
  { pattern: /^LV\. ([\d.,]+)$/, en: "LV. $1", pt: "NV. $1", es: "NV. $1" },
  { pattern: /^(.+) - LV\. ([\d.,]+)$/, en: "$1 - LV. $2", pt: "$1 - NV. $2", es: "$1 - NV. $2" },
  { pattern: /^(.+) \(LV\. ([\d.,]+)\)$/, en: "$1 (LV. $2)", pt: "$1 (NV. $2)", es: "$1 (NV. $2)" },
  { pattern: /^(.+), LV\. (\d+)\+$/, en: "$1, LV. $2+", pt: "$1, NV. $2+", es: "$1, NV. $2+" },
  { pattern: /^([\d.,]+) of ([\d.,]+) hunters with that name\.$/, en: "$1 of $2 hunters with that name.", pt: "$1 de $2 caçadores com esse nome.", es: "$1 de $2 cazadores con ese nombre." },
  { pattern: /^VIP active until (.+), not renewing\.$/, en: "VIP active until $1, not renewing.", pt: "VIP ativo até $1, sem renovar.", es: "VIP activo hasta $1, sin renovar." },
  { pattern: /^Active subscription, renews on (.+)\.$/, en: "Active subscription, renews on $1.", pt: "Assinatura ativa, renova em $1.", es: "Suscripción activa, se renueva el $1." },
  { pattern: /^(.+) closed\.$/, en: "$1 closed.", pt: "$1 fechou.", es: "$1 se cerró." },
  { pattern: /^(.+) · (.+)$/, en: "$1 · $2", pt: "$1 · $2", es: "$1 · $2" },

  // Keep last: forged names ("Gorro de Bronze +3") translate the base and keep the level.
  { pattern: /^(.+) \+(\d+)$/, en: "$1 +$2", pt: "$1 +$2", es: "$1 +$2" },
];

// English is the base language. A source string may be legacy Portuguese
// (resolved to English through BASE, or through the legacy RULES when it
// carries numbers) or already English (new code), in which case pt/es come
// straight from the English-keyed dictionaries.
function applyRule(template: string, match: RegExpMatchArray, locale: Locale, depth: number): string {
  // Captures are translated on their own, so a rule like "$1 +$2" can carry
  // an item name or another translated phrase through.
  return template.replace(/\$(\d)/g, (_, index: string) =>
    translate(match[Number(index)] ?? "", locale, depth + 1),
  );
}

export function translate(text: string, locale: Locale, depth = 0): string {
  if (locale === "pt") {
    // English-born strings translate here; legacy Portuguese passes through.
    const direct = PT[text];
    if (direct !== undefined) return direct;
    if (depth < 3) {
      for (const rule of RULES) {
        if (rule.pt === undefined) continue;
        const match = text.match(rule.pattern);
        if (match) return applyRule(rule.pt, match, locale, depth);
      }
    }
    return text;
  }

  const english = BASE[text];
  if (english !== undefined) {
    if (locale === "en") return english;
    return ES[english] ?? english;
  }

  if (depth < 3) {
    for (const rule of RULES) {
      const template = locale === "en" ? rule.en : rule.es;
      if (template === undefined) continue;
      const match = text.match(rule.pattern);
      if (match) return applyRule(template, match, locale, depth);
    }
  }

  // Already English (new code): identity for en, exact lookup for es.
  if (locale === "en") return text;
  return ES[text] ?? text;
}
