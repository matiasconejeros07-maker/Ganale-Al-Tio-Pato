#!/usr/bin/env node
// Genera firebase-rules.json a partir del catálogo de tienda.js.
// Así Firebase valida lo mismo que el juego: precios, recompensas y el tiempo real que dura una partida.
// Cada campo lleva sus propias comprobaciones (no se confía en reglas del nodo padre), para que no se puedan saltar escribiendo una sola ruta.
const fs = require('fs'), path = require('path'), vm = require('vm');
const dir = path.join(__dirname, '..');
const ctx = { window: {} }; vm.createContext(ctx);
vm.runInContext(fs.readFileSync(path.join(dir, 'tienda.js'), 'utf8'), ctx);
const T = ctx.window.TIENDA, ECO = T.eco, E = ECO.tier;
const CATS = ['ch', 'bg', 'pad', 'ball'];
const MAIL = '@tio-pato.invalid';
// pesos por punto de cada pelota (ball[].rate): se escribe como una cadena de «?:» sobre el id de la pelota que quedó anotada al empezar la partida
const rateExp = b => '(' + T.ball.map(i => `${b} === '${i.id}' ? ${i.rate}`).join(' : ') + ' : 0)';

// pesos ganados con h rebotes: $1 por rebote del 1 al 99, $2 del 100 al 199, $3 del 200 al 299…
// h + E·t(t−1)/2 + t·(h − E·t + 1), con t = ⌊h/E⌋ (las reglas no tienen variables locales, por eso se repite la expresión).
const tExp = h => `((${h} - ${h} % ${E}) / ${E})`;
const pesosExp = h => `(${h} + ${E} * ${tExp(h)} * (${tExp(h)} - 1) / 2 + ${tExp(h)} * (${h} - ${E} * ${tExp(h)} + 1))`;

const RUN = "newData.parent().parent().parent().child('runs').child($uid)";
const AVATAR = "newData.isString() && newData.val().matches(/^e[0-9A-Za-z_-]{4}([0-9A-Za-z_-]{4}){1,3}$/)";       // foto de perfil (emblema): 'e' + 4 de forma/colores/diseño + de 1 a 3 símbolos de 4 caracteres


// ---- racha diaria ----
// Todo lo decide el servidor: el día (medianoche del huso de Chile), si la racha sigue o se corta, cuánto se paga y cuándo empieza el «pesos dobles».
// Las reglas no tienen variables locales, por eso las fórmulas se escriben completas con funciones que devuelven texto.
const R = ECO.racha, DAY = 86400000, OFF = R.huso * 3600000;
const dayOf = ts => `((${ts} + (${OFF}) - (${ts} + (${OFF})) % ${DAY}) / ${DAY})`;        // número de día (entero) de una hora en ms
const TODAY = dayOf('now');
const STR = "newData.parent().parent().parent().child('streaks').child($uid)";           // la racha de esta cuenta, vista desde la cartera (ya con lo que se está escribiendo)
const STR_ROOT = "root.child('streaks').child($uid)";                                     // la racha de esta cuenta, vista desde una partida
// n que le toca a la racha: la primera vez 1 · al día siguiente del último cobro n+1 · después de saltarse un día, 1 · el mismo día, -1 (no vale)
const NEXT_N = "(data.parent().child('n').exists() ? (" + `${TODAY} === ${dayOf("data.parent().child('t').val()")} + 1 ? data.parent().child('n').val() + 1 : (${TODAY} > ${dayOf("data.parent().child('t').val()")} ? 1 : -1)` + ") : 1)";
const rewardExp = n => '(' + R.dias.map((v, i) => `(${n} - 1) % ${R.dias.length} === ${i} ? ${v}`).join(' : ') + ' : 0)';
const BOOST = `(${STR_ROOT}.child('bx').exists() && ${P_ROOT_S()} >= ${STR_ROOT}.child('bx').val() && ${P_ROOT_S()} < ${STR_ROOT}.child('bx').val() + ${R.dobleMs} ? 2 : 1)`;
function P_ROOT_S() { return "newData.parent().child('s').val()"; }
// contador de puestos (hist): SC = tu fila de scores antes de la escritura · NS = tu fila de scores después
const SC = "root.child('scores').child(auth.uid)", NS = "newData.parent().parent().child('scores').child(auth.uid)";
const HIST_INC = `newData.val() === (data.exists() ? data.val() : 0) + 1 && ${NS}.child('c').val() + '' === $b && (!${SC}.child('c').exists() || ${SC}.child('c').val() + '' !== $b)`;
const HIST_DEC = `data.exists() && newData.val() === data.val() - 1 && ${SC}.child('c').exists() && ${SC}.child('c').val() + '' === $b && ${NS}.child('c').exists() && ${NS}.child('c').val() + '' !== $b`;          // desde wallets/$uid/<campo> o scores/$uid/<campo>
const defaults = {}; for (const c of CATS) defaults[c] = T[c][0].id;

