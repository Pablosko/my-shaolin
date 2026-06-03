# Changelog

## 2026-06-03 — Sistema de armas unificado, level-up 2 pasos, migraciones automáticas

### Armas: resolverArma()
- **DB guarda solo** `nombre`, `nivel`, `equipada` — eliminados `tipo`, `dano_min`, `dano_max`
- **`resolverArma()`** en `data.js`: resuelve stats completas desde plantilla + escala daño por nivel (`+1` por nivel)
- Todos los endpoints que cargan armas usan `resolverArma()`: GET /shaolins, combate, level-up
- Bot armas generadas con stats completas, no necesitan resolución

### Level-up 2 pasos
- **Paso 1**: Elegir entre 2 opciones aleatorias (40% arma, 30% habilidad, 30% stat)
- **Paso 2**: Elegir entre 2 mejoras de stat con rareza (bronce/plata/oro)
- `+2 HP` y `+2 max_hp` automáticos por nivel (universal)

### Migraciones automáticas (`db/migrate.js`)
- `hp_formula_v2`: suma `+2 * (level - 1)` a HP/max_hp de todos los shaolins existentes
- `armas_drop_stats`: migra armas viejas a nueva estructura (descarta tipo/dano, agrega nivel)
- Se ejecutan al arrancar el servidor, registradas en tabla `_migrations`

### Easter eggs
- **Pablosko**: subir nivel → stats 99/99/99/50, todas las armas, todas habilidades Nv3, nivel 99
- **Artego7**: victoria da +4 XP (2×)
- Mensaje especial en overlay después de level-up / combate

### Bots escalados
- `generarBot(nivel)` escalan stats con +2 HP/level
- Recompensas aleatorias por nivel: 40% stat, 30% arma, 30% habilidad
- Endpoint `GET /arena/bots?level={nivel}`
- Level cap 99 previene pending_level infinito

### Documentación
- `docs/MECHANICS.md` — documento maestro con todas las mecánicas
- `docs/TODO.md` — lista de tareas pendientes, en progreso y futuras
- `docs/CHANGELOG.md` actualizado

### Archivos modificados
- `game/data.js` — `resolverArma()`, `generarOpcionesRecompensa()`, `generarBot(nivel)` con rewards
- `game/engine.js` — movimiento hacia oponente, arma equipada persistente, draw/swap/drop
- `routes/shaolin.js` — `level-up-start` devuelve 2 opciones, `level-up-confirm` recibe `opcionElegida`, armas INSERT nuevo schema
- `routes/combate.js` — `resolverArma()` en armas, XP easter eggs, level param en bots
- `db/schema.sql` — armas solo nombre/nivel/equipada
- `db/migrate.js` — sistema de migraciones con dos migraciones automáticas
- `server.js` — llama a `runMigrations()` después de `initDb()`
- `public/js/shaolin.js` — level-up UI 2 pasos, overlay easter egg
- `public/js/combate.js` — easter egg display, XP texto corregido, level param bots
- `public/css/style.css` — `.stat-option-card` reutilizado, animaciones de combate
- `docs/MECHANICS.md` — NUEVO
- `docs/TODO.md` — NUEVO

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
