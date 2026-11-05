// Marcadores de punta a punta (juego + reglas reales de Firebase): Top 30 en todos, «Todo el tiempo», «Semanal», «Tiempo jugado» y «Millonarios» (la billetera),
// y las insignias (🦆🎩 🦆🎀 👾) que pone el administrador en roles/<uid>. Uso:  cd pruebas && npm install && node marcadores.test.js
const fs = require('fs'), os = require('os'), path = require('path');
const { chromium, st, newPage, playHits, registrar, JUEGO } = require('./mockfirebase.js');
let pass = 0, fail = 0;
const ok = (n, c, x = '') => { if (c) { pass++; console.log('  ok  ', n); } else { fail++; console.log('  FALLA', n, x); } };
const cerrarDiario = p => p.evaluate(() => { const b = document.getElementById('dailyClose'); if (b && b.offsetParent) b.click(); });
const alMenu = p => p.evaluate(() => { for (const id of ['shopBack', 'backResult']) { const b = document.getElementById(id); if (b && b.offsetParent) b.click(); } });
const D = () => Math.floor((Date.now() - 3 * 3600000) / 86400000), WK = () => Math.floor((D() + 3) / 7);
const filas = p => p.evaluate(() => [...document.querySelectorAll('#list li:not(.empty)')].map(li => ({ rk: li.querySelector('.rk').textContent, n: li.querySelector('.t').textContent, sc: li.querySelector('.sc').textContent, rb: (li.querySelector('.rb') || {}).textContent || '', mine: li.classList.contains('mine') })));
const miFila = p => p.evaluate(() => { const b = document.getElementById('myRow'); return b.hidden ? null : { n: b.querySelector('.t').textContent, sc: b.querySelector('.sc').textContent, rk: b.querySelector('.rk').textContent }; });
const abrirMarcador = async p => { await alMenu(p); await p.waitForTimeout(300); await cerrarDiario(p); await p.evaluate(() => document.getElementById('openBoard').click()); await p.waitForTimeout(1200); };
const pestana = async (p, id) => { await p.evaluate(i => document.getElementById(i).click(), id); await p.waitForTimeout(1400); };
const nota = p => p.textContent('#boardNote');
const money = n => '$' + String(n).replace(/\B(?=(\d{3})+(?!\d))/g, '.');

