// Catálogo de la tienda y reglas de la economía. Los precios están en pesos ($).
// Si cambias algo aquí, ejecuta `node juego/herramientas/generar-reglas.js` y vuelve a pegar `firebase-rules.json` en
// Firebase (las reglas también validan precios y recompensas, por eso deben coincidir con este archivo).
window.TIENDA = {
  // Economía: cada punto vale lo que paga tu pelota (ball[].rate) multiplicado por «Monedas dobles»: ×1 del punto 1 al 99, ×2 del 100 al 199, ×3 del 200 al 299…
  eco: { tier: 100, msPorRebote: 450, holguraMs: 3000, hMax: 500, cMax: 1000000000000,
    // Racha diaria: entrar cada día da premios. dias = pesos del día 1 al 7 (el 7 no da pesos: da «pesos dobles» durante dobleMs) · el día cambia a medianoche de Chile en horario de verano (huso -3)
    racha: { dias: [100, 200, 300, 400, 500, 1000, 0], dobleMs: 600000, huso: -3 } },

  // Foto de perfil = un emblema que cada jugador arma en el editor: forma, colores de fondo y borde, diseño y hasta 3 símbolos puestos donde quiera.
  // Se guarda en 17 caracteres como máximo («e» + forma + fondo + borde + diseño + 4 por símbolo), así pesa casi nada en la base de datos y se dibuja con CSS (sin imágenes).
  // emojis = los símbolos que se pueden elegir (el 0 es la inicial del nombre; hasta 63) · paleta = [color claro, color oscuro, color de la letra]; hasta 64 colores.
  avatar: {
    emojis: ['🦆', '😎', '👑', '💰', '🪙', '💎', '🔥', '⚡', '🚀', '🏆', '🎮', '🎩', '🌈', '🍀', '🦁', '🐸', '🐼', '🦊', '👻', '🌙', '⭐', '❤️', '💀', '👽',
      '🤖', '🐱', '🐶', '🦄', '🐉', '🦅', '🐯', '🐵', '🦈', '🐧', '🌵', '🌸', '🍕', '🍔', '🎧', '🎸', '⚽', '🏀', '🥇', '🎯', '🧠', '💣', '⚔️', '❄️'],
    paleta: [['#4a4a4a', '#151515', '#fff'], ['#ff7b7b', '#d6282c', '#fff'], ['#ffb752', '#ee6a00', '#fff'], ['#ffe978', '#f0b400', '#3a2f00'], ['#86e486', '#25a038', '#fff'], ['#66e6d3', '#0f9f8f', '#fff'],
      ['#78d4ff', '#1f8fe0', '#fff'], ['#7b94ff', '#2c46d6', '#fff'], ['#bb94ff', '#6a35e0', '#fff'], ['#ff94d4', '#e0149f', '#fff'], ['#ffe9a0', '#cf9b10', '#3a2f00'], ['#ffffff', '#cfcfdc', '#222'],
      ['#c98a5b', '#7a4a22', '#fff'], ['#5a6fb5', '#1c2760', '#fff'], ['#d4f26a', '#8cb800', '#2a3300'], ['#b8bcc6', '#6b7080', '#fff']]
  },

  // Personajes: el rival que te devuelve la pelota. Todos son imágenes sueltas (el Tío Pato y la Tía Patita se transforman de ángel a diablo/diabla; el resto solo se enoja)
  // con temblor, brillo rojo y vapor. stat = dibujo calmado · stat2 = dibujo enojado, al que cambian cuando el personaje se enoja.
  // av = recorte de la cara para el avatar · dw = ancho de la caja del personaje (la pareja es más ancha) · g = género/número del nombre (m, f o p = plural).
  // devil: true = el personaje se transforma en diablo (su dibujo enojado es un demonio): sus frases del rebote 70 en adelante hablan del infierno; los demás solo se enfurecen.
  ch: [
    { id: 'tio', n: 'Tío Pato',   price: 0,   stat: 'trajes/angel.webp', stat2: 'trajes/angel-demonio.webp', asp: 1.723, asp2: 1.172, name: 'el Tío Pato', g: 'm', devil: true,
      av: { w: 55, fx: .545, fy: .309 }, av2: { w: 66, fx: .55, fy: .261 }, css: { steam: '60% 17%' }, note: 'El de siempre: ángel que baja al infierno' },
    { id: 'tia', n: 'Tía Patita', price: 150, stat: 'trajes/patita-angel.webp', stat2: 'trajes/patita-diabla.webp', asp: 1.547, asp2: 1.179, name: 'la Tía Patita', g: 'f', devil: true,
      av: { w: 51, fx: .465, fy: .296 }, av2: { w: 77, fx: .525, fy: .273 }, css: { steam: '62% 14%' }, note: 'Ángel que se vuelve diabla' },
    { id: 'conejo',   n: 'Tío Pato Conejo',     price: 300, stat: 'trajes/conejo.webp',   stat2: 'trajes/conejo-enojado.webp',   asp: 1.905, asp2: 1.65, name: 'el Tío Pato Conejo',     g: 'm',
      av: { w: 46, fx: .47, fy: .333 }, av2: { w: 57, fx: .525, fy: .354 }, css: { steam: '66% 12%' }, note: 'Se enoja cuando avanzas' },
    { id: 'conejita', n: 'Tía Patita Conejita', price: 300, stat: 'trajes/conejita.webp', stat2: 'trajes/conejita-enojada.webp', asp: 1.63, asp2: 1.45, name: 'la Tía Patita Conejita', g: 'f',
      av: { w: 56, fx: .535, fy: .388 }, av2: { w: 59, fx: .52, fy: .397 }, css: { steam: '70% 16%' }, note: 'Se enoja cuando avanzas' },
    { id: 'bigotes',  n: 'Tío Pato Simi',       price: 600, stat: 'trajes/bigotes.webp',  stat2: 'trajes/bigotes-enojado.webp',  asp: 1.92, asp2: 1.61, name: 'el Tío Pato Simi',       g: 'm',
      av: { w: 48, fx: .46, fy: .319 }, av2: { w: 55, fx: .52, fy: .333 }, css: { steam: '64% 12%' }, note: 'Bigote, sombrero de copa y bata' },
    { id: 'tios',     n: 'Tíos Patitos',        price: 600, stat: 'trajes/tios.webp',     stat2: 'trajes/tios-enojados.webp',    asp: .826,  asp2: .86,  name: 'los Tíos Patitos',       g: 'p', dw: 1.5,
      av: { w: 58, fx: .525, fy: .264 }, av2: { w: 58, fx: .525, fy: .28 }, css: { steam: '48% 6%' }, note: 'La pareja: te devuelven la pelota de la mano' },
    { id: 'galactico', n: 'Tío Pato Galáctico',  price: 5000, stat: 'trajes/galactico.webp', stat2: 'trajes/galactico-furia.webp', asp: 1.918, asp2: 1.56, name: 'el Tío Pato Galáctico',  g: 'm',
      av: { w: 45, fx: .46, fy: .337 }, av2: { w: 61, fx: .525, fy: .404 }, css: { steam: '60% 14%' }, note: 'Un trozo del universo: se enoja y se le eriza la melena' },
    // Personaje secreto: aparece como una carta misteriosa hasta que lo compras. Es el Tío Pato Dorado (rey de oro con corona que al enojarse se enciende al rojo vivo).
    // Su id sigue siendo «millonario» para que quien ya lo compró no lo pierda (las reglas de Firebase guardan lo comprado como ch_millonario).
    { id: 'millonario', n: 'Tío Pato Dorado', price: 100000000, stat: 'trajes/dorado.webp', stat2: 'trajes/dorado-oscuro.webp', asp: 1.812, asp2: 1.767, name: 'el Tío Pato Dorado', g: 'm', secret: true, glow: true,
      av: { w: 48, fx: .415, fy: .368 }, av2: { w: 45, fx: .475, fy: .391 }, css: { steam: '62% 22%' }, note: 'El secreto: rey de oro que se enciende al rojo vivo' }
  ],

  // vip: true = artículo para millonarios (la tienda los separa y los marca con 💎; el precio ya los deja fuera del alcance de quien recién empieza).
  bg: [
    { id: 'clasico',   n: 'Clásico',          price: 0,   base: '#fff6c0', note: 'Cambia de color con tus puntos' },
    { id: 'atardecer', n: 'Atardecer',        price: 200, base: '#ffb199', note: 'Sol sobre el mar y nubes que pasan' },
    { id: 'cristal',   n: 'Cristal helado',   price: 220, base: '#dcecff', note: 'Témpanos, escarcha y destellos' },
    { id: 'aurora',    n: 'Aurora boreal',    price: 300, base: '#0b1b34', dark: true, note: 'Cortinas de luz sobre las montañas' },
    { id: 'galaxia',   n: 'Galaxia',          price: 400, base: '#0a0a1f', dark: true, note: 'Espiral girando y estrellas fugaces' },
    { id: 'holo',      n: 'Holográfico',      price: 450, base: '#e9c8ff', note: 'Reflejos iridiscentes y burbujas' },
    { id: 'synth',     n: 'Synthwave',        price: 550, base: '#3d0a6b', dark: true, note: 'Sol neón, montañas y cuadrícula' },
    { id: 'boveda',    n: 'Bóveda de oro',    price: 2000000,  base: '#1c1204', dark: true, vip: true, note: 'Una montaña de lingotes y polvo de oro' },
    { id: 'prisma',    n: 'Palacio de diamante', price: 5000000, base: '#0b1747', dark: true, vip: true, note: 'Un brillante gigante y rayos de arcoíris' },
    { id: 'agujero',   n: 'Agujero negro',    price: 10000000, base: '#02020a', dark: true, vip: true, note: 'Disco de fuego que gira sin parar' }
  ],

  // Barras: cada una con sus propios efectos (brillos, chispas, anillos al rebotar).
  pad: [
    { id: 'clasica',  n: 'Clásica',      price: 0,   note: 'Negra y sencilla' },
    { id: 'dorada',   n: 'Oro líquido',  price: 220, note: 'Metal con destellos' },
    { id: 'fuego',    n: 'Llamarada',    price: 280, note: 'Fuego de verdad, con brasas' },
    { id: 'cristal',  n: 'Cristal',      price: 300, note: 'Vidrio con prisma' },
    { id: 'neon',     n: 'Neón',         price: 350, note: 'Brilla y cambia de color' },
    { id: 'galaxia',  n: 'Galaxia',      price: 400, note: 'Estrellas en movimiento' },
    { id: 'arcoiris', n: 'Arcoíris',     price: 450, note: 'Colores que fluyen' },
    { id: 'holo',     n: 'Holográfica',  price: 500, note: 'Iridiscente con destellos' },
    { id: 'midas',    n: 'Rey Midas',    price: 3000000,  vip: true, note: 'Todo lo que toca se vuelve monedas' },
    { id: 'diamante', n: 'Diamante',     price: 6000000,  vip: true, note: 'Facetas que lanzan arcoíris' },
    { id: 'plasma',   n: 'Tormenta eléctrica', price: 12000000, vip: true, note: 'Rayos que saltan en cada rebote' }
  ],

  // Pelotas: monedas y billetes chilenos. rate = pesos que paga cada punto (se multiplica por «Monedas dobles» desde el rebote 100).
  // nom/gen = cómo los nombran los textos del juego («la moneda», «el billete», «el lingote de oro», «el diamante»).
  // fx = cómo se mueve (spin: la moneda gira en el sentido del reloj · flutter: el billete revolotea · jump: el lingote y el diamante saltan). w = ancho relativo.
  // asp = alto/ancho del dibujo (medido de la imagen): con w dice cuánto mide la pelota en pantalla, y el juego hace chocar la pelota con las paredes, la barra y el Pato exactamente donde se ve (si cambias una imagen, el juego mide la nueva solo).
  ball: [
    { id: 'peso1',   n: 'Moneda $1',       price: 0,     rate: 1,  img: 'skins/peso1.webp',   fx: 'spin',    w: 1, asp: 0.975,    trail: '#d5dbe8', nom: 'moneda', gen: 'f', note: 'La moneda de inicio' },
    { id: 'peso5',   n: 'Moneda $5',       price: 5,     rate: 2,  img: 'skins/peso5.webp',   fx: 'spin',    w: 1, asp: 0.98,    trail: '#f2b830', nom: 'moneda', gen: 'f' },
    { id: 'peso10',  n: 'Moneda $10',      price: 10,    rate: 3,  img: 'skins/peso10.webp',  fx: 'spin',    w: 1, asp: 0.997,    trail: '#f2c66a', nom: 'moneda', gen: 'f' },
    { id: 'peso50',  n: 'Moneda $50',      price: 50,    rate: 4,  img: 'skins/peso50.webp',  fx: 'spin',    w: 1, asp: 1.003,    trail: '#e0b060', nom: 'moneda', gen: 'f' },
    { id: 'peso100', n: 'Moneda $100',     price: 100,   rate: 5,  img: 'skins/peso100.webp', fx: 'spin',    w: 1, asp: 1.0,    trail: '#ffe08a', nom: 'moneda', gen: 'f' },
    { id: 'peso500', n: 'Moneda $500',     price: 500,   rate: 6,  img: 'skins/peso500.webp', fx: 'spin',    w: 1.05, asp: 1.0, trail: '#f5f0d0', nom: 'moneda', gen: 'f' },
    { id: 'b1000',   n: 'Billete $1.000',  price: 1000,  rate: 7,  img: 'skins/b1000.webp',   fx: 'flutter', w: 1.6, asp: 0.571,  trail: '#8fe08f', nom: 'billete', gen: 'm' },
    { id: 'b2000',   n: 'Billete $2.000',  price: 2000,  rate: 8,  img: 'skins/b2000.webp',   fx: 'flutter', w: 1.6, asp: 0.509,  trail: '#c9a6ee', nom: 'billete', gen: 'm' },
    { id: 'b5000',   n: 'Billete $5.000',  price: 5000,  rate: 9,  img: 'skins/b5000.webp',   fx: 'flutter', w: 1.6, asp: 0.495,  trail: '#f08a94', nom: 'billete', gen: 'm' },
    { id: 'b10000',  n: 'Billete $10.000', price: 10000, rate: 10, img: 'skins/b10000.webp',  fx: 'flutter', w: 1.6, asp: 0.476,  trail: '#7cc4f0', nom: 'billete', gen: 'm' },
    { id: 'b20000',  n: 'Billete $20.000', price: 20000, rate: 20, img: 'skins/b20000.webp',  fx: 'flutter', w: 1.6, asp: 0.486,  trail: '#f0a070', nom: 'billete', gen: 'm' },
    { id: 'plata',   n: 'Lingote de plata', price: 50000,   rate: 100,   img: 'skins/plata.webp',    fx: 'jump', w: 1.7, asp: 0.594, trail: '#cfd6e2', nom: 'lingote de plata', gen: 'm', note: 'Un lingote de verdad' },
    { id: 'oro',     n: 'Lingote de oro',   price: 500000,  rate: 500,   img: 'skins/oro.webp',     fx: 'jump', w: 1.7, asp: 0.594, trail: '#ffd54a', nom: 'lingote de oro', gen: 'm' },
    { id: 'diamante', n: 'Diamante',        price: 1000000, rate: 5000,  img: 'skins/diamante.webp', fx: 'jump', w: 1.15, asp: 1.04, trail: '#8fd3ff', nom: 'diamante', gen: 'm', note: 'La joya de la corona' }
  ]
};
