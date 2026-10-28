// Marcadores compartidos entre todos los jugadores.
// Pega aquí la URL de tu Firebase Realtime Database (ver LEEME.md), por ejemplo:
//   window.DINERO_DB_URL = 'https://mi-proyecto-default-rtdb.firebaseio.com';
// Si queda vacío, el juego funciona igual, pero los puntajes solo se guardan en este dispositivo.
window.DINERO_DB_URL = 'https://juegotiopato-default-rtdb.firebaseio.com';

// Cuentas (nombre + contraseña). Pega aquí la «Clave de API web» de tu proyecto de Firebase
// (Configuración del proyecto ⚙ → General → «Clave de API web»). No es secreta: la protegen las reglas.
// Mientras esté vacía, el juego funciona en modo local: solo pide un nombre y no hay contraseña.
window.FIREBASE_API_KEY = 'AIzaSyDbiWooHuwa40mR0-XBsf7hwc6Mdu0HeMQ';

// Interruptor del arte de los personajes (cada uno tiene su carpeta en tienda.js: pato/, patita/).
// Déjalo con cualquier valor para usar las imágenes; si queda vacío, el juego usa un emoji.
window.PATO_DIR = 'pato/';
