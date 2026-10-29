# Gánale al Tío Pato · cómo activar los marcadores compartidos

Sin configurar nada, el juego funciona, pero cada persona solo ve su propio mejor puntaje (se guarda en su teléfono).
Para que **todos los jugadores compitan en un mismo marcador**, el juego necesita una base de datos en línea. Se usa
Firebase Realtime Database (gratis, aguanta miles de jugadores) y toma unos 5 minutos:

1. Entra a https://console.firebase.google.com con tu cuenta de Google y crea un proyecto (puedes desactivar Analytics).
2. En **Compilación → Realtime Database** aprieta **Crear base de datos**, elige cualquier región y el modo **bloqueado**.
3. En **Compilación → Authentication** aprieta **Comenzar**, abre **Método de acceso**, elige **Correo electrónico/contraseña**,
   actívalo (solo la primera opción) y guarda. Es lo que permite las cuentas con nombre y contraseña.
4. En Realtime Database, pestaña **Reglas**: borra lo que hay, pega el contenido de `firebase-rules.json` (está en esta carpeta) y aprieta **Publicar**.
   **Importante:** hay que volver a pegar y publicar las reglas cada vez que se actualiza el juego con reglas nuevas (esta versión las cambió: partidas verificadas, personajes, pelotas).
5. En **Configuración del proyecto** (el engranaje ⚙ de la izquierda) → pestaña **General**, copia la **Clave de API web**.
6. Abre `config.js` y completa las dos líneas (la dirección de la base de datos está en la pestaña **Datos**):
   `window.DINERO_DB_URL = 'https://mi-proyecto-default-rtdb.firebaseio.com';`
   `window.FIREBASE_API_KEY = 'AIza...';`
7. Sube el cambio al repositorio. Listo: para jugar hay que crear una cuenta o iniciar sesión, y el marcador muestra el Top 25.

## Cuentas (nombre y contraseña)

- Para jugar hay que **crear una cuenta** (nombre + contraseña de al menos 6 caracteres) o **entrar** con una existente.
  La sesión queda guardada en el celular: no hay que volver a escribir la contraseña. Con la misma cuenta se puede entrar desde otro celular y se recupera el mejor puntaje.
- Las contraseñas las guarda Firebase Authentication (cifradas en los servidores de Google); el juego nunca las guarda.
- El nombre no distingue mayúsculas ni tildes: «Matías» y «matias» son la misma cuenta, y dos personas no pueden usar el mismo nombre.
- Como las cuentas no usan un correo real, **no hay recuperación de contraseña**: quien la olvide tendrá que crear otra cuenta con otro nombre.
  Se puede borrar o restablecer una cuenta a mano en Firebase → Authentication → Usuarios.
- Si `FIREBASE_API_KEY` queda vacía, el juego funciona en modo local (solo pide un nombre, sin contraseña y sin cuentas).

## Pesos y tienda

- **Eslogan: «¡Rebota, gana y hazte millonario! 💰»** (aparece en el menú).
- **Cada pelota paga distinto por punto:** moneda $1 → $1 · $5 → $2 · $10 → $3 · $50 → $4 · $100 → $5 · $500 → $6 · billete $1.000 → $7 · $2.000 → $8 · $5.000 → $9 · $10.000 → $10 · $20.000 → $20 ·
  **lingote de plata ($50.000) → $200 · lingote de oro ($500.000) → $1.000 · diamante ($1.000.000) → $10.000**.
  Ese valor se multiplica por **«Monedas dobles»**: ×1 del rebote 1 al 99, ×2 del 100 al 199, ×3 del 200 al 299, y así. Ejemplo: con el diamante, una partida de 120 rebotes da 10.000 × 141 = $1.410.000.
  Al llegar al rebote 100 aparece el aviso animado **«¡Monedas dobles! ×2»** (×3 en el 200…) y una insignia ×N junto al marcador. La pelota con la que empiezas la partida es la que paga toda la partida.
