// Colores del juego de punta a punta (juego + reglas reales de Firebase): el azul de siempre, la pestaña «Colores» de la tienda (comprar con pesos y cambiar cuando uno quiere),
// que cada color se lea bien y que no se pueda equipar uno sin comprarlo. Uso:  cd pruebas && npm install && node colores.test.js
const fs = require('fs');
const { chromium, st, newPage, registrar, JUEGO } = require('./mockfirebase.js');
let pass = 0, fail = 0;
const ok = (n, c, x = '') => { if (c) { pass++; console.log('  ok  ', n); } else { fail++; console.log('  FALLA', n, x); } };
const cerrarDiario = p => p.evaluate(() => { const b = document.getElementById('dailyClose'); if (b && b.offsetParent) b.click(); });
const dar = (uid, extra = {}) => { st.db.wallets = { ...(st.db.wallets || {}), [uid]: { ...((st.db.wallets || {})[uid] || {}), c: 50000, sp: 0, ...extra } }; };
const TH = (() => { const cx = {}; require('vm').runInNewContext(fs.readFileSync(JUEGO + 'tienda.js', 'utf8'), (cx.window = {}, cx)); return cx.window.TIENDA.th; })();
const abrirTienda = async p => { await p.evaluate(() => document.getElementById('openShop').click()); await p.waitForTimeout(700); await p.evaluate(() => document.getElementById('tabTh').click()); await p.waitForTimeout(500); };
const alMenu = async p => { await p.evaluate(() => document.getElementById('shopBack').click()); await p.waitForTimeout(500); };
const tarjeta = (p, nombre) => p.evaluate(n => { const c = [...document.querySelectorAll('#shopGrid .item')].find(i => i.querySelector('.nm').textContent === n); return c ? { btn: c.querySelector('button').textContent.trim(), cls: c.querySelector('button').className, on: c.classList.contains('on'), vip: c.classList.contains('vip') } : null; }, nombre);
const tocar = (p, nombre) => p.evaluate(n => { const c = [...document.querySelectorAll('#shopGrid .item')].find(i => i.querySelector('.nm').textContent === n); if (c) c.querySelector('button').click(); return !!c; }, nombre);
const estado = p => p.evaluate(() => ({ dark: document.body.classList.contains('th-dark'), bg: getComputedStyle(document.documentElement).getPropertyValue('--bg').trim(), meta: document.getElementById('themeColor').getAttribute('content') }));
let n = 0; const nombre = () => 'Col' + (++n) + 'x' + String(Date.now()).slice(-4);

// El fondo «Clásico» de la partida (PALETTE en index.html) es todo oscuro: el marcador es blanco al 80% y son números grandes (24 px en negrita = «texto grande» de WCAG), así que cada color tiene que darle contraste de al menos 3:1 (los azules del inicio dan más de 9:1)
{
  const html = fs.readFileSync(JUEGO + 'index.html', 'utf8'), m = /const PALETTE = \[([^\]]+)\]/.exec(html), pal = m ? m[1].match(/#[0-9a-fA-F]{6}/g) : [];
  const lum = c => { const f = v => { v /= 255; return v <= .03928 ? v / 12.92 : Math.pow((v + .055) / 1.055, 2.4); }; return .2126 * f(c[0]) + .7152 * f(c[1]) + .0722 * f(c[2]); };
  const rgb = h => [1, 3, 5].map(i => parseInt(h.slice(i, i + 2), 16));
  ok('el fondo de la partida tiene 11 colores y parte en el azul del inicio (#003454)', pal.length === 11 && pal[0].toLowerCase() === '#003454', JSON.stringify(pal));
  const malos = pal.filter(h => { const c = rgb(h), mez = c.map(v => 255 * .8 + v * .2), l1 = lum(mez), l2 = lum(c); return (l1 + .05) / (l2 + .05) < 3; });
  ok('el marcador blanco se lee sobre cada color del fondo de la partida (contraste ≥ 3 para texto grande)', malos.length === 0, malos.join(' '));
}

