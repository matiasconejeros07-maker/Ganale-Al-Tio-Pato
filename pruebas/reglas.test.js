// Pruebas de las reglas de Firebase (firebase-rules.json) con el simulador oficial (targaryen): economía, antitrampas y permisos.
// Uso:  cd pruebas && npm install && node reglas.test.js
const targaryen = require('targaryen');
const path = require('path');
const JUEGO = process.env.JUEGO || path.join(__dirname, '..') + '/';
const fs = require('fs'), vm = require('vm');
const rules = JSON.parse(fs.readFileSync(JUEGO + 'firebase-rules.json', 'utf8'));
const cx = { window: {} }; vm.createContext(cx); vm.runInContext(fs.readFileSync(JUEGO + 'tienda.js', 'utf8'), cx);
const ECO = cx.window.TIENDA.eco, E = ECO.tier;
const pesosFor = (h, r = 1) => { const t = Math.floor(h / E); return r * (h + E * t * (t - 1) / 2 + t * (h - E * t + 1)); };
const START = { s: { '.sv': 'timestamp' }, b: 'peso1', r: 1 };
let pass = 0, fail = 0;
const N = Date.now(), T0 = N, SV = { '.sv': 'timestamp' };
const A = uid => ({ uid, token: { email: 'matias@tio-pato.invalid' } });
// targaryen ignora with({now}) y usa la hora real: se desplazan hacia atrás las horas guardadas y escritas para simular 'now'
const isT = (k, v) => ['s', 'e', 'lr'].includes(k) && typeof v === 'number' && v >= T0 - 5e6;
function shiftObj(o, off) { if (!o || typeof o !== 'object') return o; const c = Array.isArray(o) ? [] : {}; for (const k in o) c[k] = (o[k] && typeof o[k] === 'object' && !o[k]['.sv']) ? shiftObj(o[k], off) : (isT(k, o[k]) ? o[k] - off : o[k]); return c; }
function db(data, now, uid = 'u1') {
  const off = now - Date.now(), base = () => targaryen.database(rules, shiftObj(data || {}, off)).as(A(uid));
  const sh = (path, v) => (v && typeof v === 'object' && !v['.sv']) ? shiftObj(v, off) : (isT(path.split('/').pop(), v) ? v - off : v);
  return {
    write: (p, v) => base().write(p, sh(p, v)),
    update: (p, o) => { const m = {}; for (const k in o) m[k] = sh(k, o[k]); return base().update(p, m); },
    read: p => base().read(p)
  };
}
function ok(name, res, want) {
  const got = !!res.allowed;
  if (got === want) { pass++; console.log('  ok  ', name); }
  else { fail++; console.log('  FALLA', name, '→ permitido=' + got, 'esperado=' + want, (res.info || '').toString().split('\n').slice(0, 3).join(' | ').slice(0, 300)); }
  return res;
}
const next = (res, data) => res.newDatabase ? res.newDatabase.root.$value ? res.newDatabase.root.$value() : data : data;
// estado de la base tras escribir (para encadenar pasos)
const snap = res => JSON.parse(JSON.stringify(res.newDatabase.rules ? res.newDatabase.root.$value() : {}));

console.log('pesosFor:', [1, 99, 100, 101, 199, 200, 300, 500].map(h => h + '→' + pesosFor(h)).join('  '));

// ---------- 1. inicio de partida ----------
console.log('Inicio de partida');
let r = ok('PUT runs/u1 {s: now, b: peso1, r: 1}', db({}, T0).write('/runs/u1', START), true);
ok('inicio sin pelota ni tasa', db({}, T0).write('/runs/u1', { s: SV }), false);
ok('inicio con tasa inventada (peso1 pagando 20)', db({}, T0).write('/runs/u1', { s: SV, b: 'peso1', r: 20 }), false);
ok('inicio con pelota que no es tuya', db({}, T0).write('/runs/u1', { s: SV, b: 'b20000', r: 20 }), false);
ok('inicio con pelota inexistente', db({}, T0).write('/runs/u1', { s: SV, b: 'regalo', r: 99 }), false);
const owner = { wallets: { u1: { c: 9000, sp: 7000, own: { ball_b1000: true, ball_peso50: true } } } };
ok('inicio con el billete de $1.000 que sí tienes (7 por punto)', db(owner, T0).write('/runs/u1', { s: SV, b: 'b1000', r: 7 }), true);
ok('… con la tasa de otra pelota (8)', db(owner, T0).write('/runs/u1', { s: SV, b: 'b1000', r: 8 }), false);
ok('inicio con la moneda de $50 (4 por punto)', db(owner, T0).write('/runs/u1', { s: SV, b: 'peso50', r: 4 }), true);
ok('PUT runs/u1 con hora inventada', db({}, T0).write('/runs/u1', { s: T0 - 999999 }), false);
ok('PUT runs/u1 con campos extra', db({}, T0).write('/runs/u1', { ...START, h: 5 }), false);
ok('escribir en la partida de otra cuenta', db({}, T0, 'u2').write('/runs/u1', START), false);

