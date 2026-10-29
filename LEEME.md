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
  **lingote de plata ($50.000) → $100 · lingote de oro ($500.000) → $500 · diamante ($1.000.000) → $5.000**.
  Ese valor se multiplica por **«Monedas dobles»**: ×1 del rebote 1 al 99, ×2 del 100 al 199, ×3 del 200 al 299, y así. Ejemplo: con el diamante, una partida de 120 rebotes da 5.000 × 141 = $705.000 (y una de 500 rebotes, $7.525.000).
  Al llegar al rebote 100 aparece el aviso animado **«¡Monedas dobles! ×2»** (×3 en el 200…) y una insignia ×N junto al marcador. La pelota con la que empiezas la partida es la que paga toda la partida.
- **Personaje secreto:** el **Tío Pato Dorado** cuesta **$100.000.000** (un pato dorado con corona que al enojarse se enciende al rojo vivo: `trajes/dorado.webp` y `trajes/dorado-oscuro.webp`). En la tienda aparece como una carta misteriosa («Personaje secreto») hasta que se compra. Por dentro su id sigue siendo `millonario` (así quien ya lo tenía no lo pierde y las reglas siguen igual). El rig dorado de antes (`oro/`) ya no se usa.
- **Dificultad:** hasta el rebote 99 el juego es ágil pero amable (la pelota acelera poco y la barra se achica poco). Desde el 100 sube de verdad:
  la pelota acelera mucho más rápido y la barra se achica hasta el 28%. Los valores están al inicio del código de `index.html` (`SPEED0`, `STEP_LO`, `STEP_HI`, `SPEED_MAX`, `SHRINK_LO`, `SHRINK_HI`).
- **Cada pelota choca con la medida que tiene en pantalla** (no con un radio igual para todas): el billete es 1,6 veces más ancho que la moneda y los lingotes 1,7, así que antes se salían de la pantalla por los lados y atravesaban la barra por sus costados. `tienda.js` guarda el alto/ancho de cada dibujo (`asp`, medido de la imagen; si cambias una imagen el juego mide la nueva solo) y `fitBall()` en `index.html` calcula, para la pelota puesta y según su movimiento (la moneda gira, el billete se inclina hasta 12°, los lingotes y el diamante se ensanchan al caer), `BX` (hasta dónde llega a los lados: **nunca pasa del borde**), `BH` (mitad de su ancho), `BC` (cuánto de ella puede quedar más allá de la punta de la barra y aun así contar como golpe) y `BY` (mitad del alto, para la barra, el Pato y la caída). La punta de la barra es sólida: si la pelota se mete por un costado, rebota contra ella en vez de atravesarla.
- **La dificultad es la misma con cualquier pelota y la de siempre:** la zona de golpe total (el ancho de la barra más 16,8 px a cada lado, `OLD_TOL`) no depende de la pelota. Una pelota más ancha que la moneda cuenta con más ancho a cada lado, así que **su barra se ve más angosta** (`padWidth()`): la suma no cambia. `GRAZE` (11,2 px) es cuánto puede rozar la punta una pelota que no cuenta como golpe, igual que la moneda de siempre. La barra nunca se ve más angosta que `PAD_MIN` (26 px); en ese caso (billetes y lingotes después del rebote ~125) la pelota puede rozar un poco más la punta para que la zona de golpe siga igual.
  *Simulación (juego real con reloj virtual, 60 a 480 partidas por celda, bots «promedio» y «bueno»):* con la misma semilla, antes de los arreglos todas las pelotas daban lo mismo; al arreglar solo los bordes, el billete y los lingotes pasaban a dar entre +19% y +65% más rebotes que la moneda; con la dificultad igualada vuelven a estar todas dentro del error de medida (bots «promedio»: moneda 97, billete 95-97, lingote 92, diamante 94 rebotes de media contra 93 de antes; bot «bueno»: la moneda queda a ~5% de antes, 176 contra 185 con 480 partidas). La zona de golpe medida en las 720 partidas coincide con la de antes (diferencia 0,0 px).
