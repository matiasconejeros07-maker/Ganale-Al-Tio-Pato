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

## Cuentas (correo + nombre de usuario + contraseña)

- Para jugar hay que **crear una cuenta** (nombre + contraseña de al menos 6 caracteres) o **entrar** con una existente.
  La sesión queda guardada en el celular: no hay que volver a escribir la contraseña. Con la misma cuenta se puede entrar desde otro celular y se recupera el mejor puntaje.
- Las contraseñas las guarda Firebase Authentication (cifradas en los servidores de Google); el juego nunca las guarda.
- El nombre no distingue mayúsculas ni tildes: «Matías» y «matias» son la misma cuenta, y dos personas no pueden usar el mismo nombre.
- Como las cuentas no usan un correo real, **no hay recuperación de contraseña**: quien la olvide tendrá que crear otra cuenta con otro nombre.
  Se puede borrar o restablecer una cuenta a mano en Firebase → Authentication → Usuarios.
- Si `FIREBASE_API_KEY` queda vacía, el juego funciona en modo local (solo pide un nombre, sin contraseña y sin cuentas).

### Correo en las cuentas (recuperar la cuenta y la contraseña)

- **Cuentas nuevas:** se crean con **correo + nombre de usuario (máx. 12) + contraseña**. Para entrar se usa el correo. El nombre de usuario es lo que se ve en el marcador y es único.
- **Cuentas antiguas (nombre + contraseña):** siguen entrando con su nombre. En el menú aparece «📧 Protege tu cuenta» y en **Ajustes → Correo → Agregar** pueden asociar un correo (piden la contraseña otra vez para comprobar que es la dueña). **La cuenta es la misma** (mismo `uid`): pesos, compras, emblema, récord y racha no cambian.
  - Si Firebase tiene la **protección contra enumeración de correos** (viene activada en los proyectos nuevos) no deja cambiar el correo directamente: manda un **enlace al correo nuevo** y el cambio se hace al abrirlo. Mientras tanto la cuenta sigue funcionando igual con su nombre (Ajustes dice «falta abrir el enlace»). Al abrirlo, Firebase cierra las sesiones viejas y el juego pide entrar con el correo.
  - Si la protección está desactivada, el cambio es inmediato. El juego prueba primero el cambio directo y, si Firebase responde «operación no permitida», usa el enlace.
  - Si Firebase bloquea también el enlace, el juego muestra el código que devolvió (por ejemplo `UNVERIFIED_EMAIL`) y no cambia nada: la cuenta sigue como estaba.
  - Después de asociar el correo entran con el correo; con el nombre ya no, y el aviso se lo dice.
- **Verificar el correo:** Firebase manda un **enlace** (no un código numérico: un código necesita un servidor propio y el plan de pago de Firebase). Al abrirlo, Ajustes → Correo → «Ya lo verifiqué» muestra ✅. Se puede reenviar el enlace. (Si el correo se asoció por enlace, ya queda verificado.)
- **Olvidé mi contraseña:** en la pantalla de entrada, «¿Olvidaste tu contraseña?» manda el enlace para crear una nueva (respuesta igual exista o no la cuenta, para no revelar quién juega).
- **Cómo funciona por dentro:** la cuenta nueva se crea directamente con el correo real. El nombre de usuario se anota en `names/<nombre>` (los puntos van como comas, porque Firebase no admite puntos en las claves) junto con `mynames/<uid>` en una sola escritura (así cada cuenta tiene un solo nombre y nadie lo repite). Antes de crear la cuenta el juego mira que el nombre no esté en `names/` ni en el marcador (`scores` con `orderBy="k"`, por eso `k` tiene índice). Las reglas aceptan el nombre de la fila del marcador (`k`) si coincide con el correo interno de las cuentas antiguas (`nombre@tio-pato.invalid`) **o** con ese registro. Las cuentas antiguas anotan su nombre solas la próxima vez que abren el juego. El nombre se guarda también en el perfil de Firebase Auth (`displayName`) para recordarlo al entrar desde otro celular.
- **Pasos en la consola de Firebase:** (1) publicar `firebase-rules.json` **antes o justo con** esta versión, o las cuentas nuevas no podrán crearse (el juego avisa que faltan las reglas); (2) Authentication → Plantillas → editar «Verificación de correo», «Restablecer contraseña» y «Cambio de correo» y poner el idioma en español (opcional, solo cambia el texto del correo). No hace falta tocar la protección contra enumeración.
- **Límites honestos:** quien no abre el enlace queda con el correo «sin verificar»: la cuenta funciona igual, pero no hay garantía de que el correo sea suyo. Un tramposo con un programa podría reservar el nombre de una cuenta antigua que nunca volvió a abrir el juego y no está en el marcador (solo afecta cómo se ve el nombre). No pude probar el cambio de correo contra el Firebase real (mi entorno no llega a él): las pruebas usan un Firebase de mentira que imita la protección contra enumeración.

## Misiones (premios por jugar)

En el menú hay un botón **🎯 Misiones** (con una insignia cuando hay premios por reclamar) y la ventana de la racha tiene cuatro pestañas: **🔥 Racha · 🎯 Hoy · 📅 Semana · 🏅 Logros**. Hace falta cuenta (como la racha).

- **Misiones de hoy (3 por día, iguales para todos):** una **fácil ($100)**, una **media ($250)** y una **difícil ($500)**: a más difícil, más premio. Cada casilla elige su misión entre 3 según la fecha (fácil: jugar 3 partidas · sumar 50 rebotes · llegar a 20 en una partida; media: 5 partidas · 150 rebotes · llegar a 40; difícil: 10 partidas · 400 rebotes · llegar a 80). Se renuevan a medianoche (hora de Chile) y se cobran todas juntas con un botón.
- **Misiones de la semana (3, iguales para todos, cambian al azar cada lunes):** una **fácil ($1.000)**, una **media ($3.000)** y una **difícil ($10.000)**. Cada casilla tiene **5 misiones posibles** y la semana elige una (como la fecha elige las de hoy, con la misma fórmula en el juego y en las reglas): fácil = 15 o 20 partidas · 500 o 700 rebotes · llegar a 40; media = 35 o 45 partidas · 1.500 o 2.000 rebotes · llegar a 75; difícil = 70 o 90 partidas · 4.000 o 5.500 rebotes · llegar a 100 en una sola partida. Los contadores de la semana (`w`, `wg`, `wr`, `wm`, `wc` en `stats/<uid>`) funcionan igual que los de hoy y vuelven a 0 el lunes.
- **Logros (de una sola vez):** 35, con premios de $100 a $500.000: **cuanto más cuesta, más pagan**. Partidas jugadas (1, 10, 50, 100, 250, 500, 1.000), mejor partida (10, 25, 50, 75, **100 = $4.000**, 125, **150 = $25.000** · muy difícil, 200 = $100.000, 300 = $500.000), rebotes totales (100, 500, 2.000, 5.000, **10.000 = $20.000**, 25.000, 50.000), racha de 3, 7, 14, 21, 28 y 60 días, **tiempo jugado** (1, 10 y 50 horas), crear tu emblema, comprar tu primer artículo y **verificar tu correo ($500)**. Se pueden cobrar varios a la vez; sumados valen $1.171.050.
- **Todo está en el catálogo** (`tienda.js` → `eco.misiones`): premios, metas y qué misión corresponde a cada casilla. Después de cambiarlo hay que correr `node herramientas/generar-reglas.js` y volver a publicar `firebase-rules.json` (el servidor es quien lo comprueba).
- **Cómo se protege (las reglas de Firebase lo comprueban todo, el juego solo muestra y pide el cobro):**
  - **Estadísticas** (`stats/<uid>`): partidas, rebotes totales y lo de hoy y de la semana solo suben al cobrar una partida **verificada** (la misma del cobro de pesos), una sola vez por partida, y solo cuentan las de **5 rebotes o más** (`minRebotes`). Los contadores de hoy vuelven a 0 al cambiar el día y los de la semana el lunes. Se escriben **aparte del cobro**: si fallan, los pesos no se ven afectados.
  - **Logros** (`missions/<uid>/<id>`): solo se pueden escribir una vez, solo si las estadísticas (o el dato de la cuenta: récord, racha, tiempo jugado, emblema, gasto, correo verificado) ya cumplen la meta, y no se pueden borrar para cobrar otra vez.
  - **Pesos:** la cartera solo sube **exactamente** lo que valen las misiones que se marcan en esa misma escritura (si pides más, menos o una misión que no cumples, Firebase rechaza todo el cobro). más de 400 pruebas de reglas lo comprueban.