// ---------- 2. fin de partida + cobro atómico ----------
console.log('Cobro de una partida');
const started = { runs: { u1: { s: T0, b: 'peso1', r: 1 } } };
const claim = (h, over = {}, wal = { c: 0, sp: 0 }, p = pesosFor(h)) => Object.assign({
  'runs/u1/e': SV, 'runs/u1/h': h, 'runs/u1/p': p,
  'wallets/u1/c': (wal.c || 0) + p, 'wallets/u1/sp': wal.sp || 0, 'wallets/u1/lr': T0
}, over);
ok('60 rebotes tras 60 s, cobro completo', db(started, T0 + 60000).update('/', claim(60)), true);
ok('60 rebotes tras 23 s (muy rápido)', db(started, T0 + 23000).update('/', claim(60)), false);
ok('150 rebotes tras 60 s (más de los que caben)', db(started, T0 + 60000).update('/', claim(150)), false);
ok('30 rebotes en 10,6 s (justo dentro del límite)', db(started, T0 + 10600).update('/', claim(30)), true);
ok('30 rebotes en 10,4 s (justo fuera)', db(started, T0 + 10400).update('/', claim(30)), false);
ok('p inflado (+1)', db(started, T0 + 90000).update('/', claim(60, { 'runs/u1/p': 61, 'wallets/u1/c': 61 })), false);
ok('c inflado respecto a p', db(started, T0 + 90000).update('/', claim(60, { 'wallets/u1/c': 5000 })), false);
ok('120 rebotes (tramo ×2) paga 141', db(started, T0 + 130000).update('/', claim(120)), true);
ok('120 rebotes pagados como 120', db(started, T0 + 130000).update('/', claim(120, { 'runs/u1/p': 120, 'wallets/u1/c': 120 })), false);
ok('250 rebotes paga 250+100+2*? (tramo ×3)', db(started, T0 + 240000).update('/', claim(250)), true);
ok('h=501 (sobre el tope) aunque haya pasado una hora', db(started, T0 + 3600000).update('/', claim(501)), false);
ok('h=500 tras 4 min', db(started, T0 + 240000).update('/', claim(500)), true);
ok('h decimal', db(started, T0 + 90000).update('/', claim(60.5, { 'runs/u1/p': 60 , 'wallets/u1/c': 60})), false);
ok('h negativo', db(started, T0 + 90000).update('/', claim(-5, { 'runs/u1/p': -5, 'wallets/u1/c': -5 })), false);
ok('con hora de fin inventada (más tarde)', db(started, T0 + 90000).update('/', claim(60, { 'runs/u1/e': T0 + 90000 + 500000 })), false);
ok('cobro de partida sin terminar (solo c y lr)', db(started, T0 + 90000).update('/', { 'wallets/u1/c': 50, 'wallets/u1/sp': 0, 'wallets/u1/lr': T0 }), false);
ok('regalo directo de monedas', db({ wallets: { u1: { c: 10, sp: 0 } } }, T0).write('/wallets/u1/c', 1000000), false);
ok('regalo con c y lr inventados', db({ wallets: { u1: { c: 10, sp: 0 } } }, T0).update('/wallets/u1', { c: 1000, lr: 12345 }), false);
ok('crear cartera ya con monedas', db({}, T0).write('/wallets/u1', { c: 5000, sp: 0 }), false);
ok('crear cartera vacía', db({}, T0).write('/wallets/u1', { c: 0, sp: 0 }), true);
ok('fin de partida con h sin p', db(started, T0 + 90000).update('/', { 'runs/u1/e': SV, 'runs/u1/h': 60 }), false);
ok('s cambiado al terminar', db(started, T0 + 90000).update('/', claim(60, { 'runs/u1/s': T0 + 80000 })), false);

