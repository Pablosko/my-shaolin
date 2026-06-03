# Base de Datos

**Motor:** SQLite (vía sql.js)
**Archivo:** `data/myshaolin.db`
**Persistencia:** Escritura a disco después de cada escritura (`saveDb()`)
**Archivo DDL:** `db/schema.sql`

---

## Tablas

### users

| Columna | Tipo | Descripción |
|---------|------|-------------|
| id | INTEGER PK AUTOINCREMENT | ID único |
| username | TEXT UNIQUE NOT NULL | Nombre de usuario |
| email | TEXT UNIQUE NOT NULL | Email |
| password_hash | TEXT NOT NULL | Hash bcrypt |
| created_at | DATETIME DEFAULT NOW | Fecha registro |

### shaolins

| Columna | Tipo | Descripción |
|---------|------|-------------|
| id | INTEGER PK AUTOINCREMENT | ID único |
| user_id | INTEGER NOT NULL FK→users | Dueño del guerrero |
| name | TEXT NOT NULL | Nombre |
| genero | TEXT DEFAULT 'masculino' | masculino / femenino |
| level | INTEGER DEFAULT 1 | Nivel |
| xp | INTEGER DEFAULT 0 | Experiencia acumulada |
| hp | INTEGER DEFAULT 65 | Vida actual |
| max_hp | INTEGER DEFAULT 65 | Vida máxima |
| fuerza | INTEGER DEFAULT 5 | Stat fuerza |
| agilidad | INTEGER DEFAULT 5 | Stat agilidad |
| velocidad | INTEGER DEFAULT 5 | Stat velocidad |
| combates_hoy | INTEGER DEFAULT 0 | Combates hoy (para límite 3/día) |
| ultimo_combate | DATE | Fecha del último combate |
| created_at | DATETIME DEFAULT NOW | Fecha creación |

### armas

| Columna | Tipo | Descripción |
|---------|------|-------------|
| id | INTEGER PK AUTOINCREMENT | ID único |
| shaolin_id | INTEGER NOT NULL FK→shaolins | Guerrero propietario |
| nombre | TEXT NOT NULL | Nombre del arma |
| tipo | TEXT NOT NULL | corto / pesado / contundente |
| dano_min | INTEGER NOT NULL | Daño mínimo |
| dano_max | INTEGER NOT NULL | Daño máximo |
| equipada | INTEGER DEFAULT 0 | 1 si está equipada |

### habilidades

| Columna | Tipo | Descripción |
|---------|------|-------------|
| id | INTEGER PK AUTOINCREMENT | ID único |
| shaolin_id | INTEGER NOT NULL FK→shaolins | Guerrero propietario |
| nombre | TEXT NOT NULL | Nombre |
| descripcion | TEXT | Texto descriptivo |
| efecto | TEXT NOT NULL | JSON con stat y valores |

### mascotas

| Columna | Tipo | Descripción |
|---------|------|-------------|
| id | INTEGER PK AUTOINCREMENT | ID único |
| shaolin_id | INTEGER NOT NULL FK→shaolins | Guerrero propietario |
| nombre | TEXT NOT NULL | Nombre |
| tipo | TEXT NOT NULL | perro / lobo / oso / felino / ave |
| hp | INTEGER NOT NULL | Vida de la mascota |
| ataque | INTEGER NOT NULL | Ataque de la mascota |

### combates

| Columna | Tipo | Descripción |
|---------|------|-------------|
| id | INTEGER PK AUTOINCREMENT | ID único |
| shaolin1_id | INTEGER NOT NULL FK→shaolins | Guerrero 1 (retador) |
| shaolin2_id | INTEGER NOT NULL FK→shaolins | Guerrero 2 (oponente) |
| winner_id | INTEGER | ID del ganador (NULL si empate) |
| log | TEXT | JSON array con eventos del combate |
| created_at | DATETIME DEFAULT NOW | Fecha del combate |

---

## Relaciones (FKs)

```
users 1──N shaolins
shaolins 1──N armas
shaolins 1──N habilidades
shaolins 1──N mascotas
shaolins 1──N combates (como shaolin1_id)
shaolins 1──N combates (como shaolin2_id)
```

## Convenciones de nomenclatura

- Las tablas usan nombres en plural: `shaolins`, `armas`, `habilidades`
- Las FK siguen el patrón `nombreTabla_id`: `shaolin_id`, `user_id`, `shaolin1_id`, `shaolin2_id`
- El nombre de tabla `shaolins` se usa en todo el proyecto
- Los IDs de bots son **negativos** (ej: `-42`) para distinguirlos de guerreros reales

## Implementación

**Archivo:** `db/database.js`
- `initDb()` — Carga BD existente o crea nueva. Ejecuta schema.
- `query(sql, params)` — SELECT múltiple → array de objetos.
- `get(sql, params)` — SELECT único → objeto o undefined.
- `run(sql, params)` — INSERT/UPDATE/DELETE → `{ changes, lastInsertRowid }`.
- `saveDb()` — Exporta BD a disco.

**Archivo:** `db/schema.sql` — DDL completo con `CREATE TABLE IF NOT EXISTS`.

### Migraciones aplicadas

#### Renombre bruto → shaolin
La tabla `brutos` fue renombrada a `shaolins`. La migración en `initDb()`:
1. Detecta si existe `brutos` (tabla vieja).
2. Copia todos los datos a `shaolins` via `INSERT INTO shaolins SELECT ...`.
3. Dropea la tabla `brutos`.

#### Columnas viejas (bruto_id)
Las tablas `armas`, `habilidades` y `combates` tenían columna `bruto_id` (schema anterior).
- `initDb()` consulta `PRAGMA table_info(armas)` para detectar si la columna se llama `bruto_id` en vez de `shaolin_id`.
- En ese caso, dropea las tablas `armas`, `habilidades`, `combates` y `mascotas`.
- `CREATE TABLE IF NOT EXISTS` en `schema.sql` las recrea con `shaolin_id`.
- Los datos viejos quedan huérfanos (no hay pérdida porque solo existían jugadores de prueba).

#### Nota
`schema.sql` usa `CREATE TABLE IF NOT EXISTS` — **no modifica tablas existentes**. Por eso la migración dropea explícitamente las tablas con columnas incorrectas antes de ejecutar el schema.
