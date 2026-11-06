"""Cambia el fondo amarillo del logo por el azul del juego (degradado marino con un brillo al centro).
Uso: python3 logo_azul.py logo-amarillo.jpg logo.jpg
El fondo es plano: se busca por relleno desde los bordes (sin cruzar el contorno negro de los dibujos) y los bordes suaves se mezclan con el azul."""
import sys
from collections import deque
import numpy as np
from PIL import Image

src = Image.open(sys.argv[1]).convert('RGB')
a = np.array(src).astype(np.int32)
H, W, _ = a.shape
fondo = np.median(a[:20, :20].reshape(-1, 3), axis=0)                   # color del fondo (esquina)
dist = np.sqrt(((a - fondo) ** 2).sum(2))
cerca = dist < 38                                                         # parecido al fondo (el plumaje crema queda fuera: es más claro y más blanco)

# relleno desde todo el borde de la imagen, sin pasar por el contorno
vis = np.zeros((H, W), bool)
q = deque()
for x in range(W):
    for y in (0, H - 1):
        if cerca[y, x] and not vis[y, x]: vis[y, x] = True; q.append((y, x))
for y in range(H):
    for x in (0, W - 1):
        if cerca[y, x] and not vis[y, x]: vis[y, x] = True; q.append((y, x))
while q:
    y, x = q.popleft()
    for dy, dx in ((1, 0), (-1, 0), (0, 1), (0, -1)):
        ny, nx = y + dy, x + dx
        if 0 <= ny < H and 0 <= nx < W and cerca[ny, nx] and not vis[ny, nx]:
            vis[ny, nx] = True; q.append((ny, nx))

# huecos cerrados de fondo (entre brazos y patas): zonas grandes parecidas al fondo que el relleno no alcanzó
lab = np.zeros((H, W), np.int32); n = 0
resto = cerca & ~vis
for y0 in range(H):
    for x0 in np.nonzero(resto[y0] & (lab[y0] == 0))[0]:
        if lab[y0, x0]: continue
        n += 1; lab[y0, x0] = n; cola = [(y0, x0)]; pts = []
        while cola:
            y, x = cola.pop(); pts.append((y, x))
            for dy, dx in ((1, 0), (-1, 0), (0, 1), (0, -1)):
                ny, nx = y + dy, x + dx
                if 0 <= ny < H and 0 <= nx < W and resto[ny, nx] and not lab[ny, nx]:
                    lab[ny, nx] = n; cola.append((ny, nx))
        if len(pts) > 1500:
            for y, x in pts: vis[y, x] = True

# borde suave: alrededor del fondo, el píxel es una mezcla de fondo y contorno oscuro → alfa del dibujo según qué tan lejos está del fondo
d = vis.copy()
for _ in range(3):                                                        # zona de borde de 3 px alrededor del fondo
    e = d.copy(); e[1:] |= d[:-1]; e[:-1] |= d[1:]; e[:, 1:] |= d[:, :-1]; e[:, :-1] |= d[:, 1:]; d = e
borde = d & ~vis
contorno = np.array([18, 18, 22], float)
dc = np.sqrt(((contorno - fondo) ** 2).sum())
alfa = np.clip(dist / dc * 1.15, 0, 1)                                           # 0 = fondo puro · 1 = contorno puro

# fondo azul: marino con un brillo al centro (el del juego)
yy, xx = np.mgrid[0:H, 0:W].astype(float)
r = np.clip(np.sqrt((xx - W * .5) ** 2 + (yy - H * .46) ** 2) / (W * .72), 0, 1)[..., None]
c0, c1, c2 = np.array([12, 98, 128.]), np.array([0, 58, 92.]), np.array([0, 29, 53.])
azul = np.where(r < .5, c0 + (c1 - c0) * (r / .5), c1 + (c2 - c1) * ((r - .5) / .5))

out = a.astype(float)
out[vis] = azul[vis]
ba = alfa[borde][:, None]
out[borde] = ba * np.where(dist[borde][:, None] > 0, a[borde].astype(float) * 0 + contorno, contorno) + (1 - ba) * azul[borde]
Image.fromarray(np.clip(out, 0, 255).astype(np.uint8)).save(sys.argv[2], quality=95)
print('listo', sys.argv[2], 'fondo reemplazado:', int(vis.sum()), 'px · borde:', int(borde.sum()))