console.log('Pesos por pelota');
const startedB = { runs: { u1: { s: T0, b: 'b1000', r: 7 } }, wallets: { u1: { c: 9000, sp: 7000, own: { ball_b1000: true } } } };
const claimB = (h, p, wal = { c: 9000, sp: 7000 }) => ({ 'runs/u1/e': SV, 'runs/u1/h': h, 'runs/u1/p': p, 'wallets/u1/c': wal.c + p, 'wallets/u1/sp': wal.sp, 'wallets/u1/lr': T0 });
ok('50 rebotes con el billete de $1.000: 7 × 50 = 350', db(startedB, T0 + 60000).update('/', claimB(50, pesosFor(50, 7))), true);
ok('… cobrando de menos (50, como moneda de $1): tampoco, el total lo fijan las reglas', db(startedB, T0 + 60000).update('/', claimB(50, pesosFor(50, 1))), false);
ok('… cobrando 20 por punto', db(startedB, T0 + 60000).update('/', claimB(50, pesosFor(50, 20))), false);
ok('… cobrando 8 por punto', db(startedB, T0 + 60000).update('/', claimB(50, pesosFor(50, 8))), false);
ok('120 rebotes con el billete: 7 × 141 = 987', db(startedB, T0 + 130000).update('/', claimB(120, pesosFor(120, 7))), true);
ok('… 7 × 120 (sin las monedas dobles) también', db(startedB, T0 + 130000).update('/', claimB(120, 7 * 120)), false);
const started20 = { runs: { u1: { s: T0, b: 'b20000', r: 20 } }, wallets: { u1: { c: 90000, sp: 20000, own: { ball_b20000: true } } } };
ok('100 rebotes con el billete de $20.000: 20 × 101', db(started20, T0 + 60000).update('/', claimB(100, pesosFor(100, 20), { c: 90000, sp: 20000 })), true);
const startedFake = { runs: { u1: { s: T0, b: 'peso1', r: 1 } }, wallets: { u1: { c: 100, sp: 0 } } };
ok('partida con peso1 cobrada como billete de 20 (p inflado)', db(startedFake, T0 + 60000).update('/', claimB(50, pesosFor(50, 20), { c: 100, sp: 0 })), false);
ok('cambiar la pelota anotada después de empezar a una que no tienes', db(startedFake, T0 + 60000).update('/runs/u1', { b: 'b20000' }), false);
ok('cambiar la tasa anotada después de empezar (r = 20 con peso1)', db(startedFake, T0 + 60000).update('/runs/u1', { r: 20 }), false);
// ---------- 3. no se puede cobrar dos veces ----------
console.log('Repeticiones');
const doneDb = db(started, T0 + 60000).update('/', claim(60));
const afterClaim = { runs: { u1: { s: T0, b: 'peso1', r: 1, e: T0 + 60000, h: 60, p: 60 } }, wallets: { u1: { c: 60, sp: 0, lr: T0 } }, scores: {} };
ok('terminar otra vez la misma partida (PATCH)', db(afterClaim, T0 + 120000).update('/', { 'runs/u1/e': SV, 'runs/u1/h': 500, 'runs/u1/p': pesosFor(500) }), false);
ok('terminar otra vez (PUT completo con la misma s)', db(afterClaim, T0 + 120000).write('/runs/u1', { s: T0, b: 'peso1', r: 1, e: SV, h: 200, p: pesosFor(200) }), false);
ok('cobrar otra vez la misma partida', db(afterClaim, T0 + 120000).update('/wallets/u1', { c: 120, lr: T0 }), false);
ok('retroceder lr', db(afterClaim, T0 + 120000).update('/wallets/u1', { c: 120, lr: T0 - 1000 }), false);
ok('borrar la partida y reescribirla terminada', db(afterClaim, T0 + 120000).write('/runs/u1', { s: T0 + 120000, b: 'b20000', r: 20, e: T0 + 120000, h: 500, p: 30100 }), false);
// nueva partida
const run2 = db(afterClaim, T0 + 200000).write('/runs/u1', START); ok('empezar la partida 2', run2, true);
const started2 = { runs: { u1: { s: T0 + 200000, b: 'peso1', r: 1 } }, wallets: { u1: { c: 60, sp: 0, lr: T0 } } };
ok('cobrar la partida 2 (40 rebotes en 40 s)', db(started2, T0 + 240000).update('/', { 'runs/u1/e': SV, 'runs/u1/h': 40, 'runs/u1/p': 40, 'wallets/u1/c': 100, 'wallets/u1/sp': 0, 'wallets/u1/lr': T0 + 200000 }), true);
ok('cobrar la partida 2 sin avanzar lr', db(started2, T0 + 240000).update('/', { 'runs/u1/e': SV, 'runs/u1/h': 40, 'runs/u1/p': 40, 'wallets/u1/c': 100, 'wallets/u1/sp': 0 }), false);
ok('cobrar la partida 2 con lr de la partida 1', db(started2, T0 + 240000).update('/', { 'runs/u1/e': SV, 'runs/u1/h': 40, 'runs/u1/p': 40, 'wallets/u1/c': 100, 'wallets/u1/sp': 0, 'wallets/u1/lr': T0 }), false);
// reintento tras perder conexión: la partida 2 se termina más tarde que cuando se jugó
ok('reintento 10 min después (más tiempo → válido)', db(started2, T0 + 800000).update('/', { 'runs/u1/e': SV, 'runs/u1/h': 40, 'runs/u1/p': 40, 'wallets/u1/c': 100, 'wallets/u1/sp': 0, 'wallets/u1/lr': T0 + 200000 }), true);
// pasos separados (terminar y luego cobrar) también funcionan
const endOnly = db(started2, T0 + 240000).update('/', { 'runs/u1/e': SV, 'runs/u1/h': 40, 'runs/u1/p': 40 }); ok('terminar sin cobrar aún', endOnly, true);
const ended2 = { runs: { u1: { s: T0 + 200000, e: T0 + 240000, h: 40, p: 40 } }, wallets: { u1: { c: 60, sp: 0, lr: T0 } } };
ok('cobrarla después', db(ended2, T0 + 250000).update('/wallets/u1', { c: 100, lr: T0 + 200000 }), true);
ok('cobrarla de más después', db(ended2, T0 + 250000).update('/wallets/u1', { c: 160, lr: T0 + 200000 }), false);
ok('cobrarla dos veces con otro c', db({ ...ended2, wallets: { u1: { c: 100, sp: 0, lr: T0 + 200000 } } }, T0 + 250000).update('/wallets/u1', { c: 140, lr: T0 + 200000 }), false);

