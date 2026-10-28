// Catálogo de la tienda y reglas de la economía. Los precios están en pesos ($).
// Si cambias algo aquí, ejecuta `node juego/herramientas/generar-reglas.js` y vuelve a pegar `firebase-rules.json` en
// Firebase (las reglas también validan precios y recompensas, por eso deben coincidir con este archivo).
window.TIENDA = {
  // Economía: cada punto vale lo que paga tu pelota (ball[].rate) multiplicado por «Monedas dobles»: ×1 del punto 1 al 99, ×2 del 100 al 199, ×3 del 200 al 299…
  eco: { tier: 100, msPorRebote: 450, holguraMs: 3000, hMax: 500, cMax: 1000000000000 },

  // Personajes: el rival que te devuelve la pelota. Los dos primeros tienen carpeta con las capas del ángel y del demonio; el resto son imágenes sueltas
  // (sin alas ni aureola) que se enojan con temblor, brillo rojo y vapor. stat = dibujo calmado · stat2 = dibujo enojado, al que cambian cuando el personaje se enoja.
  // av = recorte de la cara para el avatar · dw = ancho de la caja del personaje (la pareja es más ancha) · g = género/número del nombre (m, f o p = plural).
  ch: [
    { id: 'tio', n: 'Tío Pato',   price: 0,   dir: 'pato/',    name: 'el Tío Pato', g: 'm',
      css: { wl: '43.5% 64.5%', wr: '59% 63.7%', tr: '60.3% 35.5%', tail: '40% 76%', steam: '58% 22%', avW: '142px', avL: '-47px', avT: '-56px' }, note: 'El de siempre' },
    { id: 'tia', n: 'Tía Patita', price: 150,  dir: 'patita/',  name: 'la Tía Patita', g: 'f',
      css: { wl: '42% 64.2%', wr: '60.3% 62.8%', tr: '65.6% 39.2%', tail: '39.5% 78.4%', steam: '58% 26%', avW: '166px', avL: '-50px', avT: '-67px' }, note: 'Ángel que se vuelve demonio' },
    { id: 'conejo',   n: 'Tío Pato Conejo',     price: 300, stat: 'trajes/conejo.webp',   stat2: 'trajes/conejo-enojado.webp',   asp: 1.92, asp2: 1.65, name: 'el Tío Pato Conejo',     g: 'm',
      av: { w: 78, fx: .53, fy: .40 }, av2: { w: 78, fx: .55, fy: .39 }, css: { steam: '66% 12%' }, note: 'Se enoja cuando avanzas' },
    { id: 'conejita', n: 'Tía Patita Conejita', price: 300, stat: 'trajes/conejita.webp', stat2: 'trajes/conejita-enojada.webp', asp: 1.63, asp2: 1.45, name: 'la Tía Patita Conejita', g: 'f',
      av: { w: 84, fx: .58, fy: .36 }, av2: { w: 84, fx: .60, fy: .40 }, css: { steam: '70% 16%' }, note: 'Se enoja cuando avanzas' },
    { id: 'bigotes',  n: 'Tío Pato Simi',       price: 600, stat: 'trajes/bigotes.webp',  stat2: 'trajes/bigotes-enojado.webp',  asp: 1.92, asp2: 1.61, name: 'el Tío Pato Simi',       g: 'm',
      av: { w: 76, fx: .47, fy: .375 }, av2: { w: 80, fx: .62, fy: .41 }, css: { steam: '64% 12%' }, note: 'Bigote, sombrero de copa y bata' },
    { id: 'tios',     n: 'Tíos Patitos',        price: 600, stat: 'trajes/tios.webp',     stat2: 'trajes/tios-enojados.webp',    asp: .83,  asp2: .86,  name: 'los Tíos Patitos',       g: 'p', dw: 1.5,
      av: { w: 70, fx: .49, fy: .31 }, av2: { w: 70, fx: .50, fy: .31 }, css: { steam: '48% 6%' }, note: 'La pareja: te devuelven la pelota de la mano' },
    // Personaje secreto: aparece como una carta misteriosa hasta que lo compras. Usa el mismo rig del Tío Pato, pintado de oro (carpeta oro/).
    { id: 'millonario', n: 'Tío Pato Millonario', price: 100000000, dir: 'oro/', name: 'el Tío Pato Millonario', g: 'm', secret: true, glow: true,
      css: { wl: '43.5% 64.5%', wr: '59% 63.7%', tr: '60.3% 35.5%', tail: '40% 76%', steam: '58% 22%', avW: '142px', avL: '-47px', avT: '-56px' }, note: 'De oro macizo: el sueño de todo millonario' }
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
  // fx = cómo se mueve (spin: la moneda gira en el sentido del reloj · flutter: el billete revolotea · jump: el lingote y el diamante saltan). w = ancho relativo.
  ball: [
    { id: 'peso1',   n: 'Moneda $1',       price: 0,     rate: 1,  img: 'skins/peso1.webp',   fx: 'spin',    w: 1,    trail: '#d5dbe8', note: 'La moneda de inicio' },
    { id: 'peso5',   n: 'Moneda $5',       price: 5,     rate: 2,  img: 'skins/peso5.webp',   fx: 'spin',    w: 1,    trail: '#f2b830' },
    { id: 'peso10',  n: 'Moneda $10',      price: 10,    rate: 3,  img: 'skins/peso10.webp',  fx: 'spin',    w: 1,    trail: '#f2c66a' },
    { id: 'peso50',  n: 'Moneda $50',      price: 50,    rate: 4,  img: 'skins/peso50.webp',  fx: 'spin',    w: 1,    trail: '#e0b060' },
    { id: 'peso100', n: 'Moneda $100',     price: 100,   rate: 5,  img: 'skins/peso100.webp', fx: 'spin',    w: 1,    trail: '#ffe08a' },
    { id: 'peso500', n: 'Moneda $500',     price: 500,   rate: 6,  img: 'skins/peso500.webp', fx: 'spin',    w: 1.05, trail: '#f5f0d0' },
    { id: 'b1000',   n: 'Billete $1.000',  price: 1000,  rate: 7,  img: 'skins/b1000.webp',   fx: 'flutter', w: 1.6,  trail: '#8fe08f' },
    { id: 'b2000',   n: 'Billete $2.000',  price: 2000,  rate: 8,  img: 'skins/b2000.webp',   fx: 'flutter', w: 1.6,  trail: '#c9a6ee' },
    { id: 'b5000',   n: 'Billete $5.000',  price: 5000,  rate: 9,  img: 'skins/b5000.webp',   fx: 'flutter', w: 1.6,  trail: '#f08a94' },
    { id: 'b10000',  n: 'Billete $10.000', price: 10000, rate: 10, img: 'skins/b10000.webp',  fx: 'flutter', w: 1.6,  trail: '#7cc4f0' },
    { id: 'b20000',  n: 'Billete $20.000', price: 20000, rate: 20, img: 'skins/b20000.webp',  fx: 'flutter', w: 1.6,  trail: '#f0a070' },
    { id: 'plata',   n: 'Lingote de plata', price: 50000,   rate: 200,   img: 'skins/plata.webp',    fx: 'jump', w: 1.7, trail: '#cfd6e2', note: 'Un lingote de verdad' },
    { id: 'oro',     n: 'Lingote de oro',   price: 500000,  rate: 1000,  img: 'skins/oro.webp',      fx: 'jump', w: 1.7, trail: '#ffd54a' },
    { id: 'diamante', n: 'Diamante',        price: 1000000, rate: 10000, img: 'skins/diamante.webp', fx: 'jump', w: 1.15, trail: '#8fd3ff', note: 'La joya de la corona' }
  ]
};
