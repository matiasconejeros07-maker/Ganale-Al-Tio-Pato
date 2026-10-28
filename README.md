# Gánale al Tío Pato

Juego web instalable (PWA) para celulares: rebota la moneda con tu barra, junta pesos, compra skins, fondos, barras y pelotas, y compite en los marcadores.

- Se juega abriendo `index.html` (no necesita compilar nada). Funciona en cualquier hosting estático.
- Las cuentas, los pesos, las compras y los marcadores viven en Firebase (Realtime Database + Authentication). La configuración está en `config.js`.
- `LEEME.md` explica cómo activar Firebase, la economía, las skins y la protección anti-trampas.
- `firebase-rules.json` son las reglas que hay que pegar en Firebase. Se generan con `node herramientas/generar-reglas.js` a partir de `tienda.js`.

## Publicarlo

**GitHub Pages:** Settings → Pages → *Deploy from a branch* → `main` / `/ (root)`.

**Firebase Hosting:** `npm install -g firebase-tools`, luego `firebase login` y `firebase deploy` (ya viene `firebase.json`; el proyecto está en `.firebaserc`, revísalo con `firebase projects:list`).
