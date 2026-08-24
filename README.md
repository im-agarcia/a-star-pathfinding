# A* — Cerrados / Abiertos

Visualizador web del algoritmo **A\*** (estilo pizarra) con listas **Cerrados** y **Abiertos**.

## Uso local

Abrí `index.html` en el navegador, o serví la carpeta:

```bash
npx --yes serve .
```

## Cloudflare Pages

1. Subí esta carpeta a un repo de GitHub (o usá Direct Upload).
2. En [Cloudflare Dashboard → Pages](https://dash.cloudflare.com/) → **Create project**.
3. Framework preset: **None**.
4. Build command: *(vacío)*.
5. Output directory: `/` (o la carpeta donde estén estos archivos).
6. Deploy.

Con Direct Upload:

```bash
npx wrangler pages deploy . --project-name=astar-cerrados-abiertos
```

## Controles

| Acción | Descripción |
|--------|-------------|
| Columnas / Filas | Tamaño de la grilla (2–20) |
| Bloquear | Clic en celdas para obstáculos (rayado rojo) |
| Punto A / B | Ubicar inicio y destino |
| Calcular A* | Ejecuta hasta el final |
| Paso a paso | Expande un nodo cerrado por clic |
| Limpiar cálculo | Quita números/flechas, conserva la grilla |

## Valores en cada celda

1. **Sup. derecha (rojo):** número de bloque (orden de descubrimiento)
2. **Inf. derecha (rojo):** `h` = Manhattan × 10 hasta B
3. **Inf. izquierda (rojo):** `g` = costo desde A (10 ortogonal, 15 diagonal)
4. **Sup. izquierda (verde):** `f = g + h`
5. **Centro:** flecha hacia el padre (origen del `g`)

La grilla 4×4 inicial replica el ejemplo del pizarrón (A en (1,2), B en (3,4), dos bloqueos).
