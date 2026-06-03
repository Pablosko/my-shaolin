# Creación de personaje

## Flujo actual

1. **Paso 1**: Elegir nombre y género.
2. **Paso 2**: Stats generados aleatoriamente (solo preview visual).
3. **Paso 3**: Elegir entre 3 opciones fijas: Arma, Habilidad o Mascota.
4. **Paso 4**: Resultado final con stats y objeto recibido.

## Stats iniciales por género

A nivel 1 las stats son fijas según el género, más 1 punto extra aleatorio:

```js
function generarStatsIniciales(genero) {
  const base = genero === 'masculino'
    ? { hp: 55, max_hp: 55, fuerza: 3, agilidad: 2, velocidad: 2 }
    : { hp: 50, max_hp: 50, fuerza: 2, agilidad: 3, velocidad: 3 };

  const r = Math.floor(Math.random() * 4);
  if (r === 0) base.fuerza += 1;
  else if (r === 1) base.agilidad += 1;
  else if (r === 2) base.velocidad += 1;
  else { base.hp += 5; base.max_hp += 5; }

  return base;
}
```

| Género     | Base (pts) | Fuerza | Agilidad | Velocidad | HP  | Punto extra |
|------------|------------|--------|----------|-----------|-----|-------------|
| Masculino  | 8          | 3      | 2        | 2         | 55  | +1 fue / +1 agi / +1 vel / +5 hp |
| Femenino   | 8          | 2      | 3        | 3         | 50  | +1 fue / +1 agi / +1 vel / +5 hp |

> **Regla:** 5 HP = 1 punto de habilidad.

Los bots siguen la misma lógica con género aleatorio.

## Sistema de 3 opciones aleatorias (nuevo)

En vez de 3 opciones fijas predecibles, se generan 3 objetos aleatorios del pool de armas, habilidades y mascotas.

### Pesos

| Tipo | Probabilidad |
|------|-------------|
| Arma | 45% |
| Habilidad | 40% |
| Mascota | 15% |

### Funcionamiento

```
1. Servidor genera 3 objetos aleatorios usando los pesos
2. Frontend muestra los 3 (nombre, icono, descripción corta)
3. Jugador selecciona uno (índice 0, 1, 2)
4. Servidor crea el personaje y asigna el objeto seleccionado
```

### Endpoints

**`POST /api/shaolins/opciones`** — Genera 3 opciones aleatorias y las devuelve.

```json
// Response
{
  "opciones": [
    { "index": 0, "tipo": "arma", "nombre": "Espadón", "icono": "🗡️", "descripcion": "Daño 4-8" },
    { "index": 1, "tipo": "arma", "nombre": "Cuchillo", "icono": "🗡️", "descripcion": "Daño 2-5" },
    { "index": 2, "tipo": "mascota", "nombre": "Lobo", "icono": "🐾", "descripcion": "HP30 ATQ10" }
  ]
}
```

**`POST /api/shaolins`** — Crea personaje (body incluye `indiceOpcion` en vez de `eleccion`).

```json
// Request
{
  "name": "Shaolin Master",
  "genero": "masculino",
  "indiceOpcion": 0,
  "opciones": [...]  // las mismas 3 opciones que se mostraron
}
```

## Máximo de guerreros

Cada cuenta puede tener hasta **3 guerreros**.

## Implementación actual

**Archivos:**
- `public/js/crear-shaolin.js` — Frontend: pasos, selección, llamada API.
- `routes/shaolin.js:29-83` — Backend: validación, inserción en BD, asignación de item.
- `game/data.js:53-67` — `generarStatsIniciales(genero)`, stats por género.

**Tabla BD:** `shaolins` — `user_id`, `name`, `genero`, `hp`, `max_hp`, `fuerza`, `agilidad`, `velocidad`, `level`, `xp`, `combates_hoy`, `ultimo_combate`.
