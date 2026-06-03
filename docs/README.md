# My Shaolin 🥋

Juego multijugador de artes marciales por turnos. Inspirado en El Shaolin.

## Stack

- **Servidor**: Node.js + Express
- **Base de datos**: Turso (libsql client, SQLite en la nube)
- **Frontend**: HTML + CSS vanilla (sin frameworks)
- **Auth**: JWT (jsonwebtoken)
- **Hosting**: Fly.io (https://myshaolin.fly.dev)

### Despliegue manual

```bash
fly deploy
```

### Variables de entorno

| Variable | Descripción |
|----------|-------------|
| `TURSO_DB_URL` | URL de la base de datos Turso |
| `TURSO_AUTH_TOKEN` | Token de autenticación de Turso |
| `ADMIN_KEY` | Clave del panel admin (default: admin123) |

### Bases de datos

La base de datos está en **Turso** (SQLite en la nube, free tier).
Las tablas se crean automáticamente al arrancar el servidor via `db/schema.sql`.

## Admin

Clave maestra: `ADMIN_KEY` en env vars (por defecto: `admin123`).

## Nomenclatura

| Término | Significado |
|---------|-------------|
| Shaolin | Guerrero / personaje del jugador |
| shaolin_id | PK en tabla `shaolins`, FK en `armas`, `habilidades`, `combates` |
| shaolin1_id / shaolin2_id | FK en `combates` (atacante/defensor) |
| Qi | Armonía interna del luchador, calculada del equilibrio de stats |
| PA | Puntos de acción por turno (basado en Velocidad) |
| Rango | Distancia entre luchadores (0=contacto, 4=proyectil) |

> ❗ **0 tolerancia a "bruto" en el código.** El juego se llama My Shaolin, los personajes son **shaolins**, no brutos. Todo el código base usa `shaolin`/`shaolins` como nombre de tabla, variable y nomenclatura. Cualquier PR debe seguir esta convención.

## Docs relacionados

- [`STATS.md`](./STATS.md) — Stats, Qi, Armonía, fórmulas
- [`COMBAT.md`](./COMBAT.md) — Sistema de combate, PA, rangos, defensas, IA
- [`WEAPONS.md`](./WEAPONS.md) — Armas, eficacia por rango
- [`SKILLS.md`](./SKILLS.md) — Habilidades y efectos
- [`PETS.md`](./PETS.md) — Mascotas y comportamiento
- [`CREATION.md`](./CREATION.md) — Creación de personaje
- [`API.md`](./API.md) — Endpoints de la API
- [`DATABASE.md`](./DATABASE.md) — Esquema de base de datos
- [`IMAGES.md`](./IMAGES.md) — Sistema de skins e imágenes
