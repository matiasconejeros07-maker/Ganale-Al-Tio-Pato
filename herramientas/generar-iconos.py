#!/usr/bin/env python3
"""Genera los íconos de la app (carpeta icons/) a partir del logo (PNG con fondo transparente).

Uso (desde la carpeta del juego):  python3 herramientas/generar-iconos.py logo.png
Crea icon-192.png, icon-512.png, maskable-512.png (con margen de seguridad para Android), apple-touch-icon.png (iOS, sin transparencia)
y favicon-32.png / favicon-64.png (el logo entero, sin sombra, para que se reconozca en tamaño chico). Requiere Pillow y numpy.
Después sube VERSION en sw.js para que los celulares descarguen los íconos nuevos.
"""
import sys
import numpy as np
from PIL import Image, ImageDraw, ImageFilter

logo = Image.open(sys.argv[1]).convert('RGBA')
a = np.array(logo)[:, :, 3]
ys, xs = np.where(a > 8)
logo = logo.crop((xs.min(), ys.min(), xs.max() + 1, ys.max() + 1))


def fondo(S, redondo=False):
    """Amarillo del juego: centro claro y bordes más cálidos, con un brillo suave."""
    yy, xx = np.mgrid[0:S, 0:S].astype(float)
    d = np.sqrt((xx - S * .5) ** 2 + (yy - S * .46) ** 2) / (S * .72)
    d = np.clip(d, 0, 1)[..., None]
    c0, c1 = np.array([255, 244, 170]), np.array([255, 201, 40])
    rgb = (c0 * (1 - d) + c1 * d).astype(np.uint8)
    im = Image.fromarray(np.dstack([rgb, np.full((S, S), 255, np.uint8)]), 'RGBA')
    if redondo:                                           # esquinas redondeadas con bordes suaves (se dibuja 4 veces más grande y se reduce)
        k = 4; m = Image.new('L', (S * k, S * k), 0); ImageDraw.Draw(m).rounded_rectangle((0, 0, S * k - 1, S * k - 1), radius=int(S * k * .22), fill=255)
        im.putalpha(m.resize((S, S), Image.LANCZOS))
    return im


def componer(S, ancho, sombra=True, redondo=False, fuente=None, dy=0.0):
    src = fuente or logo
    h = round(src.height * ancho / src.width)
    fig = src.resize((round(ancho), h), Image.LANCZOS)
    base = fondo(S, redondo)
    x, y = (S - fig.width) // 2, round((S - fig.height) / 2 + dy * S)
    if sombra:
        sh = Image.new('RGBA', base.size, (0, 0, 0, 0))
        al = fig.split()[3].point(lambda v: int(v * .30))
        sh.paste(Image.new('RGBA', fig.size, (90, 55, 0, 255)), (x + round(S * .008), y + round(S * .022)), al)
        base.alpha_composite(sh.filter(ImageFilter.GaussianBlur(S * .012)))
    base.alpha_composite(fig, (x, y))
    return base


for nombre, S, ancho, kw in [
    ('icon-512', 512, 512 * .86, dict(redondo=True, dy=.01)),
    ('icon-192', 192, 192 * .86, dict(redondo=True, dy=.01)),
    ('maskable-512', 512, 512 * .62, dict()),              # a pantalla completa: Android la recorta en círculo, todo queda dentro de la zona segura
    ('favicon-64', 64, 64 * .96, dict(redondo=True, sombra=False)),
    ('favicon-32', 32, 32 * .98, dict(redondo=True, sombra=False)),
]:
    componer(S, ancho, **kw).save(f'icons/{nombre}.png', optimize=True); print(nombre, S)
ap = componer(180, 180 * .84, dy=.01).convert('RGB')        # iOS no admite transparencia y redondea solo las esquinas
ap.save('icons/apple-touch-icon.png', optimize=True); print('apple-touch-icon 180')
