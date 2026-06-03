# My Shaolin 🥋

Juego multijugador de artes marciales por turnos. Inspirado en El Shaolin.

## Stack

- **Servidor**: Node.js + Express
- **Base de datos**: SQLite (sql.js) con persistencia a archivo
- **Frontend**: HTML + CSS vanilla (sin frameworks)
- **Auth**: JWT (jsonwebtoken)
- **Hosting**: Fly.io (free tier, volumen persistente)

## Estructura del proyecto

```
my-shaolin/
├── server.js              # Entry point
├── db/                    # Base de datos
│   ├── database.js        # Wrapper sql.js (init, query, get, run)
│   └── schema.sql         # DDL de tablas
├── routes/                # API endpoints
│   ├── auth.js            # POST /api/auth/register, /login
│   ├── shaolin.js         # CRUD de guerreros (/api/shaolins)
│   ├── combate.js         # Arena, bots, historial (/api/arena)
│   └── admin.js           # Panel admin (/api/admin)
├── game/                  # Lógica de juego
│   ├── data.js            # Armas, habilidades, mascotas, bots, generación
│   └── engine.js          # Simulación de combate (turnos, daño, defensas)
├── middleware/
│   └── auth.js            # JWT: generarToken, verificarToken
├── public/                # Frontend estático
│   ├── index.html         # Login/Register
│   ├── dashboard.html     # Lista de guerreros
│   ├── shaolin.html       # Detalle del guerrero
│   ├── crear-shaolin.html # Crear guerrero
│   ├── arena.html         # Arena / combate
│   ├── admin.html         # Panel admin
│   ├── css/style.css      # Estilos globales
│   └── js/
│       ├── api.js         # Cliente API con JWT
│       ├── auth.js        # checkAuth, logout
│       ├── dashboard.js   # Lista de guerreros
│       ├── shaolin.js     # Detalle del guerrero
│       ├── crear-shaolin.js # Creación
│       └── combate.js     # Combate con animación
├── docs/                  # Especificaciones técnicas
└── fly.toml               # Config Fly.io
```

## Despliegue

```bash
fly deploy
```

App en: https://myshaolin.fly.dev/

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
