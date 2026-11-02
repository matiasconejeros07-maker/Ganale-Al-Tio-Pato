// Misiones de punta a punta (juego + reglas reales de Firebase): estadísticas al cobrar partidas, 3 misiones por día, logros de una sola vez y premios exactos.
// Uso:  cd pruebas && npm install && node misiones.test.js
const fs = require('fs'), os = require('os'), path = require('path'), vm = require('vm');
const { chromium, st, newPage, playHits, registrar } = require('./mockfirebase.js');
let pass = 0, fail = 0;
const ok = (n, c, x = '') => { if (c) { pass++; console.log('  ok  ', n); } else { fail++; console.log('  FALLA', n, x); } };
const cx = { window: {} }; vm.createContext(cx); vm.runInContext(fs.readFileSync(path.join(__dirname, '..', 'tienda.js'), 'utf8'), cx);
const MI = cx.window.TIENDA.eco.misiones, hoy = () => Math.floor((Date.now() - 3 * 3600000) / 86400000), pickJ = (d, k) => ((d * 5 + 2 * k) % 7) % 3;
const CAMPO = { g: 'dg', r: 'dr', m: 'dm' };
const cerrarDiario = p => p.evaluate(() => { const b = document.getElementById('dailyClose'); if (b && b.offsetParent) b.click(); });
const alMenu = p => p.evaluate(() => { const b = document.getElementById('backResult'); if (b && b.offsetParent) b.click(); });
const abrir = async (p, id) => { await alMenu(p); await p.waitForTimeout(300); await cerrarDiario(p); await p.evaluate(i => document.getElementById(i).click(), id); await p.waitForTimeout(900); };
const filas = p => p.evaluate(() => [...document.querySelectorAll('#missList .mrow')].map(r => ({ t: r.querySelector('b').textContent, premio: r.querySelector('.mr').textContent, cls: r.className, peq: r.querySelector('small').textContent })));
const boton = p => p.evaluate(() => ({ t: document.getElementById('dailyGo').textContent, off: document.getElementById('dailyGo').disabled }));
const tab = async (p, id) => { await p.evaluate(i => document.getElementById(i).click(), id); await p.waitForTimeout(900); };
(async () => {
  const b = await chromium.launch(fs.existsSync('/opt/pw-browsers/chromium') ? { executablePath: '/opt/pw-browsers/chromium' } : {});
  const { ctx, p, errs } = await newPage(b);
  const uid = await registrar(p, 'Misiones Uno'); await cerrarDiario(p); await p.waitForTimeout(500);

  console.log('Pantalla de misiones');
  ok('con las reglas publicadas aparece el botón «Misiones» (sin avisos todavía)', await p.isVisible('#openMiss') && !(await p.isVisible('#missBadge')));
  await abrir(p, 'openMiss');
  const dia = await filas(p);
  ok('«Hoy» muestra 3 misiones: fácil, media y difícil, con más premio cuanto más difícil', dia.length === 3 && dia[0].premio === '$100' && dia[1].premio === '$250' && dia[2].premio === '$500' && /Fácil/.test(dia[0].t) && /Media/.test(dia[1].t) && /Difícil/.test(dia[2].t), JSON.stringify(dia));
  const D = hoy(), esperadas = [0, 1, 2].map(k => { const de = MI.dia[k].de[pickJ(D, k)]; return de; });
  const texto = ([t, n]) => t === 'g' ? `Juega ${n} partidas hoy` : t === 'r' ? `Suma ${n} rebotes hoy` : `Llega a ${n} rebotes en una sola partida hoy`;
  ok('las misiones de hoy son las que dice la fecha (igual que en las reglas)', esperadas.every((de, k) => dia[k].t.startsWith(texto(de))), JSON.stringify([esperadas, dia.map(x => x.t)]));
  ok('el botón avisa que hay que cumplir una misión', (await boton(p)).off && /Cumple una misión/.test((await boton(p)).t), JSON.stringify(await boton(p)));
  await tab(p, 'tabA');
  const logros = await filas(p);
  ok(`«Logros» muestra los ${MI.logros.length} logros con sus premios, ninguno listo`, logros.length === MI.logros.length && !logros.some(l => /ready|done/.test(l.cls)) && logros.some(l => l.t === 'Llega a 100 rebotes en una partida' && l.premio === '$600') && logros.some(l => l.t === 'Juega 10 partidas' && l.premio === '$150'), JSON.stringify(logros.slice(0, 3)));
  await p.evaluate(() => document.getElementById('dailyClose').click());

  console.log('Las estadísticas suben al cobrar cada partida');
  await playHits(p, 12, async () => {}); await p.waitForTimeout(5000);
  const run = st.db.runs[uid], s1 = st.db.stats && st.db.stats[uid];
  ok(`la primera partida (${run.h} rebotes) crea las estadísticas`, s1 && s1.g === 1 && s1.r === run.h && s1.sl === run.s && s1.d === D && s1.dg === 1 && s1.dr === run.h && s1.dm === run.h && s1.dc === 0, JSON.stringify(s1));
  ok('el final de la partida avisa que hay misiones por reclamar', /misi/.test(await p.textContent('#missLine')), await p.textContent('#missLine'));
  const h1 = run.h; const c1 = st.db.wallets[uid].c;
  await playHits(p, 6, async () => {}); await p.waitForTimeout(5000);
  const run2 = st.db.runs[uid], s2 = st.db.stats[uid];
  ok('la segunda partida se suma: partidas, rebotes totales, lo de hoy y la mejor de hoy', s2.g === 2 && s2.r === h1 + run2.h && s2.dg === 2 && s2.dr === h1 + run2.h && s2.dm === Math.max(h1, run2.h) && s2.sl === run2.s, JSON.stringify(s2));
  ok('sin denegados ni errores de página', st.denied.length === 0 && errs.length === 0, st.denied.join(' || ') + errs.join('|'));

  console.log('Cobrar logros');
  await abrir(p, 'openMiss'); await tab(p, 'tabA');
  const l2 = await filas(p), listas = l2.filter(l => /ready/.test(l.cls));
  const esperados = MI.logros.filter(([, t, n]) => (t === 'g' && n <= 2) || (t === 'b' && n <= Math.max(h1, run2.h, 0)) || (t === 'r' && n <= h1 + run2.h) || false);
  ok(`hay logros listos (${listas.length}): «Juega tu primera partida» y los de rebotes que ya alcanzaste`, listas.some(l => l.t === 'Juega tu primera partida') && listas.length >= esperados.length - 1, JSON.stringify(listas.map(l => l.t)));
  const antes = st.db.wallets[uid].c, boton1 = await boton(p), suma = listas.reduce((a, l) => a + (+l.premio.replace(/[$.]/g, '')), 0);
  ok(`el botón dice cuánto se cobra (${boton1.t})`, !boton1.off && boton1.t === 'Reclamar $' + String(suma).replace(/\B(?=(\d{3})+(?!\d))/g, '.'), JSON.stringify(boton1) + ' suma=' + suma);
  await p.evaluate(() => document.getElementById('dailyGo').click()); await p.waitForTimeout(4500);
  ok('el servidor aceptó el cobro: los pesos suben EXACTAMENTE la suma de los premios', st.db.wallets[uid].c === antes + suma && st.denied.length === 0, `${antes} → ${st.db.wallets[uid].c} (suma ${suma}) ${st.denied.join(' || ')}`);
  ok('los logros quedan marcados como cobrados en la base de datos', st.db.missions && st.db.missions[uid] && st.db.missions[uid].g1 === true && Object.keys(st.db.missions[uid]).length === listas.length, JSON.stringify(st.db.missions && st.db.missions[uid]));
  const l3 = await filas(p);
  ok('en la pantalla pasan a «Cobrada ✓» y el botón se apaga', l3.filter(l => /done/.test(l.cls)).length === listas.length && (await boton(p)).off, JSON.stringify(await boton(p)));

  console.log('Misiones del día');
  const cumple = { dg: MI.dia.map((_, k) => MI.dia[k].de[pickJ(D, k)]).find(d => d[0] === 'g'), };
  const sd = { g: 12, r: 800, sl: s2.sl, d: D, dg: 0, dr: 0, dm: 0, dc: 0 };
  MI.dia.forEach((x, k) => { const de = x.de[pickJ(D, k)]; sd[CAMPO[de[0]]] = Math.max(sd[CAMPO[de[0]]], de[1]); });
  st.db.stats[uid] = sd;
  await p.reload(); await p.waitForTimeout(2500); await cerrarDiario(p);
  ok('con las 3 cumplidas el menú avisa con una insignia', await p.isVisible('#missBadge') && +(await p.textContent('#missBadge')) >= 3, await p.textContent('#missBadge'));
  await abrir(p, 'openMiss');
  const hoyF = await filas(p), bt = await boton(p);
  ok('las 3 de hoy salen listas y el botón suma $850 (100 + 250 + 500)', hoyF.every(f => /ready/.test(f.cls)) && bt.t === 'Reclamar $850', JSON.stringify([bt, hoyF.map(f => f.cls)]));
  const antes2 = st.db.wallets[uid].c;
  await p.evaluate(() => document.getElementById('dailyGo').click()); await p.waitForTimeout(4500);
  ok('se cobran las 3: los pesos suben exactamente $850 y quedan las 3 casillas marcadas', st.db.wallets[uid].c === antes2 + 850 && st.db.stats[uid].dc === 7 && st.denied.length === 0, `${antes2} → ${st.db.wallets[uid].c} dc=${st.db.stats[uid].dc} ${st.denied.join(' || ')}`);
  ok('el botón queda apagado con «Vuelve en…»', (await boton(p)).off && /Vuelve en/.test((await boton(p)).t), JSON.stringify(await boton(p)));
  await p.evaluate(() => document.getElementById('dailyGo').click()); await p.waitForTimeout(800);
  ok('no hay forma de cobrarlas otra vez el mismo día', st.db.wallets[uid].c === antes2 + 850);

  console.log('Cambio de día');
  const ayer = { ...st.db.stats[uid], d: D - 1, dc: 7, dg: 9, dr: 400, dm: 80 }; st.db.stats[uid] = ayer;
  await p.reload(); await p.waitForTimeout(2500); await cerrarDiario(p);
  await abrir(p, 'openMiss');
  ok('con contadores de ayer, las misiones de hoy vuelven a empezar (sin listas)', (await filas(p)).every(f => !/ready|done/.test(f.cls)), JSON.stringify((await filas(p)).map(f => f.cls)));
  await p.evaluate(() => document.getElementById('dailyClose').click());
  await playHits(p, 5, async () => {}); await p.waitForTimeout(5000);
  const s3 = st.db.stats[uid], run3 = st.db.runs[uid];
  ok('la primera partida del día reinicia los contadores de hoy y las casillas (dc = 0), pero no los totales', s3.d === D && s3.dg === 1 && s3.dr === run3.h && s3.dm === run3.h && s3.dc === 0 && s3.g === 13, JSON.stringify(s3));
  ok('sin denegados ni errores de página en todo el recorrido', st.denied.length === 0 && errs.length === 0, st.denied.join(' || ') + errs.join('|'));
  await ctx.close();

  console.log('Logro «Verifica tu correo» y el emblema');
  {
    const { ctx: c2, p: p2, errs: e2 } = await newPage(b);
    const u2 = await registrar(p2, 'Misiones Dos', 'dos@gmail.com'); await cerrarDiario(p2); await p2.waitForTimeout(500);
    await abrir(p2, 'openMiss'); await tab(p2, 'tabA');
    const v0 = (await filas(p2)).find(l => l.t === 'Verifica tu correo');
    ok('«Verifica tu correo» ($300) no está lista mientras el correo no esté verificado', v0 && v0.premio === '$300' && !/ready/.test(v0.cls), JSON.stringify(v0));
    await p2.evaluate(() => document.getElementById('dailyClose').click());
    st.users['dos@gmail.com'].ev = true;                                                          // abre el enlace del correo
    await alMenu(p2); await p2.evaluate(() => document.getElementById('openSettings').click()); await p2.waitForTimeout(300);
    await p2.evaluate(() => document.getElementById('mailBtn').click()); await p2.waitForTimeout(500);
    await p2.evaluate(() => document.getElementById('mCheck').click()); await p2.waitForTimeout(1200);
    await p2.evaluate(() => document.getElementById('mailClose').click()); await p2.waitForTimeout(300);
    await abrir(p2, 'openMiss'); await tab(p2, 'tabA');
    const v1 = (await filas(p2)).find(l => l.t === 'Verifica tu correo');
    ok('con el correo verificado la misión queda lista', /ready/.test(v1.cls), JSON.stringify(v1));
    await p2.evaluate(() => document.getElementById('dailyGo').click()); await p2.waitForTimeout(4500);
    ok('se cobra: $300 y queda marcada (el servidor comprobó que el correo está verificado)', st.db.missions && st.db.missions[u2] && st.db.missions[u2].v1 === true && st.db.wallets[u2].c === 300 && st.denied.length === 0, JSON.stringify([st.db.missions && st.db.missions[u2], st.db.wallets[u2], st.denied]));
    ok('sin errores de página', e2.length === 0, e2.join('|'));
    await c2.close();
  }

  console.log('Si todavía no están publicadas las reglas nuevas');
  {
    const r = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'firebase-rules.json'), 'utf8')); delete r.rules.stats; delete r.rules.missions;
    const f = path.join(os.tmpdir(), 'sin-misiones-' + process.pid + '.json'); fs.writeFileSync(f, JSON.stringify(r)); st.rulesFile = f;
    const { ctx: c3, p: p3, errs: e3 } = await newPage(b);
    const u3 = await registrar(p3, 'Misiones Tres'); await cerrarDiario(p3); await p3.waitForTimeout(500);
    ok('sin las reglas nuevas no aparece «Misiones» (no se muestra nada roto)', !(await p3.isVisible('#openMiss')));
    await playHits(p3, 5, async () => {}); await p3.waitForTimeout(5000);
    ok('y la partida se cobra igual (las misiones no pueden romper los pesos)', st.db.wallets[u3].c === st.db.runs[u3].h && !(st.db.stats && st.db.stats[u3]), JSON.stringify(st.db.wallets[u3]));
    fs.unlinkSync(f); st.rulesFile = null; st.denied.length = 0; await c3.close();
  }

  console.log(`\n${pass} correctas, ${fail} fallas`);
  await b.close(); process.exit(fail ? 1 : 0);
})();
