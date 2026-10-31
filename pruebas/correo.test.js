// Correo en las cuentas, de punta a punta (juego + reglas reales de Firebase): crear cuenta con correo, agregar el correo a una cuenta antigua sin perder nada,
// verificar el correo y recuperar la contraseña. Uso:  cd pruebas && npm install && node correo.test.js
const fs = require('fs'), os = require('os'), path = require('path');
const { chromium, st, newPage, playHits, registrar } = require('./mockfirebase.js');
let pass = 0, fail = 0;
const ok = (n, c, x = '') => { if (c) { pass++; console.log('  ok  ', n); } else { fail++; console.log('  FALLA', n, x); } };
const cerrarDiario = p => p.evaluate(() => { const b = document.getElementById('dailyClose'); if (b && b.offsetParent) b.click(); });
const alMenu = p => p.evaluate(() => { const b = document.getElementById('backResult'); if (b && b.offsetParent) b.click(); });
const ajustes = async p => { await alMenu(p); await p.waitForTimeout(300); await cerrarDiario(p); await p.evaluate(() => document.getElementById('openSettings').click()); await p.waitForTimeout(300); };
const salir = async p => { await ajustes(p); await p.evaluate(() => document.getElementById('logout').click()); await p.waitForTimeout(700); };
const entrar = async (p, id, clave) => { await p.fill('#acct', id); await p.fill('#pass', clave); await p.tap('#authGo'); await p.waitForTimeout(2500); await cerrarDiario(p); };
const msg = p => p.textContent('#authMsg');
(async () => {
  const b = await chromium.launch(fs.existsSync('/opt/pw-browsers/chromium') ? { executablePath: '/opt/pw-browsers/chromium' } : {});

  console.log('Crear una cuenta nueva: correo + nombre de usuario + contraseña');
  {
    const { ctx, p, errs } = await newPage(b);
    await p.tap('#tabUp');
    ok('al crear cuenta se piden correo, nombre de usuario y contraseña', await p.isVisible('#acctMail') && await p.isVisible('#acct') && await p.isVisible('#pass') && /Crear cuenta/.test(await p.textContent('#authGo')));
    await p.fill('#acctMail', 'sin-arroba'); await p.fill('#acct', 'Ana Perez'); await p.fill('#pass', 'secreto123'); await p.tap('#authGo');
    ok('un correo mal escrito se rechaza sin crear nada', /correo válido/.test(await msg(p)) && Object.keys(st.users).length === 0, await msg(p));
    const uid = await registrar(p, 'Ana Perez', 'ana@gmail.com');
    ok('la cuenta queda con el correo real (no con el interno) y con su nombre', !!st.users['ana@gmail.com'] && st.users['ana@gmail.com'].uid === uid && st.users['ana@gmail.com'].name === 'Ana Perez' && Object.keys(st.users).length === 1, JSON.stringify(Object.keys(st.users)));
    ok('el nombre queda registrado a nombre de la cuenta (ana,perez)', st.db.names && st.db.names['ana,perez'] === uid, JSON.stringify(st.db.names));
    ok('Firebase mandó el enlace para verificar el correo', st.mails.some(m => m.type === 'verify' && m.email === 'ana@gmail.com'), JSON.stringify(st.mails));
    ok('el menú avisa que se envió el enlace', /Te enviamos un enlace/.test(await p.textContent('#mailBannerTxt')) && await p.isVisible('#mailBanner'));
    await cerrarDiario(p);
    await playHits(p, 4, async () => {}); await p.waitForTimeout(3500);
    const h = st.db.runs[uid].h;
    ok(`la primera partida se cobra y crea la fila del marcador con el nombre registrado (${h} rebotes)`, st.db.wallets[uid].c === h && st.db.scores[uid] && st.db.scores[uid].k === 'ana.perez' && st.db.scores[uid].s === h, JSON.stringify(st.db.scores && st.db.scores[uid]));
    ok('sin denegados ni errores de página', st.denied.length === 0 && errs.length === 0, st.denied.join(' || ') + errs.join('|'));
    await ajustes(p);
    ok('Ajustes muestra el correo «sin verificar»', /ana@gmail\.com · ⏳ sin verificar/.test(await p.textContent('#mailSt')), await p.textContent('#mailSt'));
    st.users['ana@gmail.com'].ev = true;                                                       // la persona abre el enlace del correo
    await p.evaluate(() => document.getElementById('mailBtn').click()); await p.waitForTimeout(500);
    await p.evaluate(() => document.getElementById('mCheck').click()); await p.waitForTimeout(800);
    ok('«Ya lo verifiqué» confirma que el correo está verificado', /verificado/.test(await p.textContent('#mailMsg')) && /Verificado ✅/.test(await p.textContent('#mailTxt')), await p.textContent('#mailMsg'));
    await p.evaluate(() => document.getElementById('mailClose').click());
    await ajustes(p);
    ok('y Ajustes lo muestra verificado', /✅ verificado/.test(await p.textContent('#mailSt')), await p.textContent('#mailSt'));
    await salir(p);
    await entrar(p, 'ana@gmail.com', 'secreto123');
    ok('se puede entrar con el correo y el juego recuerda el nombre y los pesos', await p.evaluate(() => document.getElementById('hello').textContent) === 'Ana Perez' && /\$/.test(await p.textContent('#coinNum')), await p.evaluate(() => document.getElementById('hello').textContent));
    await ctx.close();
  }

  console.log('Nombre o correo repetidos');
  {
    const { ctx, p } = await newPage(b);
    const antes = Object.keys(st.users).length, nombres = JSON.stringify(st.db.names);
    await p.tap('#tabUp'); await p.fill('#acctMail', 'otra@gmail.com'); await p.fill('#acct', 'ANA PEREZ'); await p.fill('#pass', 'secreto123'); await p.tap('#authGo'); await p.waitForTimeout(1500);
    ok('un nombre ya registrado se rechaza sin crear una cuenta', /nombre ya está en uso/.test(await msg(p)) && Object.keys(st.users).length === antes, await msg(p));
    st.users['vieja.cuenta@tio-pato.invalid'] = { uid: 'UIDviejaabcdefghijklmnopq', pass: 'clavevieja', ev: false, name: '' };
    await p.fill('#acct', 'Vieja Cuenta'); await p.tap('#authGo'); await p.waitForTimeout(1500);
    ok('el nombre de una cuenta antigua (aún sin correo) también está ocupado', /nombre ya está en uso/.test(await msg(p)) && Object.keys(st.users).length === antes + 1, await msg(p));
    await p.fill('#acctMail', 'ana@gmail.com'); await p.fill('#acct', 'Nombre Nuevo'); await p.tap('#authGo'); await p.waitForTimeout(2000);
    ok('un correo que ya tiene cuenta se rechaza', /correo ya está asociado/.test(await msg(p)), await msg(p));
    ok('y no queda ninguna cuenta ni nombre a medias', Object.keys(st.users).length === antes + 1 && !st.db.names['nombre,nuevo'] && Object.keys(st.db.names).length === Object.keys(JSON.parse(nombres)).length, JSON.stringify(st.db.names) + ' ' + Object.keys(st.users));
    delete st.users['vieja.cuenta@tio-pato.invalid'];
    await ctx.close();
  }

  console.log('Cuenta antigua (nombre + contraseña): agregar el correo sin perder nada');
  {
    const uid = 'UIDantiguaabcdefghijklmnop';
    st.users['antigua@tio-pato.invalid'] = { uid, pass: 'claveantigua', ev: false, name: '' };
    st.db.wallets = { ...(st.db.wallets || {}), [uid]: { c: 5000, sp: 1200, own: { ch_tia: true }, av: 'e41A33GGG' } };
    st.db.scores = { ...(st.db.scores || {}), [uid]: { n: 'Antigua', k: 'antigua', s: 40, t: Date.now() - 9000 } };
    const { ctx, p, errs } = await newPage(b); st.denied.length = 0;
    await entrar(p, 'Antigua', 'claveantigua');
    ok('entra con su nombre como siempre', await p.evaluate(() => document.getElementById('hello').textContent) === 'Antigua');
    ok('el menú le ofrece proteger su cuenta con un correo', await p.isVisible('#mailBanner') && /Protege tu cuenta/.test(await p.textContent('#mailBannerTxt')));
    ok('su nombre se anota en el registro (sin que ella haga nada)', st.db.names && st.db.names['antigua'] === uid, JSON.stringify(st.db.names));
    await ajustes(p);
    ok('Ajustes dice «Sin correo» y ofrece agregarlo', /Sin correo/.test(await p.textContent('#mailSt')) && /Agregar/.test(await p.textContent('#mailBtn')));
    await p.evaluate(() => document.getElementById('mailBtn').click()); await p.waitForTimeout(400);
    await p.fill('#mEmail', 'ana@gmail.com'); await p.fill('#mPass', 'claveantigua'); await p.evaluate(() => document.getElementById('mGo').click()); await p.waitForTimeout(1500);
    ok('un correo que ya es de otra cuenta se rechaza', /otra cuenta/.test(await p.textContent('#mailMsg')) && !!st.users['antigua@tio-pato.invalid'], await p.textContent('#mailMsg'));
    await p.fill('#mEmail', 'antigua@gmail.com'); await p.fill('#mPass', 'contraseña-mala'); await p.evaluate(() => document.getElementById('mGo').click()); await p.waitForTimeout(1500);
    ok('con una contraseña que no es la suya no pasa nada', /no es la de tu cuenta/.test(await p.textContent('#mailMsg')) && !!st.users['antigua@tio-pato.invalid'], await p.textContent('#mailMsg'));
    await p.fill('#mPass', 'claveantigua'); await p.evaluate(() => document.getElementById('mGo').click()); await p.waitForTimeout(2000);
    ok('el correo queda asociado a la MISMA cuenta (mismo uid)', !!st.users['antigua@gmail.com'] && st.users['antigua@gmail.com'].uid === uid && !st.users['antigua@tio-pato.invalid'], Object.keys(st.users).join(','));
    ok('no pierde nada: pesos, gastado, compras, emblema y récord siguen iguales', st.db.wallets[uid].c === 5000 && st.db.wallets[uid].sp === 1200 && st.db.wallets[uid].own.ch_tia === true && st.db.wallets[uid].av === 'e41A33GGG' && st.db.scores[uid].s === 40, JSON.stringify(st.db.wallets[uid]));
    ok('Firebase mandó el enlace de verificación', st.mails.some(m => m.type === 'verify' && m.email === 'antigua@gmail.com'));
    ok('el modal confirma que quedó asociado', /Asociado a tu cuenta/.test(await p.textContent('#mailTxt')) && /Correo agregado/.test(await p.textContent('#mailMsg')), await p.textContent('#mailMsg'));
    await p.evaluate(() => document.getElementById('mailClose').click());
    ok('ya no se ofrece agregar el correo', !(await p.isVisible('#mailBanner')));
    await playHits(p, 6, async () => {}); await p.waitForTimeout(3500);
    const h = st.db.runs[uid].h;
    ok(`después de agregarlo sigue cobrando partidas y subiendo el récord (${h} rebotes)`, st.db.wallets[uid].c === 5000 + h && st.db.scores[uid].s === Math.max(40, h), JSON.stringify([st.db.wallets[uid], st.db.scores[uid]]));
    ok('sin denegados ni errores de página en todo el proceso', st.denied.length === 0 && errs.length === 0, st.denied.join(' || ') + errs.join('|'));
    await salir(p);
    await p.fill('#acct', 'Antigua'); await p.fill('#pass', 'claveantigua'); await p.tap('#authGo'); await p.waitForTimeout(1500);
    ok('con el nombre ya no entra y el aviso le dice que entre con su correo', /entra con tu correo/.test(await msg(p)), await msg(p));
    await entrar(p, 'antigua@gmail.com', 'claveantigua');
    ok('con el correo entra y conserva su nombre y su progreso', await p.evaluate(() => document.getElementById('hello').textContent) === 'Antigua' && st.db.wallets[uid].c >= 5000);
    await ctx.close();
  }

  console.log('Recuperar la contraseña');
  {
    const { ctx, p } = await newPage(b);
    st.mails.length = 0;
    await p.tap('#forgot');
    ok('«¿Olvidaste tu contraseña?» pide solo el correo', await p.isVisible('#acctMail') && !(await p.isVisible('#acct')) && !(await p.isVisible('#pass')) && /Enviar enlace/.test(await p.textContent('#authGo')));
    await p.fill('#acctMail', 'ana@gmail.com'); await p.tap('#authGo'); await p.waitForTimeout(800);
    ok('manda el enlace al correo de la cuenta', st.mails.some(m => m.type === 'reset' && m.email === 'ana@gmail.com') && /te enviamos un enlace/.test(await msg(p)), await msg(p));
    st.mails.length = 0;
    await p.fill('#acctMail', 'nadie@gmail.com'); await p.tap('#authGo'); await p.waitForTimeout(800);
    ok('con un correo sin cuenta responde igual (no revela quién tiene cuenta) y no manda nada', st.mails.length === 0 && /te enviamos un enlace/.test(await msg(p)), await msg(p));
    await p.tap('#tabIn');
    ok('«Entrar» vuelve al formulario normal', await p.isVisible('#acct') && await p.isVisible('#pass') && !(await p.isVisible('#acctMail')));
    await ctx.close();
  }

  console.log('Si todavía no están publicadas las reglas nuevas');
  {
    const r = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'firebase-rules.json'), 'utf8')); delete r.rules.names;
    st.rulesFile = path.join(os.tmpdir(), 'sin-names-' + process.pid + '.json'); fs.writeFileSync(st.rulesFile, JSON.stringify(r));
    const { ctx, p } = await newPage(b); const antes = Object.keys(st.users).length;
    await p.tap('#tabUp'); await p.fill('#acctMail', 'nueva@gmail.com'); await p.fill('#acct', 'Sin Reglas'); await p.fill('#pass', 'secreto123'); await p.tap('#authGo'); await p.waitForTimeout(1800);
    ok('avisa que faltan publicar las reglas y no deja cuentas a medias', /publicar las reglas/.test(await msg(p)) && Object.keys(st.users).length === antes, await msg(p));
    fs.unlinkSync(st.rulesFile); st.rulesFile = null; st.denied.length = 0; await ctx.close();
  }

  console.log(`\n${pass} correctas, ${fail} fallas`);
  await b.close(); process.exit(fail ? 1 : 0);
})();
