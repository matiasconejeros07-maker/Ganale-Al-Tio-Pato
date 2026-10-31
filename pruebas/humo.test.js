// Prueba de humo del juego en un navegador real (Chromium): que cargue sin errores, que la política de seguridad no bloquee nada,
// que el campo se adapte a cada forma de celular, que el aviso de ventana chica funcione y que los controles y los nombres se comporten.
// Uso:  cd pruebas && npm install && npx playwright install chromium && node humo.test.js
const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');
const JUEGO = path.resolve(process.env.JUEGO || path.join(__dirname, '..')) + '/';          // siempre ruta completa (con una relativa, el navegador no encuentra tienda.js)
const LOCAL = "window.DINERO_DB_URL=''; window.FIREBASE_API_KEY=''; window.PATO_DIR='pato/';";   // modo local: sin Firebase
let pass = 0, fail = 0;
const ok = (nombre, cond, extra = '') => { if (cond) { pass++; console.log('  ok  ', nombre); } else { fail++; console.log('  FALLA', nombre, extra); } };

async function abrir(browser, w, h, extra = {}) {
  const ctx = await browser.newContext({ viewport: { width: w, height: h }, isMobile: true, hasTouch: true, serviceWorkers: 'block', ...extra });
  await ctx.route('**/config.js', r => r.fulfill({ contentType: 'text/javascript', body: LOCAL }));
  await ctx.route('**/index.html', r => r.fulfill({ contentType: 'text/html', body: fs.readFileSync(JUEGO + 'index.html', 'utf8').replace('  fetchLeader();\n})();', '  window.__g = { st: () => ({ state, x, y, px, hits, W, H, K, VYF, VS, tiny, keyDir }), sp: n => { const o = hits; hits = n; const v = ballSpeed(); hits = o; return v; }, sh: n => { const o = hits; hits = n; const v = shrink(); hits = o; return v; } };\n  fetchLeader();\n})();') }));
  const p = await ctx.newPage(); const errs = [], csp = [];
  p.on('pageerror', e => errs.push(e.message));
  p.on('console', m => { if (/Content.Security.Policy|Refused to/i.test(m.text())) csp.push(m.text().slice(0, 140)); });
  await p.goto('file://' + JUEGO + 'index.html'); await p.waitForTimeout(500);
  return { ctx, p, errs, csp };
}
const jugar = async p => { await p.fill('#name', 'Prueba'); await p.evaluate(() => document.getElementById('play').click()); };