// ---------- 4. marcadores ----------
console.log('Marcadores');
const sc = (s, over = {}) => Object.assign({ n: 'Matías', k: 'matias', s, t: SV }, over);
ok('guardar récord = rebotes de la partida', db(afterClaim, T0 + 130000).write('/scores/u1', sc(60)), true);
ok('récord mayor que la partida', db(afterClaim, T0 + 130000).write('/scores/u1', sc(61)), false);
ok('récord sin partida terminada', db({}, T0).write('/scores/u1', sc(5)), false);
ok('récord con partida solo iniciada', db(started, T0 + 130000).write('/scores/u1', sc(1)), false);
ok('escribir solo s enorme', db(afterClaim, T0).write('/scores/u1/s', 99999), false);
ok('escribir solo s dentro del límite', db({ ...afterClaim, scores: { u1: { n: 'M', k: 'matias', s: 10, t: 5 } } }, T0).write('/scores/u1/s', 60), true);
ok('bajar el récord', db({ ...afterClaim, scores: { u1: { n: 'M', k: 'matias', s: 60, t: 5 } } }, T0).write('/scores/u1', sc(30)), false);
ok('nombre de otra cuenta (k)', db(afterClaim, T0 + 130000).write('/scores/u1', sc(60, { k: 'otro' })), false);
ok('campo extra', db(afterClaim, T0 + 130000).write('/scores/u1', sc(60, { x: 1 })), false);
ok('escribir el puntaje de otra cuenta', db(afterClaim, T0 + 130000, 'u2').write('/scores/u1', sc(60)), false);
ok('récord y cobro en una sola escritura atómica', db(started, T0 + 60000).update('/', Object.assign(claim(60), { 'scores/u1': sc(60) })), true);
ok('… con récord inflado', db(started, T0 + 60000).update('/', Object.assign(claim(60), { 'scores/u1': sc(61) })), false);

