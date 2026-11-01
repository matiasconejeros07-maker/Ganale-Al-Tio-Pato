// Marcador de tiempo jugado de punta a punta (juego + reglas reales de Firebase): se suma el tiempo de cada partida cobrada, el Top 25 por tiempo
// tiene el mismo formato que el de rebotes y no se puede inflar. Uso:  cd pruebas && npm install && node tiempo.test.js
const fs = require('fs');
const { chromium, st, newPage, playHits, registrar } = require('./mockfirebase.js');
let pass = 0, fail = 0;
const ok = (n, c, x = '') => { if (c) { pass++; console.log('  ok  ', n); } else { fail++; console.log('  FALLA', n, x); } };
const cerrarDiario = p => p.evaluate(() => { const b = document.getElementById('dailyClose'); if (b && b.offsetParent) b.click(); });
const alMenu = p => p.evaluate(() => { const b = document.getElementById('backResult'); if (b && b.offsetParent) b.click(); });
const filas = p => p.evaluate(() => [...document.querySelectorAll('#list li:not(.empty)')].map(li => [li.querySelector('.rk').textContent, li.querySelector('.t').textContent, li.querySelector('.sc').textContent, li.classList.contains('mine')]));
(async () => {
  const b = await chromium.launch(fs.existsSync('/opt/pw-browsers/chromium') ? { executablePath: '/opt/pw-browsers/chromium' } : {});

  console.log('Se suma el tiempo de cada partida cobrada');
  const { ctx, p, errs } = await newPage(b);
  const uid = await registrar(p, 'Tiempo Uno'); await cerrarDiario(p);
  await playHits(p, 4, async () => {}); await p.waitForTimeout(4500);
  let run = st.db.runs[uid], fila = st.db.scores[uid];
  const inc1 = Math.min(run.e - run.s, run.h * 4500 + 6000);
  ok(`la primera partida (${run.h} rebotes) suma lo que duró: ${Math.round(inc1 / 1000)} s`, fila.ms === inc1 && fila.ml === run.s && inc1 > 3000, JSON.stringify(fila));
  await playHits(p, 5, async () => {}); await p.waitForTimeout(4500);
  const run2 = st.db.runs[uid], fila2 = st.db.scores[uid], inc2 = Math.min(run2.e - run2.s, run2.h * 4500 + 6000);
  ok('la segunda partida se acumula sobre la primera', fila2.ms === inc1 + inc2 && fila2.ml === run2.s && run2.s !== run.s, JSON.stringify(fila2) + ' ' + inc1 + ' ' + inc2);
  ok('sin denegados ni errores de página', st.denied.length === 0 && errs.length === 0, st.denied.join(' || ') + errs.join('|'));

  console.log('Marcador «Tiempo»');
  const resto = { A: 7200000 + 5 * 60000, B: 3 * 3600000 + 5 * 60000, C: 45000, D: 30 * 60000, E: 26 * 3600000 + 4 * 3600000 };
  st.db.scores = { ...st.db.scores };
  Object.entries(resto).forEach(([k, ms], i) => { st.db.scores['x' + k] = { n: 'Jugador ' + k, k: 'jugador.' + k.toLowerCase(), s: 10 + i, t: 100 + i, ms, ml: 1 }; });
  st.db.scores.sinTiempo = { n: 'Sin Tiempo', k: 'sin.tiempo', s: 300, t: 1 };                 // un récord enorme pero sin tiempo: no sale en «Tiempo»
  await alMenu(p); await p.waitForTimeout(300);
  await p.evaluate(() => document.getElementById('openBoard').click()); await p.waitForTimeout(900);
  ok('el marcador abre en «Rebotes» y muestra las dos pestañas', await p.isVisible('#boardKind') && /on/.test(await p.getAttribute('#kindR', 'class')) && /Top/.test(await p.textContent('#boardNote')));
  const reb = await filas(p);
  ok('«Rebotes» sigue ordenado por puntaje (Sin Tiempo = 300 primero)', reb[0][1] === 'Sin Tiempo', JSON.stringify(reb[0]));
  await p.evaluate(() => document.getElementById('kindT').click()); await p.waitForTimeout(1100);
  const t = await filas(p);
  ok('«Tiempo» ordena por tiempo jugado: 1 d 6 h, 3 h 05 min, 2 h 05 min, 30 min, 45 s y al final tu tiempo', JSON.stringify(t.slice(0, 5).map(r => r[2])) === JSON.stringify(['1 d 6 h', '3 h 05 min', '2 h 05 min', '30 min', '45 s']) && t.length === 6 && t[5][1] === 'Tiempo Uno', JSON.stringify(t));
  ok('con medallas 🥇🥈🥉 y después el número, igual que «Rebotes»', t[0][0] === '🥇' && t[1][0] === '🥈' && t[2][0] === '🥉' && t[3][0] === '4', JSON.stringify(t.map(r => r[0])));
  ok('quien no tiene tiempo no aparece (aunque tenga el mejor récord)', !t.some(r => r[1] === 'Sin Tiempo'));
  ok('tu fila sale resaltada con tu tiempo', t.some(r => r[3] && r[1] === 'Tiempo Uno') && /\d+ s|min/.test(t[5][2]), JSON.stringify(t[5]));
  ok('la nota dice Top y que gana quien más tiempo lleva jugando', /Top 6/.test(await p.textContent('#boardNote')) && /más tiempo/.test(await p.textContent('#boardNote')), await p.textContent('#boardNote'));
  ok('el reloj de 1 minuto sigue (no se alarga al cambiar de pestaña)', /Vuelves al inicio en (\d+) s/.test(await p.textContent('#boardLeft')) && +/(\d+) s/.exec(await p.textContent('#boardLeft'))[1] <= 58, await p.textContent('#boardLeft'));

  console.log('Top 25 y actualización');
  for (let i = 0; i < 30; i++) st.db.scores['m' + i] = { n: 'Muchos ' + i, k: 'muchos.' + i, s: 5, t: 500 + i, ms: 100000 + i * 1000, ml: 1 };
  await p.evaluate(() => document.getElementById('refreshBoard').click()); await p.waitForTimeout(1200);
  const g = await filas(p);
  ok('muestra como máximo 25 jugadores', g.length === 25, String(g.length));
  ok('los 25 son los de más tiempo (el de 45 s ya no entra)', g[0][1] === 'Jugador E' && !g.some(r => r[1] === 'Jugador C'), JSON.stringify(g.slice(0, 3)));
  const mio = await p.evaluate(() => { const b = document.getElementById('myRow'); return { visible: !b.hidden, txt: b.textContent }; });
  ok('si no estás entre los 25, debajo salen tres puntos y tu tiempo', mio.visible && /Tiempo Uno/.test(mio.txt) && /(s|min)/.test(mio.txt), JSON.stringify(mio));
  await p.evaluate(() => document.getElementById('kindR').click()); await p.waitForTimeout(1100);
  ok('al volver a «Rebotes» se ven los rebotes', (await filas(p))[0][1] === 'Sin Tiempo' && /rebotes/.test(await p.textContent('#boardNote')));
  ok('sin errores de página', errs.length === 0, errs.join('|'));
  await ctx.close();

  console.log('Dejar el juego abierto no suma horas');
  {
    const { ctx: c2, p: p2 } = await newPage(b);
    const uid2 = await registrar(p2, 'Tiempo Dos'); await cerrarDiario(p2);
    await playHits(p2, 3, async () => {}); await p2.waitForTimeout(4500);
    const r2 = st.db.runs[uid2], antes = st.db.scores[uid2].ms;
    const hora = 3600000;                                                                    // la partida «duró» 1 hora (la persona dejó el celular antes de que se cobrara)
    ok('la regla no deja sumar más del tope (rebotes × 4,5 s + 6 s)', antes <= r2.h * 4500 + 6000, `${antes} vs ${r2.h * 4500 + 6000}`);
    ok('y nunca más de lo que de verdad duró la partida', antes <= r2.e - r2.s, `${antes} vs ${r2.e - r2.s}`);
    await c2.close();
  }

  console.log('Si todavía no están publicadas las reglas nuevas');
  {
    const r = JSON.parse(fs.readFileSync(require('path').join(__dirname, '..', 'firebase-rules.json'), 'utf8'));
    r.rules.scores['.indexOn'] = ['s', 'k']; delete r.rules.scores.$uid.ms; delete r.rules.scores.$uid.ml;
    const f = require('path').join(require('os').tmpdir(), 'sin-ms-' + process.pid + '.json'); fs.writeFileSync(f, JSON.stringify(r)); st.rulesFile = f;
    const { ctx: c3, p: p3, errs: e3 } = await newPage(b);
    const uid3 = await registrar(p3, 'Tiempo Tres'); await cerrarDiario(p3);
    await playHits(p3, 3, async () => {}); await p3.waitForTimeout(4500);
    ok('con las reglas viejas la partida se cobra igual (el tiempo no puede romper los pesos)', st.db.wallets[uid3].c === st.db.runs[uid3].h && !('ms' in st.db.scores[uid3]), JSON.stringify([st.db.wallets[uid3], st.db.scores[uid3]]));
    await alMenu(p3); await p3.waitForTimeout(300);
    await p3.evaluate(() => document.getElementById('openBoard').click()); await p3.waitForTimeout(800); await p3.evaluate(() => document.getElementById('kindT').click()); await p3.waitForTimeout(1200);
    ok('«Tiempo» avisa que faltan publicar las reglas', /publicar las reglas/.test(await p3.textContent('#boardNote')), await p3.textContent('#boardNote'));
    fs.unlinkSync(f); st.rulesFile = null; st.denied.length = 0; await c3.close();
  }

  console.log(`\n${pass} correctas, ${fail} fallas`);
  await b.close(); process.exit(fail ? 1 : 0);
})();
