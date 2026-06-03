# Mecánicas Completas — My Shaolin

> Documento maestro con todas las mecánicas vivas del juego.
> Generado el 2026-06-03. Fuente: código en `game/`, `routes/`, `public/js/`.

---

## 1. Sistema de Personajes

### 1.1 Creación

| Paso | Descripción |
|------|-------------|
| 1 | Nombre + género (masculino/femenino) |
| 2 | Stats iniciales generados (ver tabla abajo) |
| 3 | Elegir entre 2 opciones aleatorias: arma o habilidad |

**Stats base por género:**

| Género | HP | Fuerza | Agilidad | Velocidad | Vitalidad |
|--------|----|--------|----------|-----------|-----------|
| Masculino | 55 | 3 | 2 | 2 | 0 |
| Femenino | 50 | 2 | 3 | 3 | 0 |

+1 punto extra aleatorio: +1 Fuerza | +1 Agilidad | +1 Velocidad | +5 HP.

### 1.2 Subida de nivel (Level-up)

**Flujo de 2 pasos:**

1. **Elegir recompensa** entre 2 opciones aleatorias:
   - 40% arma (daño escala con nivel del arma)
   - 30% habilidad (nueva o mejora +1 nivel, tope 3)
   - 30% stat (+1 o +2 Vitalidad [+5/+10 HP], +1 a stat base)
2. **Elegir mejora de stat** entre 2 opciones con rareza:
   - 🥉 Bronce (60%): +1 stat / +2 Vitalidad
   - 🥈 Plata (30%): +2 / +4 Vitalidad
   - 🥇 Oro (10%): +3 / +6 Vitalidad

**HP adicional:** `+2 HP` y `+2 max_hp` automáticos por nivel (se aplican al confirmar level-up).

**Fórmula de XP:**
```
xpNeeded = 6 + nivel * 2
```
- Victoria: +2 XP (Artego7: +4 XP)
- Derrota: +1 XP
- Pablosko: gana la XP exacta para subir de nivel instantáneamente

### 1.3 Límite de personajes

Máximo **3 shaolins** por cuenta.

### 1.4 Límite de combates

Máximo **500 combates** por día por shaolin.

---

## 2. Stats

### 2.1 Stats base

| Stat | Display | Efecto |
|------|---------|--------|
| ❤️ HP | Solo número (sin barra) | Vida total |
| 💪 Fuerza | Barra 10 segmentos | Daño físico |
| 🏃 Agilidad | Barra 10 segmentos | Precisión, esquiva, defensa |
| ⚡ Velocidad | Barra 10 segmentos | PA/turno, iniciativa, crítico |
| 🛡️ Vitalidad | Barra 10 segmentos | +5 HP por punto |

### 2.2 Visualización de barras

- **10 segmentos fijos** por barra (sin importar valor real)
- Color por posición: segmento 1 = verde → segmento 10 = rojo
- Se llenan `Math.min(valor, 10)` segmentos
- **HP**: ❤️ + número solamente (sin barra)

### 2.3 Fórmulas en combate (valores base, sin Qi)

**Daño puño:**
```
dañoBase = floor(fuerza * 0.3) + random(5-7)  // golpe (60%)
dañoBase = floor(fuerza * 0.3) + random(7-9)  // patada (40%)
```

**Daño arma:**
```
dañoArma = fuerza + random(dano_min ~ dano_max)
dano_min = base_dano_min + (nivelArma - 1)
dano_max = base_dano_max + (nivelArma - 1)
```

**Multiplicador por rango:**
```
corto:   [1.0, 1.0, 0.7, 0.4, 0.2]
pesado:  [0.6, 0.8, 1.0, 0.7, 0.3]
contundente: [1.0, 1.0, 0.8, 0.5, 0.2]
```

**Precisión:**
```
probAcierto = clamp(0.20, 0.98, 0.85 + (agi_atacante - agi_defensor) * 0.02)
```