// ---------- 5. tienda ----------
console.log('Tienda');
const rich = { wallets: { u1: { c: 1000, sp: 0, lr: T0 } } };
ok('comprar Tía Patita ($150) pagando 150', db(rich, T0).update('/wallets/u1', { sp: 150, 'own/ch_tia': true }), true);
ok('comprar Tía Patita pagando 149', db(rich, T0).update('/wallets/u1', { sp: 149, 'own/ch_tia': true }), false);
ok('… con el precio de antes ($50)', db(rich, T0).update('/wallets/u1', { sp: 50, 'own/ch_tia': true }), false);
ok('comprar Tío Pato Conejo ($300) pagando 299', db(rich, T0).update('/wallets/u1', { sp: 299, 'own/ch_conejo': true }), false);
ok('comprar Tío Pato Conejo ($300) pagando 300', db(rich, T0).update('/wallets/u1', { sp: 300, 'own/ch_conejo': true }), true);
ok('comprar Tía Patita Conejita ($300) pagando 300', db(rich, T0).update('/wallets/u1', { sp: 300, 'own/ch_conejita': true }), true);
ok('… pagando 200 (precio de antes)', db(rich, T0).update('/wallets/u1', { sp: 200, 'own/ch_conejita': true }), false);
ok('comprar Tíos Patitos ($600) pagando 600', db(rich, T0).update('/wallets/u1', { sp: 600, 'own/ch_tios': true }), true);
ok('comprar Tío Pato Simi ($600) pagando 599', db(rich, T0).update('/wallets/u1', { sp: 599, 'own/ch_bigotes': true }), false);
ok('comprar Tío Pato Simi pagando 600', db(rich, T0).update('/wallets/u1', { sp: 600, 'own/ch_bigotes': true }), true);
ok('comprar la moneda de $5 pagando 5', db(rich, T0).update('/wallets/u1', { sp: 5, 'own/ball_peso5': true }), true);
ok('comprar la moneda de $5 pagando 4', db(rich, T0).update('/wallets/u1', { sp: 4, 'own/ball_peso5': true }), false);
ok('comprar sin pagar', db(rich, T0).update('/wallets/u1', { 'own/ch_tia': true }), false);
ok('comprar pagando de más', db(rich, T0).update('/wallets/u1', { sp: 900, 'own/ch_tia': true }), true);
ok('gastar más de lo ganado', db(rich, T0).update('/wallets/u1', { sp: 1500, 'own/ch_tia': true }), false);
ok('billete de 20.000 sin saldo', db(rich, T0).update('/wallets/u1', { sp: 20000, 'own/ball_b20000': true }), false);
ok('artículo inexistente', db(rich, T0).update('/wallets/u1', { sp: 10, 'own/ball_regalo': true }), false);
ok('own = false', db(rich, T0).update('/wallets/u1', { 'own/ch_tia': false }), false);
ok('gastar bajando sp', db({ wallets: { u1: { c: 1000, sp: 400, lr: T0 } } }, T0).update('/wallets/u1', { sp: 100 }), false);
const bought = { wallets: { u1: { c: 1000, sp: 500, lr: T0, own: { ch_tia: true }, eq: { ch: 'tio' } } } };
ok('equipar lo comprado', db(bought, T0).update('/wallets/u1', { eq: { ch: 'tia' } }), true);
ok('equipar lo no comprado', db(bought, T0).update('/wallets/u1', { eq: { bg: 'galaxia' } }), false);
ok('equipar la pelota inicial', db(bought, T0).update('/wallets/u1', { eq: { ball: 'peso1' } }), true);
ok('equipar la barra clásica', db(bought, T0).update('/wallets/u1', { eq: { pad: 'clasica' } }), true);
ok('comprar por otra cuenta', db(rich, T0, 'u2').update('/wallets/u1', { sp: 500, 'own/ch_tia': true }), false);
ok('leer la cartera de otra cuenta', db(rich, T0, 'u2').read('/wallets/u1'), false);
ok('leer la propia', db(rich, T0).read('/wallets/u1'), true);
ok('leer marcadores sin sesión', targaryen.database(rules, {}).as(null).with({ now: T0 }).read('/scores'), true);
ok('escribir sin sesión', targaryen.database(rules, {}).as(null).with({ now: T0 }).write('/runs/u1', { s: SV }), false);

