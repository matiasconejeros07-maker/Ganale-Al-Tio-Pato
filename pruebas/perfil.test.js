// Emblema de perfil de punta a punta: editarlo, guardarlo en la cuenta y en el marcador, verlo en el marcador y como rival del primer lugar.
// Uso:  cd pruebas && npm install && npx playwright install chromium && node perfil.test.js
const fs = require('fs');
const { chromium, st, newPage, playHits } = require('./mockfirebase.js');
let pass = 0, fail = 0;
const ok = (n, c, x = '') => { if (c) { pass++; console.log('  ok  ', n); } else { fail++; console.log('  FALLA', n, x); } };
(async () => {
  const b = await chromium.launch(fs.existsSync('/opt/pw-browsers/chromium') ? { executablePath: '/opt/pw-browsers/chromium' } : {});
  const { ctx, p, errs } = await newPage(b);
  await p.tap('#tabUp'); await p.fill('#acct', 'Perfil Test'); await p.fill('#pass', 'secreto123'); await p.tap('#authGo'); await p.waitForTimeout(2500);
  const uid = Object.values(st.users)[0].uid;
  st.db.scores = { a1: { n: 'Matías', k: 'matias', s: 131, t: 1, a: 'e41A33GGG' }, a2: { n: 'Cami', k: 'cami', s: 80, t: 2 } };   // el primero tiene un escudo rojo con dorado y una corona
  await p.reload(); await p.waitForTimeout(2500); await p.tap('#dailyClose').catch(() => {});
  console.log('El rival del encabezado es el primer lugar');
  const rival = await p.evaluate(() => ({ emb: document.getElementById('botAv').classList.contains('emb'), txt: document.getElementById('botEmb').textContent, nombre: document.getElementById('botAv').title }));
  ok('el avatar rival muestra el emblema de quien va primero (👑) y su nombre', rival.emb && rival.txt === '👑' && rival.nombre === 'Matías', JSON.stringify(rival));
  console.log('Editor');
  await p.tap('#userBox'); await p.waitForTimeout(400);
  ok('el editor se abre desde el chip del inicio', await p.evaluate(() => document.getElementById('emblem').classList.contains('show')));
  const antes = await p.evaluate(() => document.querySelector('#edStage .embs').style.left);
  const box = await p.evaluate(() => { const r = document.getElementById('edStage').getBoundingClientRect(); return [r.left, r.top, r.width, r.height]; });
  await p.mouse.move(box[0] + box[2] * .5, box[1] + box[3] * .5); await p.mouse.down(); await p.mouse.move(box[0] + box[2] * .75, box[1] + box[3] * .3, { steps: 4 }); await p.mouse.up();
  const despues = await p.evaluate(() => document.querySelector('#edStage .embs').style.left);
  ok('arrastrar sobre la vista previa mueve el símbolo', antes !== despues, antes + ' → ' + despues);
  await p.evaluate(() => { document.querySelectorAll('#edSyms button')[6].click(); document.querySelectorAll('#edShapes button')[4].click(); document.querySelectorAll('#edC1 button')[7].click(); document.querySelectorAll('#edC2 button')[10].click(); document.querySelectorAll('#edPats button')[3].click(); document.getElementById('edBigger').click(); });
  await p.evaluate(() => document.getElementById('edLayers').lastElementChild.click());
  ok('se pueden agregar símbolos (hasta 3)', await p.evaluate(() => document.querySelectorAll('#edLayers .edchip').length === 3));
  await p.evaluate(() => document.getElementById('edSave').click()); await p.waitForTimeout(1500);
  const av = st.db.wallets && st.db.wallets[uid] && st.db.wallets[uid].av;
  ok('el emblema queda en la cuenta (9 a 17 caracteres)', typeof av === 'string' && /^e[0-9A-Za-z_-]{4}([0-9A-Za-z_-]{4}){1,3}$/.test(av) && av.length <= 17, String(av));
  ok('el encabezado y el chip muestran el 💎', await p.evaluate(() => document.getElementById('meEmb').textContent.includes('💎') && document.getElementById('userEmb').textContent.includes('💎')));
  console.log('Marcador');
  await playHits(p, 3, async () => {}); await p.waitForTimeout(3500);
  ok('al guardar la partida el marcador lleva el mismo emblema', st.db.scores && st.db.scores[uid] && st.db.scores[uid].a === av, JSON.stringify(st.db.scores && st.db.scores[uid]));
  await p.tap('#openBoard2'); await p.waitForTimeout(1200);
  const filas = await p.evaluate(() => [...document.querySelectorAll('#list li')].map(li => [li.querySelector('.t').textContent, li.querySelector('.pav .embs') ? li.querySelector('.pav .embs').textContent : '']));
  ok('el marcador muestra el emblema de cada jugador', filas.length === 3 && filas[0][0] === 'Matías' && filas[0][1] === '👑' && filas.some(f => f[0] === 'Perfil Test' && f[1].includes('💎')), JSON.stringify(filas));
  console.log('Otro dispositivo');
  await p.evaluate(() => { const o = JSON.parse(localStorage.getItem('gana-al-tio-pato-v2')); delete o.av; localStorage.setItem('gana-al-tio-pato-v2', JSON.stringify(o)); });
  await p.reload(); await p.waitForTimeout(2500);
  ok('con los datos locales borrados, el emblema vuelve desde la cuenta', await p.evaluate(() => document.getElementById('meEmb').textContent.includes('💎')));
  ok('sin denegados ni errores de página', st.denied.length === 0 && errs.length === 0, st.denied.join(' || ') + errs.join('|'));
  console.log(`\n${pass} correctas, ${fail} fallas`);
  await b.close(); process.exit(fail ? 1 : 0);
})();