- **Límite honesto:** un programa que juegue partidas de 5 rebotes puede cobrar las misiones fáciles; como mucho se llevaría los premios del día ($850), los de la semana ($14.000) y los logros una vez, y cada partida le exige tiempo real (mínimo 0,45 s por rebote). No hay forma de inventar estadísticas ni de cobrar dos veces.

## Grupo VIP (el WhatsApp de quien desbloquea el personaje secreto)

Quien compra el **Tío Pato Dorado** ($100.000.000) ve una ventana de felicitación («¡Desbloqueaste el personaje secreto! Ahora tienes acceso exclusivo al grupo VIP») donde puede dejar su **número de WhatsApp**. La carta misteriosa de la tienda ya anuncia ese premio.

- **Cómo lo deja:** escribe su número (un celular chileno como `9 1234 5678` se completa a `+56 9 1234 5678`; los de otros países van con `+` y el código) y marca la casilla de que acepta que le escriban. Si cierra la ventana sin enviarlo, el menú le recuerda con un aviso (se puede ocultar por 3 días) y en **Ajustes → Grupo VIP** puede enviarlo, cambiarlo o **borrarlo** cuando quiera. Quien ya tenía el personaje antes de esta versión recibe el mismo aviso.
- **Dónde se guarda:** Realtime Database → `vip/<uid>` con `w` (número, formato `+56912345678`), `n` (su nombre), `t` (hora, la pone el servidor) y `c` (aceptó que le escriban). Para verlos: consola de Firebase → Realtime Database → Datos → `vip`. El `uid` es el de la cuenta: en Authentication → Usuarios aparece el correo de esa cuenta.
- **Quién lo ve:** las reglas solo dejan **leer y escribir su propio número a su dueño**, y **solo si ya tiene el personaje secreto** (`wallets/<uid>/own/ch_millonario`). Nadie más puede leerlo ni listarlo desde el juego; tú lo ves desde la consola (que no pasa por las reglas). Las reglas exigen el formato `+` y de 8 a 15 dígitos, la aceptación (`c: true`), una hora que no se puede inventar y ningún campo extra.
- **Datos personales:** es un dato personal. Úsalo solo para invitar al grupo (es lo que acepta quien lo envía), no lo compartas ni lo publiques, y bórralo si alguien te lo pide. Si quedó mal formateado, el jugador puede corregirlo desde Ajustes. **Al revisar pull requests de otras personas, mira con cuidado cualquier cambio que toque `vip/`, `firebase-rules.json` o envíe datos a otro sitio:** un cambio malicioso podría sacar los números.
- **Reglas nuevas:** hay que volver a publicar `firebase-rules.json` (agrega el bloque `vip`). Si no están publicadas, el juego lo dice al intentar guardar («revisa que las reglas nuevas estén publicadas») y la compra del personaje no se ve afectada.
- **Pruebas:** `pruebas/vip.test.js` (juego + reglas reales) y la sección «Grupo VIP» de `pruebas/reglas.test.js`.

## Pesos y tienda

- **Eslogan: «¡Rebota, gana y hazte millonario! 💰»** (aparece en el menú).
- **Cada pelota paga distinto por punto:** moneda $1 → $1 · $5 → $2 · $10 → $3 · $50 → $4 · $100 → $5 · $500 → $6 · billete $1.000 → $7 · $2.000 → $8 · $5.000 → $9 · $10.000 → $10 · $20.000 → $20 ·
  **lingote de plata ($50.000) → $100 · lingote de oro ($500.000) → $500 · diamante ($1.000.000) → $5.000**.
  Ese valor se multiplica por **«Monedas dobles»**: ×1 del rebote 1 al 99, ×2 del 100 al 199, ×3 del 200 al 299, y así. Ejemplo: con el diamante, una partida de 120 rebotes da 5.000 × 141 = $705.000 (y una de 500 rebotes, $7.525.000).
  Al llegar al rebote 100 aparece el aviso animado **«¡Monedas dobles! ×2»** (×3 en el 200…) y una insignia ×N junto al marcador. La pelota con la que empiezas la partida es la que paga toda la partida.
- **Personaje secreto:** el **Tío Pato Dorado** cuesta **$100.000.000** (un pato dorado con corona que al enojarse se enciende al rojo vivo: `trajes/dorado.webp` y `trajes/dorado-oscuro.webp`). En la tienda aparece como una carta misteriosa («Personaje secreto») hasta que se compra. Por dentro su id sigue siendo `millonario` (así quien ya lo tenía no lo pierde y las reglas siguen igual). El rig dorado de antes (`oro/`) ya no se usa.
- **Dificultad:** hasta el rebote 99 el juego es ágil pero amable (la pelota sube 4 px/s por rebote y la barra se achica 0,3% por rebote). Desde el 100 sube de verdad, pero de a poco:
  - **Barra:** del 70% en el rebote 100 al 28% recién en el 200 (0,42% por rebote; antes llegaba al 28% en el 144).
  - **Pelota:** sigue acelerando sin parar, pero cada rebote suma menos que el anterior (curva suave hacia un techo de 2.100 px/s que casi nunca se alcanza del todo). Antes subía 16 por rebote y se frenaba en 1.800 en el rebote 137. Ahora: 1.200 en el 100, 1.325 en el 118, 1.440 en el 137, 1.708 en el 200, 1.930 en el 300, 2.026 en el 400 (`SPEED0`, `STEP_LO`, `SPEED_MAX`, `SPEED_TAU`).
  - **Por qué el techo es 2.100 y no más:** el Pato devuelve la pelota al instante, así que el ciclo más corto posible depende solo de la velocidad y del alto de la cancha. Medido en el juego real, a 1.800 el ciclo dura ~700 ms de media y 562 ms como mínimo; a 2.100 el mínimo teórico es ~490 ms, todavía más lento que el mínimo de las reglas de Firebase (450 ms por rebote). Una prueba (`humo.test.js`) lo comprueba. Si algún día subes el techo, sube también `msPorRebote` en `tienda.js` y vuelve a publicar las reglas.
  - **Alivio:** la pelota va **un 10% más lenta hasta el rebote 55** (cuando el Pato se enoja) y **un 5% más lenta hasta el rebote 100**; desde el 101 va a la velocidad completa (`EASE_1`, `EASE_2`, `EASE_K1`, `EASE_K2`). Como solo la hace más lenta, el límite de las reglas de Firebase no cambia y no hay que volver a publicarlas.
  Los valores están al inicio del código de `index.html` (`SHRINK_LO`, `SHRINK_HI`, `SHRINK_MIN` para la barra).