console.log('Lingotes, diamante y personaje secreto');
const gem = { wallets: { u1: { c: 900000000, sp: 1550000, own: { ball_plata: true, ball_oro: true, ball_diamante: true } } } };
const startG = (b, r) => ({ runs: { u1: { s: T0, b, r } }, wallets: gem.wallets });
const claimG = (h, p, c0 = 900000000, sp = 1550000) => ({ 'runs/u1/e': SV, 'runs/u1/h': h, 'runs/u1/p': p, 'wallets/u1/c': c0 + p, 'wallets/u1/sp': sp, 'wallets/u1/lr': T0 });
ok('inicio con el diamante (5.000 por punto)', db(gem, T0).write('/runs/u1', { s: SV, b: 'diamante', r: 5000 }), true);
ok('inicio con el lingote de oro (500)', db(gem, T0).write('/runs/u1', { s: SV, b: 'oro', r: 500 }), true);
ok('inicio con el lingote de plata (100)', db(gem, T0).write('/runs/u1', { s: SV, b: 'plata', r: 100 }), true);
ok('diamante con tasa de oro (500)', db(gem, T0).write('/runs/u1', { s: SV, b: 'diamante', r: 500 }), false);
ok('plata con tasa de diamante', db(gem, T0).write('/runs/u1', { s: SV, b: 'plata', r: 5000 }), false);
ok('diamante con la tasa vieja (500)', db(gem, T0).write('/runs/u1', { s: SV, b: 'diamante', r: 500 }), false);
ok('oro con la tasa vieja (200)', db(gem, T0).write('/runs/u1', { s: SV, b: 'oro', r: 200 }), false);
ok('diamante sin tenerlo', db({ wallets: { u1: { c: 10, sp: 0 } } }, T0).write('/runs/u1', { s: SV, b: 'diamante', r: 5000 }), false);
ok('100 rebotes con el diamante: 5.000 × 101', db(startG('diamante', 5000), T0 + 60000).update('/', claimG(100, pesosFor(100, 5000))), true);
ok('… cobrando 10.000 por punto', db(startG('diamante', 5000), T0 + 60000).update('/', claimG(100, pesosFor(100, 10000))), false);
ok('500 rebotes con el diamante (7.525.000)', db(startG('diamante', 5000), T0 + 240000).update('/', claimG(500, pesosFor(500, 5000))), true);
ok('120 rebotes con el lingote de oro: 500 × 141', db(startG('oro', 500), T0 + 130000).update('/', claimG(120, pesosFor(120, 500))), true);
ok('120 rebotes con el lingote de plata: 100 × 141', db(startG('plata', 100), T0 + 130000).update('/', claimG(120, pesosFor(120, 100))), true);
ok('tope de pesos: c = 1.000.000.000.000 permitido', db({ runs: { u1: { s: T0, b: 'peso1', r: 1 } }, wallets: { u1: { c: 999999999999, sp: 0 } } }, T0 + 60000).update('/', claimG(1, 1, 999999999999, 0)), true);
ok('… un peso más: rechazado', db({ runs: { u1: { s: T0, b: 'peso1', r: 1 } }, wallets: { u1: { c: 1000000000000, sp: 0 } } }, T0 + 60000).update('/', claimG(1, 1, 1000000000000, 0)), false);
const rica = { wallets: { u1: { c: 300000000, sp: 0, lr: T0 } } };
ok('comprar el lingote de plata ($50.000) pagando 50.000', db(rica, T0).update('/wallets/u1', { sp: 50000, 'own/ball_plata': true }), true);
ok('… pagando 49.999', db(rica, T0).update('/wallets/u1', { sp: 49999, 'own/ball_plata': true }), false);
ok('comprar el lingote de oro ($500.000) pagando 500.000', db(rica, T0).update('/wallets/u1', { sp: 500000, 'own/ball_oro': true }), true);
ok('comprar el diamante ($1.000.000) pagando 999.999', db(rica, T0).update('/wallets/u1', { sp: 999999, 'own/ball_diamante': true }), false);
ok('comprar el diamante pagando 1.000.000', db(rica, T0).update('/wallets/u1', { sp: 1000000, 'own/ball_diamante': true }), true);
ok('comprar el Tío Pato Millonario ($100.000.000) pagando 99.999.999', db(rica, T0).update('/wallets/u1', { sp: 99999999, 'own/ch_millonario': true }), false);
ok('… pagando 100.000.000', db(rica, T0).update('/wallets/u1', { sp: 100000000, 'own/ch_millonario': true }), true);
ok('… sin saldo (c = 50.000.000)', db({ wallets: { u1: { c: 50000000, sp: 0 } } }, T0).update('/wallets/u1', { sp: 100000000, 'own/ch_millonario': true }), false);
ok('equipar el personaje secreto ya comprado', db({ wallets: { u1: { c: 300000000, sp: 100000000, own: { ch_millonario: true } } } }, T0).update('/wallets/u1', { eq: { ch: 'millonario' } }), true);
ok('equipar el personaje secreto sin comprarlo', db(rica, T0).update('/wallets/u1', { eq: { ch: 'millonario' } }), false);

// --- personajes nuevos: Ángel ($1.000), Galáctico ($5.000) y Dorado secreto ($50.000.000) ---
ok('comprar el Tío Pato Galáctico ($5.000) pagando 5.000', db(rica, T0).update('/wallets/u1', { sp: 5000, 'own/ch_galactico': true }), true);
ok('… pagando 4.999', db(rica, T0).update('/wallets/u1', { sp: 4999, 'own/ch_galactico': true }), false);
ok('equipar el Galáctico ya comprado', db({ wallets: { u1: { c: 300000000, sp: 5000, own: { ch_galactico: true } } } }, T0).update('/wallets/u1', { eq: { ch: 'galactico' } }), true);