// El final de la partida es un azul degradado en movimiento (body.end en index.html): el texto va blanco, así que cada tono tiene que dar contraste de al menos 4,5:1
{
  const html = fs.readFileSync(JUEGO + 'index.html', 'utf8'), m = /body\.end \{ background: linear-gradient\(([^;]+)\);/.exec(html), pal = m ? m[1].match(/#[0-9a-fA-F]{6}/g) : [];
  const lum = c => { const f = v => { v /= 255; return v <= .03928 ? v / 12.92 : Math.pow((v + .055) / 1.055, 2.4); }; return .2126 * f(c[0]) + .7152 * f(c[1]) + .0722 * f(c[2]); };
  const rgb = h => [1, 3, 5].map(i => parseInt(h.slice(i, i + 2), 16));
  ok('el degradado del final tiene al menos 5 tonos', pal.length >= 5, JSON.stringify(pal));
  ok('todos los tonos del final son azules (sin morado ni rosado)', pal.every(h => { const c = rgb(h); return c[2] > c[0] + 40 && c[2] >= c[1]; }), pal.join(' '));
  const malos = pal.filter(h => { const c = rgb(h), mez = c.map(v => 255 * .85 + v * .15); return (lum(mez) + .05) / (lum(c) + .05) < 4.5; });
  ok('el texto blanco del final se lee sobre cada tono del degradado (contraste ≥ 4,5)', malos.length === 0, malos.join(' '));
  ok('en el final ya no queda ningún morado (#7b3ff2, #b21ee0, #e0149f, #8e2bea) en el fondo ni en la barra del navegador', !/body\.end \{[^}]*(7b3ff2|b21ee0|e0149f)/i.test(html) && !/setTheme\('#8e2bea'\)/.test(html));
}

// La barra del navegador y la de Android (manifiesto) y la pantalla de carga son azules; no queda el amarillo crema de antes (#fff7c2) en lo que pinta la barra
{
  const man = JSON.parse(fs.readFileSync(JUEGO + 'manifest.webmanifest', 'utf8')), html = fs.readFileSync(JUEGO + 'index.html', 'utf8');
  const meta = (/<meta name="theme-color" content="(#[0-9a-fA-F]{6})"/.exec(html) || [])[1] || '';
  const azul = h => /^#[0-9a-fA-F]{6}$/.test(h || '') && (c => c[2] > c[0] + 40 && c[2] >= c[1])([1, 3, 5].map(i => parseInt(h.slice(i, i + 2), 16)));
  ok('el color de la barra (manifiesto y meta theme-color) y el de la pantalla de carga son azules', azul(man.theme_color) && azul(man.background_color) && azul(meta), man.theme_color + ' ' + man.background_color + ' ' + meta);
  const viejos = ['index.html', 'manifest.webmanifest', 'sw.js'].filter(f => fs.existsSync(JUEGO + f) && /fff7c2/i.test(fs.readFileSync(JUEGO + f, 'utf8')));
  ok('no queda el amarillo crema de antes (#fff7c2) en la página, el manifiesto ni el service worker (solo vive en la tienda, como el color «Amarillo clásico» de $100)', viejos.length === 0, viejos.join(' '));
  const iconos = man.icons.map(i => i.src), faltan = iconos.concat(['icons/apple-touch-icon.png', 'icons/favicon-32.png', 'icons/favicon-64.png']).filter(f => !fs.existsSync(JUEGO + f));
  ok('el manifiesto trae los 3 íconos (192, 512 y maskable) y existen todos los íconos y favicons', iconos.length === 3 && faltan.length === 0, faltan.join(' '));
}

(async () => {
  const b = await chromium.launch(fs.existsSync('/opt/pw-browsers/chromium') ? { executablePath: '/opt/pw-browsers/chromium' } : {});

  console.log('El azul de siempre');
  const { ctx, p, errs } = await newPage(b);
  const uid = await registrar(p, nombre()); await cerrarDiario(p);
  let e = await estado(p);
  ok('el juego arranca en azul profundo: fondo #003454, barra del navegador #00223b y texto claro', e.bg === '#003454' && e.meta === '#00223b' && e.dark, JSON.stringify(e));
  const m = await p.evaluate(() => { const c = el => getComputedStyle(document.querySelector(el)).color; return { ttl: c('#menu .ttl'), tag: c('#menu .tag'), fondo: getComputedStyle(document.getElementById('menu')).backgroundImage }; });
  ok('el título del inicio es blanco y el fondo es el degradado azul (#00223b → #003454 → #001d35)', m.ttl === 'rgb(255, 255, 255)' && /rgb\(0, 34, 59\)/.test(m.fondo) && /rgb\(0, 52, 84\)/.test(m.fondo) && /rgb\(0, 29, 53\)/.test(m.fondo), JSON.stringify(m));

  console.log('La pestaña «Colores» de la tienda');
  dar(uid); await p.reload(); await p.waitForTimeout(2500); await cerrarDiario(p);
  await abrirTienda(p);
  const hay = await p.evaluate(() => ({ tabs: [...document.querySelectorAll('#shop .seg button')].map(b => b.textContent), on: document.getElementById('tabTh').classList.contains('on'), items: [...document.querySelectorAll('#shopGrid .item .nm')].map(x => x.textContent), vipHead: !!document.querySelector('#shopGrid .vipHead') }));
  ok('la tienda tiene 5 pestañas: Personajes, Fondos, Barras, Pelotas y Colores', hay.tabs.join('|') === 'Personajes|Fondos|Barras|Pelotas|Colores' && hay.on, JSON.stringify(hay.tabs));
  ok('muestra los 9 colores del catálogo (con la franja «Solo para millonarios» para los dos últimos)', hay.items.length === TH.length && hay.items.join('|') === TH.map(t => t.n).join('|') && hay.vipHead, JSON.stringify(hay.items));
  const azul = await tarjeta(p, 'Azul profundo'), amar = await tarjeta(p, 'Amarillo clásico'), oro = await tarjeta(p, 'Negro y oro');
  ok('el azul de siempre sale «Equipado ✓» y los demás con su precio (el amarillo $100, el negro y oro $1.000.000 sin poder pagarlo)', azul && azul.on && /Equipado/.test(azul.btn) && /\$100$/.test(amar.btn) && /1\.000\.000/.test(oro.btn) && oro.vip && /no/.test(oro.cls), JSON.stringify([azul, amar, oro]));
  ok('cada color tiene su vista previa en miniatura', await p.evaluate(() => document.querySelectorAll('#shopGrid .pv.thpv').length === 9));
  ok('las 5 pestañas caben en la barra (390 px)', await p.evaluate(() => { const bar = document.querySelector('#shop .seg').getBoundingClientRect(), t = [...document.querySelectorAll('#shop .seg button')].map(x => ({ r: x.getBoundingClientRect(), sw: x.scrollWidth, cw: x.clientWidth })); return t.every(x => x.r.left >= bar.left - .5 && x.r.right <= bar.right + .5 && x.sw <= x.cw + 1); }));

  console.log('Comprar y cambiar');
  ok('sin saldo no se compra «Negro y oro»: avisa cuánto falta', await tocar(p, 'Negro y oro') && (await p.waitForTimeout(500), /Te faltan/.test(await p.textContent('#shopMsg'))) && !(st.db.wallets[uid].own && st.db.wallets[uid].own.th_oro), await p.textContent('#shopMsg'));
  await tocar(p, 'Amarillo clásico'); await p.waitForTimeout(2500);
  const w1 = st.db.wallets[uid];
  ok('se compra el amarillo clásico ($100): queda en la cartera, se descuentan 100 pesos y queda puesto', w1.own && w1.own.th_clasico === true && w1.sp === 100 && w1.eq && w1.eq.th === 'clasico', JSON.stringify(w1));
  e = await estado(p);
  ok('la tienda cambia de color al tiro: fondo amarillo (#fff7c2) y texto oscuro', e.bg === '#fff7c2' && !e.dark && e.meta === '#ffec96', JSON.stringify(e));
  ok('el mensaje confirma la compra', /Compraste «Amarillo clásico»/.test(await p.textContent('#shopMsg')), await p.textContent('#shopMsg'));
  ok('sin denegados', st.denied.length === 0, st.denied.join(' || '));
  ok('el amarillo ahora sale «Equipado ✓» y el azul ofrece «Equipar» (es gratis)', /Equipado/.test((await tarjeta(p, 'Amarillo clásico')).btn) && /^Equipar$/.test((await tarjeta(p, 'Azul profundo')).btn));
  await tocar(p, 'Azul profundo'); await p.waitForTimeout(1500);
  e = await estado(p);
  ok('volver al azul no cuesta nada y lo deja puesto en la nube', e.bg === '#003454' && e.dark && st.db.wallets[uid].eq.th === 'oceano' && st.db.wallets[uid].sp === 100, JSON.stringify(e) + JSON.stringify(st.db.wallets[uid]));
  await tocar(p, 'Amarillo clásico'); await p.waitForTimeout(1500);
  ok('y volver al amarillo ya comprado tampoco cuesta (solo «Equipar»)', st.db.wallets[uid].eq.th === 'clasico' && st.db.wallets[uid].sp === 100 && (await estado(p)).bg === '#fff7c2');
  await alMenu(p);
  ok('el inicio sigue con el color elegido', (await estado(p)).bg === '#fff7c2');
  await p.reload(); await p.waitForTimeout(2800); await cerrarDiario(p);
  ok('al volver a abrir el juego el color elegido sigue puesto (viene de la cuenta)', (await estado(p)).bg === '#fff7c2');
  ok('sin denegados ni errores de página', st.denied.length === 0 && errs.length === 0, st.denied.join(' || ') + errs.join('|'));

  console.log('No se puede hacer trampa');
  const tok = await p.evaluate(() => JSON.parse(localStorage.getItem('gana-al-tio-pato-sesion') || 'null').id), url = 'https://juegotiopato-default-rtdb.firebaseio.com';
  const hit = (ruta, body, m = 'PATCH') => p.evaluate(async ([url, ruta, body, tok, m]) => (await fetch(`${url}/${ruta}.json?auth=${encodeURIComponent(tok)}`, { method: m, body: JSON.stringify(body) })).status, [url, ruta, body, tok, m]);
  ok('ponerse «Negro y oro» sin comprarlo', await hit(`wallets/${uid}`, { 'eq/th': 'oro' }) === 401);
  ok('regalarse «Hielo diamante» sin pagar', await hit(`wallets/${uid}`, { 'own/th_diamante': true }) === 401);
  ok('comprar un color pagando menos ($1 por el violeta de $300)', await hit(`wallets/${uid}`, { sp: 101, 'own/th_violeta': true }) === 401);
  ok('los colores de otra cuenta no se tocan', await hit(`wallets/OTRAcuenta`, { 'eq/th': 'oro' }) === 401);
  st.denied.length = 0;

  console.log('Cada color se lee bien (texto contra su fondo)');
  const rico = {}; for (const t of TH) if (t.price > 0) rico['th_' + t.id] = true;
  for (const t of TH) {
    st.db.wallets[uid] = { c: 9000000, sp: 0, lr: 0, own: rico, eq: { th: t.id } };
    await p.reload(); await p.waitForTimeout(2500); await cerrarDiario(p);
    const r = await p.evaluate(tema => {
      const rgb = s => { const m = s.match(/[\d.]+/g).map(Number); return { r: m[0], g: m[1], b: m[2], a: m.length > 3 ? m[3] : 1 }; };
      const hex = h => ({ r: parseInt(h.slice(1, 3), 16), g: parseInt(h.slice(3, 5), 16), b: parseInt(h.slice(5, 7), 16), a: 1 });
      const mix = (f, bg) => ({ r: f.r * f.a + bg.r * (1 - f.a), g: f.g * f.a + bg.g * (1 - f.a), b: f.b * f.a + bg.b * (1 - f.a) });
      const lum = c => { const f = v => { v /= 255; return v <= .03928 ? v / 12.92 : Math.pow((v + .055) / 1.055, 2.4); }; return .2126 * f(c.r) + .7152 * f(c.g) + .0722 * f(c.b); };
      const con = (a, b) => { const x = lum(a), y = lum(b); return (Math.max(x, y) + .05) / (Math.min(x, y) + .05); };
      const fondos = [hex(tema.c[0]), hex(tema.c[1]), hex(tema.c[2])];
      const peor = col => Math.min(...fondos.map(f => con(mix(rgb(col), f), f)));
      const color = s => getComputedStyle(document.querySelector(s)).color;
      return { ttl: peor(color('#menu .ttl')), tag: peor(color('#menu .tag')), dark: document.body.classList.contains('th-dark'), bg: getComputedStyle(document.documentElement).getPropertyValue('--bg').trim() };
    }, t);
    ok(`${t.n}: el título (contraste ${r.ttl.toFixed(1)}) y el texto del inicio (${r.tag.toFixed(1)}) se leen sobre su fondo`, r.ttl >= 4.5 && r.tag >= 3.5 && r.dark === !!t.dark && r.bg === t.c[1], JSON.stringify(r));
  }
  ok('sin errores de página en todo el recorrido', errs.length === 0, errs.join('|'));
  await ctx.close();

  console.log('Las 5 pestañas caben también en pantallas angostas');
  for (const [w, h] of [[360, 740], [320, 568]]) {
    const { ctx: c2, p: p2, errs: e2 } = await newPage(b, { viewport: { width: w, height: h } });
    const u2 = await registrar(p2, nombre()); await cerrarDiario(p2); dar(u2); await p2.reload(); await p2.waitForTimeout(2500); await cerrarDiario(p2);
    await abrirTienda(p2);
    const r = await p2.evaluate(() => { const bar = document.querySelector('#shop .seg').getBoundingClientRect(), t = [...document.querySelectorAll('#shop .seg button')].map(x => ({ r: x.getBoundingClientRect(), sw: x.scrollWidth, cw: x.clientWidth })); return { ok: t.every(x => x.r.left >= bar.left - .5 && x.r.right <= bar.right + .5 && x.sw <= x.cw + 1), n: t.length }; });
    ok(`${w}×${h}: las 5 pestañas de la tienda caben en la barra sin cortarse`, r.ok && r.n === 5, JSON.stringify(r));
    await c2.close();
  }

  console.log('Sin las reglas nuevas de Firebase el juego sigue funcionando');
  {
    const r = JSON.parse(fs.readFileSync(JUEGO + 'firebase-rules.json', 'utf8'));
    for (const k of Object.keys(r.rules.wallets.$uid.own.$item)) { /* se deja igual */ }
    r.rules.wallets.$uid.eq['$other'] = { '.validate': false }; delete r.rules.wallets.$uid.eq.th;                // las reglas de antes no conocen el color
    r.rules.wallets.$uid.own.$item['.validate'] = r.rules.wallets.$uid.own.$item['.validate'].replace(/\$item === 'th_[a-z]+' \? \d+ : /g, '');
    const f = require('os').tmpdir() + '/sin-colores-' + process.pid + '.json'; fs.writeFileSync(f, JSON.stringify(r)); st.rulesFile = f;
    const { ctx: c3, p: p3, errs: e3 } = await newPage(b);
    const u3 = await registrar(p3, nombre()); await cerrarDiario(p3); dar(u3); await p3.reload(); await p3.waitForTimeout(2500); await cerrarDiario(p3);
    await abrirTienda(p3); await tocar(p3, 'Amarillo clásico'); await p3.waitForTimeout(2000);
    ok('al no estar publicadas las reglas nuevas, comprar un color avisa que Firebase no lo permitió (y no se cobra)', /Firebase no permitió la compra/.test(await p3.textContent('#shopMsg')) && !(st.db.wallets[u3].own && st.db.wallets[u3].own.th_clasico) && (st.db.wallets[u3].sp || 0) === 0, await p3.textContent('#shopMsg'));
    await p3.evaluate(() => document.getElementById('tabCh').click()); await p3.waitForTimeout(400);
    ok('y el resto de la tienda sigue funcionando (las otras categorías)', await p3.evaluate(() => document.querySelectorAll('#shopGrid .item').length) > 3 && e3.length === 0, e3.join('|'));
    fs.unlinkSync(f); st.rulesFile = null; st.denied.length = 0; await c3.close();
  }

  await b.close();
  console.log(`\n${pass} correctas, ${fail} fallas`);
  process.exit(fail ? 1 : 0);
})();
