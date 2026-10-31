// Racha diaria de punta a punta: el juego real en Chromium contra un Firebase de mentira que aplica las reglas REALES (firebase-rules.json).
// Uso:  cd pruebas && npm install && npx playwright install chromium && node racha.test.js
const fs = require('fs');
const { chromium, st, newPage, playHits, registrar } = require('./mockfirebase.js');
const DAY = 86400000;
let pass = 0, fail = 0;
const ok = (n, c, x = '') => { if (c) { pass++; console.log('  ok  ', n); } else { fail++; console.log('  FALLA', n, x); } };
const pesosFor = h => h;   // hasta 99 rebotes: $1 por rebote
(async () => {
  const b = await chromium.launch(fs.existsSync('/opt/pw-browsers/chromium') ? { executablePath: '/opt/pw-browsers/chromium' } : {});
  const { ctx, p, errs } = await newPage(b);
  await registrar(p, 'Racha Test');
  const uid = Object.values(st.users)[0].uid;
  const vis = sel => p.evaluate(s => document.querySelector(s).classList.contains('show'), sel);
  const txt = sel => p.evaluate(s => document.querySelector(s).textContent.trim(), sel);
  console.log('Día 1');
  ok('al entrar se abre sola la racha diaria', await vis('#daily'));
  ok('botón «Reclamar $100»', (await txt('#dailyGo')) === 'Reclamar $100', await txt('#dailyGo'));
  const iconos = await p.evaluate(() => [...document.querySelectorAll('#dailyGrid .dcard:not(.d7)')].map(c => [...c.querySelectorAll('.ic img')].map(i => i.getAttribute('src').replace('skins/', '').replace('.webp', ''))));
  ok('los dibujos coinciden con los pesos: $100 = 1 moneda de 100, $200 = 2, $300 = 3, $400 = 4, $500 = moneda de 500, $1.000 = billete de 1000',
    JSON.stringify(iconos) === JSON.stringify([['peso100'], ['peso100', 'peso100'], ['peso100', 'peso100', 'peso100'], ['peso100', 'peso100', 'peso100', 'peso100'], ['peso500'], ['b1000']]), JSON.stringify(iconos));
  await p.screenshot({ path: process.env.SHOT || '/tmp/racha_iconos.png' });
  await p.tap('#dailyGo'); await p.waitForTimeout(1200);
  await p.waitForTimeout(250);
  ok('al reclamar salen monedas volando hacia el bolsillo y el «+$100» grande', await p.evaluate(() => document.querySelectorAll('.fly').length > 0 && !!document.querySelector('.gain')));
  await p.waitForTimeout(2600);
  ok('el bolsillo termina en $100 y no quedan monedas volando', (await txt('#pocketNum')) === '$100' && await p.evaluate(() => document.querySelectorAll('.fly, .gain').length === 0), await txt('#pocketNum'));
  ok('la cartera subió $100 en el servidor', st.db.wallets[uid].c === 100, JSON.stringify(st.db.wallets[uid]));
  ok('racha guardada n=1', st.db.streaks[uid].n === 1, JSON.stringify(st.db.streaks[uid]));
  ok('el mensaje confirma el cobro', /\+\$100/.test(await txt('#dailyMsg')), await txt('#dailyMsg'));
  ok('el botón queda en «Vuelve en …»', /^Vuelve en/.test(await txt('#dailyGo')) && await p.evaluate(() => document.getElementById('dailyGo').disabled));
  ok('chip 🔥 1', (await txt('#streakNum')) === '1');
  await p.tap('#dailyClose'); await p.waitForTimeout(300);
  ok('sin denegados', st.denied.length === 0, st.denied.join('|'));

  console.log('Día 2 (al día siguiente)');
  st.db.streaks[uid].t -= DAY; await p.reload(); await p.waitForTimeout(2500);
  ok('se abre sola otra vez', await vis('#daily')); ok('botón «Reclamar $200»', (await txt('#dailyGo')) === 'Reclamar $200', await txt('#dailyGo'));
  await p.tap('#dailyGo'); await p.waitForTimeout(1200);
  ok('cartera $300 y racha 2', st.db.wallets[uid].c === 300 && st.db.streaks[uid].n === 2, JSON.stringify([st.db.wallets[uid], st.db.streaks[uid]]));
  await p.tap('#dailyClose');

  console.log('Se saltó un día');
  st.db.streaks[uid].t -= 2 * DAY; await p.reload(); await p.waitForTimeout(2500);
  ok('avisa que perdió la racha', /Perdiste la racha/.test(await txt('#dailySub')), await txt('#dailySub'));
  await p.tap('#dailyGo'); await p.waitForTimeout(1200);
  ok('vuelve al día 1: cartera $400 y racha 1', st.db.wallets[uid].c === 400 && st.db.streaks[uid].n === 1, JSON.stringify([st.db.wallets[uid], st.db.streaks[uid]]));
  await p.tap('#dailyClose');

  console.log('Mismo día: no se puede cobrar dos veces');
  const r2 = await p.evaluate(async () => { document.getElementById('streakChip').click(); return document.getElementById('dailyGo').disabled; });
  ok('el botón está desactivado', r2);
  await p.tap('#dailyClose');

  console.log('Día 7: pesos dobles');
  st.db.streaks[uid] = { n: 6, t: st.db.streaks[uid].t - DAY }; await p.reload(); await p.waitForTimeout(2500);
  ok('botón «Reclamar bono ⚡»', /bono/.test(await txt('#dailyGo')), await txt('#dailyGo'));
  const c0 = st.db.wallets[uid].c;
  await p.tap('#dailyGo'); await p.waitForTimeout(1200);
  ok('sin pesos de regalo y con bx guardado', st.db.wallets[uid].c === c0 && st.db.streaks[uid].n === 7 && st.db.streaks[uid].bx > 0, JSON.stringify([st.db.wallets[uid], st.db.streaks[uid]]));
  await p.tap('#dailyClose'); await p.waitForTimeout(1500);
  ok('aparece el cartel «Pesos dobles»', await p.evaluate(() => !document.getElementById('boostBar').hidden));
  await playHits(p, 6, async () => {}); await p.waitForTimeout(3500);
  const run = st.db.runs[uid];
  ok('la partida pagó el doble y el servidor lo aceptó', run && run.p === 2 * pesosFor(run.h) && run.h >= 6, JSON.stringify(run));
  ok('el resultado lo muestra', /pesos dobles/i.test(await txt('#finalSub')), await txt('#finalSub'));
  ok('sin denegados en todo el flujo', st.denied.length === 0, st.denied.join(' || '));
  ok('sin errores de página', errs.length === 0, errs.join('|'));
  console.log(`\n${pass} correctas, ${fail} fallas`);
  await b.close(); process.exit(fail ? 1 : 0);
})();