console.log('Fondos y barras (precios +100) y artículos para millonarios');
const precios = { bg_atardecer: 200, bg_cristal: 220, bg_aurora: 300, bg_galaxia: 400, bg_holo: 450, bg_synth: 550,
  pad_dorada: 220, pad_fuego: 280, pad_cristal: 300, pad_neon: 350, pad_galaxia: 400, pad_arcoiris: 450, pad_holo: 500,
  bg_boveda: 2000000, bg_prisma: 5000000, bg_agujero: 10000000, pad_midas: 3000000, pad_diamante: 6000000, pad_plasma: 12000000 };
const rico = { wallets: { u1: { c: 90000000, sp: 0, lr: T0 } } };
for (const [k, pr] of Object.entries(precios)) {
  ok(`comprar ${k} ($${pr}) pagando ${pr}`, db(rico, T0).update('/wallets/u1', { sp: pr, ['own/' + k]: true }), true);
  ok(`… pagando ${pr - 1}`, db(rico, T0).update('/wallets/u1', { sp: pr - 1, ['own/' + k]: true }), false);
}
ok('fondo de oro sin saldo suficiente (c = 1.000.000)', db({ wallets: { u1: { c: 1000000, sp: 0 } } }, T0).update('/wallets/u1', { sp: 2000000, 'own/bg_boveda': true }), false);
ok('barra eléctrica con el precio de una barra común', db(rico, T0).update('/wallets/u1', { sp: 500, 'own/pad_plasma': true }), false);
ok('el precio antiguo de la llamarada ($180)', db(rico, T0).update('/wallets/u1', { sp: 180, 'own/pad_fuego': true }), false);
const vip = { wallets: { u1: { c: 90000000, sp: 11000000, lr: T0, own: { bg_boveda: true, pad_midas: true } } } };
ok('equipar el fondo de oro ya comprado', db(vip, T0).update('/wallets/u1', { eq: { bg: 'boveda' } }), true);
ok('equipar la barra Rey Midas ya comprada', db(vip, T0).update('/wallets/u1', { eq: { pad: 'midas' } }), true);
ok('equipar el agujero negro sin comprarlo', db(vip, T0).update('/wallets/u1', { eq: { bg: 'agujero' } }), false);
ok('equipar la tormenta eléctrica sin comprarla', db(vip, T0).update('/wallets/u1', { eq: { pad: 'plasma' } }), false);