- **Cada pelota choca con la medida que tiene en pantalla** (no con un radio igual para todas): el billete es 1,6 veces más ancho que la moneda y los lingotes 1,7, así que antes se salían de la pantalla por los lados y atravesaban la barra por sus costados. `tienda.js` guarda el alto/ancho de cada dibujo (`asp`, medido de la imagen; si cambias una imagen el juego mide la nueva solo) y `fitBall()` en `index.html` calcula, para la pelota puesta y según su movimiento (la moneda gira, el billete se inclina hasta 12°, los lingotes y el diamante se ensanchan al caer), `BX` (hasta dónde llega a los lados: **nunca pasa del borde**), `BH` (mitad de su ancho), `BC` (cuánto de ella puede quedar más allá de la punta de la barra y aun así contar como golpe) y `BY` (mitad del alto, para la barra, el Pato y la caída). La punta de la barra es sólida: si la pelota se mete por un costado, rebota contra ella en vez de atravesarla.
- **La dificultad es la misma con cualquier pelota y la de siempre:** la zona de golpe total (el ancho de la barra más 16,8 px a cada lado, `OLD_TOL`) no depende de la pelota. Una pelota más ancha que la moneda cuenta con más ancho a cada lado, así que **su barra se ve más angosta** (`padWidth()`): la suma no cambia. `GRAZE` (11,2 px) es cuánto puede rozar la punta una pelota que no cuenta como golpe, igual que la moneda de siempre. La barra nunca se ve más angosta que `PAD_MIN` (26 px); en ese caso (billetes y lingotes después del rebote ~125) la pelota puede rozar un poco más la punta para que la zona de golpe siga igual.
  *Simulación (juego real con reloj virtual, 60 a 480 partidas por celda, bots «promedio» y «bueno»):* con la misma semilla, antes de los arreglos todas las pelotas daban lo mismo; al arreglar solo los bordes, el billete y los lingotes pasaban a dar entre +19% y +65% más rebotes que la moneda; con la dificultad igualada vuelven a estar todas dentro del error de medida (bots «promedio»: moneda 97, billete 95-97, lingote 92, diamante 94 rebotes de media contra 93 de antes; bot «bueno»: la moneda queda a ~5% de antes, 176 contra 185 con 480 partidas). La zona de golpe medida en las 720 partidas coincide con la de antes (diferencia 0,0 px).
  **Revisión de «¿tiene alguna pelota la hitbox más grande?» (nov 2026):** se midió en el juego real. (1) La zona de golpe total es **exactamente igual** para todas las pelotas con 0, 25, 50, 75, 100, 125, 150, 200 y 300 rebotes (197,4 px al inicio, 148,3 en el 100, 79,5 en el 200; una prueba en `humo.test.js` lo vigila). (2) Simulación con el juego real (100 partidas por pelota, jugadores virtuales): *jugador bueno* → moneda 184 ± 7 rebotes de media, billete $1.000 185, lingote de plata 175, diamante 188 (todas dentro del margen de error); *jugador promedio* → moneda 120 ± 6, billete 107, lingote 114, diamante 107 (la moneda queda entre 5% y 11% más fácil). El billete **no** rinde mejor que el diamante. (3) Lo único «más generoso» en billetes y lingotes es lo relativo: su zona ocupa el 68% y el 70% del recorrido lateral de su centro (moneda 59%, diamante 62%) y les basta que se toque el 16% de su ancho (moneda y diamante 20%). Se decidió **dejarlo como está** (la zona es igual en píxeles y los resultados son parecidos); si más adelante se quisiera igualar lo relativo, la tolerancia de cada pelota sería `0,6 × su ancho visible / 2` en vez de la fija (lo que baja un 4-5% la zona de billetes y lingotes).
- **El campo de juego se adapta a tu celular y la dificultad es la misma en todos:** ocupa toda la pantalla (sin marcos) en cualquier celular, largo o corto, con o sin barras del navegador. Por dentro mide siempre 390 unidades de ancho (`FW`): todo (pelota, barra, Pato) escala con `K = ancho / 390` y la velocidad **vertical** se estira con lo alto que sea el campo (`VYF`), así la pelota tarda lo mismo en cruzar y recorre lo mismo hacia los lados en cualquier pantalla. El dedo también se normaliza: el mismo recorrido del dedo cruza el campo en cualquier tamaño (`× K` en `movePaddle`). Antes la barra no escalaba con la ventana y una ventana corta (por ejemplo la vista emergente de Samsung) era entre 13% y 50% más fácil.
  Solo si la ventana es mucho más ancha que un celular (computador, tablet en horizontal; proporción ancho/alto sobre 0,72, `A_HI`) el campo se centra con un marco oscuro. Si la ventana es demasiado chica (menos de `MIN_W` × `MIN_H` = 320 × 540 px: pantalla duplicada y achicada, vista emergente) no se puede jugar: sale «La ventana es muy chica para jugar parejo» y, si se achica en plena partida, el juego se pausa hasta que se agrande. Si cambian el tamaño de la ventana jugando, todo se reescala junto.
  *Simulación (juego real, bot «promedio», 60 partidas por tamaño, puntería y velocidad de la mano escaladas con el tamaño de la pantalla):* 390×844 → 97,4 ± 6,2 rebotes (referencia); 375×667 98,4; 375×553 95,1; 320×568 99,5; 360×640 96,3; 360×860 103,8; 412×915 101,4; 430×932 90,5; 320×540 105,1; 390×600 100,2; 768×1024 99,1; 1280×720 97,5. Todas dentro del error de medida (la mayor diferencia, +8%, es 0,9 σ); con el juego anterior, 390×560 daba +32% y 390×480 +50%.
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

## Muchos jugadores a la vez

- **Reintento al empezar la partida:** si Firebase está ocupado (error 429 o 5xx) o no contesta, el juego reintenta hasta 2 veces con pausas al azar, mientras corre la cuenta regresiva, para que un tropiezo de un instante no deje esa partida sin pesos. Un rechazo de las reglas (401/403) no se reintenta. Si Firebase sigue sin responder, la partida se juega pero no suma (el mensaje dice «Sin conexión»). Al terminar, el cobro ya reintentaba 4 veces y, si no se puede, queda pendiente y se cobra solo después.

## Si los pesos no se suman: «Ver detalle técnico»

Al final de una partida que no se pudo guardar aparece **Ver detalle técnico**. Prueba paso a paso lo que Firebase deja hacer a esa cuenta y termina con una frase que dice qué hacer:

- **«Firebase no reconoce tu sesión»**: la sesión guardada en el teléfono ya no vale (el token venció o la hora del teléfono está mal). El juego renueva el token solo ante cualquier rechazo; si sigue igual: Ajustes → Cerrar sesión y volver a entrar, con la hora del teléfono en automático.
- **«Firebase rechaza incluso leer tu billetera»**: las reglas publicadas en Firebase no son las de `firebase-rules.json` (falta el bloque `wallets`). Pega el archivo completo en Realtime Database → Reglas y pulsa **Publicar**; si Firebase marca un error rojo, no se guardan. Mira también que la base elegida arriba del editor sea la que dice «Base de datos» en el detalle.
- **«Rechaza empezar la partida»**: falta el bloque `runs` en las reglas publicadas (mismo arreglo).
- **«La pelota que llevas puesta no está registrada en tu cuenta»**: cámbiala en la tienda y vuelve a jugar.

Los pesos no tienen tope práctico: una cuenta puede llegar hasta $1.000.000.000.000 (las reglas lo comprueban) y cada partida suma lo que calculan las reglas, sin importar el saldo.

## Publicar con otro link (Cloudflare Pages, sin tu usuario de GitHub en la dirección)

`herramientas/publicar.js` arma la carpeta `dist/` con **solo lo que el juego necesita** (la página, el service worker, las imágenes y las cabeceras de seguridad en `_headers`): nada de pruebas, herramientas, documentación, reglas ni archivos ocultos. Una prueba (`pruebas/dist.test.js`) comprueba que esté completa y que **ningún archivo publicado nombre GitHub, tu usuario ni tu correo**.

**Cómo conectarlo (una sola vez, lo haces tú en tu cuenta de Cloudflare):**
1. Cloudflare → *Workers & Pages* → *Create* → *Pages* → *Connect to Git* → autoriza solo este repositorio.
2. *Production branch*: `main` · *Build command*: `node herramientas/publicar.js` · *Build output directory*: `dist`.
3. El nombre del proyecto es tu link: `https://<nombre>.pages.dev`. **Elígelo bien: si lo renombras, el link cambia.** Con un dominio propio (se conecta en *Custom domains*) el link no cambia nunca más aunque cambies de hosting.
4. Desde ese momento cada vez que se une un cambio a `main`, Cloudflare publica la versión nueva sola (en ~1 minuto).