**Esquiva:**
```
probEsquiva = 0.10 + extraEsquiva  // 10% base + habilidad
```

**Crítico:**
```
probCrit = velocidad * 0.01 + extraCritico
dañoCrit = dañoFinal * 1.5
```

**Contraataque:**
```
probContra = extraContra  // por habilidad
dañoContra = max(1, floor(defensor.fuerza * 0.5))
```

**Pérdida de arma (al recibir daño):**
```
probPerder = min(0.05, (dañoRecibido / max_hp) * 0.05)
// Solo si el defensor tiene arma equipada
```

### 2.4 Qi (Armonía interna)

**Cálculo:**
```
potencialQi = nivel >= 70 ? 100 : 29 + nivel
media = promedio(hp/10, fuerza, agilidad, velocidad)
desviacionRelativa = promedio(abs(stat - media) / media) para las 4 stats
tolerancia = 0.08 + (nivel <= 70 ? 0 : min(0.07, (nivel - 70) * 0.001))
desviacionEfectiva = max(0, desviacionRelativa - tolerancia)
armonia = clamp(0.5, 1.0, 1 - desviacionEfectiva * 2.2)
qi = round(potencialQi * armonia)
```

**Aplicación en combate:**
```
factor = 0.5 + qi / 100
factor *= qiBoost  // x1.15 a x1.50 por habilidad

real_fuerza = round(baseFuerza * factor)
real_agilidad = round(baseAgilidad * factor)
real_velocidad = round(baseVelocidad * factor)
real_max_hp = round(baseMaxHp * factor)
```

### 2.5 Habilidades (Skills) que afectan stats

| Habilidad | Stat | Nv1 | Nv2 | Nv3 |
|-----------|------|-----|-----|-----|
| Armonía Interior | qi_boost ×1.15 | ×1.30 | ×1.50 |
| Cuerpo de Roca | hp_porcentual +20% | +35% | +50% |
| Furia del Dragón | fuerza_porcentual +15% | +30% | +50% |
| Viento Veloz | velocidad_porcentual +15% | +30% | +45% |
| Paso Ágil | agilidad_porcentual +15% | +30% | +45% |
| Sangre de Shaolin | robo_vida 1% | 2% | 4% |
| Muro de Acero | defensa -15% | -25% | -35% |
| Mano del Maestro | daño_arma +15% | +30% | +50% |
| Puño de Hierro | daño_puño +20% | +35% | +55% |
| Cascada de Golpes | combo 15% | 25% | 40% |
| Ojo de Halcón | critico +10% | +20% | +30% |
| Paso de Sombra | esquiva +10% | +20% | +30% |
| Reflejo de Serpiente | contraataque +12% | +22% | +35% |
| Piel de Piedra | resistencia -15% | -25% | -35% |

Las habilidades porcentuales se multiplican sobre stats base (fuerza, agilidad, velocidad, hp).

---

## 3. Armas

### 3.1 Catálogo (12 armas)

| Arma | Tipo | Daño Nv1 | Daño Nv3 | Daño Nv5 |
|------|------|----------|----------|----------|
| Cuchillo | corto | 6-10 | 8-12 | 10-14 |
| Látigo | corto | 5-10 | 7-12 | 9-14 |
| Shuriken | corto | 4-8 | 6-10 | 8-12 |
| Sai | corto | 5-9 | 7-11 | 9-13 |
| Espadón | pesado | 9-15 | 11-17 | 13-19 |
| Hacha | pesado | 10-16 | 12-18 | 14-20 |
| Lanza | pesado | 7-13 | 9-15 | 11-17 |
| Cimitarra | pesado | 8-14 | 10-16 | 12-18 |
| Alabarda | pesado | 9-15 | 11-17 | 13-19 |
| Maza | contundente | 8-14 | 10-16 | 12-18 |
| Mangual | contundente | 8-14 | 10-16 | 12-18 |
| Martillo | contundente | 10-17 | 12-19 | 14-21 |