- **Personaje secreto:** el **Tío Pato Millonario** (el Tío Pato de oro) cuesta **$100.000.000**. En la tienda aparece como una carta misteriosa («Personaje secreto») hasta que se compra. Su arte provisorio está en `oro/` (las mismas capas del Tío Pato pintadas de oro); se puede reemplazar por uno propio con el mismo nombre de archivos.
- **Dificultad:** hasta el rebote 99 el juego es ágil pero amable (la pelota acelera poco y la barra se achica poco). Desde el 100 sube de verdad:
  la pelota acelera mucho más rápido y la barra se achica hasta el 28%. Los valores están al inicio del código de `index.html` (`SPEED0`, `STEP_LO`, `STEP_HI`, `SPEED_MAX`, `SHRINK_LO`, `SHRINK_HI`).
- **Los golpes del personaje son aleatorios:** cada vez que te devuelve la pelota la manda en una dirección al azar (de casi vertical a muy abierta).
- En la **Tienda** (desde el menú o al terminar una partida) hay cuatro pestañas. Lo comprado queda en la cuenta y viaja con ella a cualquier celular:
  - **Personajes:** Tío Pato (incluido), Tía Patita ($150), Tío Pato Conejo ($300), Tía Patita Conejita ($300), Tío Pato Simi ($600) y Tíos Patitos ($600). El Tío Pato y la Tía Patita empiezan de ángel y se vuelven demonio.
    Las demás skins son imágenes sueltas (`trajes/`): cada una tiene su dibujo calmado y su dibujo enojado, al que cambia cuando el personaje se enoja (rebote 55), con temblor, brillo rojo, vapor y fuego.
  - **Fondos:** Atardecer ($200), Cristal helado ($220), Aurora boreal ($300), Galaxia ($400), Holográfico ($450) y Synthwave ($550): escenas en capas (cielo, astros, siluetas, partículas) con movimiento lento. Las imágenes van dentro del CSS como SVG.
  - **Barras:** Oro líquido ($220), Llamarada ($280), Cristal ($300), Neón ($350), Galaxia ($400), Arcoíris ($450) y Holográfica ($500); cada una con su color, brillo, partículas y un anillo de luz en cada rebote. La Llamarada dibuja lenguas de fuego de verdad (tres capas, parpadeo y brasas) y la tienda anima la vista previa de cada barra.
  - **Para millonarios** (aparecen en una sección aparte, marcadas con `vip: true` en `tienda.js`): fondos **Bóveda de oro** ($2.000.000), **Palacio de diamante** ($5.000.000) y **Agujero negro** ($10.000.000); barras **Rey Midas** ($3.000.000, lanza monedas), **Diamante** ($6.000.000, destellos con arcoíris) y **Tormenta eléctrica** ($12.000.000, rayos en cada rebote).
  - **Pelotas:** empiezas con la **moneda de $1** (que gira en el sentido del reloj y brilla). Se compran las monedas de $5, $10, $50, $100 y $500 (giran igual), los billetes de $1.000, $2.000, $5.000, $10.000 y $20.000 (que revolotean) y los lingotes de plata y de oro y el diamante (no giran: saltan, y brillan). Precio = su valor en pesos; cada una muestra cuánto paga por punto.
- Sin cuentas (modo local) los pesos y compras quedan solo en ese celular.
- **Lo que dicen los personajes** está en `dialogos.js`, separado de la economía (cambiarlo no obliga a tocar las reglas de Firebase). Hay frases comunes para todos y frases propias de cada skin
  (más de 160 por partida para cada personaje), en cuatro fases: amables (1-29), de reto (30-54, te provocan), de enojo (55-69) y de furia (70 en adelante). Salen al azar y sin repetirse
  hasta que se acaban las de esa fase; la próxima frase llega entre 4 y 10 rebotes después (al azar). Pueden usar tu nombre (`%j`), tus rebotes (`%h`) y el récord (`%b`).
  Los textos también nombran **la pelota con la que juegas** (`{la}` = la moneda / el billete / el lingote de oro / el diamante, `{esa}`, `{esta}`, `{una}`, `{nom}`, `{noms}`, `{pago}` = lo que vale cada rebote) y hay frases propias de cada tipo de pelota (`pelota` en `dialogos.js`; 3 de cada 10 frases son de ellas). Cada pelota se nombra en `tienda.js` con `nom` y `gen`.
  Solo el Tío Pato, la Tía Patita y el Tío Pato Millonario se vuelven diablo y hablan del infierno; las skins de una imagen (conejos, Simi y Tíos Patitos) solo se enojan.