**Si hay gente en el link de GitHub y gente en el de Cloudflare:**
- **Los dos se actualizan juntos**: ambos publican el mismo `main`. (Si pasas el repositorio a privado, GitHub Pages gratis deja de publicar y queda solo Cloudflare.)
- **Los marcadores, billeteras, rachas, emblemas y cuentas son los mismos en los dos**, porque viven en Firebase, no en el link. Quien juegue en uno aparece en el marcador del otro. Lo único separado es la **sesión** del celular (en cada link hay que iniciar sesión una vez con la misma cuenta) y la app instalada.
- Si restringiste la clave de API de Google por referente, agrega **los dos** dominios.
- Para llevar a todos al link nuevo cuando quieras: pon el link en `window.ENLACE_NUEVO` de `config.js` (viene vacío = apagado); quien entre por cualquier otra dirección será llevado al nuevo.

## Seguridad al publicar el juego (GitHub Pages) y pruebas

Revisión hecha con las skills de seguridad y calidad de jeffallan (escaneo estático con ESLint + `eslint-plugin-security` y `no-unsanitized`, revisión manual y pruebas):

- **No hay claves secretas en el código.** La «clave de API web» de `config.js` es pública por diseño (la protegen las reglas); no hay librerías ni scripts de terceros (nada de CDN), y todo texto que viene de otros jugadores se muestra con `textContent` (nunca como HTML).
- **Política de contenido (CSP) dentro de `index.html`** (por si el hosting no deja poner cabeceras propias; en Cloudflare, `_headers` la manda además como cabecera real): solo carga lo del mismo sitio y solo habla con Firebase (`*.firebaseio.com`, `identitytoolkit`, `securetoken`). Si cambias de dominio de base de datos, ajusta `connect-src`. Un pequeño script impide que otro sitio meta el juego en un marco (clickjacking). En Firebase Hosting `firebase.json` ya manda las cabeceras reales.
- **Nombres:** máximo **12 caracteres** al crear la cuenta (las cuentas antiguas de hasta 16 siguen entrando con su nombre completo y se ven cortadas a 12). Se les quitan caracteres de control, invisibles y de dirección de texto (alguien podía disfrazar su nombre escribiendo directo en la base de datos).
- **Contraseña:** al crear la cuenta se piden 8 caracteres o más (los nombres del marcador son públicos, y con ellos el nombre de usuario).
- **Service worker:** nunca guarda respuestas con error, espera como máximo 4 s a internet antes de usar la copia guardada y al instalarse ignora el caché del navegador (GitHub Pages guarda los archivos 10 minutos).
- **Lo que debes hacer tú en la consola de Google/Firebase** (yo no puedo entrar a tus cuentas):
  1. *Google Cloud → APIs y servicios → Credenciales → tu clave de API*: restringe por **referentes HTTP** (`https://tu-usuario.github.io/*`) y por API a **Identity Toolkit** y **Token Service**. Así nadie más puede usar tu clave.
  2. *Facturación → Presupuestos y alertas*: crea una alerta (por ejemplo a US$5) para enterarte si alguien abusa de las lecturas.
  3. *Authentication → Configuración → Política de contraseñas*: sube el mínimo a 8 y activa la **protección contra enumeración de correos**.
  4. *App Check* (reCAPTCHA Enterprise/Play Integrity/App Attest) cuando lo subas a las tiendas: frena a quien llama a Firebase desde fuera del juego.
- **Límite que no se puede cerrar sin un servidor:** un programa que juegue perfecto (bot) puede llegar a los 500 rebotes; las reglas solo garantizan que no se pueda llegar más rápido que 1 rebote cada 0,45 s y que los pesos coincidan con la partida.

**Pruebas** (carpeta `pruebas/`): `cd pruebas && npm install && npx playwright install chromium && npm test`. `reglas.test.js` prueba las reglas de Firebase con el simulador oficial (más de 450 casos, con la racha y sus multiplicadores, el emblema, las misiones y el grupo VIP), `racha.test.js` y `perfil.test.js` prueban la racha y el emblema de punta a punta (el juego real contra un Firebase de mentira con las reglas reales) y `humo.test.js` abre el juego en Chromium y comprueba que cargue sin errores, que la CSP no bloquee nada, que el campo se adapte a cada forma de celular, el aviso de ventana chica, el multitáctil, el teclado y que los 8 personajes carguen. `.github/workflows/pruebas.yml` las corre solas en cada cambio.

## Qué hace el marcador

- Cada cuenta guarda **solo su mejor puntaje** (si rebota más veces, se actualiza; si rebota menos, no baja). El puntaje son los rebotes: cada vez que la barra toca la pelota suma uno.
  Gana quien más rebotes aguante contra el personaje. Se guarda junto con los pesos al terminar cada partida.
- Muestra el **Top 30** ordenado por rebotes (**🏆 Todo el tiempo**; hay otras tres pestañas, ver más abajo). Si no estás entre ellos, debajo aparecen tres puntos y tu fila fija con **tu puesto en el mundo** (`#4.321`) y tu puntaje.
- **Cómo calcula el puesto sin bajar la lista de jugadores:** Firebase guarda un contador `hist` con cuántas cuentas hay en cada puntaje (0 a 500). Tu puesto es 1 + la suma de las casillas de arriba de tu puntaje:
  se leen unos 500 números (~4 KB) vengan 100 o 100.000 jugadores. Cada cuenta se cuenta sola, una vez, y al mejorar pasa de casilla (`scores/<uid>/c` guarda dónde está contada; las reglas exigen que
  el contador solo se mueva de a 1 y solo para tu propia cuenta). Las cuentas que ya existían antes de que hubiera contador se cuentan la próxima vez que entran al juego; hasta entonces el puesto
  de los demás puede salir unos lugares más arriba de lo real (el Top 30 siempre es exacto).
- Cada vez que alguien abre el marcador se descargan ~6 KB (Top 30 + contador). El **Top 30 se actualiza cada 30 s** mientras el marcador está abierto y a la vista, y **el marcador se puede mirar como máximo 1 minuto**: a los 60 s el juego vuelve solo al inicio (un reloj bajo el título cuenta los segundos). Así, una apertura cuesta como mucho ~12 KB (la primera carga y 3 refrescos) sin importar cuánto tiempo se quede la persona mirando. El botón **↻ Actualizar** pide el Top 30 al instante (una vez cada 5 s) y no alarga el minuto. **Tu puesto** (el contador) se lee al abrir, cada 2 min y cuando cambia tu récord; con la app en segundo plano no se pide nada, y si vuelves después del minuto, te manda al inicio. Las escrituras usan `print=silent` (Firebase no devuelve lo escrito). Los tiempos están al inicio de `index.html` (`REFRESH_MS`, `BOARD_MAX_MS`, `REFRESH_COOLDOWN_MS`, `RANK_MS`).
- Para miles de jugadores a la vez, lo más barato es que el Top 30 y el contador se lean de una copia en el CDN de Firebase Hosting (una Cloud Function los publica cada pocos segundos) en vez de leer la base de datos en cada pedido: ver la guía de seguridad y costos.
- El plan gratuito (Spark) de Firebase (1 GB guardado, 10 GB de descarga al mes) alcanza de sobra para miles de jugadores; para una app en las tiendas con 10.000+ jugadores conviene pasar al plan Blaze (pago por uso, con alerta de presupuesto).


### Las 4 pestañas del marcador (todas con el Top 30)

| Pestaña | Qué muestra |
|---|---|
| 🏆 **Todo el tiempo** | Los mejores rebotes de la historia, con tu puesto en el mundo debajo si no estás |
| 📅 **Semanal** | La mejor partida de **esta semana** (empieza el lunes, hora de Chile); la nota dice cuánto falta para que se reinicie |
| ⏱️ **Tiempo jugado** | Quienes más tiempo llevan jugando (ver abajo) |
| 💰 **Millonarios** | Quienes **más pesos han ganado en total** en el juego (acumulado: lo que se gasta en la tienda **no se descuenta**), con el monto en pesos |

