// Lo que dicen los personajes mientras juegas. Cada fase tiene su propia lista y el juego va sacando frases al azar, sin repetir ninguna
// hasta que se acaban las de esa fase (en cada partida el orden es otro).
//
// Fases: amable (rebotes 1-29) · reto (30-54, te provocan) · enojo (55-69) · furia (70 en adelante; los personajes que se vuelven diablo usan `diablo`).
// `comun`: frases para TODOS los personajes; no hablan de sí mismos ni de su género o número, solo de ti y del juego.
// `personajes[id]`: frases propias de cada skin (se suman a las comunes). Los que no se transforman en diablo (conejos, Simi, Tíos Patitos) nunca hablan del infierno.
// hitos: frases que salen justo en ese rebote (si hay varias, se elige una al azar).
// Se puede escribir: %j = tu nombre · %h = tus rebotes · %b = el récord (solo sale si ya hay uno) · %n = el nombre del personaje · %D = EL DIABLO / LA DIABLA / LOS DIABLOS.
window.DIALOGOS = {
  comun: {
    amable: [
      '¡Qué bien lo haces, amigo!', '¡Muy bien, campeón!', '¡Tú puedes, amigo!', '¡Wow, qué buenos reflejos!', '¡Sigue así, crack!', '¡Eres genial!',
      '¡Qué divertido, cuac!', '¡Esa moneda va con ganas!', '¡Bien ahí, %j!', '¡Eso es, mueve esa barra!', '¡Qué buen rebote!', '¡Vas increíble!',
      'Ya van %h rebotes, ¡qué bacán!', '¡Nada mal para empezar!', '¡Te la estás ganando, %j!', '¡Cuac cuac! ¡Qué manos tienes!', '¡Esa barra obedece como un reloj!',
      '¡Uf, qué puntería!', '¡Dale, dale, que vas bien!', '¡Qué lindo es jugar contigo!', '¡Eso, así se hace, po!', '¡Ni se te cae la moneda, qué crack!',
      '¡Sigue, sigue, que esto recién parte!', '¡Estás en racha, %j!', '¡Cada rebote cuenta, amigo!', '¡Pura buena onda y puro rebote!', 'Mmm, juegas mejor de lo que pensaba…',
      '¡Tus pesos van sonando, cling cling!', '¡Casi parece que has practicado!', '¡Aplausos para %j!'
    ],
    reto: [
      '¿Seguro que puedes con esto?', 'Veamos cuánto aguantas…', '¿Eso es todo lo que tienes?', 'No te confíes tanto, amigo', 'Ahora sí empieza lo bueno', 'Se acabó lo amable…',
      'Ya van %h rebotes… ¿y ahora qué?', 'Tu barra tiembla, ¿la ves?', '¿Te sudan las manos, %j?', 'Esto recién se pone difícil', 'Mira cómo se achica tu barra…',
      '¿Y si juegas con los ojos cerrados? Seguro te va igual', 'Qué rápido va la moneda, ¿no?', 'Todavía no has visto nada', 'A ver si aguantas lo que viene',
      '¿Seguro que quieres seguir?', 'Apuesto a que no llegas a 100', 'El récord es %b rebotes. ¿Te alcanza?', 'Para el récord de %b falta bastante, ¿no?', 'Ahí viene otra… ¿la alcanzas?',
      'Se te están acabando las ideas', 'No parpadees, que se te va la moneda', 'Cada rebote te cuesta más, ¿lo notas?', 'Un descuido y se acabó, %j', 'Hasta aquí fue fácil, ¿cachái?',
      'Ese rebote fue de pura suerte, lo sé', '¿Dónde quedó tu sonrisa?', 'Te veo pensando demasiado…', 'Los buenos no se ponen nerviosos. ¿Y tú?', 'Falta mucho para ganar, %j',
      'Vamos a ver de qué estás hecho', '¡Ja! Eso fue apenas el calentamiento', 'Respira hondo… que esto se acelera', 'Tus dedos van más lento que la moneda',
      'Mira que ahora viene lo difícil', 'Los pesos hay que ganárselos, %j', 'Cuidado, que la barra no se cuida sola', '¡Ánimo! Lo vas a necesitar', '¿Y si la moneda se te escapa? Pásala mal, po'
    ],
    enojo: [
      '¡DEJA DE REBOTAR ESO!', '¡Basta de rebotes, %j!', '¡Esto ya no tiene gracia!', '¡Qué terquedad la tuya!', '¿Quién te enseñó a jugar así?', '¡Se acabó la paciencia!',
      '¡CUAC! ¡CUAC! ¡CUAC!', '¡No puede ser! ¡Otra vez!', '¡Ya van %h y no te caes!', '¡Suelta esa barra!', '¡Esta moneda no se rinde!', '¡Estás abusando de la suerte!',
      '¿Cuándo vas a fallar, %j?', '¡ESTO ES UN ABUSO!', '¡Haz una pausa, por favor!', '¡Ya te pasaste, %j!', '¡Cada rebote es una ofensa!', '¡Alguien que pare esta moneda!',
      '¡Esa barra está haciendo trampa!', '¡Qué rabia, qué rabia!', '¡Increíble! ¡Sigues rebotando!', '¡Esto es una falta de respeto!', '¡Dime que ya te cansaste!',
      'Sube la presión con cada rebote…', '¡Esto va a terminar mal, %j!', '¡Vas a lamentar cada rebote!', '¡Pierde de una vez!', '¡Ya no es gracioso!',
      '¡No hay quien se crea esta racha!', '¡Hasta aquí llegaste… o eso quisiera!'
    ],
    furia: [
      '¡NO PUEDE SEGUIR ASÍ!', '¡ESTO NO TIENE SENTIDO!', '¡CUAC! ¡CUAC! ¡CUAAAC!', '¡YA VAN %h REBOTES! ¡NO ES POSIBLE!', '¡TE ESTÁS PASANDO, %j!', '¡PARA, PARA, PARA!',
      '¡NO TE VAS A SALIR CON LA TUYA!', '¡CADA REBOTE DUELE!', '¡FALLA DE UNA VEZ!', '¡NO SE PUEDE CREER!', '¡AAARGH! ¡OTRO REBOTE MÁS!', '¡DEJA ESA BARRA QUIETA!',
      '¡Vas a quemar la barra de tanto rebotar!', '¡ESTO ES UNA LOCURA!', '¡QUE SE CAIGA YA ESA MONEDA!', '¡HASTA CUÁNDO, %j, HASTA CUÁNDO!', '¡ES IMPOSIBLE! ¡IMPOSIBLE!',
      '¡CÓMO PUEDES SEGUIR AHÍ!', '¡CADA PUNTO ES UNA INJUSTICIA!', '¡DEJA ALGO PARA LOS DEMÁS!', '¡QUÉ RACHA MÁS INSOPORTABLE!', '¡ESTO TIENE QUE PARAR YA!',
      '¡SE ACABÓ EL JUEGO… PARA TI, OJALÁ!', '¡VAS POR %h Y NO TE CANSAS!', '¡TU BARRA ES DEMASIADO BUENA!', '¡NO HAY QUIEN TE PARE, %j!'
    ],
    hitos: {
      1: ['¡Muy bien, amigo!', '¡Empezamos! ¡A rebotar, %j!', '¡Buen primer rebote!', '¡Ahí va la primera!'],
      100: ['¡Monedas dobles! Pero ahora va en serio… 😏', '¡100! Todo vale el doble… ¿aguantas? 😏', '¡Cien rebotes! Esto recién se pone interesante 😏'],
      200: ['¡Monedas triples! ¿Hasta dónde llegas? 😈', '¡200! Triple de pesos y triple de problemas 😈', '¡Doscientos! ¿Seguro que eres humano, %j? 😈'],
      300: ['¡Monedas cuádruples! ¡Esto ya es una locura! 🤯', '¡300! ¡Nadie había llegado tan lejos, %j! 🤯'],
      400: ['¡Monedas quíntuples! ¡Eres una leyenda! 🏆', '¡400! ¡Ya casi tocas el cielo, %j! 🏆'],
      500: ['¡500! ¡Llegaste al tope, %j! 👑', '¡Ya no hay más que ganar! ¡Eres el rey! 👑']
    }
  },

  personajes: {
    tio: {
      amable: [
        '¡Cuac! ¡Qué buen amigo eres!', 'Soy el pato más feliz del mundo', 'Mis alas aplauden por ti', 'Con esta aureola me siento dichoso', '¡Cuac cuac! ¡Juguemos toda la tarde!',
        'Dicen que soy buen perdedor… ¡mira cómo aprendo!', '¡Qué rico es rebotar monedas, cuac!', 'Mis plumitas se erizan de alegría', 'Hoy me levanté con ganas de jugar contigo',
        '¡Soy un angelito, pero con mucha puntería!'
      ],
      reto: [
        'Los patos también tenemos orgullo, ¿sabes?', 'Mi aureola brilla menos cuando me desafían', 'Ahora sí me pongo serio, cuac', 'Mis alas ya no aplauden tanto…',
        'No subestimes a un pato, amigo', 'Me estoy calentando, ¿ves mis plumas?', '¡Ojo! Este pato no se deja ganar', 'Dicen que de ángel a demonio hay un solo paso… ¿quieres verlo?',
        'Mi aureola se está torciendo… mala señal', 'Todavía soy bueno, pero me estás tentando'
      ],
      enojo: [
        'Se me acabó la paciencia, cuac', '¡Mi aureola se derritió, %j!', '¡Siento que me salen cuernos!', '¡Ya me estás sacando de quicio!', '¡Nadie me gana, nadie!',
        '¡Te voy a destrozar la barra!', '¡Estoy perdiendo la paciencia!', '¡Me sale humo del pico!', '¡Mis plumas se ponen rojas de rabia!', 'Ya no soy tan amable, ¿cachái?'
      ],
      diablo: [
        '¡MUAJAJAJA! ¡Eres mío!', '¡Arde, mortal!', '¡Bienvenido al infierno, cuac!', '¡NO ESCAPARÁS!', '¡Soy %n del infierno!', '¡Quémate!', '¡Mi tridente tiene hambre de monedas!',
        '¡Aquí abajo hace calorcito, ¿no?!', '¡El infierno es mío y tú eres mi invitado!', '¡Sufre, sufre, mortal!', '¡Mis llamas no se apagan con rebotes!', '¡Hasta el diablo se asombra de ti, cuac!'
      ],
      hitos: {
        30: ['Mmm… ya me cansé de ser amable', 'Se terminó la amabilidad, amigo', 'Hasta aquí llegó mi lado bueno'],
        55: ['¡Se me acabó la paciencia! ¡AAARGH! 😡', '¡YA BASTA! ¡AAARGH! 😡', '¡Mi aureola se rompió! ¡CUAAAC! 😡'],
        60: ['¡AHORA SOY %D! 😈', '¡ME CONVIERTO EN %D! 😈', '¡MIREN, SOY %D! 😈']
      }
    },

    tia: {
      amable: [
        '¡Cuac! ¡Qué lindo es jugar contigo, cariño!', 'Mi aureola brilla por ti', 'Soy un angelito con mucho estilo', '¡Qué educado rebotas, %j!', 'Hoy me puse mis mejores plumas',
        '¡Ay, qué emoción, cuac cuac!', '¡Me encanta cómo juegas, cielo!', 'Con ese rebote me derrites el corazoncito', 'Un angelito feliz es un pato feliz', 'Qué bonito baila tu barra'
      ],
      reto: [
        'Ay, no me subestimes, cariño', 'Hasta los angelitos tenemos carácter', 'Mi aureola se inclina… ¡cuidado!', 'Ya se me acaba la dulzura, ¿lo notas?', '¡Ojito! Esta patita no se deja',
        'No me hagas perder la compostura, %j', 'Qué atrevimiento… ¡me gusta!', 'Mis alitas empiezan a temblar de rabia', 'Me estás sacando la ternura a empujones', 'Mmm, ¿con esa puntería quieres ganarme?'
      ],
      enojo: [
        '¡Se me acabó la dulzura, %j!', '¡Ya me tienes harta!', '¡Mis alas se ponen negras de rabia!', '¡Ay, qué rabia, qué rabia, cuac!', '¡Nadie me gana, nadie!',
        '¡Te voy a destrozar la barra, cariño!', '¡Me sacas de quicio!', '¡Se me torció la aureola de la furia!', '¡Esto ya no es amable, cielo!'
      ],
      diablo: [
        '¡MUAJAJAJA! ¡Eres mío, cariño!', '¡Arde, mortal!', '¡Bienvenido al infierno, cuac!', '¡NO ESCAPARÁS!', '¡Soy %n del infierno!', '¡Quémate, cielo!',
        '¡Mi tridente ya te tiene el ojo puesto!', '¡Hasta el infierno se pone elegante conmigo!', '¡Qué calorcito, ¿no?!', '¡SOY LA DIABLA MÁS ELEGANTE!'
      ],
      hitos: {
        30: ['Mmm… ya me cansé de ser dulce', 'Se acabó la ternura, cariño', 'Hasta aquí llegó mi lado bueno, cielo'],
        55: ['¡Se me acabó la paciencia! ¡AAARGH! 😡', '¡YA ME TIENES HARTA! ¡CUAAAC! 😡', '¡Mi aureola se rompió! ¡CUAAAC! 😡'],
        60: ['¡AHORA SOY %D! 😈', '¡ME CONVIERTO EN %D! 😈', '¡MIREN, SOY %D! 😈']
      }
    },

    conejo: {
      amable: [
        '¡Estoy más contento que conejo en la huerta!', '¡Qué zanahoria de partida!', '¡Saltas casi tan bien como yo!', '¡Mis orejas aplauden por ti!', '¡Cuac y orejas, qué combo!',
        'Ni el conejo más veloz rebotaría así', 'Esto me da hambre de zanahorias', '¡Brinco de alegría, cuac!', '¡Mi colita de conejo se mueve sola!', '¡Soy mitad pato, mitad conejo y todo diversión!'
      ],
      reto: [
        'Los conejos también sabemos correr, ¿sabes?', 'Mis orejas ya captaron tu estrategia…', '¿Crees que un pato con orejas se cansa?', 'Mi paciencia da saltitos… y se acaba',
        'Veamos si me alcanzas', 'Estas orejas oyen todo, ¡hasta tus dudas!', 'No me confundas: soy pato, pero salto', 'Mmm, me están picando las ganas de ganar',
        'Hasta las zanahorias tienen límite', 'Mi colita peluda dice que no confíes'
      ],
      enojo: [
        '¡Me pusiste las orejas de punta, %j!', '¡Tengo las orejas paradas de la rabia!', '¡Estoy más rojo que una zanahoria!', '¡Salto de rabia, cuac!', '¡Mi paciencia se fue saltando!',
        '¡Ya basta, que se me enredan las orejas!', '¡No me hagas zapatear como conejo!', '¡Se me está acabando la zanahoria… digo, la paciencia!'
      ],
      furia: [
        '¡Estoy que echo humo por las orejas!', '¡Ni una zanahoria me calma ahora!', '¡Voy a dar un salto de furia, cuac!', '¡Mis orejas están al rojo vivo!', '¡CUAC! ¡Esto me tiene a mil por hora!',
        '¡Se me erizó hasta la colita!', '¡Soy un conejo MUY enojado!', '¡Me están hirviendo las orejas!'
      ],
      hitos: {
        30: ['Mmm… se me acabaron las zanahorias amables', 'Ya me cansé de ser simpático', 'Mis orejas dicen que esto se puso serio'],
        55: ['¡Se me acabó la paciencia! ¡Me enojé de verdad! 😡', '¡Orejas arriba, estoy ENOJADO! 😡', '¡CUAAAC! ¡Ya no más! 😡'],
        60: ['¡Ahora sí estoy furioso, cuac! 😡', '¡Me están saliendo chispas por las orejas! 😡', '¡Estoy que salto de la rabia! 😡']
      }
    },

    conejita: {
      amable: [
        '¡Qué zanahoria de partida, cielo!', '¡Mis orejitas aplauden por ti!', '¡Saltas casi tan bien como yo!', '¡Qué lindo rebote, cuac!', 'Brinco de la emoción', 'Mi colita de conejita no para de moverse',
        '¡Eres un amor jugando!', '¡Estoy más feliz que una conejita en primavera!', '¡Cuac, cuac! ¡Cuánta ternura!', '¡Qué bonita partida!'
      ],
      reto: [
        'Las conejitas también tenemos carácter', 'Mis orejas ya te escucharon pensar', 'No me subestimes por ser tierna', 'Veamos si me alcanzas, cielo', 'Mi ternura tiene un límite, ¿sabes?',
        'Cuidado: una conejita enojada salta muy lejos', 'Se me están parando las orejitas…', 'Mmm, ya no me hace tanta gracia', 'Hasta las zanahorias se acaban', 'Te estás ganando un buen salto… de rabia'
      ],
      enojo: [
        '¡Se me pararon las orejas de la rabia!', '¡Ya me tienes harta, %j!', '¡Estoy más roja que una zanahoria!', '¡Salto de rabia, cuac!', '¡Se me acabó la ternura!', '¡Mi colita está erizada de rabia!',
        '¡No me hagas patalear!', '¡Ay, qué enojo, qué enojo!'
      ],
      furia: [
        '¡Estoy que echo humo por las orejas!', '¡Ni una zanahoria me calma ahora!', '¡Voy a dar un salto de furia, cuac!', '¡Mis orejas están al rojo vivo!', '¡Se me erizó hasta la colita!',
        '¡Soy una conejita MUY enojada!', '¡CUAC! ¡Esto me tiene a mil!', '¡Me hierven las orejitas!'
      ],
      hitos: {
        30: ['Mmm… se me acabó la ternura', 'Ya me cansé de ser dulce, cielo', 'Mis orejitas dicen que esto se puso serio'],
        55: ['¡Se me acabó la paciencia! ¡Me enojé de verdad! 😡', '¡Orejitas arriba, estoy ENOJADA! 😡', '¡CUAAAC! ¡Ya no más! 😡'],
        60: ['¡Ahora sí estoy furiosa, cuac! 😡', '¡Me están saliendo chispas por las orejas! 😡', '¡Estoy que salto de la rabia! 😡']
      }
    },

    bigotes: {
      amable: [
        '¡Excelente jugada, mi estimado!', '¡Qué elegancia, amigo!', 'Mi bigote tiembla de emoción', '¡Un aplauso con guante blanco!', 'Esto es lo que yo llamo clase', '¡Bravo, bravísimo, cuac!',
        'Permítame felicitarle por ese rebote', '¡Qué distinción al rebotar!', 'Mi sombrero de copa se levanta por usted', '¡Tomemos el té después de esta partida!'
      ],
      reto: [
        'Un caballero nunca se rinde, ¿y usted?', 'Veamos si tiene clase para esto', 'Mi bigote presiente problemas…', 'No confunda mi elegancia con debilidad', 'Esto ya no es un paseo en bata',
        'Ajusto mi sombrero: ahora va en serio', 'Un pato de mi categoría no pierde, estimado', 'Mi bata de seda no se arruga ante cualquiera', 'Cuidado con subestimar un bigote como este',
        'Mmm, ¿seguro que sabe a lo que se enfrenta?'
      ],
      enojo: [
        '¡Mi bigote se está erizando, %j!', '¡Esto es una falta de respeto!', '¡Se me cayó la compostura!', '¡Por mi sombrero de copa, esto es intolerable!', '¡Mi bata de seda no merece este trato!',
        '¡Qué descaro el suyo!', '¡He perdido los estribos, cuac!', '¡Ya no queda té que me calme!'
      ],
      furia: [
        '¡MI BIGOTE ESTÁ AL ROJO VIVO!', '¡Esto es INACEPTABLE!', '¡Por todos los sombreros de copa del mundo!', '¡Se me salió el sombrero de tanto rabiar!', '¡CUAC! ¡NO SE PUEDE, NO SE PUEDE!',
        '¡He perdido hasta los modales!', '¡Mi bigote parece un cepillo de la rabia!', '¡ESTO ES UN ESCÁNDALO!'
      ],
      hitos: {
        30: ['Mmm… se acabaron los buenos modales', 'La cortesía tiene un límite, estimado', 'Dejemos a un lado la etiqueta'],
        55: ['¡Se me acabó la paciencia! ¡AAARGH! 😡', '¡Esto es una ofensa a mi bigote! 😡', '¡CUAAAC! ¡He perdido la compostura! 😡'],
        60: ['¡Ahora sí estoy FURIOSO, estimado! 😡', '¡Mi sombrero salió volando de la rabia! 😡', '¡Esto ya es un escándalo! 😡']
      }
    },

    tios: {
      amable: [
        '¡Nos encanta jugar contigo!', '¡Qué divertido, cuac cuac!', '¡Los dos aplaudimos por ti!', '¡Somos los patitos más felices!', 'Juntos somos invencibles… ¡bueno, casi!', '¡Cuac y recuac, qué partidón!',
        'Uno devuelve y el otro celebra', '¡Qué lindo es jugar en pareja!', 'Mi cielo, ¿viste ese rebote?', 'Mira, mi vida, ¡cómo rebota la moneda!'
      ],
      reto: [
        '¿Crees que puedes con los dos?', 'Dos patos pueden más que uno, ¿cachái?', 'Nos estamos poniendo serios, amigo', 'Mi amor, ¿ya jugamos en serio? ¡Sí, mi vida!', 'Doble defensa, doble problema para ti',
        'No nos subestimes: somos dos', 'Se nos acaba la paciencia, a los dos', 'Nos estamos poniendo nerviosos… y eso es peligroso', 'Mmm, ya no nos hace tanta gracia', 'Juntos te vamos a ganar'
      ],
      enojo: [
        '¡Se nos acabó la paciencia a los dos!', '¡Nos tienes hartos, %j!', '¡Estamos enojados! ¡Los dos!', '¡Ya no nos hace gracia!', '¡Nos sacas de quicio, cuac cuac!', '¡Basta, que nos tienes en pie de guerra!',
        '¡Hasta mi pareja está roja de rabia!', '¡No nos hagas pelear… entre nosotros!', '¡Nadie nos gana, nadie!'
      ],
      furia: [
        '¡LOS DOS ESTAMOS FURIOSOS!', '¡CUAC CUAC! ¡CUAC CUAC!', '¡Hasta nos peleamos entre nosotros de la rabia!', '¡ESTO ES UNA LOCURA, CUAC!', '¡Nos hierve la sangre a los dos!',
        '¡DEJA DE REBOTAR, POR FAVOR! ¡LOS DOS TE LO PEDIMOS!', '¡Estamos al rojo vivo!', '¡NO NOS HAGAS ENOJAR MÁS!'
      ],
      hitos: {
        30: ['Mmm… ya nos cansamos de ser amables', 'Se nos acabó la amabilidad, a los dos', 'Mi amor, ¿les ponemos un límite? ¡Sí!'],
        55: ['¡Se nos acabó la paciencia! ¡AAARGH! 😡', '¡LOS DOS ESTAMOS ENOJADOS! 😡', '¡CUAAAC! ¡Ya no más! 😡'],
        60: ['¡Ahora sí estamos furiosos! 😡', '¡Nos salen chispas a los dos! 😡', '¡Esto ya es una pelea de patos! 😡']
      }
    },

    millonario: {
      amable: [
        'Con tus rebotes me haces más rico', '¡Cada moneda suena a música!', 'Soy tan millonario que hasta mis plumas son de oro', '¡Qué buena inversión eres, %j!', 'Mi fortuna crece con cada rebote',
        'Hasta mi chofer aplaude', 'El oro brilla, pero tu juego brilla más', '¡Cuac de oro, cuac de lujo!', 'Esto sí es vida de millonario', 'Después de esto, caviar para todos'
      ],
      reto: [
        'Un millonario no se deja ganar, ¿sabes?', 'Tengo oro para aburrir… ¿y tú?', 'Mis monedas valen más que tu puntería', '¿Crees que puedes con una fortuna como la mía?', 'Para ganarme hay que ser millonario… ¿lo eres?',
        'Ya me aburrí de regalarte puntos', 'Mi banco no pierde, amigo', 'Estoy contando mis monedas… y tú vas perdiendo las tuyas', 'Mil pesos más y te rindes, ¿cierto?', 'Mi caja fuerte está más segura que tu barra'
      ],
      enojo: [
        '¡Esto me está costando una fortuna!', '¡Mi oro se está enfriando de la rabia!', '¡Llamen a mi contador, esto es un robo!', '¡Estás gastando mi paciencia, que vale millones!', '¡Ya no soy tan generoso, cuac!',
        '¡Mi paciencia se agrietó como un lingote!', '¡Pierdo millones por tu culpa!', '¡Eso fue un robo a mano alzada!'
      ],
      diablo: [
        '¡MUAJAJAJA! ¡Tu alma tiene precio!', '¡Arde, mortal… pero yo pago!', '¡El infierno también se compra, cuac!', '¡NO ESCAPARÁS DE MI FORTUNA!', '¡Soy %n del infierno… y rico!',
        '¡Mis llamas son de oro puro!', '¡Todo el infierno es mío, hasta el último peso!', '¡Quémate… en billetes!', '¡Hasta el diablo me debe plata!', '¡Mi tridente es de oro macizo!'
      ],
      hitos: {
        30: ['Mmm… se me acabó la generosidad', 'Ya no regalo más puntos, amigo', 'Hasta aquí llegó el millonario bueno'],
        55: ['¡Se me acabó la paciencia! ¡AAARGH! 😡', '¡ESTO ME ESTÁ COSTANDO UNA FORTUNA! 😡', '¡Mi corona se torció de la rabia! 😡'],
        60: ['¡AHORA SOY %D! 😈', '¡ME CONVIERTO EN %D… Y RICO! 😈', '¡MIREN, SOY %D DE ORO! 😈']
      }
    }
  }
};