### 3.2 Sistema de resolución (`resolverArma`)

- **DB guarda solo:** `nombre`, `nivel`, `equipada`
- **En runtime:** `resolverArma()` busca la plantilla en `data.js` y completa `tipo`, `dano_min`, `dano_max`
- **Escalado por nivel:** `dano_min += (nivel - 1)`, `dano_max += (nivel - 1)`
- Se aplica en: GET /shaolins, GET /shaolins/:id, inicio de combate

### 3.3 Mecánica en combate

| Evento | Probabilidad | Descripción |
|--------|-------------|-------------|
| Draw (sacar arma) | 33% por turno | Si no tiene arma equipada, saca una |
| Swap (cambiar arma) | 30% por turno | Si ya tiene arma, puede cambiar |
| Drop (perder arma) | 1-5% al recibir daño | Se desequipa el arma |

**Log en combate:**
- `🗡️ X sacó Y` — draw
- `🔄 X cambió A por B` — swap
- `💔 X perdió su Y` — drop
- `X atacó con Y` / `X atacó con puños` — en cada golpe

---

## 4. Sistema de Combate

### 4.1 Puntos de Acción (PA)

```
paPorTurno = clamp(100, 250, 100 + floor(sqrt(velocidad) * 12))
paReaccion = floor(paPorTurno * 0.5)
```

### 4.2 Costes de acciones

| Acción | Coste PA |
|--------|----------|
| Mover rango 0↔1 | 25 |
| Mover rango 1↔2 | 50 |
| Mover rango 2↔3 | 50 |
| Mover rango 3↔4 | 75 |
| Puño / Patada / Ataque arma | 50 |
| Sacar / Cambiar arma | 0 (sin implementar) |
| Bloquear / Esquivar (reacción) | 50 |
| Contraatacar (reacción) | 50 adicional |

### 4.3 Rangos de distancia

| Rango | Nombre | Descripción |
|-------|--------|-------------|
| 0 | Contacto | Cuerpo a cuerpo |
| 1 | Corta | Alcance de puño |
| 2 | Media | Distancia media |
| 3 | Guardia | Inicio del combate |
| 4 | Proyectil | Larga distancia |

- Todos los combates empiezan en **rango 3**
- Máximo: rango 4

### 4.4 Eficacia por rango según tipo de arma

| Tipo | R0 | R1 | R2 | R3 | R4 |
|------|----|----|----|----|----|
| corto | 1.0 | 1.0 | 0.7 | 0.4 | 0.2 |
| pesado | 0.6 | 0.8 | 1.0 | 0.7 | 0.3 |
| contundente | 1.0 | 1.0 | 0.8 | 0.5 | 0.2 |
| puños | sí | sí | no | no | no |

### 4.5 Turno de combate

```
1. Calcular PA del actor según velocidad
2. Intentar draw/swap de arma (sin coste PA actualmente)
3. Loop de acciones mientras haya PA ≥ 50:
   a. Si está en rango de ataque → atacar (gasta 50 PA, o 0 si sin PA)
   b. Si no está en rango → moverse hacia el oponente (gasta PA según rango)
   c. Máximo 4 acciones por turno
4. Si rango ≤ 1 → registrar "exposed" (solo informativo, sin penalización)
```

### 4.6 IA del bot

Prioridades (en orden):
1. Si HP ≤ 0, no actuar
2. Si está en rango de ataque → atacar
3. Si no está en rango → moverse hacia el oponente
4. Sin acciones complejas (carga, combo, retirada) por ahora

### 4.7 Eventos del frontend

```js
combat_start, turn_start, pa, draw_weapon, switch_weapon,
move, range_change, hit, critical_hit, miss, dodge,
counter_hit, drop_weapon, life_steal, hp_update, exposed, combat_end
```