- **Semanal** (`weekly/<semana>/<uid>` = `n`, `s`, `t`, `a`): se escribe sola al terminar una partida que es tu **nueva mejor de la semana**, aparte del cobro. Las reglas solo dejan escribir en la semana en curso, `s` tiene que ser exactamente tu mejor partida de la semana que ya llevan tus estadísticas verificadas (`stats/<uid>/wm`), no baja nunca y el nombre es el de tu fila del marcador. Cada semana es un nodo nuevo: los de semanas viejas quedan guardados (pesan casi nada) y se pueden borrar desde la consola cuando quieras.
- **Millonarios** (`scores/<uid>/w`): es el **total de pesos que cada jugador ha ganado en todo el juego** (partidas, racha, misiones, logros y ruleta: `wallets/<uid>/c`). **Es acumulado: gastar en la tienda no lo baja**, así que nadie pierde su puesto por comprarse un personaje. Se copia a tu fila del marcador tras cada cobro, racha, misión o ruleta (como mucho cada 15 s) y al abrir la pestaña. Las reglas solo aceptan **el valor exacto que dice tu cartera en ese momento** (nadie puede inventarse un total). Es público (como el puntaje): cualquiera ve cuántos pesos ha ganado cada jugador del Top 30. Antes esta pestaña mostraba lo que cada uno *tenía* (ganado − gastado); los valores viejos se corrigen solos la próxima vez que cada jugador abre el juego con la versión nueva.
- **Insignias junto al nombre** en todas las pestañas: **🦆🎩 Tío Patito**, **🦆🎀 Tía Patita** y **👾 desarrolladores**. Las pone **solo el administrador desde la consola de Firebase** (`roles/<uid>` = `tio`, `tia` o `dev`; nadie puede escribirlas desde el juego). Pasos: Realtime Database → Datos → `roles` → «+» → nombre = el **uid** de la cuenta (se ve en Authentication → Usuarios) y valor = `tio`, `tia` o `dev`. Para que nadie más use los nombres «TIOPATITO» o «Tia Patita», regístralos tú: `names` → «+» → nombre `tiopatito` (y `tia,patita` para «Tia Patita»: en minúsculas y con los espacios/puntos como coma) y valor = tu uid.
- **Reglas nuevas** (`weekly`, `roles` y `scores/<uid>/w` con su índice): hay que volver a pegar `firebase-rules.json`. Sin ellas, «Todo el tiempo» sigue igual y «Semanal» y «Millonarios» avisan que faltan publicarlas.
- **Pruebas:** `pruebas/marcadores.test.js` (juego + reglas reales) y la sección «Marcadores: semanal, millonarios e insignias» de `pruebas/reglas.test.js`.

### Marcador «Tiempo jugado» (horas jugadas)

- «Tiempo jugado» muestra el **Top 30 de quienes más tiempo llevan jugando**, con el mismo formato que el de rebotes: medallas 🥇🥈🥉, emblema, nombre, tu fila resaltada, actualización cada 30 s, botón «Actualizar» cada 5 s como máximo y el mismo minuto para mirarlo. Si no estás entre los 30, debajo salen tres puntos y **tu tiempo**; no hay «puesto en el mundo» porque contarlo exigiría bajar todas las cuentas (el de rebotes lo hace con el contador `hist`).
- El tiempo se muestra como `45 s`, `12 min`, `3 h 05 min` o `2 d 4 h`. **Cuenta desde que existe este marcador**: no se puede recuperar el tiempo de partidas anteriores.
- **Qué se suma:** al terminar cada partida (ya cobrada) se suma **lo que duró de verdad esa partida**, el mismo «Aguantaste 1:52 min» que ves al final (sin la cuenta regresiva), y el final de la partida muestra «⏱️ +1:52 · en total llevas 3 h 05 min jugando». El total es la **suma de todas tus partidas jugadas**.
- **Por qué no se infla:** el juego manda lo que midió, pero las reglas no dejan sumar más de lo que tardó la partida en el servidor (hora de fin menos hora de inicio, las dos del servidor) ni más del **tope de 4,5 s por rebote + 6 s** (`eco.tiempo` en `tienda.js`). Así dejar el juego abierto o tardar en cobrar no suma horas. `ml` = la última partida sumada: cada partida cuenta una sola vez, y el tiempo nunca baja. Se escribe **aparte del cobro** (`scores/<uid>/ms` y `ml`): si falla, los pesos no se ven afectados, y el juego lo reintenta antes de empezar la siguiente partida. El Top 25 usa el índice `ms` de `scores`. (Las partidas que quedaron pendientes con una versión anterior suman lo que tardaron menos la cuenta regresiva.)
- **Límite honesto:** un programa que juegue 24 horas seguidas aparecería como alguien que juega 24 horas al día (no puede sumar más tiempo real del que pasó).

## El arte de los personajes

Cada personaje es un par de imágenes sueltas en `trajes/` (el dibujo calmo y el enojado): se preparan con `python3 herramientas/preparar-trajes.py original.png trajes/nombre.webp`.
(`pato/` es el rig por capas del Tío Pato de antes: hoy solo sirve de respaldo si falta `tienda.js`.)
El Tío Pato y la Tía Patita (`devil: true` en `tienda.js`) cambian de ángel a diablo/diabla según los rebotes; los demás solo se enojan:

- **0–29 rebotes:** ángel amistoso, frases cariñosas.
- **30–54:** sigue siendo ángel, pero desafiante.
- **55 en adelante:** en cuanto se enoja cambia a su dibujo de diablo/diabla. Desde ahí se enoja de forma progresiva (más rojo, más temblor y vapor) y, desde el 58, aparece el aura de fuego, que crece hasta el rebote 80. El fondo pasa a rojo infierno.

**Avatar del encabezado** (círculo de 44 px): `av` (calmo) y `av2` (enojado) en `tienda.js` indican el ancho de la imagen dentro del círculo (`w`) y el punto de la imagen que queda al centro (`fx`, `fy`). Para que siempre se vea la cara entera (o las dos caras de los Tíos Patitos):
`python3 herramientas/ajustar-avatares.py` calcula esos valores a partir del recuadro de la cara de cada skin (editable al principio del archivo) y `python3 herramientas/hoja-avatares.py hoja.png` dibuja cómo quedan todos los avatares para revisarlos.

Para agregar otro personaje: prepara sus dos imágenes, añade una entrada en `ch` dentro de `tienda.js` (`stat`, `stat2`, `asp` = alto/ancho, `av`, `av2`), vuelve a generar las reglas y agrega las imágenes a la lista de `sw.js`.

## Racha diaria (premios por volver cada día)

Con cuenta, al entrar cada día aparece la **Racha diaria** (también desde el chip 🔥 del inicio, con un punto rojo cuando hay premio):

| Días | Premio |
|---|---|
| 1 a 5 | $100, $200, $300, $400 y $500 |
| 6 | $1.000 |
| **7** | 🤑💸 **Multiplicador ×2** (se guarda: lo activas tú) |
| 8 a 13 | de 1 a 6 monedas de $500: $500, $1.000, $1.500, $2.000, $2.500 y $3.000 |
| **14** | 🤑💸 **Multiplicador ×3** |
| 15 a 20 | de 1 a 6 billetes de $1.000: $1.000 a $6.000 |
| **21** | 🤑💸 **Multiplicador ×4** |
| 22 a 27 | $2.000, $3.000, $4.000, $5.000, $6.000 y $8.000 |
| **28 en adelante** | **$10.000 cada día** (el billete de $10.000) |

