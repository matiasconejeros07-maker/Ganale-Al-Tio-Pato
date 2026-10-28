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

const RUN = "newData.parent().parent().parent().child('runs').child($uid)";          // desde wallets/$uid/<campo> o scores/$uid/<campo>
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
    p: { '.validate': `newData.isNumber() && !data.exists() && ${P}.hasChildren(['s', 'b', 'r', 'e', 'h']) && newData.val() === ${P}.child('r').val() * ${pesosExp(`${P}.child('h').val()`)}` },
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
      $other: { '.validate': false }
    }
  },

  // ---- cartera: c = pesos ganados · sp = gastados · lr = última partida cobrada · own = compras · eq = lo que llevas puesto ----
  // Los pesos solo suben cobrando UNA partida terminada (exactamente lo que valió) y cada partida se cobra una sola vez.
  wallets: { $uid: {
    '.read': 'auth != null && auth.uid === $uid',
    '.write': 'auth != null && auth.uid === $uid',
    '.validate': "newData.hasChildren(['c', 'sp'])",
    c: { '.validate': `newData.isNumber() && newData.val() % 1 === 0 && newData.val() >= 0 && newData.val() <= ${ECO.cMax}`
      + " && (newData.val() === (data.exists() ? data.val() : 0)"
      + ` || (${P}.child('lr').exists() && (!data.parent().child('lr').exists() || ${P}.child('lr').val() > data.parent().child('lr').val())`
      + ` && newData.val() - (data.exists() ? data.val() : 0) === ${RUN}.child('p').val()))` },
    sp: { '.validate': `newData.isNumber() && newData.val() % 1 === 0 && newData.val() >= 0 && (!data.exists() || newData.val() >= data.val()) && newData.val() <= ${P}.child('c').val()` },
    lr: { '.validate': `newData.isNumber() && newData.val() === ${RUN}.child('s').val() && ${RUN}.child('e').exists() && (!data.exists() || newData.val() > data.val())` },
    own, eq,
    $other: { '.validate': false }
  } }
} };
fs.writeFileSync(path.join(dir, 'firebase-rules.json'), JSON.stringify(rules, null, 2) + '\n');
console.log('firebase-rules.json generado:', Object.keys(own).length - 1, 'artículos de pago');