### 4.8 Límites

- Máximo 50 turnos por combate
- PA máximo: 250
- Máximo 4 acciones por turno

---

## 5. Bots

### 5.1 Generación

```js
generarBot(nivel)
```
- Crea stats base con género aleatorio
- 40% lleva un arma, 30% una habilidad
- Por cada nivel del personaje: +2 HP, y recompensa aleatoria:
  - 40%: +1 stat aleatorio (+10 HP si vitalidad)
  - 30%: arma aleatoria (si no la tiene)
  - 30%: habilidad aleatoria (nueva o mejora +1, tope 3)

### 5.2 Endpoint

```
GET /api/arena/bots?level={nivel}
```
Devuelve 5 bots escalados al nivel del jugador.

---

## 6. Easter Eggs

| Personaje | Efecto |
|-----------|--------|
| **Pablosko** | Al subir nivel: stats 99/99/99/50, todas las armas, todas las habilidades nivel 3, nivel 99, HP +250. En combate: gana XP exacta para subir nivel. |
| **Artego7** | Victoria: +4 XP en vez de +2 (2×). |

---

## 7. Migraciones

Sistema automático en `db/migrate.js`:

| Migración | Fecha | Efecto |
|-----------|-------|--------|
| `hp_formula_v2` | 2026-06-03 | Suma `+2 * (level - 1)` a HP y max_hp de todos los shaolins con level > 1 |
| `armas_drop_stats` | 2026-06-03 | Elimina columnas `tipo`, `dano_min`, `dano_max` de armas, agrega `nivel INTEGER DEFAULT 1` |

Se ejecutan automáticamente al iniciar el servidor (en orden) y se marcan como aplicadas en tabla `_migrations`.

---

## 8. Bases de Datos

### 8.1 Esquema actual

```sql
-- Tablas vivas: users, shaolins, armas, habilidades, combates

armas -- solo nombre + nivel + equipada (stats resueltas en runtime)
habilidades -- nombre + efecto (JSON) + nivel
shaolins -- stats base + level + xp + pending_level
combates -- shaolin1_id + shaolin2_id + winner_id + log (JSON)
```

### 8.2 Tablas removidas / no implementadas

| Tabla | Estado |
|-------|--------|
| mascotas | No existe en schema.sql (eliminada) |
| bruto | Migrada a shaolins |
| armas_vieja | Migrada a nueva estructura |

---

## 9. Frontend

### 9.1 Arquitectura

- **Sin frameworks** — HTML + CSS vanilla + JS plano
- **API helper** global `API.get/post()` con manejo de token JWT
- **Páginas**: index (login), dashboard, shaolin detail, arena, admin

### 9.2 Componentes visuales clave

| Componente | Archivo | Descripción |
|------------|---------|-------------|
| Barras segmentadas | shaolin.js:renderSegBar() | 10 segmentos coloreados |
| Avatar con skins | api.js:crearAvatarImg() | Imagen PNG o emoji fallback |
| Modal level-up | shaolin.js | 2 pasos (recompensa + stats) |
| Campo de batalla animado | combate.js | Posicionamiento CSS por rango |
| Log de combate | combate.js:addLog() | Stream de eventos con colores |

### 9.3 Animaciones de combate

- Ataque: desplazamiento lateral (atacar-der/izq)
- Golpe: vibración (golpeado)
- Crítico: flash + escala 1.5×
- Daño flotante: float-up con fade
- Draw/swap: fadeIn del badge
- Victoria/derrota: bounce/pulse

---

## 10. Tech Stack

| Componente | Tecnología |
|------------|------------|
| Servidor | Node.js + Express |
| Base de datos | Turso (libsql, SQLite cloud) |
| Autenticación | JWT (jsonwebtoken) |
| Frontend | HTML + CSS + JS vanilla |
| Hosting | Render.com |
| Repo | GitHub (Pablosko/my-shaolin) |