- El catálogo y los precios están en `tienda.js`. Si cambias algo, ejecuta `node herramientas/generar-reglas.js`
  (regenera `firebase-rules.json`, porque las reglas también validan precios y pesos) y vuelve a pegar las reglas en Firebase → Realtime Database → Reglas → Publicar.

### Cambiar las imágenes de las pelotas
Están en `skins/` (WebP con fondo transparente). Ya están todas las imágenes reales.
Para reemplazarlas basta con guardar la imagen nueva con el mismo nombre (monedas de ~300 px, billetes de ~440 px de ancho) y subir el número de `VERSION` en `sw.js`
para que los celulares descarguen lo nuevo. Los ajustes de cada pelota (animación `spin`/`flutter`, tamaño y color de la estela) están en `tienda.js`.

## Anti-trampas: cómo se protege el juego

Todo juego que corre en el teléfono puede ser manipulado por alguien con conocimientos, así que la protección está en **Firebase**, que es lo único que el jugador no controla.
Las reglas de `firebase-rules.json` hacen esto:

- **Partidas verificadas:** al empezar, el juego anota en Firebase la hora de inicio **del servidor**, la pelota que usas (tiene que ser tuya) y lo que paga por punto; al terminar, Firebase pone la hora de fin y solo acepta la partida si los rebotes caben
  en el tiempo transcurrido (mínimo 0,45 s por rebote, más 3 s de margen) y con un máximo de 500 rebotes. **Los pesos de la partida los calculan las reglas** (no el jugador).
- **Cobro único:** los pesos y el marcador se escriben en una sola operación atómica y cada partida se cobra una sola vez. No hay forma de escribir «mi saldo es 99999», de subir el
  puntaje por su cuenta, de repetir una partida ya cobrada ni de borrar lo gastado.
- **Compras:** cada artículo exige haber gastado su precio exacto y solo se puede llevar puesto lo que se compró.
- Cada cuenta solo lee y escribe **lo suyo**; no se puede tocar la cartera ni el puntaje de otra persona.
- Sin conexión no hay partida verificada: se puede jugar, pero esa partida no suma pesos ni marcador. Si se corta internet justo al terminar, la partida queda guardada y se cobra sola al volver la conexión.

**Límite honesto:** un tramposo con un programa (un «bot») que de verdad espere el tiempo real sí puede enviar partidas de pocos o muchos rebotes, porque desde el servidor no se puede saber
si los rebotes los dio una persona. Lo máximo que logra es ganar a un ritmo acotado: hasta 500 rebotes por partida, así que como mucho unos $1.500 por partida con la moneda de $1 y hasta ~$30.000 con el billete de $20.000 (que antes tuvo que comprar); no puede inventar cifras ni gastar de más.
Para un juego entre conocidos o un evento es más que suficiente. Si algún día necesitas más: (1) **Firebase App Check** con reCAPTCHA (gratis) bloquea la mayoría de los bots y las copias
modificadas del juego; (2) **Cloud Functions** (plan Blaze) permiten registrar los movimientos de la partida y repetirla en el servidor para validarla.

## Qué hace el marcador

- Cada cuenta guarda **solo su mejor puntaje** (si rebota más veces, se actualiza; si rebota menos, no baja). El puntaje son los rebotes: cada vez que la barra toca la pelota suma uno.
  Gana quien más rebotes aguante contra el personaje. Se guarda junto con los pesos al terminar cada partida.