- **La racha no se reinicia cada 7 días:** sigue sumando (día 8, 9, 10…) mientras no te saltes un día. La pantalla muestra la semana de hoy (7 días); pasado el día 28 queda la tarjeta de los $10.000 diarios.
- **Los multiplicadores (7, 14 y 21) no se activan solos:** al reclamarlos se **guardan** en tu cuenta (`x2`, `x3`, `x4`) y en el inicio aparece un botón **«🤑 Activar ×N · 10 min»** por cada uno que tengas (los que regala la **ruleta** se guardan aparte, duran **5 minutos** y tienen su propio botón «🎡 Activar ×N · 5 min»; ver «Ruleta diaria»). Al tocarlo empieza el tiempo (se ve el cartel «🤑 Pesos ×N» con la cuenta regresiva) y **las partidas que EMPIEZAN en ese lapso pagan ×N** (los rebotes del marcador no se multiplican; se suma a las «Monedas dobles» del rebote 100). No se puede activar otro mientras uno corre; los guardados no vencen. Los días 7, 14 y 21 muestran 🤑💸 animados en vez del rayo ⚡.
- Los dibujos de cada día son lo que regalan: monedas y billetes de `skins/` (día 9 = dos monedas de $500, día 16 = dos billetes de $1.000; si son más de 4 monedas o 3 billetes se dibujan 4 o 3 con una insignia «×5», «×6»; de la semana 4 en adelante son los billetes que sumen el premio).
- Si pasas un día entero sin entrar, la racha vuelve al día 1 (los multiplicadores guardados se conservan).
- **El día cambia a medianoche de Chile en horario de verano** (`huso: -3` en `eco.racha` de `tienda.js`; en invierno es una hora antes). Todo está en `eco.racha`: la tabla `dias` (días 1 a 27; 0 = día de multiplicador), `fijo`/`fijoDesde` (los $10.000 diarios desde el día 28), `mult` (`[día, ×N]`) y `dobleMs` (la duración). Si cambias algo, ejecuta `node herramientas/generar-reglas.js` y vuelve a pegar `firebase-rules.json`.
- **Lo valida el servidor** (reglas de Firebase, nodo `streaks/<uid>`): el día y la hora los pone Firebase, la racha solo avanza al valor exacto que toca, el premio en pesos tiene que coincidir con la tabla (también el de los $10.000), los multiplicadores solo se guardan el día que tocan (uno por reclamo) y activar uno exige tenerlo guardado y gastarlo en esa misma escritura, sin otro activo; la racha no se puede borrar para cobrar de nuevo y el pago de una partida solo vale ×N si empezó dentro de lo que dura la activación (`bd`: 10 minutos los de la racha y 5 los de la ruleta; las activaciones antiguas, sin `bd`, siguen valiendo 10 minutos y las que no tienen `bm` ×2). Cambiar el reloj del celular no sirve: si no coincide con el de Firebase, el servidor rechaza el cobro.
- **Hay que publicar las reglas nuevas** (`firebase-rules.json`). Mientras no estén publicadas, el juego funciona igual pero la racha no aparece o no deja reclamar los días nuevos.

## Ruleta diaria (un giro por día)

En la ventana de la racha hay una pestaña **🎡 Ruleta** (con punto rojo cuando tienes el giro del día; el chip 🔥 del inicio también avisa). Un giro por día (el día cambia a medianoche de Chile). **Aparece sola cada día nuevo:** al entrar, si ya cobraste la racha de hoy y no has girado, se abre la ruleta; y si aún no la cobraste, apenas cobras la racha la ventana pasa sola a la ruleta. Los premios (`eco.ruleta` de `tienda.js`, 20 casillas en total):

| Premio | Casillas | Probabilidad |
|---|---|---|
| $500 | 4 | 20% |
| $1.000 | 4 | 20% |
| $2.500 | 3 | 15% |
| $5.000 | 2 | 10% |
| $10.000 | 1 | 5% |
| 💰 **$25.000** (premio gordo) | 1 | 5% |
| 🤑 Multiplicador ×2 (se guarda, lo activas tú) | 2 | 10% |
| 🤑 Multiplicador ×3 | 2 | 10% |
| 🤑 Multiplicador ×4 | 1 | 5% |

En promedio un giro vale unos **$2.900** en pesos y, una de cada cuatro veces, un multiplicador. Los multiplicadores de la ruleta se guardan **aparte de los de la racha** (`streaks/<uid>/y2`, `y3`, `y4`) y **duran 5 minutos** (`eco.ruleta.multMs` en `tienda.js`; los de la racha duran 10). Se activan con su propio botón del inicio, **«🎡 Activar ×N · 5 min»**: al tocarlo se anota `bx` (hora), `bm` (cuál) y `bd = 300000` (cuánto dura) y se gasta el contador `y<N>` en esa misma escritura. Las reglas rechazan activarlo diciendo que dura más (o activar uno de la racha diciendo que dura menos), y el pago de una partida solo vale ×N si empezó dentro de esos 5 minutos. Los multiplicadores que alguien ya tenía guardados de giros anteriores a este cambio quedan en `x2`/`x3`/`x4` y siguen durando 10 minutos.

- **Diseño:** rueda dibujada en SVG (nítida en cualquier pantalla) con marco dorado de focos que parpadean (más rápido al girar), clavitos entre premios, brillo de cristal, centro con el patito y un puntero rojo que **chasquea (suena y vibra) cada vez que pasa por un clavito**. Al caer muestra el premio, la rueda brilla y salen confeti y monedas. El tamaño de cada trozo es su probabilidad y la rueda nunca es más alta que un tercio de la pantalla (el botón siempre se ve). Las cinco pestañas de la ventana (Racha, Hoy, Semana, Ruleta y Logros) son del mismo ancho y no se salen de la tarjeta ni en celulares de 320 px.
- **El jugador no puede elegir ni reintentar el resultado.** El giro y el cobro son **dos escrituras distintas**: (1) girar anota la hora del servidor en `ruleta/<uid>/t` y (2) cobrar escribe `ruleta/<uid>/c = t` junto con los pesos o el multiplicador. El premio sale de la hora guardada (`t` en ms % 20), así que el jugador no sabe cuál será hasta que el servidor la anota, y las reglas **rechazan girar y cobrar en la misma escritura** (si no, se podría repetir una escritura rechazada hasta acertar el premio grande), un segundo giro el mismo día, cobrar dos veces el mismo giro, un monto distinto al de la tabla y borrar el giro.
- Si se corta la conexión entre girar y cobrar, el premio **sigue guardado**: el botón pasa a «Cobrar mi premio» (también al día siguiente, mientras no se gire de nuevo).
- La rueda es solo un dibujo: gira hasta donde ya dijo el servidor. Si cambias la tabla en `tienda.js`, las casillas deben seguir sumando 20 (hay una prueba) y hay que volver a correr `node herramientas/generar-reglas.js` y a publicar las reglas.
- **Pruebas:** la sección «Ruleta diaria» de `pruebas/reglas.test.js` (hora congelada: prueba cada casilla, los bordes y los intentos de trampa) y `pruebas/ruleta.test.js` de punta a punta (giro, cobro de cada casilla, trampas, aparición automática cada día, pestañas dentro de la tarjeta a 390, 360 y 320 px y sin reglas nuevas).
- **Hay que publicar las reglas nuevas** (nodo `ruleta`). Sin ellas la pestaña no aparece y todo lo demás sigue igual.

## Foto de perfil: el emblema (editor libre)

Cada jugador arma su **emblema** (tocando su nombre en el inicio, o en Ajustes → «Mi emblema»): elige la **forma** (círculo, cuadrado, hexágono, octógono, escudo, rombo, estrella, arco), el **color de fondo** y el del **borde** (16 colores), un **diseño** (liso, rayas, puntos, rayos, mitad, cuadros) y hasta **5 símbolos** (48 emojis o su inicial) que **toca o arrastra donde quiera** en la vista previa, además de agrandarlos, girarlos, quitarlos y **mandarlos «Al fondo» o traerlos «Al frente»** para decidir cuál tapa a cuál (el orden de las capas es el orden de los símbolos en el texto del emblema: el primero queda al fondo). También hay «🎲 Sorpréndeme».

