# API Endpoints

Base URL: `https://myshaolin.fly.dev/api`

Headers comunes:
- `Content-Type: application/json`
- `Authorization: Bearer <token>` (para rutas protegidas)

---

## Auth (`/api/auth`)

### POST /register

Registrar nuevo usuario.

```json
// Request
{ "username": "player1", "email": "p1@mail.com", "password": "1234" }

// Response 200
{ "token": "jwt...", "userId": 1, "username": "player1" }
```

### POST /login

Iniciar sesión.

```json
// Request
{ "username": "player1", "password": "1234" }

// Response 200
{ "token": "jwt...", "userId": 1, "username": "player1" }
```

---

## Shaolins (`/api/shaolins`)

Todas requieren token JWT.

### GET /

Listar todos los guerreros del usuario autenticado. Cada guerrero incluye sus armas, habilidades y mascotas anidadas.

### GET /:id

Obtener detalle de un guerrero (solo si pertenece al usuario autenticado). Incluye items anidados.

### POST /

Crear un nuevo guerrero.

```json
// Request
{ "name": "Shaolin Master", "genero": "masculino", "eleccion": 0 }

// eleccion: 0=arma, 1=habilidad, 2=mascota

// Response 200
{
  "id": 1, "user_id": 1, "name": "Shaolin Master", "genero": "masculino",
  "level": 1, "xp": 0, "hp": 72, "max_hp": 72,
  "fuerza": 7, "agilidad": 5, "velocidad": 9,
  "item": { "tipo": "arma", "nombre": "Espadón" }
}
```

### POST /:id/equipar-arma

Equipar un arma específica del guerrero.

```json
// Request
{ "arma_id": 3 }

// Response
{ "ok": true }
```

---

## Arena (`/api/arena`)

Todas requieren token JWT.

### GET /oponentes

Listar guerreros de otros usuarios disponibles para combatir (excluye los del usuario autenticado). Incluye items anidados y nombre del dueño.

### GET /bots

Generar y devolver 5 bots de práctica (no se persisten en BD).

### GET /historial/:shaolin_id

Historial de combates de un guerrero. Últimos 20, ordenados por fecha descendente.

```json
// Response
[{
  "id": 1, "shaolin1_id": 1, "shaolin2_id": 5, "winner_id": 1,
  "b1_name": "Shaolin Master", "b2_name": "Bot Lee",
  "created_at": "2026-06-02T20:00:00.000Z"
}]
```

### POST /combatir/:oponente_id

Iniciar combate contra un oponente.

```json
// Request (contra jugador real)
{ "shaolin_id": 1 }

// Request (contra bot)
{ "shaolin_id": 1, "oponente_data": { ...bot } }

// Response 200
{
  "resultado": "victoria" | "derrota",
  "winner_id": 1,
  "log": [ ...eventos ],
  "shaolin_actualizado": { ... },
  "subio_nivel": false
}
```

**Límite:** 3 combates diarios por guerrero.

---

## Admin (`/api/admin`)

Requieren `x-admin-key` header con la clave maestra.

### POST /login

Verificar clave admin.

```json
// Request
{ "key": "admin123" }

// Response
{ "ok": true }
```

### GET /users

Listar todos los usuarios con sus guerreros y conteo de combates.

### GET /shaolins

Listar todos los guerreros con nombre del dueño y conteo de combates.

### DELETE /users/:id

Eliminar usuario y todos sus datos (guerreros, armas, habilidades, mascotas, combates).

### DELETE /shaolins/:id

Eliminar un guerrero y sus datos asociados.

### GET /combates

Últimos 50 combates con nombres de los participantes.