- Muestra el **Top 25** ordenado por rebotes. Si no estás entre ellos, debajo aparecen tres puntos y tu fila fija con **tu puesto en el mundo** (`#4.321`) y tu puntaje.
- **Cómo calcula el puesto sin bajar la lista de jugadores:** Firebase guarda un contador `hist` con cuántas cuentas hay en cada puntaje (0 a 500). Tu puesto es 1 + la suma de las casillas de arriba de tu puntaje:
  se leen unos 500 números (~4 KB) vengan 100 o 100.000 jugadores. Cada cuenta se cuenta sola, una vez, y al mejorar pasa de casilla (`scores/<uid>/c` guarda dónde está contada; las reglas exigen que
  el contador solo se mueva de a 1 y solo para tu propia cuenta). Las cuentas que ya existían antes de que hubiera contador se cuentan la próxima vez que entran al juego; hasta entonces el puesto
  de los demás puede salir unos lugares más arriba de lo real (el Top 25 siempre es exacto).
- Cada vez que alguien abre el marcador se descargan ~6 KB (Top 25 + contador). El **Top 25 se actualiza cada 5 s** mientras el marcador está abierto y a la vista (2 KB por vez); **tu puesto** (el contador) se vuelve a leer cada 30 s, y con la app en segundo plano no se pide nada. Eso no crece con la cantidad de jugadores, pero sí con el tiempo que tengan el marcador abierto (≈34 KB por minuto de marcador abierto); si hace falta bajar el costo, `REFRESH_MS` y `RANK_MS` están al inicio de `index.html`.
- El plan gratuito (Spark) de Firebase (1 GB guardado, 10 GB de descarga al mes) alcanza de sobra para miles de jugadores; para una app en las tiendas con 10.000+ jugadores conviene pasar al plan Blaze (pago por uso, con alerta de presupuesto).

## El arte de los personajes

Cada personaje tiene su carpeta (`pato/`, `patita/`) con capas PNG transparentes del mismo tamaño: 4 caras, alas de ángel y de diablo, aureola, cuernos, tridente, cola y 3 retratos (`hero_*`).
El juego las superpone y las anima según los rebotes:

- **0–29 rebotes:** ángel amistoso, con aureola y alas, frases cariñosas.
- **30–54:** sigue siendo ángel, pero desafiante.
- **55 en adelante:** en cuanto se enoja pierde la aureola y las alas de ángel y pasa a su piel de diablo: cuernos, alas de murciélago, cola y tridente rojo. Desde ahí se enoja de forma
  progresiva (más rojo, más temblor y vapor) y, desde el 58, aparece el aura de fuego, que crece hasta el rebote 80. El fondo pasa a rojo infierno.

Para agregar otro personaje: crea su carpeta con las mismas capas y añade una entrada en `ch` dentro de `tienda.js` (con los puntos de giro de alas, tridente y cola en `css`),
vuelve a generar las reglas y agrega la carpeta a la lista de `sw.js`.

## Fluidez (celulares lentos)

- Los fondos **Galaxia** y **Aurora boreal** usan texturas ya difuminadas en `fondos/*.webp` (en vez de `filter: blur` y máscaras que se recalculaban en cada cuadro). Para regenerarlas: `python3 herramientas/generar-fondos.py fondos` (necesita Pillow y numpy).
- Las llamas del diablo y los destellos de las barras se dibujan con sprites precalculados (`drawImage`), no con un degradado nuevo por partícula en cada cuadro.
- Las alas, cuernos y tridente del diablo se decodifican al empezar la partida, no justo cuando aparecen (rebote 55).
- **Modo liviano automático:** si durante unos 5 segundos más del 30% de los cuadros salen lentos, el juego congela los fondos animados y los brillos del personaje (`body.lite`) hasta que se recargue la página.
