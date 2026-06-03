# Mascotas

## Lista actual (5 mascotas)

| Mascota | Tipo | HP | Ataque |
|---------|------|----|--------|
| Perro | perro | 15 | 5 |
| Lobo | lobo | 30 | 10 |
| Oso | oso | 50 | 8 |
| Pantera | felino | 35 | 12 |
| Águila | ave | 20 | 7 |

## Comportamiento en combate

- La mascota ataca automáticamente durante el turno de su dueño.
- **Probabilidad de activación**: 40% por turno.
- Si se activa, inflige `mascota.ataque * (0.5 + random * 0.5)` de daño.
- Tanto el atacante como el defensor pueden tener mascota activa.
- El daño de mascota se calcula y aplica después del ataque principal.

```js
// Lógica actual en engine.js
dañoMascota = Math.max(1, Math.floor(mascota.ataque * (0.5 + Math.random() * 0.5)))
// 40% de probabilidad de activar
if (Math.random() < 0.4) {
  defensor.hp_actual -= dañoMascota
}
```

## Valores en log de combate

- `daño_mascota_atq`: daño infligido por la mascota del atacante.
- `daño_mascota_def`: daño infligido por la mascota del defensor.
- Si no se activa, ambos valores son 0.

## Implementación actual

**Archivo:** `game/data.js:29-35` — Array `mascotas`.

**Uso en combate:**
- `game/engine.js:103-111` — Mascota del atacante.
- `game/engine.js:113-121` — Mascota del defensor.

**Creación de bots:**
- `game/data.js:80` — Probabilidad de que un bot tenga mascota: 20%.

**Tabla BD:** `mascotas` — `shaolin_id`, `nombre`, `tipo`, `hp`, `ataque`.
