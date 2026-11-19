# Fuentes del Perfume Bar

Las apps publicadas son archivos únicos generados desde acá:

- `app-celular.html` → `perfume-bar/index.html` (la del QR)
- `app-tablet.html` → `perfume-bar/tablet/` (index, sw.js, manifest, ícono)

El motor químico, los datos del evento y el dibujo de la imagen final están en `app-celular.html`
(entre las marcas `@@COMUN1`/`@@FIN1` y `@@COMUN2`/`@@FIN2`) y la tablet los toma de ahí, así las dos calculan igual.

Para regenerar (desde esta carpeta):

    python3 build_celular.py ../index.html
    python3 build_tablet.py ../tablet

`imgs/` tiene las fotos; `fra_full.json` la base de perfumes (con los agregados de `fra_extra.json`).
