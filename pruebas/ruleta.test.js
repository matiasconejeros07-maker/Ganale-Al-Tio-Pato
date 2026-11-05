// Ruleta diaria de punta a punta (juego + reglas reales de Firebase): un giro por día, el resultado sale de la hora del servidor y el premio se cobra en pesos o en un multiplicador guardado.
// Uso:  cd pruebas && npm install && node ruleta.test.js
const fs = require('fs'), os = require('os'), path = require('path'), vm = require('vm');
const { chromium, st, newPage, registrar, JUEGO } = require('./mockfirebase.js');
const DAY = 86400000;
let pass = 0, fail = 0;
const ok = (n, c, x = '') => { if (c) { pass++; console.log('  ok  ', n); } else { fail++; console.log('  FALLA', n, x); } };
const cx = { window: {} }; vm.createContext(cx); vm.runInContext(fs.readFileSync(path.join(JUEGO, 'tienda.js'), 'utf8'), cx);
const RU = cx.window.TIENDA.eco.ruleta, N = RU.premios.reduce((a, x) => a + x[2], 0);
const premioDe = t => { const x = ((t % N) + N) % N; let acc = 0; for (const pr of RU.premios) { acc += pr[2]; if (x < acc) return pr; } };
const tDe = idx => { let acc = 0; for (let i = 0; i < idx; i++) acc += RU.premios[i][2]; const base = Math.floor((Date.now() - 3600000) / N) * N; return base + acc; };     // una hora de hace un rato cuyo resultado es el premio idx
const cerrarDiario = p => p.evaluate(() => { const b = document.getElementById('dailyClose'); if (b && b.offsetParent) b.click(); });
const txt = (p, sel) => p.evaluate(s => document.querySelector(s).textContent.trim(), sel);
const vis = (p, sel) => p.evaluate(s => { const e = document.querySelector(s); return !!e && !e.hidden && e.offsetParent !== null; }, sel);
const money = n => '$' + String(n).replace(/\B(?=(\d{3})+(?!\d))/g, '.');
(async () => {
  const b = await chromium.launch(fs.existsSync('/opt/pw-browsers/chromium') ? { executablePath: '/opt/pw-browsers/chromium' } : {});
  const { ctx, p, errs } = await newPage(b);
  const uid = await registrar(p, 'Ruleta Uno');

  console.log('La ruleta aparece cuando ya reclamaste tu racha');
  ok('antes de reclamar la racha no hay pestaña «Ruleta» (los multiplicadores se guardan en la racha)', !(await vis(p, '#tabR')));
  await p.tap('#dailyGo'); await p.waitForTimeout(3800);
  ok('con la racha reclamada aparece la pestaña «🎡 Ruleta»', await vis(p, '#tabR') && /Ruleta/.test(await txt(p, '#tabR')));
  ok('con un punto rojo porque hay un giro disponible', await p.evaluate(() => document.getElementById('tabR').classList.contains('dot')));
  await p.tap('#tabR'); await p.waitForTimeout(900);
  const rueda = await p.evaluate(() => ({ labels: [...document.querySelectorAll('#wheel span')].map(s => s.textContent), bg: document.getElementById('wheel').style.background.slice(0, 20), go: document.getElementById('dailyGo').textContent, ttl: document.getElementById('dailyTitle').textContent }));
  ok('se ve la rueda con todos los premios de la tabla ($300, $500, $1.000, $2.000, ×2, $5.000 y ×3)', JSON.stringify(rueda.labels) === JSON.stringify(RU.premios.map(pr => pr[0] > 0 ? money(pr[0]) : '×' + pr[1] + ' 🤑')) && /conic-gradient/.test(rueda.bg), JSON.stringify(rueda));
  ok('el título y el botón invitan a girar', /Ruleta diaria/.test(rueda.ttl) && rueda.go === '🎡 Girar la ruleta', JSON.stringify(rueda));
  await p.screenshot({ path: process.env.SHOT || '/tmp/ruleta_antes.png' });

  console.log('Girar y cobrar');
  const c0 = st.db.wallets[uid].c, x0 = Object.assign({ x2: 0, x3: 0 }, st.db.streaks[uid]);
  await p.tap('#dailyGo'); await p.waitForTimeout(800);
  ok('mientras gira el botón dice «Girando…» y no se puede tocar', (await txt(p, '#dailyGo')) === 'Girando…' && await p.evaluate(() => document.getElementById('dailyGo').disabled));
  await p.waitForTimeout(6500);
  const r = st.db.ruleta[uid], pr = premioDe(r.t);
  ok('el servidor anotó el giro (t = hora del servidor) y el cobro (c = t)', r && Math.abs(r.t - Date.now()) < 60000 && r.c === r.t, JSON.stringify(r));
  ok(`el premio es el que dice la hora del giro (${pr[0] > 0 ? money(pr[0]) : '×' + pr[1]})`, pr[0] > 0 ? st.db.wallets[uid].c === c0 + pr[0] : st.db.streaks[uid]['x' + pr[1]] === (x0['x' + pr[1]] || 0) + 1 && st.db.wallets[uid].c === c0, JSON.stringify([pr, st.db.wallets[uid], st.db.streaks[uid]]));
  ok('la pantalla dice lo que te tocó y el mensaje confirma', /Te tocó/.test(await txt(p, '#wheelRes')) && /Listo/.test(await txt(p, '#dailyMsg')), await txt(p, '#wheelRes') + ' | ' + await txt(p, '#dailyMsg'));
  ok('el botón queda apagado con «Vuelve en …» y se va el punto rojo', /^Vuelve en/.test(await txt(p, '#dailyGo')) && await p.evaluate(() => document.getElementById('dailyGo').disabled && !document.getElementById('tabR').classList.contains('dot')));
  ok('sin denegados ni errores de página', st.denied.length === 0 && errs.length === 0, st.denied.join(' || ') + errs.join('|'));
  await p.screenshot({ path: process.env.SHOT2 || '/tmp/ruleta_despues.png' });

  console.log('No se puede hacer trampa');
  const url = 'https://juegotiopato-default-rtdb.firebaseio.com';
  const hit = (m, ruta, body) => p.evaluate(async ([m, ruta, body, url]) => {
    const sess = JSON.parse(localStorage.getItem('gana-al-tio-pato-sesion') || 'null');
    const x = await fetch(`${url}/${ruta}.json?auth=${encodeURIComponent(sess.id)}`, { method: m, body: JSON.stringify(body) }); return x.status;
  }, [m, ruta, body, url]);
  ok('girar otra vez el mismo día', await hit('PATCH', `ruleta/${uid}`, { t: { '.sv': 'timestamp' } }) === 401);
  ok('cobrar otra vez el mismo giro', await hit('PATCH', '', { [`ruleta/${uid}/c`]: st.db.ruleta[uid].t, [`wallets/${uid}/c`]: st.db.wallets[uid].c + 5000, [`wallets/${uid}/sp`]: st.db.wallets[uid].sp }) === 401);
  ok('borrar el giro de hoy para girar de nuevo', await hit('DELETE', `ruleta/${uid}`, null) === 401);
  ok('girar y cobrar el premio grande en la misma escritura (reintentar hasta acertar)', await hit('PATCH', '', { [`ruleta/${uid}/t`]: { '.sv': 'timestamp' }, [`ruleta/${uid}/c`]: { '.sv': 'timestamp' }, [`wallets/${uid}/c`]: st.db.wallets[uid].c + 5000, [`wallets/${uid}/sp`]: st.db.wallets[uid].sp }) === 401);
  st.denied.length = 0;

  console.log('Al día siguiente se puede girar otra vez');
  st.db.ruleta[uid] = { t: st.db.ruleta[uid].t - DAY, c: st.db.ruleta[uid].c - DAY };
  await p.reload(); await p.waitForTimeout(2500); await cerrarDiario(p);
  ok('con el último giro de ayer, el punto rojo vuelve', await p.evaluate(() => document.getElementById('streakChip').classList.contains('go')));
  await p.evaluate(() => document.getElementById('streakChip').click()); await p.waitForTimeout(600); await p.tap('#tabR'); await p.waitForTimeout(700);
  ok('el botón vuelve a decir «Girar la ruleta»', (await txt(p, '#dailyGo')) === '🎡 Girar la ruleta' && !(await p.evaluate(() => document.getElementById('dailyGo').disabled)));
  await cerrarDiario(p);

  console.log('Cada casilla paga lo que dice la tabla (giros sin cobrar, con hora de cada casilla)');
  for (let i = 0; i < RU.premios.length; i++) {
    const prem = RU.premios[i], t = tDe(i), c1 = st.db.wallets[uid].c, k1 = (st.db.streaks[uid]['x' + prem[1]] || 0);
    st.db.ruleta[uid] = { t };
    await p.reload(); await p.waitForTimeout(2300); await cerrarDiario(p);
    await p.evaluate(() => document.getElementById('streakChip').click()); await p.waitForTimeout(600); await p.tap('#tabR'); await p.waitForTimeout(700);
    const boton = await txt(p, '#dailyGo');
    await p.tap('#dailyGo'); await p.waitForTimeout(6800);
    ok(`casilla ${i}: giraste sin cobrar → «Cobrar mi premio» → ${prem[0] > 0 ? money(prem[0]) : '×' + prem[1] + ' guardado'}`,
      boton === 'Cobrar mi premio' && st.db.ruleta[uid].c === t && (prem[0] > 0 ? st.db.wallets[uid].c === c1 + prem[0] : st.db.streaks[uid]['x' + prem[1]] === k1 + 1 && st.db.wallets[uid].c === c1), `${boton} ${JSON.stringify([st.db.ruleta[uid], st.db.wallets[uid], st.db.streaks[uid]])}`);
    await cerrarDiario(p);
  }
  ok('sin denegados ni errores de página en todo el recorrido', st.denied.length === 0 && errs.length === 0, st.denied.join(' || ') + errs.join('|'));
  await ctx.close();

  console.log('Si todavía no están publicadas las reglas nuevas');
  {
    const rl = JSON.parse(fs.readFileSync(path.join(JUEGO, 'firebase-rules.json'), 'utf8')); delete rl.rules.ruleta;
    const f = path.join(os.tmpdir(), 'sin-ruleta-' + process.pid + '.json'); fs.writeFileSync(f, JSON.stringify(rl)); st.rulesFile = f;
    const { ctx: c2, p: p2, errs: e2 } = await newPage(b);
    await registrar(p2, 'Ruleta Dos');
    await p2.tap('#dailyGo'); await p2.waitForTimeout(3800);
    ok('sin las reglas nuevas no aparece la pestaña «Ruleta» (no se muestra nada roto) y la racha funciona igual', !(await vis(p2, '#tabR')) && st.db.streaks && Object.values(st.db.streaks).some(k => k.n === 1), JSON.stringify(st.db.streaks));
    ok('sin errores de página', e2.length === 0, e2.join('|'));
    fs.unlinkSync(f); st.rulesFile = null; st.denied.length = 0; await c2.close();
  }

  console.log(`\n${pass} correctas, ${fail} fallas`);
  await b.close(); process.exit(fail ? 1 : 0);
})();