console.log('Contador de puestos (hist) y marcador con filas por campo');
const row = (s, c) => Object.assign({ n: 'Matías', k: 'matias', s, t: 5 }, c === undefined ? {} : { c });
const H = (scores, hist = {}) => ({ scores, hist });
ok('contar por primera vez: c=50 y hist/50: 0 → 1', db(H({ u1: row(50) }), T0).update('/', { 'scores/u1/c': 50, 'hist/50': 1 }), true);
ok('… sumando a una casilla que ya tiene 7 (→ 8)', db(H({ u1: row(50) }, { 50: 7 }), T0).update('/', { 'scores/u1/c': 50, 'hist/50': 8 }), true);
ok('… sumando 2 de golpe (7 → 9)', db(H({ u1: row(50) }, { 50: 7 }), T0).update('/', { 'scores/u1/c': 50, 'hist/50': 9 }), false);
ok('… sin marcar c', db(H({ u1: row(50) }, { 50: 7 }), T0).update('/', { 'hist/50': 8 }), false);
ok('… en una casilla que no es la de c (hist/51)', db(H({ u1: row(50) }), T0).update('/', { 'scores/u1/c': 50, 'hist/51': 1 }), false);
ok('… con c menor que tu puntaje (49)', db(H({ u1: row(50) }), T0).update('/', { 'scores/u1/c': 49, 'hist/49': 1 }), false);
ok('… con c mayor que tu puntaje (60)', db(H({ u1: row(50) }), T0).update('/', { 'scores/u1/c': 60, 'hist/60': 1 }), false);
ok('… contar dos veces (c ya es 50)', db(H({ u1: row(50, 50) }, { 50: 1 }), T0).update('/', { 'scores/u1/c': 50, 'hist/50': 2 }), false);
ok('mejorar de 50 a 80: c=80, hist/80 +1 y hist/50 −1', db(H({ u1: row(80, 50) }, { 50: 3 }), T0).update('/', { 'scores/u1/c': 80, 'hist/80': 1, 'hist/50': 2 }), true);
ok('… bajando la casilla equivocada (hist/60)', db(H({ u1: row(80, 50) }, { 60: 3 }), T0).update('/', { 'scores/u1/c': 80, 'hist/80': 1, 'hist/60': 2 }), false);
ok('… bajar sin mover c', db(H({ u1: row(80, 50) }, { 50: 3 }), T0).update('/', { 'hist/50': 2 }), false);
ok('… bajar de 3 a 1', db(H({ u1: row(80, 50) }, { 50: 3 }), T0).update('/', { 'scores/u1/c': 80, 'hist/80': 1, 'hist/50': 1 }), false);
ok('… bajar una casilla en cero', db(H({ u1: row(80, 50) }, { 50: 0 }), T0).update('/', { 'scores/u1/c': 80, 'hist/80': 1, 'hist/50': -1 }), false);
ok('bajar la casilla de una cuenta que no está contada', db(H({ u1: row(80) }, { 50: 3 }), T0).update('/', { 'scores/u1/c': 80, 'hist/80': 1, 'hist/50': 2 }), false);
ok('c no puede bajar (80 → 70)', db(H({ u1: row(80, 80) }, { 80: 1 }), T0).update('/', { 'scores/u1/c': 70 }), false);
ok('c fuera de rango (501)', db(H({ u1: row(501) }), T0).update('/', { 'scores/u1/c': 501, 'hist/501': 1 }), false);
ok('casilla con nombre inválido', db(H({ u1: row(50) }), T0).update('/', { 'scores/u1/c': 50, 'hist/abc': 1 }), false);
ok('escribir en hist sin ser tú (otra cuenta sube la casilla 50)', db(H({ u1: row(50) }), T0, 'u2').update('/', { 'hist/50': 1 }), false);
ok('escribir hist directo (sin tocar scores)', db(H({ u1: row(50, 50) }, { 50: 1 }), T0).write('/hist/99', 1), false);
ok('borrar el contador', db(H({ u1: row(50, 50) }, { 50: 5 }), T0).write('/hist/50', null), false);
ok('leer hist sin sesión', targaryen.database(rules, { hist: { 50: 3 } }).as(null).with({ now: T0 }).read('/hist'), true);
// el cobro de una partida escribe el marcador por campos, y así no borra `c`
const cl = db({ ...started, scores: { u1: row(50, 50) }, hist: { 50: 1 } }, T0 + 60000).update('/', { ...claim(60), 'scores/u1/n': 'Matías', 'scores/u1/k': 'matias', 'scores/u1/s': 60, 'scores/u1/t': SV });
ok('cobro que sube el récord por campos (50 → 60) conservando c', cl, true);
ok('… y c sigue en 50', { allowed: cl.allowed && cl.newDatabase.root.$value().scores.u1.c === 50 }, true);
// jugadores seguidos: tres cuentas se cuentan y mejoran; el contador siempre cuadra
{
  const as = (uid, data, o) => db(data, T0, uid).update('/', o);
  let d = { scores: { u1: row(50), u2: row(50), u3: row(80) }, hist: {} };
  for (const [uid, c] of [['u1', 50], ['u2', 50], ['u3', 80]]) {
    const cur = (d.hist || {})[c] || 0; const res = as(uid, d, { [`scores/${uid}/c`]: c, [`hist/${c}`]: cur + 1 });
    ok(`contar a ${uid} (puntaje ${c})`, res, true); d = res.newDatabase.root.$value();
  }
  ok('contador tras contar a los tres: {50: 2, 80: 1}', { allowed: d.hist[50] === 2 && d.hist[80] === 1 }, true);
  d.scores.u1.s = 90;                                                                                  // u1 mejora a 90
  const res = as('u1', d, { 'scores/u1/c': 90, 'hist/90': 1, 'hist/50': d.hist[50] - 1 });
  ok('u1 mejora de 50 a 90 y se mueve de casilla', res, true); d = res.newDatabase.root.$value();
  const above = (m) => Object.entries(d.hist).filter(([k]) => +k > m).reduce((a, [, v]) => a + v, 0);
  ok('puestos: u1 (90) es el 1º, u3 (80) el 2º, u2 (50) el 3º', { allowed: above(90) + 1 === 1 && above(80) + 1 === 2 && above(50) + 1 === 3 }, true);
}

console.log(`\n${pass} correctas, ${fail} fallas`);
process.exit(fail ? 1 : 0);