const own = {};
for (const c of CATS) for (const it of T[c].filter(i => i.price > 0))
  own[`${c}_${it.id}`] = { '.validate': `newData.val() === true && (data.exists() || newData.parent().parent().child('sp').val() - root.child('wallets').child(auth.uid).child('sp').val() >= ${it.price})` };
own['$other'] = { '.validate': false };
const eq = {};
for (const c of CATS) eq[c] = { '.validate': `newData.isString() && (newData.val() === '${defaults[c]}' || newData.parent().parent().child('own').child('${c}_' + newData.val()).val() === true)` };
eq['$other'] = { '.validate': false };

const P = "newData.parent()";
const rules = { rules: {
  '.read': false, '.write': false,

  // ---- partidas: el servidor pone la hora de inicio y la de fin. Los rebotes no pueden ser más de los que caben en ese tiempo,
  //      y los pesos de la partida los fijan las reglas (no el jugador): pelota usada (b, tiene que ser tuya) → pesos por punto (r) → total (p).
  //      Una partida terminada no se puede volver a terminar. ----
  runs: { $uid: {
    '.read': 'auth != null && auth.uid === $uid',
    '.write': 'auth != null && auth.uid === $uid',
    '.validate': "newData.hasChildren(['s', 'b', 'r'])",
    s: { '.validate': 'newData.isNumber() && (newData.val() === now || newData.val() === data.val())' },
    b: { '.validate': `newData.isString() && (newData.val() === '${defaults.ball}' || root.child('wallets').child($uid).child('own').child('ball_' + newData.val()).val() === true)` },
    r: { '.validate': `newData.isNumber() && newData.val() === ${rateExp(`${P}.child('b').val()`)}` },
    e: { '.validate': `newData.isNumber() && newData.val() === now && !data.exists() && data.parent().child('s').exists() && ${P}.child('s').val() === data.parent().child('s').val() && ${P}.hasChildren(['s', 'b', 'r', 'h', 'p'])` },
    h: { '.validate': `newData.isNumber() && newData.val() % 1 === 0 && newData.val() >= 0 && newData.val() <= ${ECO.hMax} && !data.exists() && ${P}.hasChildren(['s', 'b', 'r', 'e', 'p'])`
      + ` && newData.val() * ${ECO.msPorRebote} <= now - ${P}.child('s').val() + ${ECO.holguraMs}` },
    p: { '.validate': `newData.isNumber() && !data.exists() && ${P}.hasChildren(['s', 'b', 'r', 'e', 'h']) && newData.val() === ${P}.child('r').val() * ${pesosExp(`${P}.child('h').val()`)} * ${BOOST}` },
    $other: { '.validate': false }
  } },

  // ---- marcadores: cada cuenta escribe solo lo suyo, nunca baja y no puede superar los rebotes de su partida terminada ----
  scores: {
    '.read': true, '.indexOn': ['s'],
    $uid: {
      '.write': "auth != null && auth.uid === $uid && (!data.exists() || newData.child('s').val() >= data.child('s').val())",
      '.validate': "newData.hasChildren(['n', 'k', 's', 't'])",
      n: { '.validate': 'newData.isString() && newData.val().length >= 1 && newData.val().length <= 16' },
      k: { '.validate': `newData.isString() && newData.val().matches(/^[a-z0-9.]{3,24}$/) && auth.token.email === newData.val() + '${MAIL}'` },
      s: { '.validate': `newData.isNumber() && newData.val() % 1 === 0 && newData.val() >= 0 && newData.val() <= ${ECO.hMax} && ${RUN}.child('e').exists() && newData.val() <= ${RUN}.child('h').val()` },
      t: { '.validate': 'newData.val() === now' },
      a: { '.validate': AVATAR },                                                         // foto de perfil que ven los demás en el marcador (solo el formato i00c00)
      // c = el puntaje que ya está contado en `hist` (así cada cuenta cuenta una sola vez y se puede mover de casilla al mejorar). Solo sube y siempre es igual al puntaje de ese momento.
      c: { '.validate': `newData.isNumber() && newData.val() % 1 === 0 && newData.val() >= 0 && newData.val() <= ${ECO.hMax} && newData.val() === ${P}.child('s').val() && (!data.exists() || newData.val() > data.val())` },
      $other: { '.validate': false }
    }
  },

  // ---- contador de puestos: hist/<puntaje> = cuántas cuentas tienen ese puntaje. Con esto el puesto de cualquiera se calcula leyendo ~500 números
  //      (unos 4 KB) sea cual sea la cantidad de jugadores, en vez de bajar toda la lista. Cada casilla solo se mueve de a 1 y solo si la misma cuenta
  //      que escribe acaba de pasar a (o salir de) esa casilla en `scores/<su uid>/c`. ----
  hist: {
    '.read': true,
    $b: {
      '.validate': 'newData.isNumber() && newData.val() % 1 === 0 && newData.val() >= 0 && $b.matches(/^([0-9]|[1-9][0-9]|[1-4][0-9][0-9]|500)$/)',
      '.write': `auth != null && (${HIST_INC} || ${HIST_DEC})`
    }
  },

  // ---- racha diaria: n = días seguidos · t = hora del último cobro (la pone el servidor) · bx = hora en que empezó el último «pesos dobles» (día 7).
  //      Cada cobro mueve n y t juntos al valor exacto que toca; la recompensa en pesos la valida la cartera (c) y no se puede borrar la racha para cobrar otra vez. ----
  streaks: { $uid: {
    '.read': 'auth != null && auth.uid === $uid',
    '.write': 'auth != null && auth.uid === $uid && newData.exists()',
    '.validate': "newData.hasChildren(['n', 't'])",
    n: { '.validate': `newData.isNumber() && newData.val() % 1 === 0 && newData.val() >= 1 && newData.val() <= 100000 && newData.val() === ${NEXT_N} && ${P}.child('t').val() === now` },
    t: { '.validate': `newData.isNumber() && newData.val() === now && ${P}.child('n').val() === ${NEXT_N}` },
    bx: { '.validate': `newData.isNumber() && (newData.val() === data.val() || (newData.val() === now && ${P}.child('t').val() === now && (${P}.child('n').val() - 1) % ${R.dias.length} === ${R.dias.length - 1}))` },
    $other: { '.validate': false }
  } },

  // ---- cartera: c = pesos ganados · sp = gastados · lr = última partida cobrada · own = compras · eq = lo que llevas puesto ----
  // Los pesos solo suben cobrando UNA partida terminada (exactamente lo que valió) y cada partida se cobra una sola vez.
  wallets: { $uid: {
    '.read': 'auth != null && auth.uid === $uid',
    '.write': 'auth != null && auth.uid === $uid',
    '.validate': "newData.hasChildren(['c', 'sp'])",
    c: { '.validate': `newData.isNumber() && newData.val() % 1 === 0 && newData.val() >= 0 && newData.val() <= ${ECO.cMax}`
      + " && (newData.val() === (data.exists() ? data.val() : 0)"
      + ` || (${P}.child('lr').exists() && (!data.parent().child('lr').exists() || ${P}.child('lr').val() > data.parent().child('lr').val())`
      + ` && newData.val() - (data.exists() ? data.val() : 0) === ${RUN}.child('p').val())`
      + ` || (${STR}.child('t').val() === now && newData.val() - (data.exists() ? data.val() : 0) === ${rewardExp(`${STR}.child('n').val()`)}))` },
    sp: { '.validate': `newData.isNumber() && newData.val() % 1 === 0 && newData.val() >= 0 && (!data.exists() || newData.val() >= data.val()) && newData.val() <= ${P}.child('c').val()` },
    lr: { '.validate': `newData.isNumber() && newData.val() === ${RUN}.child('s').val() && ${RUN}.child('e').exists() && (!data.exists() || newData.val() > data.val())` },
    av: { '.validate': AVATAR },                                                           // tu foto de perfil (se sincroniza entre tus dispositivos)
    own, eq,
    $other: { '.validate': false }
  } }
} };
fs.writeFileSync(path.join(dir, 'firebase-rules.json'), JSON.stringify(rules, null, 2) + '\n');
console.log('firebase-rules.json generado:', Object.keys(own).length - 1, 'artículos de pago');
