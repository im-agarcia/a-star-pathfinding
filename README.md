# A* — Cerrados / Abiertos

Visualizador web del algoritmo **A\*** (estilo pizarra) con listas **Cerrados** y **Abiertos**.

## Uso local

Abrí `index.html` en el navegador, o serví la carpeta:

```bash
npx --yes serve .
```

## Cómo usarlo

1. Elegí columnas y filas y tocá **Crear grilla**.
2. Con los modos, hacé clic en celdas: **Bloquear**, **Punto A** o **Punto B**.
3. Tocá **Calcular A\*** (o **Paso a paso**).
4. Cuando hay solución, el camino óptimo se marca con un **borde amarillo intenso** (sin pintar el fondo), para que sigan legibles los números de cada celda.

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
