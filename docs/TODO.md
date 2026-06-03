# TODO — My Shaolin

> Lista maestra de tareas pendientes, en progreso y futuras.
> Basada en revisión del código al 2026-06-03.

---

## 🟥 Alta Prioridad

### Bugs / Issues conocidos

- [ ] **Draw de arma no consume PA** — La doc dice 50 PA, pero en `engine.js:intentarDibujar()` se llama sin gastar PA
- [ ] **No hay penalización de exposed** — El evento `exposed` solo es informativo, debería aplicar `-20%` a defensa
- [ ] **ProcesarActor no reacciona** — El turno loop permite hasta 4 ataques si hay PA, pero si se queda sin PA en medio de un move, sigue (break condicional)

### Mecánicas faltantes (documentadas pero no implementadas)

- [ ] **Sistema de bloqueo real** — `procesarDefensa()` solo hace contraataque, no hay reducción de daño por bloqueo
- [ ] **Acciones compuestas** — COMBAT.md describe: patada de entrada, estocada, carga, rodar atrás, combo. No implementadas en engine.js
- [ ] **PA de reacción** — `paReaccion` se calcula pero nunca se usa; las defensas deberían consumir de este pool separado

---

## 🟧 Media Prioridad

### Balance

- [ ] **Ajustar PA costes** — Verificar que mover + atacar sea factible en un turno normal (120-180 PA)
- [ ] **Eficacia de arma por rango** — Los multiplicadores actuales hacen que armas pesadas sean malas en rango 0 (0.6) siendo que deberían tener opciones
- [ ] **IA más inteligente** — Prioridades básicas implementadas, pero falta: cambiar arma según rango, retirada táctica, combo, carga
- [ ] **Probabilidad de drop** — `probPerder = min(0.05, (daño/max_hp) * 0.05)` — contra daño bajo nunca se pierde arma (~0.0001% con 1HP de daño)
- [ ] **Tasa de swap 30%** — Puede ser muy alta, revisar si debería depender de velocidad

### Visual

- [ ] **Animación de shuriken/lanzamiento** — Proyectiles deberían tener su propia animación
- [ ] **Cámara lenta en críticos** — Efecto visual cuando ocurre un crítico
- [ ] **Partículas de impacto** — Chispas o destellos al golpear
- [ ] **Iconos de arma** — Reemplazar 🗡️ por imágenes reales de cada arma

### Frontend

- [ ] **Panel de equipamiento** — Página para administrar armas (equipar/guardar)
- [ ] **Botón eliminar shaolin** — No hay forma de borrar un personaje
- [ ] **Tooltips en stats** — Explicar qué hace cada stat al hacer hover
- [ ] **Skin selector en creación** — Actualmente solo acepta `skin` en body pero no hay UI para elegir

---

## 🟩 Baja Prioridad / Futuro

### Features

- [ ] **Sistema de mascotas** — Tabla y código removidos, se puede re-implementar si se desea
- [ ] **Torneos** — Modalidad torneo con bracket de 4/8 jugadores
- [ ] **Ranking** — Tabla de líderes por nivel/combates ganados
- [ ] **Tienda / Shop** — Comprar armas/habilidades con moneda del juego
- [ ] **Misiones diarias** — Objetivos con recompensa
- [ ] **Chat global** — Sistema de mensajes entre jugadores

### Técnico

- [ ] **Rate limiting** — Proteger endpoints de abuso
- [ ] **Logging estructurado** — Reemplazar console.log por logger
- [ ] **Tests** — Tests unitarios para engine.js y data.js
- [ ] **CI/CD** — GitHub Actions para test + deploy automático
- [ ] **Validación de datos** — Sanitizar inputs en todos los endpoints
- [ ] **Error monitoring** — Integrar Sentry o similar

### Contenido

- [ ] **Más armas** — Actualmente 12, se pueden agregar más (bastón, guandao, dardos, etc.)
- [ ] **Más habilidades** — Actualmente 14, agregar variedad
- [ ] **Más skins** — Actualmente 6, generar más imágenes con Leonardo AI
- [ ] **Más easter eggs** — Nombres secretos adicionales

---

## ✅ Completado (histórico reciente)

| Fecha | Tarea |
|-------|-------|
| 2026-06-03 | Sistema de armas unificado: resolverArma(), DB solo nombre+nivel |
| 2026-06-03 | Migración hp_formula_v2: +2 HP retroactivo por nivel |
| 2026-06-03 | Migración armas_drop_stats: eliminar tipo/dano de armas |
| 2026-06-03 | Level-up 2 pasos: elegir entre 2 recompensas + stats con rareza |
| 2026-06-03 | Easter egg Pablosko: stats max, nivel 99, todas armas/habilidades |
| 2026-06-03 | Easter egg Artego7: +4 XP (2×) |
| 2026-06-03 | Bots escalan por nivel con rewards simulados |
| 2026-06-03 | HP universal: +2/level aplicado automáticamente |
| 2026-06-03 | Vitalidad nerf: +3 HP por punto, migración retroactiva (vitalidad_nerf_v3) |
| 2026-06-03 | Combate: stats con Qi (real_fuerza/agilidad/velocidad/max_hp), sin doble skill |
| 2026-06-03 | Armas: grid mural con tooltip hover (daño Nv.1/2/3), sin badge equipada |
| 2026-06-03 | Vitalidad: sin barra segmentada (solo número como HP) |
| 2026-06-02 | Fase 2 completa: rangos 0-4, PA, movimiento, IA básica |
| 2026-06-02 | Armas persistentes: draw 33%, swap 30%, drop 1-5% |
| 2026-06-02 | Barras de stats: 10 segmentos coloreados 1→verde 10→rojo |
| 2026-06-01 | Precisión de golpe: 85% base + diferencia de agilidad |
| 2026-06-01 | Error handler global en /api (JSON siempre) |