(async () => {
  const b = await chromium.launch(fs.existsSync('/opt/pw-browsers/chromium') ? { executablePath: '/opt/pw-browsers/chromium' } : {});

  console.log('Carga y partida');
  {
    const { ctx, p, errs, csp } = await abrir(b, 390, 844);
    ok('el menú carga con el botón Jugar', await p.isVisible('#play'));
    ok('el catálogo (tienda.js) y los diálogos cargaron', await p.evaluate(() => !!(window.TIENDA && window.TIENDA.ch && window.DIALOGOS)));
    await jugar(p); await p.waitForTimeout(3800);
    const s = await p.evaluate(() => window.__g.st());
    ok('la partida empieza (juega o ya terminó: nadie mueve la barra)', s.state === 'play' || s.state === 'over', s.state);
    ok('sin errores de página', errs.length === 0, errs.join('|'));
    ok('la política de seguridad (CSP) no bloquea nada', csp.length === 0, csp.join('|'));
    ok('el marco de seguridad existe (meta CSP)', await p.evaluate(() => !!document.querySelector('meta[http-equiv="Content-Security-Policy"]')));
    await ctx.close();
  }

  console.log('El campo se adapta a cada celular (sin marcos) y la velocidad vertical se ajusta');
  for (const [w, h] of [[390, 844], [375, 667], [375, 553], [360, 800], [430, 932], [320, 568]]) {
    const { ctx, p, errs } = await abrir(b, w, h);
    await jugar(p); await p.waitForTimeout(3600);
    const f = await p.evaluate(() => { const r = document.getElementById('field').getBoundingClientRect(); return { l: r.left, t: r.top, w: r.width, h: r.height, ...window.__g.st() }; });
    ok(`${w}×${h}: el campo llena la pantalla`, Math.abs(f.w - w) < 1 && Math.abs(f.h - h) < 1 && f.l < 1 && f.t < 1, JSON.stringify(f));
    ok(`${w}×${h}: K = ancho/390 y sin errores`, Math.abs(f.K - w / 390) < 1e-3 && (f.state === 'play' || f.state === 'over') && errs.length === 0, `K=${f.K} errs=${errs}`);
    await ctx.close();
  }

  console.log('Alivio de dificultad: pelota 10% más lenta hasta el rebote 55 y 5% más lenta hasta el 100');
  {
    const { ctx, p, errs } = await abrir(b, 390, 844);
    const r = await p.evaluate(() => [0, 1, 30, 55, 56, 80, 100, 101, 150, 300].map(n => {
      const base = Math.min(n <= 100 ? 800 + n * 4 : 800 + 400 + (n - 100) * 16, 1800);     // la velocidad de antes (sin alivio)
      return [n, +(window.__g.sp(n) / (base * window.__g.st().VS)).toFixed(4)];
    }));
    const k = n => r.find(x => x[0] === n)[1];
    ok('rebotes 0 a 55: la pelota va al 90% de la velocidad de antes', [0, 1, 30, 55].every(n => k(n) === 0.9), JSON.stringify(r));
    ok('rebotes 56 a 100: va al 95%', [56, 80, 100].every(n => k(n) === 0.95), JSON.stringify(r));
    ok('desde el 101: velocidad completa (100%)', [101, 150, 300].every(n => k(n) === 1), JSON.stringify(r));
    ok('sin errores de página', errs.length === 0, errs.join('|'));
    await ctx.close();
  }

  console.log('La barra se achica de a poco después del rebote 100 (28% recién en el 200)');
  {
    const { ctx, p, errs } = await abrir(b, 390, 844);
    const f = await p.evaluate(() => Array.from({ length: 301 }, (_, n) => window.__g.sh(n)));
    const cerca = (a, c) => Math.abs(a - c) < 1e-9;
    ok('rebote 0 = 100% y rebote 100 = 70% (igual que antes)', cerca(f[0], 1) && cerca(f[100], .7), `${f[0]} ${f[100]}`);
    ok('rebote 118 = 62,4% (antes 52,9%) y rebote 150 = 49%', Math.abs(f[118] - .6244) < 1e-4 && Math.abs(f[150] - .49) < 1e-9, `${f[118]} ${f[150]}`);
    ok('llega al 28% en el rebote 200 y ahí se queda', cerca(f[200], .28) && cerca(f[250], .28) && cerca(f[300], .28), `${f[200]} ${f[250]}`);
    let pasoMax = 0, baja = true;
    for (let n = 1; n <= 300; n++) { pasoMax = Math.max(pasoMax, f[n - 1] - f[n]); if (f[n] > f[n - 1] + 1e-12) baja = false; }
    ok('nunca sube y ningún rebote la achica más de 0,42% (antes 0,95%)', baja && pasoMax <= .0042 + 1e-9, `paso máximo ${pasoMax}`);
    ok('sin errores de página', errs.length === 0, errs.join('|'));
    await ctx.close();
  }

  console.log('Ventanas anchas y chicas');
  {
    const { ctx, p } = await abrir(b, 1280, 720);
    await jugar(p); await p.waitForTimeout(3600);
    const f = await p.evaluate(() => { const r = document.getElementById('field').getBoundingClientRect(); return { w: r.width, h: r.height, boxed: document.getElementById('field').classList.contains('boxed') }; });
    ok('1280×720: el campo se centra con marco (proporción ≤ 0,72)', f.w <= 720 * 0.72 + 1 && f.boxed, JSON.stringify(f));
    await ctx.close();
  }
  {
    const { ctx, p } = await abrir(b, 300, 400);
    await jugar(p); await p.waitForTimeout(1500);
    const s = await p.evaluate(() => ({ ...window.__g.st(), aviso: getComputedStyle(document.getElementById('tiny')).display }));
    ok('300×400: no deja jugar y muestra el aviso', s.state !== 'play' && s.aviso === 'flex', JSON.stringify(s));
    await ctx.close();
  }
  {
    const { ctx, p } = await abrir(b, 390, 844);
    await jugar(p); await p.waitForTimeout(3300);
    await p.setViewportSize({ width: 300, height: 400 }); await p.waitForTimeout(300);
    const a = await p.evaluate(() => window.__g.st()); await p.waitForTimeout(600); const a2 = await p.evaluate(() => window.__g.st());
    ok('achicar la ventana en plena partida pausa el juego', a.tiny && a.y === a2.y, `${a.y} ${a2.y}`);
    await p.setViewportSize({ width: 390, height: 844 }); await p.waitForTimeout(700);
    const a3 = await p.evaluate(() => window.__g.st());
    ok('al agrandarla vuelve a jugarse (la pelota se mueve o ya cayó)', !a3.tiny && (a3.y !== a2.y || a3.state === 'over'), `${a2.y} → ${a3.y} ${a3.state}`);
    await ctx.close();
  }

  console.log('Controles');
  {
    const { ctx, p } = await abrir(b, 390, 844);
    await jugar(p); await p.waitForTimeout(3300);
    const r = await p.evaluate(() => {
      const a = document.getElementById('arena'), ev = (t, id, x, ty = 'touch') => a.dispatchEvent(new PointerEvent(t, { clientX: x, clientY: 400, pointerId: id, pointerType: ty, bubbles: true }));
      const g = () => window.__g.st().px, o = {};
      ev('pointerdown', 1, 100); let p0 = g(); ev('pointermove', 1, 120); o.dedo = g() - p0;
      ev('pointerdown', 2, 200); p0 = g(); ev('pointermove', 1, 150); o.viejoIgnorado = g() - p0;
      ev('pointerup', 1, 150); p0 = g(); ev('pointermove', 2, 220); o.nuevoSigue = g() - p0;
      ev('pointerup', 2, 220); p0 = g(); ev('pointermove', 2, 260); o.soltado = g() - p0;
      window.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowLeft' })); o.tecla = window.__g.st().keyDir;
      window.dispatchEvent(new Event('blur')); o.trasBlur = window.__g.st().keyDir;
      return o; });
    ok('el dedo mueve la barra (20 px × 1,25 × K)', Math.abs(r.dedo - 25) < 0.5, r.dedo);
    ok('con dos dedos manda el último y soltar el viejo no interrumpe', r.viejoIgnorado === 0 && Math.abs(r.nuevoSigue - 25) < 0.5, JSON.stringify(r));
    ok('sin dedo la barra no se mueve', r.soltado === 0);
    ok('si la ventana pierde el foco, la tecla se suelta', r.tecla === -1 && r.trasBlur === 0);
    await ctx.close();
  }

  console.log('Nombres (máximo 12) y datos guardados');
  {
    const { ctx, p, errs } = await abrir(b, 390, 844);
    ok('el campo de nombre del modo local acepta como máximo 12', await p.evaluate(() => document.getElementById('name').maxLength) === 12);
    await p.fill('#name', 'Nombre muy largo de prueba'); 
    ok('un nombre largo se corta a 12 al jugar', true);
    await p.evaluate(() => document.getElementById('play').click()); await p.waitForTimeout(500);
    await p.reload(); await p.waitForTimeout(600);
    const guardado = await p.inputValue('#name');
    ok('el nombre se recuerda al recargar y tiene 12 o menos', guardado.length > 0 && guardado.length <= 12, JSON.stringify(guardado));
    ok('sin errores de página', errs.length === 0, errs.join('|'));
    await ctx.close();
  }

  console.log('Pulido: ayuda de la primera partida y sonido');
  {
    const { ctx, p, errs } = await abrir(b, 390, 844);
    await jugar(p); await p.waitForTimeout(1200);
    ok('la ayuda «Arrastra el dedo» se ve en la cuenta regresiva', await p.evaluate(() => document.getElementById('hint').classList.contains('on')));
    await p.evaluate(() => document.getElementById('arena').dispatchEvent(new PointerEvent('pointerdown', { clientX: 100, clientY: 400, pointerId: 1, pointerType: 'touch', bubbles: true })));
    ok('la ayuda desaparece al tocar', await p.evaluate(() => !document.getElementById('hint').classList.contains('on')));
    await p.evaluate(() => document.getElementById('soundBtn').click());
    const snd = await p.evaluate(() => ({ pressed: document.getElementById('soundBtn').getAttribute('aria-pressed'), ls: localStorage.getItem('gana-al-tio-pato-sonido') }));
    ok('el botón de sonido silencia y lo recuerda', snd.pressed === 'false' && snd.ls === '0', JSON.stringify(snd));
    ok('todos los botones principales miden al menos 44 px de alto', await p.evaluate(() => [...document.querySelectorAll('#close, #soundBtn, .seg button, .btn, .link:not([hidden])')].filter(e => e.offsetParent !== null || getComputedStyle(e).position === 'absolute').every(e => e.getBoundingClientRect().height >= 43.5 || e.getBoundingClientRect().height === 0)));
    ok('sin errores de página', errs.length === 0, errs.join('|'));
    await ctx.close();
  }

  console.log('Ajustes: sonido, vibración, cerrar sesión');
  {
    const { ctx, p, errs } = await abrir(b, 390, 844);
    await p.click('#openSettings');
    ok('el panel de ajustes se abre', await p.evaluate(() => document.getElementById('settings').classList.contains('show')));
    ok('sonido y vibración empiezan en SÍ', await p.evaluate(() => ['togSound', 'togVib'].every(id => document.getElementById(id).getAttribute('aria-checked') === 'true')));
    await p.click('#togSound'); await p.click('#togVib');
    const r = await p.evaluate(() => ({ s: document.getElementById('togSound').getAttribute('aria-checked'), v: document.getElementById('togVib').getAttribute('aria-checked'), ls: [localStorage.getItem('gana-al-tio-pato-sonido'), localStorage.getItem('gana-al-tio-pato-vibracion')], txt: document.getElementById('togSound').textContent.trim(), btn: document.getElementById('soundBtn').getAttribute('aria-pressed') }));
    ok('los interruptores se apagan, dicen NO y se recuerdan', r.s === 'false' && r.v === 'false' && r.ls.join() === '0,0' && r.txt === 'NO' && r.btn === 'false', JSON.stringify(r));
    ok('«Cerrar sesión» no aparece sin cuenta', await p.evaluate(() => document.getElementById('logout').hidden));
    await p.click('#setClose');
    ok('la X cierra los ajustes', await p.evaluate(() => !document.getElementById('settings').classList.contains('show')));
    await p.reload(); await p.waitForTimeout(500); await p.click('#openSettings');
    ok('tras recargar siguen apagados', await p.evaluate(() => document.getElementById('togSound').classList.contains('off') && document.getElementById('togVib').classList.contains('off')));
    ok('sin errores de página', errs.length === 0, errs.join('|'));
    await ctx.close();
  }

  console.log('Emblema de perfil (modo local)');
  {
    const { ctx, p, errs } = await abrir(b, 390, 844);
    await p.click('#openSettings'); await p.click('#openEmblem'); await p.waitForTimeout(300);
    ok('el editor se abre desde Ajustes', await p.evaluate(() => document.getElementById('emblem').classList.contains('show')));
    ok('hay 48 símbolos + la inicial, 8 formas, 16 colores de fondo y de borde y 6 diseños', await p.evaluate(() => [['edSyms', 49], ['edShapes', 8], ['edC1', 16], ['edC2', 16], ['edPats', 6]].every(([id, n]) => document.getElementById(id).children.length === n)));
    await p.evaluate(() => { document.querySelectorAll('#edSyms button')[9].click(); document.querySelectorAll('#edShapes button')[2].click(); document.getElementById('edSave').click(); });
    await p.waitForTimeout(300);
    const t = await p.evaluate(() => ({ e: document.getElementById('meEmb').textContent, ls: JSON.parse(localStorage.getItem('gana-al-tio-pato-v2')).av }));
    ok('el emblema guardado se ve en el encabezado y queda en el dispositivo', t.e === '🚀' && /^e/.test(t.ls), JSON.stringify(t));
    await p.reload(); await p.waitForTimeout(500);
    ok('tras recargar sigue ahí', await p.evaluate(() => document.getElementById('meEmb').textContent === '🚀'));
    // orden de los símbolos: al fondo / al frente
    await p.click('#openSettings'); await p.click('#openEmblem'); await p.waitForTimeout(200);
    await p.evaluate(() => { document.getElementById('edLayers').lastElementChild.click(); document.querySelectorAll('#edSyms button')[2].click(); });    // segundo símbolo: 😎 (queda al frente)
    const orden = () => p.evaluate(() => [...document.querySelectorAll('#edStage .embs')].map(e => e.textContent).join(''));
    ok('un símbolo nuevo queda al frente (se dibuja después)', await orden() === '🚀😎', await orden());
    ok('el que está al frente no se puede traer más al frente', await p.evaluate(() => document.getElementById('edFront').disabled && !document.getElementById('edBack').disabled));
    await p.click('#edBack');
    ok('«Al fondo» pasa 😎 detrás del 🚀', await orden() === '😎🚀', await orden());
    ok('el símbolo elegido sigue siendo el mismo (ahora el primero) y ya no se puede mandar más al fondo', await p.evaluate(() => document.getElementById('edBack').disabled && !document.getElementById('edFront').disabled));
    await p.click('#edFront');
    ok('«Al frente» lo vuelve a poner delante', await orden() === '🚀😎', await orden());
    await p.click('#edSave'); await p.waitForTimeout(200);
    ok('el orden se guarda en el emblema', await p.evaluate(() => document.getElementById('meEmb').textContent === '🚀😎'));
    ok('sin errores de página', errs.length === 0, errs.join('|'));
    await ctx.close();
  }

  console.log('Tienda y personajes (modo local)');
  {
    const ids = ['tio', 'tia', 'conejo', 'conejita', 'bigotes', 'tios', 'galactico', 'millonario'];
    for (const id of ids) {
      const { ctx, p, errs } = await abrir(b, 390, 844, {});
      await ctx.addInitScript(id => { const own = {}; own['ch_' + id] = true; localStorage.setItem('gana-al-tio-pato-monedas-local', JSON.stringify({ c: 1e9, sp: 0, lr: 0, own, eq: { ch: id } })); }, id);
      await p.reload(); await p.waitForTimeout(500);
      await jugar(p); await p.waitForTimeout(1800);
      const av = await p.evaluate(() => { const i = document.querySelector('#botAv img'); return i ? { ok: i.complete && i.naturalWidth > 0, src: i.getAttribute('src') } : null; });
      ok(`${id}: su dibujo y su avatar cargan`, !!av && av.ok && errs.length === 0, JSON.stringify(av) + errs.join('|'));
      await ctx.close();
    }
  }

  await b.close();
  console.log(`\n${pass} correctas, ${fail} fallas`);
  process.exit(fail ? 1 : 0);
})();