- **Casi no gasta recursos:** el emblema es un texto de 9 a 25 caracteres (`e` + forma, fondo, borde, diseño + 4 caracteres por símbolo: símbolo, x, y, tamaño y giro). Se dibuja con CSS (sin imágenes), se guarda en caché y pesa lo mismo que un nombre cortito en la base de datos.
- Se ve en el **encabezado de la partida**, en el inicio, en los Ajustes y **en el marcador** (cada fila). Se guarda en tu cuenta (`wallets/<uid>/av`, para tus otros dispositivos) y en tu fila del marcador (`scores/<uid>/a`, para que te vean los demás). Las reglas de Firebase solo aceptan ese formato exacto.
- **Rival del encabezado:** el avatar del lado derecho (donde antes salía la cara del Tío Pato) ahora es el emblema del **jugador en el primer lugar**, con su récord al lado, y al empezar el Pato dice «¡Hoy le ganas a <nombre>!». Si no hay conexión o marcador, vuelve a salir el personaje.
- Para agregar símbolos o colores edita `avatar.emojis` / `avatar.paleta` en `tienda.js` (hasta 63 símbolos y 64 colores) sin tocar las reglas.
- En el marcador el emblema se ve **grande** (52 px; 44 px en celulares muy angostos) y las filas son más altas para darle espacio (`EMB_BOARD` en `index.html`).
- **Quién ve tu emblema:** tú siempre ves el tuyo (se dibuja desde tu celular); los demás lo ven solo si está guardado en tu fila del marcador (`scores/<uid>/a`) y si ellos tienen la versión nueva del juego. Los jugadores que no han armado su emblema salen con su inicial en un círculo negro.
- **Ajustes → Mi emblema** dice en qué estado está: «✅ Todos lo ven en el marcador», «⏳ Guardando…», «⏳ Sin conexión» o «⚠️ faltan publicar las reglas nuevas». Si no se pudo subir, queda pendiente y **se reintenta solo cada vez que abres el juego**; también se sube si tu fila del marcador no tiene emblema (por ejemplo, el récord se hizo antes).
- **Hay que publicar las reglas nuevas** (`firebase-rules.json`): sin ellas el emblema se ve en tu celular pero no se guarda en la cuenta ni en el marcador.

### Marco dorado (para quien desbloquea el personaje de 100 millones)

Quien compra el **Tío Pato Dorado** ($100.000.000) puede llevar un **marco dorado animado** en su emblema, y **todos los demás lo ven en los marcadores** (los 4, el primer lugar del encabezado y tu propio emblema en el inicio y en Ajustes) para distinguirlo.

- **Cómo se ve:** un aro de oro con la forma de su emblema (círculo, estrella, escudo…), un brillo dorado que gira, un destello blanco que lo recorre y dos estrellitas que titilan. No cambia el tamaño: el emblema se achica un poco dentro del aro. En el «modo liviano» y con «reducir movimiento» queda quieto (sin animación).
- **Cómo se equipa:** Ajustes → **Mi emblema** → sección **Marco** (**Sin marco** / **👑 Marco dorado**) y **Guardar**. La vista previa lo muestra al tiro. Quien no tiene el personaje secreto **ni ve esa sección** (el personaje es secreto).
- **Al desbloquearlo** el marco queda **puesto solo** (se puede sacar cuando quiera) y la tarjeta del grupo VIP lo avisa. **Quien ya tenía el personaje antes** de esta actualización queda anotado y con el marco puesto **la próxima vez que abra el juego**.
- **¿Quiénes tienen el personaje secreto? (para el administrador):** Firebase → Realtime Database → nodo **`compradores`**: una fila por jugador (la clave es su `uid`) con `n` (nombre) y `t` (hora en que quedó anotado). Esa lista solo se ve en la consola (ni el juego ni nadie más la puede leer). Para saber quién es un `uid`, busca ese mismo `uid` en `scores/<uid>` (ahí está el nombre y el puntaje). **Ojo:** solo aparece quien ya abrió el juego con la versión nueva (es lo que anota a los antiguos); las compras de antes están en `wallets/<uid>/own/ch_millonario`, que solo ve la consola.
- **Lo público:** `marco/<uid> = true` es lo único que ven los demás (quién lleva el marco puesto). **Quien se saca el marco no aparece en ninguna lista pública** (su fila en `compradores` sigue cerrada).
- **Seguridad (reglas):** solo escribe quien de verdad tiene el personaje (`own/ch_<id>` en su cartera, que ya se valida con el precio), la hora de `compradores` la pone el servidor, una sola vez, y no se puede borrar ni cambiar; el marco solo se puede poner si el registro ya existe. Nadie puede ponerle el marco a otra cuenta.
- **Dónde se ajusta:** estilos `.embw.gold` (colores y velocidades) y la función `emblem()` en `index.html`; `goldSync` / `goldSet` (la conversación con Firebase) y `fetchMarcos` (los demás: se baja cada 5 minutos como máximo).
- **Pruebas:** `pruebas/dorado.test.js` (juego + reglas reales: anotarse al comprar, equipar/quitar, ver el marco de otros en el marcador y que quien se lo saca deja de verse, quien ya lo tenía antes, quien no lo tiene no puede ni intentarlo a mano, y el juego sin las reglas nuevas) y la sección «Marco dorado» de `pruebas/reglas.test.js`.
- **Hay que publicar las reglas nuevas** (nodos `compradores` y `marco`). Sin ellas el dueño ve su marco en su celular, pero los demás no.

## Potenciadores en la partida (burbujas)

Las burbujas flotan en la cancha, entre el Pato y tu barra, y se activan cuando **la pelota las toca** (así que conviene apuntar con la barra: el ángulo del rebote depende de dónde pega la pelota en ella). Son un **privilegio, no una costumbre**: salen en **rebotes fijos** (no por tiempo ni al azar; lo único al azar es *cuál* de los tres es) y de a una:

- **Los rebotes en que sale una burbuja:** **20 · 60 · 100 · 140 · 180 · 220 · 250 · 280 · 310 · 340 · 370 · 400 · 430 · 450 · 480** (15 como máximo en una partida; la lista es `PUP_POINTS` en `index.html`). Antes del rebote 20 y después del 480 no sale ninguna. Aparece apenas se da ese rebote y flota unos segundos hasta que la pelota la toca (o se va sola).
- **Nunca otra mientras flota una burbuja o hay un efecto activo, y tampoco al tiro cuando termina uno:** si un punto de la lista llega justo con una burbuja o un efecto en marcha, la burbuja sale cuando termina y después de **3 rebotes más** (con los puntos de la lista, que están a 30 rebotes o más entre sí, casi nunca pasa).
- La burbuja dura 8 s en pantalla (parpadea los últimos 2). Todas las partidas empiezan de cero.

Todos los efectos duran **10 s** y están pensados para que hagas más rebotes:

| Burbuja | Efecto | Animación | Probabilidad |
|---|---|---|---|
| 🫧 **Burbujas** | La pelota baja al **60%** de su rapidez | El campo se tiñe de agua y suben burbujas de jabón | 40% |
| ❄️ **Hielo cristal** | La pelota baja al **40%** (lenta, pero sin detenerse) | Destello blanco y el fondo se cubre de cristales de hielo y escarcha, con copos que caen; en el último segundo se derrite | 30% |
| 📏 **Barra grande** | La barra y su zona de golpe miden un **50% más** | Brillo verde y un aro que se expande desde la barra | 30% |

Los efectos activos se ven como cuadritos con la cuenta regresiva a la izquierda de la cancha (🫧 8 ✕ · ❄️ 9 ✕ · 📏 6 ✕). **Cada cuadrito es un botón: si lo tocas, ese efecto se apaga al tiro** (por ejemplo, si la barra grande te estorba o ya no quieres la pelota lenta). El toque no mueve la barra; apagar uno también cuenta como «terminó», así que no sale otra burbuja hasta dar 3 rebotes. Los efectos se limpian (burbujas, copos y hielo incluidos) al empezar y al terminar cada partida. Si dos efectos de lentitud coinciden, manda el más lento. En celulares que van justos el juego pasa solo al «modo liviano» y no dibuja copos ni burbujas.