(async () => {
  const b = await chromium.launch(fs.existsSync('/opt/pw-browsers/chromium') ? { executablePath: '/opt/pw-browsers/chromium' } : {});
  const { ctx, p, errs } = await newPage(b);
  const uid = await registrar(p, 'Marc Uno'); await cerrarDiario(p);

  console.log('Las partidas llenan el marcador semanal y la billetera pública');
  const w = WK();
  await playHits(p, 8, async () => {}); await p.waitForTimeout(6000);
  const r1 = st.db.runs[uid], s1 = st.db.weekly && st.db.weekly[w] && st.db.weekly[w][uid];
  ok(`la primera partida (${r1.h} rebotes) crea tu fila semanal: nombre, mejor de la semana y hora del servidor`, s1 && s1.n === 'Marc Uno' && s1.s === r1.h && typeof s1.t === 'number' && Object.keys(s1).length >= 3, JSON.stringify(s1));
  ok('la fila semanal coincide con tus estadísticas verificadas (wm)', st.db.stats[uid].wm === r1.h && st.db.stats[uid].w === w, JSON.stringify(st.db.stats[uid]));
  const cartera = () => st.db.wallets[uid].c - st.db.wallets[uid].sp;
  ok('tu billetera pública (scores/<uid>/w) es la de tu cartera (ganado − gastado)', st.db.scores[uid].w === cartera() && cartera() > 0, `${st.db.scores[uid].w} vs ${cartera()}`);
  await playHits(p, 5, async () => {}); await p.waitForTimeout(6000);
  const r2 = st.db.runs[uid];
  ok('una partida peor no baja la marca de la semana', r2.h < r1.h ? st.db.weekly[w][uid].s === r1.h : st.db.weekly[w][uid].s === Math.max(r1.h, r2.h), JSON.stringify(st.db.weekly[w][uid]) + ' ' + r1.h + '/' + r2.h);
  ok('y la billetera pública se actualiza con lo que sumó la partida', st.db.scores[uid].w === cartera(), `${st.db.scores[uid].w} vs ${cartera()}`);
  await playHits(p, 12, async () => {}); await p.waitForTimeout(6000);
  const r3 = st.db.runs[uid];
  ok(`una partida mejor (${r3.h}) sube la marca de la semana`, st.db.weekly[w][uid].s === Math.max(r1.h, r2.h, r3.h) && st.db.weekly[w][uid].s >= r3.h, JSON.stringify(st.db.weekly[w][uid]));
  ok('sin denegados ni errores de página en todo el recorrido', st.denied.length === 0 && errs.length === 0, st.denied.join(' || ') + errs.join('|'));

  console.log('Los cuatro marcadores (con 40 jugadores sembrados)');
  const base = { s: 0, t: 1000 };
  for (let i = 1; i <= 40; i++) {
    st.db.scores['x' + i] = { n: 'Jug ' + i, k: 'jug.' + i, s: i, t: 1000 + i, ms: i * 600000, ml: 1, w: i * 1000000 };
    st.db.weekly[w]['x' + i] = { n: 'Jug ' + i, s: 100 + i, t: 1000 + i };
  }
  st.db.roles = { x40: 'tio', x39: 'tia', x38: 'dev', zz: 'dev' };
  await abrirMarcador(p);
  ok('aparecen las 4 pestañas: Todo el tiempo, Semanal, Tiempo jugado y Millonarios', await p.evaluate(() => ['kindR', 'kindW', 'kindT', 'kindM'].map(i => document.getElementById(i).textContent).join('|')) === '🏆 Todo el tiempo|📅 Semanal|⏱️ Tiempo jugado|💰 Millonarios');
  let f = await filas(p);
  ok('«Todo el tiempo» muestra 30 jugadores (no 25), el mejor primero', f.length === 30 && f[0].n === 'Jug 40' && f[0].sc === '40', JSON.stringify(f.slice(0, 2)));
  ok('con 🥇🥈🥉 y después el número', f[0].rk === '🥇' && f[1].rk === '🥈' && f[2].rk === '🥉' && f[3].rk === '4' && f[29].rk === '30');
  ok('la nota dice Top 30', /Top 30/.test(await nota(p)), await nota(p));
  ok('las insignias salen junto al nombre: 🦆🎩 al Tío Patito, 🦆🎀 a la Tía Patita y 👾 a los desarrolladores', f[0].rb === '🦆🎩' && f[1].rb === '🦆🎀' && f[2].rb === '👾' && f.slice(3).every(r => r.rb === ''), JSON.stringify(f.slice(0, 4)));

  await pestana(p, 'kindW');
  f = await filas(p);
  ok('«Semanal»: Top 30 de la semana, ordenado por la mejor partida de la semana', f.length === 30 && f[0].n === 'Jug 40' && f[0].sc === '140' && f[29].n === 'Jug 11', JSON.stringify([f[0], f[29]]));
  ok('«Semanal» también lleva las insignias', f[0].rb === '🦆🎩' && f[2].rb === '👾');
  ok('la nota dice que es de la semana y que se reinicia el lunes', /Top 30 de la semana/.test(await nota(p)) && /se reinicia el lunes/.test(await nota(p)), await nota(p));
  let mi = await miFila(p);
  ok('tu fila sale debajo (tu mejor de la semana) si no estás entre los 30', mi && mi.n === 'Marc Uno' && +mi.sc === st.db.weekly[w][uid].s, JSON.stringify(mi));

  await pestana(p, 'kindT');
  f = await filas(p);
  ok('«Tiempo jugado»: también 30 jugadores, el que más tiempo lleva primero', f.length === 30 && f[0].n === 'Jug 40' && /d|h/.test(f[0].sc) && f[0].rb === '🦆🎩', JSON.stringify(f[0]));

  await pestana(p, 'kindM');
  f = await filas(p);
  ok('«Millonarios»: 30 jugadores ordenados por billetera, con el monto en pesos', f.length === 30 && f[0].n === 'Jug 40' && f[0].sc === money(40000000) && f[1].sc === money(39000000), JSON.stringify(f.slice(0, 2)));
  ok('«Millonarios» lleva las insignias y la nota explica qué se ve', f[0].rb === '🦆🎩' && /billeteras más grandes/.test(await nota(p)), await nota(p));
  mi = await miFila(p);
  ok('tu billetera (la tuya de verdad) aparece debajo si no estás entre los 30', mi && mi.n === 'Marc Uno' && mi.sc === money(cartera()), JSON.stringify(mi) + ' ' + cartera());
  ok('al abrir «Millonarios» se actualiza tu billetera pública', st.db.scores[uid].w === cartera());
  await pestana(p, 'kindR');
  f = await filas(p);
  ok('al volver a «Todo el tiempo» se ven los rebotes otra vez', f[0].sc === '40' && /Top 30/.test(await nota(p)));
  ok('el reloj de 1 minuto sigue (no se alarga al cambiar de pestaña)', /Vuelves al inicio en (\d+) s/.test(await p.textContent('#boardLeft')) && +/(\d+) s/.exec(await p.textContent('#boardLeft'))[1] <= 58, await p.textContent('#boardLeft'));
  ok('sin denegados ni errores de página', st.denied.length === 0 && errs.length === 0, st.denied.join(' || ') + errs.join('|'));
  await ctx.close();

  console.log('Los marcadores no se pueden falsear desde el juego');
  {
    const { ctx: c2, p: p2 } = await newPage(b);
    const u2 = await registrar(p2, 'Marc Dos'); await cerrarDiario(p2);
    await playHits(p2, 6, async () => {}); await p2.waitForTimeout(6000);
    const url = 'https://juegotiopato-default-rtdb.firebaseio.com';
    const hit = (m, ruta, body) => p2.evaluate(async ([m, ruta, body, url]) => {
      const sess = JSON.parse(localStorage.getItem('gana-al-tio-pato-sesion') || 'null');
      const r = await fetch(`${url}/${ruta}.json?auth=${encodeURIComponent(sess.id)}`, { method: m, body: JSON.stringify(body) }); return r.status;
    }, [m, ruta, body, url]);
    const wk = WK();
    ok('ponerte una billetera inventada en el marcador de millonarios', await hit('PATCH', `scores/${u2}`, { w: 999999999 }) === 401);
    ok('ponerte 10.000 rebotes en el marcador semanal', await hit('PUT', `weekly/${wk}/${u2}`, { n: 'Marc Dos', s: 500, t: { '.sv': 'timestamp' } }) === 401);
    ok('escribir en la semana pasada', await hit('PUT', `weekly/${wk - 1}/${u2}`, { n: 'Marc Dos', s: st.db.stats[u2].wm, t: { '.sv': 'timestamp' } }) === 401);
    ok('ponerte una insignia de desarrollador', await hit('PUT', `roles/${u2}`, 'dev') === 401);
    ok('la billetera real sí se acepta', await hit('PATCH', `scores/${u2}`, { w: st.db.wallets[u2].c - st.db.wallets[u2].sp }) === 200);
    st.denied.length = 0;
    await c2.close();
  }

  console.log('Si todavía no están publicadas las reglas nuevas');
  {
    const r = JSON.parse(fs.readFileSync(path.join(JUEGO, 'firebase-rules.json'), 'utf8')); delete r.rules.weekly; delete r.rules.roles; delete r.rules.scores['$uid'].w;
    r.rules.scores['.indexOn'] = ['s', 'k', 'ms'];
    const f2 = path.join(os.tmpdir(), 'sin-marcadores-' + process.pid + '.json'); fs.writeFileSync(f2, JSON.stringify(r)); st.rulesFile = f2;
    const { ctx: c3, p: p3, errs: e3 } = await newPage(b);
    const u3 = await registrar(p3, 'Marc Tres'); await cerrarDiario(p3);
    await playHits(p3, 6, async () => {}); await p3.waitForTimeout(6000);
    ok('la partida se cobra y se anota igual (el marcador semanal y la billetera no pueden romper los pesos)', st.db.wallets[u3].c === st.db.runs[u3].h && st.db.scores[u3] && st.db.scores[u3].s === st.db.runs[u3].h && !(st.db.weekly && st.db.weekly[WK()] && st.db.weekly[WK()][u3]), JSON.stringify(st.db.wallets[u3]));
    await abrirMarcador(p3);
    ok('«Todo el tiempo» sigue funcionando', (await filas(p3)).length > 0 && /Top/.test(await nota(p3)), await nota(p3));
    await pestana(p3, 'kindW');
    ok('«Semanal» avisa que faltan las reglas nuevas', /Falta publicar las reglas nuevas/.test(await nota(p3)), await nota(p3));
    await pestana(p3, 'kindM');
    ok('«Millonarios» avisa que faltan las reglas nuevas', /Falta publicar las reglas nuevas/.test(await nota(p3)), await nota(p3));
    ok('sin errores de página', e3.length === 0, e3.join('|'));
    fs.unlinkSync(f2); st.rulesFile = null; st.denied.length = 0; await c3.close();
  }

  console.log(`\n${pass} correctas, ${fail} fallas`);
  await b.close(); process.exit(fail ? 1 : 0);
})();