- **El campo de juego mide lo mismo en cualquier ventana** (ventana emergente de Samsung, navegador con barras, tablet, computador): es siempre de 390 × 844 unidades (`FW × FH` en `index.html`) y solo cambia la escala `K` (todo se achica o agranda junto: pelota, barra, Pato, velocidades). Si la ventana no tiene esa proporción, el campo se centra y sobra un marco oscuro con borde claro (`#field.boxed`); los menús, la tienda y los marcadores siguen ocupando toda la pantalla. Antes la barra no escalaba con la ventana y el largo de la cancha dependía del alto, así que una ventana corta o baja (por ejemplo la vista emergente) era entre 13% y 50% más fácil.
  Si la ventana es más chica que `S_MIN` (0,6 de escala: unos 234 × 506 px) no se puede jugar: aparece «La ventana es muy chica para jugar parejo» y, si se achica en plena partida, el juego se pausa hasta que se agrande. Si cambian el tamaño de la ventana jugando, todo se reescala junto.
  *Simulación (juego real, bot «promedio», 60 a 120 partidas por tamaño, puntería escalada con el tamaño de la pantalla):* 390×844 → 103,8 ± 4,4 rebotes (referencia); 360×800 97,0; 360×640 96,0; 320×568 100,2; 412×915 99,5; 430×932 100,8; 390×560 102,1; 600×700 101,1; 768×1024 97,0; 1280×720 98,2. Todas dentro del error de medida (la peor, −7%, es 1,1 σ); con el juego anterior, 390×560 daba +32%, 390×480 +50% y 240×420 +36%. Lo que queda: en una ventana más chica el dedo recorre menos distancia para cruzar el campo (lo mismo que ocurre entre un celular chico y uno grande); `S_MIN` limita ese efecto.
- **Los golpes del personaje son aleatorios:** cada vez que te devuelve la pelota la manda en una dirección al azar (de casi vertical a muy abierta).
- En la **Tienda** (desde el menú o al terminar una partida) hay cuatro pestañas. Lo comprado queda en la cuenta y viaja con ella a cualquier celular:
  - **Personajes:** Tío Pato (incluido), Tía Patita ($150), Tío Pato Conejo ($300), Tía Patita Conejita ($300), Tío Pato Simi ($600), Tíos Patitos ($600) y **Tío Pato Galáctico ($5.000)** (su cabeza y cola son una galaxia; al enojarse se le eriza la melena morada y le salen rayos en los puños). El **Tío Pato** (el principal, incluido) es un ángel de traje blanco que se vuelve demonio rojo: dos imágenes sueltas, `trajes/angel.webp` y `trajes/angel-demonio.webp`, con `devil: true` en `tienda.js`. La Tía Patita empieza de ángel y se vuelve demonio con el rig de capas de `patita/`.
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
  Solo el Tío Pato (`devil: true` en `tienda.js`) y la Tía Patita se vuelven diablo y hablan del infierno; las demás skins de una imagen (conejos, Simi, Tíos Patitos, Galáctico y el Dorado secreto) solo se enojan. El Tío Pato (sus frases de siempre más otras bien chilenas: «bacán», «vas de pana», «la raja», «cachái», con 😎), el Galáctico y el Dorado tienen unas 16 a 22 frases por fase y frases especiales en los rebotes 10, 20, 30, 45, 55, 60, 80, 120 y 150.
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
- Cada vez que alguien abre el marcador se descargan ~5 KB (Top 25 + contador). El **Top 25 se actualiza cada 15 s** mientras el marcador está abierto y a la vista, y **el marcador se puede mirar como máximo 1 minuto**: a los 60 s el juego vuelve solo al inicio (un reloj bajo el título cuenta los segundos). Así, una apertura cuesta como mucho ~12 KB (la primera carga y 3 refrescos) sin importar cuánto tiempo se quede la persona mirando. El botón **↻ Actualizar** pide el Top 25 al instante (una vez cada 5 s) y no alarga el minuto. **Tu puesto** (el contador) se lee al abrir, cada 2 min y cuando cambia tu récord; con la app en segundo plano no se pide nada, y si vuelves después del minuto, te manda al inicio. Las escrituras usan `print=silent` (Firebase no devuelve lo escrito). Los tiempos están al inicio de `index.html` (`REFRESH_MS`, `BOARD_MAX_MS`, `REFRESH_COOLDOWN_MS`, `RANK_MS`).
- Para miles de jugadores a la vez, lo más barato es que el Top 25 y el contador se lean de una copia en el CDN de Firebase Hosting (una Cloud Function los publica cada pocos segundos) en vez de leer la base de datos en cada pedido: ver la guía de seguridad y costos.
- El plan gratuito (Spark) de Firebase (1 GB guardado, 10 GB de descarga al mes) alcanza de sobra para miles de jugadores; para una app en las tiendas con 10.000+ jugadores conviene pasar al plan Blaze (pago por uso, con alerta de presupuesto).

## El arte de los personajes

La Tía Patita (carpeta `patita/`) tiene capas PNG transparentes del mismo tamaño (`pato/` es el rig del Tío Pato de antes: hoy solo sirve de respaldo si falta `tienda.js`, porque el Tío Pato usa `trajes/angel*.webp`): 4 caras, alas de ángel y de diablo, aureola, cuernos, tridente, cola y 3 retratos (`hero_*`).
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