- **No cambian lo que paga la partida ni los límites del servidor:** solo ayudan a seguir vivo. Las reglas de Firebase solo limitan cuántos rebotes caben en el tiempo de la partida (como mucho 1 cada 0,45 s); una pelota más lenta nunca pasa ese límite, y el antitrampas del juego (rebotes demasiado rápidos o reloj alterado) no se activa por los efectos. Una barra más grande tampoco acelera los rebotes.
- **Dónde se ajusta:** `PUPS` (duración `ms`, factor de rapidez `k` y probabilidad `w`), `PUP_POINTS` (los rebotes en que sale una burbuja; con `nextPupAt` el juego busca el siguiente), `PUP_BREATH` (los 3 rebotes de respiro tras un efecto) y `PUP_LIFE` (cuánto dura la burbuja en pantalla) en `index.html`.
- **Pruebas:** `humo.test.js` («Potenciadores»): no hay burbujas antes del rebote 20; la lista de rebotes es exactamente la pedida; se avanza el reloj del juego de 0 a 500 y salen burbujas en esos 15 rebotes y en ningún otro, y jugando de verdad salen justo en el 20, 60, 100 y 140; nunca salen dos a la vez ni con un efecto activo ni justo al terminar uno; una burbuja que la pelota no toca desaparece sola; cada efecto dura 10 s y hace lo que dice (rapidez ×0,6, ×0,4 sin detenerse, barra ×1,5); se ven sus animaciones; **tocar el cuadrito de cada efecto (con el dedo y con el mouse) lo apaga al tiro**; vuelve todo a la normalidad y no queda nada al terminar la partida. `CPU=3 node humo.test.js` la corre con el procesador frenado, como en la CI.

## El Pato que responde y los botones de redes

- **El Pato no sigue la pelota:** se queda quieto mientras la pelota se aleja (hacia ti) y **solo sale a recibirla cuando vuelve**: calcula dónde va a llegar (con los rebotes en las paredes) y se desplaza justo a tiempo para golpearla. Es solo el movimiento del personaje: la pelota le llega igual y él siempre la devuelve, así que la dificultad y los límites de las reglas no cambian. Una prueba (`humo.test.js`) mide que mientras la pelota se aleja el Pato no se mueve ni un píxel y que cuando vuelve se desplaza sin saltos.
- **Botones de redes sociales** (inicio, sobre «Ajustes»): círculos amarillos con su piquito y un patito encima, uno por red (📸 Instagram · 🎵 TikTok · ▶️ YouTube · 👍 Facebook · 💬 WhatsApp · ✖️ X). Los links se ponen en **`config.js` → `window.REDES`** (`instagram`, `tiktok`, `youtube`, `facebook`, `whatsapp`, `x`) con el enlace completo `https://…`; las redes que dejes vacías **no se muestran** y, si no hay ninguna, no aparece nada. Solo se aceptan enlaces `https://` (se descartan `javascript:`, `http:` y los que tengan espacios); abren en otra pestaña con `noopener noreferrer`. Para WhatsApp pon el link de tu comunidad o grupo (`https://chat.whatsapp.com/…`).

## Interfaz y accesibilidad

- **Ajustes** (⚙️ al pie del inicio): interruptores de **Sonido** y **Vibración** (SÍ/NO, se recuerdan en el dispositivo), **Cerrar sesión** y la versión del juego. Además, el botón 🔊/🔇 arriba a la derecha durante la partida silencia rápido.
- **Cobro de la racha animado:** las monedas del premio salen de la tarjeta del día, vuelan al «bolsillo» (con sonido y vibración suave) y cada una que llega suma al contador; sale un «+$500» grande. Con «reducir movimiento» el total se actualiza sin animación.
- **Logo de la app** (`icons/`): es la imagen de los Tíos Patitos sobre fondo amarillo (`herramientas/logo.jpg`); se regenera con `python3 herramientas/generar-iconos.py herramientas/logo.jpg` (íconos de 192 y 512, versión *maskable* para Android, ícono de iOS y favicons). Los celulares que ya instalaron la app pueden tardar en cambiar el ícono; para verlo de inmediato hay que desinstalar y volver a instalar.
- **Ayuda de la primera partida:** «👆 Arrastra el dedo para mover la barra» durante la cuenta regresiva en las 3 primeras partidas de cada dispositivo (desaparece al tocar).
- **Legibilidad:** el marcador de rebotes tiene contraste de más de 4,5:1 sobre el fondo amarillo; todos los botones, pestañas y enlaces miden al menos 44 px de alto; las pantallas entran con un desvanecido suave (se desactiva con «reducir movimiento»); la tienda se desvanece abajo para mostrar que se puede seguir bajando.
- **Teclado y lectores de pantalla:** anillo de foco visible, pestañas con `role="tab"` y `aria-selected`, botones con `aria-label` y avisos con `role="alert"`/`aria-live`.

## Fluidez (celulares lentos)

- Los fondos **Galaxia** y **Aurora boreal** usan texturas ya difuminadas en `fondos/*.webp` (en vez de `filter: blur` y máscaras que se recalculaban en cada cuadro). Para regenerarlas: `python3 herramientas/generar-fondos.py fondos` (necesita Pillow y numpy).
- Las llamas del diablo y los destellos de las barras se dibujan con sprites precalculados (`drawImage`), no con un degradado nuevo por partícula en cada cuadro.
- Las alas, cuernos y tridente del diablo se decodifican al empezar la partida, no justo cuando aparecen (rebote 55).
- **Lienzo de efectos a resolución 1×:** las llamas del diablo, la estela, las chispas y los brillos de la barra se dibujan en un lienzo del tamaño de la pantalla (no de los píxeles físicos). Medido en Chromium con la CPU frenada ×4 y pantalla ×3: del rebote 55 (cuando aparecen las llamas) en adelante bajaba de 60 a 33–45 cuadros por segundo con resolución 2× y se queda en 60 con 1× en todas las etapas (con 1,5× daba 52). Con la CPU ×6 y el fondo «Synthwave» (el más pesado) llega a ~47. Con cualquier fondo premium pasaba lo mismo, así que el costo estaba en este lienzo y no en los fondos. Además hay como máximo 60 llamas a la vez (antes 90; 30 en modo liviano).
- **El «¡Monedas dobles! ×2» del rebote 100 es una sola animación liviana:** antes soltaba a la vez un cartel con filtros de sombra grandes (texto recortado con degradado, 2,6 s con giro y rebote), 70 chispas, una animación extra en la insignia ×2 y una fanfarria de 5 notas, justo cuando el juego ya está en la fase del diablo. Ahora es solo el cartel (1,5 s, solo opacidad y posición, texto plano con sombra fija, en su propia capa, lanzado con la API de animaciones para no forzar a recalcular la página); la insignia ×2 queda quieta, sin chispas, con 2 notas y una vibración corta. Una prueba en `humo.test.js` lo comprueba (una sola animación, 1,5 s, sin filtros ni chispas). Nota honesta: en el emulador no logré reproducir un congelamiento (la diferencia quedaba dentro del ruido), así que la mejora se basa en quitar lo caro y duplicado, no en una medición del antes y después.
- **Sin fugas:** 12 partidas seguidas pasando el rebote 100 dejan igual la cantidad de elementos de la página (317), las animaciones (40) y la memoria (~2,6 MB).
- **Modo liviano automático:** si durante unos 5 segundos más del 30% de los cuadros salen lentos (menos de ~38 por segundo; antes el umbral era 28 y a 30 cuadros por segundo nunca saltaba), el juego congela los fondos animados y los brillos del personaje (`body.lite`) hasta que se recargue la página.
