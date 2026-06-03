# Changelog

## 2026-06-03 — Nuevo sistema de armas persistente

### Armas en combate
- **Draw por turno**: al inicio del turno, si no tiene arma equipada, 30-90% de probabilidad (según velocidad) de sacar un arma.
- **Estado persistente**: una vez sacada, el arma se usa en **todos** los ataques hasta que se pierde.
- **Log de "sacó"**: cuando se dibuja el arma, aparece `🗡️ X sacó Y`.
- **Pérdida de arma**: al recibir daño, ~1-5% de probabilidad de soltar el arma. `💔 X perdió su Y`.
- **Daño base de puño**: `5-7 + fuerza` (antes solo `fuerza`).
- **Daño de arma aumentado**: todas las armas tienen daño base más alto (ej: Cuchillo 6-10, Espadón 9-15, Martillo 10-17).

### Archivos modificados
- `game/engine.js` — persistencia de `arma_equipada`, draw/drop en `simularCombate()`, fist base 5-7
- `game/data.js` — nuevos valores de daño en `armas[]`
- `public/js/combate.js` — render de eventos `type: 'draw'` y `type: 'drop'`

## 2026-06-03 — Mejoras de combate, UI y estabilidad

### Combate — Armas en UI
- Las armas del inventario se muestran como badges (`🗡️ Espadón`) en la esquina superior derecha del cuadrado del luchador (`.weapon-reserve`).
- Cuando un atacante usa arma en un turno, aparece `⚔️ [NombreArma]` bajo el nombre del luchador (`.weapon-equipada`) con animación fadeIn.
- El mensaje de daño ahora indica el arma: `X golpeó a Y -5HP con Espadón` o `X golpeó a Y -5HP con puños`.
- Probabilidad de usar arma por ataque: `min(0.85, 0.25 + agilidad * 0.02)`.
- Se eliminó el log duplicado de "sacó [Arma]".

### Combate — Precisión de golpe (Dodge nerf)
- Fórmula de probabilidad de acierto: `clamp(0.20, 0.98, 0.85 + (atacante.agilidad - defensor.agilidad) * 0.02)`.
- Antes: ~52% base de acierto. Ahora: 85% base, dodge basado en diferencia de agilidad.
- Esquiva pura (10% base) se mantiene como capa separada.

### UI — Barras de stats
- Las barras de stat (fuerza, agilidad, velocidad) usan **10 segmentos fijos**, coloreados por posición: 1→verde, 10→rojo.
- Se llenan `Math.min(valor, 10)` segmentos. Valores >10 desbordan pero solo colorean 10.
- HP: **sin barra**. Solo muestra ❤️ + número.

### Backend — Error handler
- `server.js` añade middleware global en `/api` que captura errores y devuelve `{ error: "Error interno del servidor" }` como JSON (antes devolvía HTML en algunos casos).
- `routes/shaolin.js`: el handler de creación verifica que `shaolin` existe antes de asignar `.item`.

### Base de datos — Migración
- `db/database.js`: migración copia datos de tabla `brutos` a `shaolins` via INSERT SELECT, luego dropea `brutos`.
- Detecta columnas viejas (`bruto_id` en `armas`, `habilidades`, `combates`) y dropea esas tablas para que `schema.sql` las recree con `shaolin_id`.
- `schema.sql` usa `CREATE TABLE IF NOT EXISTS` — no modifica tablas existentes, por eso era necesaria la detección.
