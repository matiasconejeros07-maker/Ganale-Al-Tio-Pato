// Firebase de mentira para las pruebas: Auth falso + Realtime Database cuyas escrituras las autoriza el simulador oficial de reglas (targaryen) con el firebase-rules.json REAL.
const { chromium } = require('playwright');
const path = require('path');
const targaryen = require('targaryen');
const fs = require('fs');
const JUEGO = path.resolve(process.env.JUEGO || path.join(__dirname, '..')) + '/';
const PAGE = 'file://' + JUEGO + 'index.html';
const DBURL = 'https://juegotiopato-default-rtdb.firebaseio.com';
const cors = { 'access-control-allow-origin': '*', 'access-control-allow-headers': '*', 'access-control-allow-methods': '*' };
const rules = () => JSON.parse(fs.readFileSync(st.rulesFile || (JUEGO + 'firebase-rules.json'), 'utf8'));
const st = { rulesFile: null, db: {}, users: {}, mails: [], uidN: 0, recentMs: 0, log: [], denied: [], failRoot: 0, down: false, htmlPatch: null, cfg: fs.readFileSync(JUEGO + 'config.js', 'utf8'), tienda: null };
const b64 = o => Buffer.from(JSON.stringify(o)).toString('base64url');
const mkTok = (uid, email, ev) => { const iat = Math.floor(Date.now() / 1000); return 'e30.' + b64({ user_id: uid, sub: uid, email, email_verified: !!ev, aud: 'juegotiopato', iat, exp: iat + 3600, ms: Date.now() }) + '.firma'; };   // un token con forma de JWT, como los de Google
const authOf = tok => { let p; try { p = JSON.parse(Buffer.from(String(tok || '').split('.')[1] || '', 'base64url').toString()); } catch (e) { return null; } return p && p.user_id && !(st.minTokenTs && p.ms < st.minTokenTs) ? { uid: p.user_id, token: { email: p.email, email_verified: !!p.email_verified } } : null; };   // st.minTokenTs: los tokens emitidos antes de esa hora ya no valen (Firebase los trata como sin sesión)
const sub = (obj, parts) => parts.reduce((o, k) => (o == null ? null : o[k] === undefined ? null : o[k]), obj);
async function mocks(ctx) {
  await ctx.route('**/config.js', r => r.fulfill({ contentType: 'text/javascript', body: st.cfg }));
  if (st.tienda) await ctx.route('**/tienda.js', r => r.fulfill({ contentType: 'text/javascript', body: st.tienda }));
  if (st.htmlPatch) await ctx.route('**/index.html', r => r.fulfill({ contentType: 'text/html', body: st.htmlPatch(fs.readFileSync(JUEGO + 'index.html', 'utf8')) }));
  const J = (r, o, status = 200) => r.fulfill({ status, headers: { ...cors, 'content-type': 'application/json' }, body: JSON.stringify(o) });
  const tokP = tk => { try { return JSON.parse(Buffer.from(String(tk).split('.')[1], 'base64url').toString()); } catch (e) { return {}; } };
  const mailOf = uid => Object.keys(st.users).find(e => st.users[e].uid === uid);
  await ctx.route('https://identitytoolkit.googleapis.com/**', async r => {                // Auth falso: signUp · signInWithPassword · update · sendOobCode · lookup · delete
    const req = r.request(); if (req.method() === 'OPTIONS') return r.fulfill({ status: 204, headers: cors });
    if (st.down) return r.abort();
    const act = (req.url().match(/accounts:(\w+)/) || [])[1], b = JSON.parse(req.postData() || '{}');
    const err = m => J(r, { error: { message: m } }, 400);
    const resp = e => { const u = st.users[e]; return { localId: u.uid, email: e, displayName: u.name || '', idToken: mkTok(u.uid, e, u.ev), refreshToken: 'rt|' + u.uid, expiresIn: '3600' }; };
    if (act === 'signUp') { if (st.users[b.email]) return err('EMAIL_EXISTS'); st.users[b.email] = { uid: 'UID' + (st.uidN++) + 'abcdefghijklmnopqrst', pass: b.password, ev: false, name: '' }; return J(r, resp(b.email)); }
    if (act === 'signInWithPassword') { const u = st.users[b.email]; if (!u || u.pass !== b.password) return err('INVALID_LOGIN_CREDENTIALS'); return J(r, resp(b.email)); }
    const tp = tokP(b.idToken), cur = mailOf(tp.user_id);
    if (act === 'sendOobCode' && b.requestType === 'PASSWORD_RESET') { if (!st.users[b.email]) return err('EMAIL_NOT_FOUND'); st.mails.push({ type: 'reset', email: b.email }); return J(r, { email: b.email }); }
    if (!cur) return err('INVALID_ID_TOKEN');
    if (act === 'update') {
      if (st.recentMs && Date.now() - tp.ms > st.recentMs) return err('CREDENTIAL_TOO_OLD_LOGIN_AGAIN');
      let e = cur; if (b.email && b.email !== cur) { if (st.users[b.email]) return err('EMAIL_EXISTS'); st.users[b.email] = st.users[cur]; delete st.users[cur]; st.users[b.email].ev = false; e = b.email; }
      if (b.displayName) st.users[e].name = b.displayName; return J(r, resp(e));
    }
    if (act === 'sendOobCode') { st.mails.push({ type: 'verify', email: cur }); return J(r, { email: cur }); }
    if (act === 'lookup') { const u = st.users[cur]; return J(r, { users: [{ localId: u.uid, email: cur, emailVerified: !!u.ev, displayName: u.name || '' }] }); }
    if (act === 'delete') { delete st.users[cur]; return J(r, {}); }
    return err('OPERATION_NOT_ALLOWED');
  });
  await ctx.route('https://securetoken.googleapis.com/**', async r => {
    const req = r.request(); if (req.method() === 'OPTIONS') return r.fulfill({ status: 204, headers: cors });
    const uid = new URLSearchParams(req.postData()).get('refresh_token').split('|')[1]; const email = Object.keys(st.users).find(e => st.users[e].uid === uid);
    if (!email) return J(r, { error: { message: 'USER_NOT_FOUND' } }, 400);
    return J(r, { id_token: mkTok(uid, email, st.users[email].ev), refresh_token: 'rt|' + uid, expires_in: '3600', user_id: uid });
  });
  await ctx.route(DBURL + '/**', async r => {
    const req = r.request(), u = new URL(req.url()); if (req.method() === 'OPTIONS') return r.fulfill({ status: 204, headers: cors });
    if (st.down) return r.abort();
    const auth = authOf(u.searchParams.get('auth')); const path = '/' + u.pathname.replace(/^\/|\.json$/g, '');
    const parts = path.split('/').filter(Boolean); const m = req.method();
    const db = () => targaryen.database(rules(), st.db).as(auth);
    if (m === 'GET') {
      const rd = db().read(path === '/' ? '/' : path);
      if (!rd.allowed) { st.denied.push('GET ' + path); return J(r, { error: 'Permission denied' }, 401); }
      if (parts[0] === 'scores' && parts.length === 1) {
        let rows = Object.entries(st.db.scores || {}).sort((a, b) => a[1].s - b[1].s);
        if (u.searchParams.get('shallow') === 'true') return J(r, Object.fromEntries(rows.map(([k]) => [k, true])));
        if (u.searchParams.get('startAt')) rows = rows.filter(([, v]) => v.s >= +u.searchParams.get('startAt'));
        if (u.searchParams.get('limitToLast')) rows = rows.slice(-u.searchParams.get('limitToLast'));
        return J(r, rows.length ? Object.fromEntries(rows) : null);
      }
      return J(r, sub(st.db, parts));
    }
    if (st.busyRuns > 0 && parts[0] === 'runs' && (m === 'PUT' || m === 'GET')) { st.busyRuns--; st.log.push('503 simulado en ' + m + ' ' + path); return J(r, { error: 'busy' }, 503); }   // st.busyRuns: las próximas N peticiones a /runs responden «ocupado»
    if (m === 'PATCH' && st.failRoot > 0 && path === '/') { st.failRoot--; st.log.push('500 simulado en ' + path); return J(r, {}, 500); }
    const body = JSON.parse(req.postData() || 'null');
    const res = m === 'PUT' || m === 'DELETE' ? db().write(path, m === 'DELETE' ? null : body) : db().update(path, body);
    st.log.push(m + ' ' + path + ' → ' + (res.allowed ? 'ok' : 'DENEGADO'));
    if (!res.allowed) { st.denied.push(m + ' ' + path + ' ' + JSON.stringify(body).slice(0, 160) + ' :: ' + (res.info || '').split('\n').filter(l => /=> false|disallow/.test(l)).slice(0, 2).join(' | ').slice(0, 260)); return J(r, { error: 'Permission denied' }, 401); }
    st.db = res.newDatabase.root.$value() || {};
    return J(r, body);
  });
}
async function newPage(b, opts = {}) {
  const ctx = await b.newContext({ viewport: opts.viewport || { width: 390, height: 844 }, isMobile: true, hasTouch: true, serviceWorkers: 'block' });
  await mocks(ctx); const p = await ctx.newPage(); const errs = [];
  p.on('pageerror', e => errs.push(e.message)); p.on('console', m => m.type() === 'error' && !/Failed to load resource|net::ERR/.test(m.text()) && errs.push(m.text()));
  await p.goto(PAGE); await p.waitForTimeout(700); return { ctx, p, errs };
}
// Juega siguiendo la pelota con la barra hasta `target` rebotes y luego la deja caer. Devuelve segundos jugados y marcas de tiempo por rebote.
async function playHits(p, target, onTarget) {
  await p.tap((await p.isVisible('#again')) ? '#again' : '#play'); await p.waitForTimeout(3300);
  const py = await p.evaluate(() => { const r = document.getElementById('paddle').getBoundingClientRect(); return r.y + r.height / 2; });
  const t0 = Date.now(), marks = {}; let fired = false;
  while (Date.now() - t0 < 600000) {
    const c = await p.evaluate(() => { const r = document.getElementById('target').getBoundingClientRect(); return [r.x + r.width / 2, +document.getElementById('meNum').textContent, document.getElementById('result').classList.contains('show')]; });
    if (c[2]) break;
    if (!(c[1] in marks)) marks[c[1]] = Date.now() - t0;
    if (c[1] >= target && !fired) { fired = true; if (onTarget) await onTarget(); }
    await p.mouse.move(c[1] < target ? c[0] : 2, py); await p.waitForTimeout(8);
  }
  await p.waitForSelector('#result.show', { timeout: 60000 });
  return marks;
}
// Crea una cuenta desde la pantalla de inicio (correo + nombre de usuario + contraseña). Devuelve el uid.
async function registrar(p, nombre, correo, clave = 'secreto123') {
  await p.tap('#tabUp'); await p.fill('#acctMail', correo || (nombre.toLowerCase().replace(/[^a-z0-9]+/g, '.') + '@correo.test')); await p.fill('#acct', nombre); await p.fill('#pass', clave); await p.tap('#authGo'); await p.waitForTimeout(2500);
  return (Object.values(st.users).find(u => u.name === nombre) || Object.values(st.users).slice(-1)[0]).uid;
}
module.exports = { chromium, st, PAGE, mocks, newPage, playHits, registrar, DBURL, JUEGO };
