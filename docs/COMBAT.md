# Sistema de Combate

## Visión general

Combate automático por turnos. El servidor resuelve toda la lógica y devuelve un log de eventos que el cliente reproduce como animación.

## Puntos de Acción (PA)

Cada turno, el luchador recibe PA según su Velocidad:

```txt
paTurno = clamp(100, 250, 100 + floor(sqrt(velocidad) * 12))
paReaccion = floor(paTurno * 0.5)
```

- **PA activos**: se usan durante el turno propio para atacar, moverse, etc.
- **PA de reacción**: se usan para bloquear, esquivar o contraatacar durante acciones enemigas.
- Los PA se consumen en bloques de 25.

## Costes de acciones

### Movimiento

| Acción | Coste PA |
|--------|----------|
| Mover 1 rango | 50 |
| Mover 2 rangos | 100 |

Versión detallada por rango:

| Transición | Coste |
|------------|-------|
| 0 ↔ 1 | 25 |
| 1 ↔ 2 | 50 |
| 2 ↔ 3 | 50 |
| 3 ↔ 4 | 75 |

### Acciones simples (50 PA)

- Puño
- Patada corta
- Ataque con arma en rango óptimo
- Lanzar shuriken
- Sacar arma / Cambiar arma
- Bloquear (reacción)
- Esquivar (reacción)
- Contraatacar (reacción, solo tras defensa exitosa)

### Acciones compuestas (75 PA)

Combinan movimiento + acción con 50% de descuento en el movimiento:

```txt
coste = costeAtaque + costeMovimiento * 0.5
```

Ejemplos: Patada de entrada, estocada, paso + puño, empujar + retroceder.

### Acciones pesadas (100 PA)

- Carga
- Patada voladora
- Rodar atrás
- Ataque pesado
- Técnica especial (75-150 PA)

### Proyectiles

Rodar atrás y lanzar shuriken: 125 PA (más eficiente que hacerlo por separado: 150 PA).

## Rangos de distancia

El combate usa rangos discretos:

```txt
0 = Contacto
1 = Corta
2 = Media
3 = Guardia / Larga (inicio del combate)
4 = Proyectil
```

- Todos los combates empiezan en **rango 3**.
- Rango máximo: 4 (no se puede retroceder más allá).

## Ataques con desplazamiento

Algunos ataques modifican la distancia automáticamente (acción compuesta):

| Acción | PA | Rango ideal | Efecto |
|--------|----|-------------|--------|
| Patada de entrada | 75 | 2 | Ataca y reduce distancia en 1 |
| Patada de empuje | 75 | 1-2 | Ataca y aumenta distancia en 1 |
| Estocada | 75 | 2-3 | Ataca, mantiene distancia |
| Carga | 100 | 3-4 | Reduce distancia en 2 y ataca |
| Rodar atrás | 100 | cualquiera | Aumenta distancia en 2 |

## Defensa, esquiva, bloqueo y contraataque

### Defensa con PA de reacción

| Defensa | Coste |
|---------|-------|
| Bloquear | 50 PA reacción |
| Esquivar | 50 PA reacción |
| Contraatacar | 50 PA reacción adicional |

### Defensa desesperada

Si no hay PA de reacción suficientes:

```txt
efectividadDefensa = efectividadDefensa * 0.35
```

Se puede defender con penalización, no hay imposibilidad total.

### Probabilidad de esquiva

```txt
probEsquiva = clamp(2, 45, agilidad * (0.75 + velocidad / 60))
```

### Probabilidad de bloqueo

```txt
probBloqueo = clamp(5, 50, fuerza * 0.4 + agilidad * 0.3 + velocidad * 0.2)
```

El bloqueo reduce daño en vez de anularlo: `dañoBloqueado = dañoOriginal * 0.35`.

### Probabilidad de contraataque

Solo ocurre tras defensa exitosa. Requiere ≥50 PA de reacción.

```txt
probContraataque = clamp(0, 60, velocidad * (0.5 + agilidad / 80))
```

**Regla**: Agilidad decide si evitas bien. Velocidad decide si llegas a castigar.

## Exposición

Si un luchador termina su turno en rango 0-1 sin PA de reacción suficiente:

```txt
exposed = true
penalizaciónDefensaExpuesto = -20%
```

## Resolución de un turno (IA automática)

```
1. Calcular PA del actor
2. Elegir acción según prioridades:
   1. Si HP ≤ 0, no actuar
   2. Si arma en rango malo, corregir distancia o cambiar arma
   3. Si rival expuesto y PA suficiente, atacar
   4. Si arma proyectil y rango 3-4, lanzar
   5. Si arma larga y rango 0-1, empujar o retroceder
   6. Si arma corta y rango alto, intentar entrar
   7. Si PA para atacar y retirarse, preferir secuencia segura
   8. Si PA para combo, atacar varias veces
   9. Si no hay buena acción, recuperar postura
3. Comprobar rango
4. Aplicar coste de PA
5. Resolver ataque
6. Defensor intenta defensa (esquiva / bloqueo)
7. Si defensa exitosa y hay PA, posible contraataque
8. Aplicar cambios de distancia
9. Registrar eventos para frontend
10. Pasar al siguiente actor
```

## Límites de seguridad

- PA máximo: 250
- Máximo 3 ataques ofensivos consecutivos por turno (salvo habilidad especial)
- Proyectiles: 3-5 usos por combate
- Rango máximo: 4
- Máximo 50 turnos por combate

## Eventos para frontend

El servidor devuelve un array de eventos reproducibles:

```js
// Tipos de evento
[
  { type: "combat_start", ... },
  { type: "move", actor, fromRange, toRange, cost },
  { type: "range_change", fromRange, toRange },
  { type: "attack_attempt", actor, target, action, cost },
  { type: "hit", actor, target, damage, critical },
  { type: "miss", actor, target },
  { type: "dodge", actor, success, cost },
  { type: "block", actor, success },
  { type: "counter_attempt", actor, target, cost },
  { type: "counter_hit", actor, target, damage },
  { type: "glancing_hit", actor, target, damage },
  { type: "critical_hit", actor, target, damage },
  { type: "push", actor, target },
  { type: "knockback", actor, target },
  { type: "exposed", actor },
  { type: "combat_end", winner, loser },
]
```

## Implementación actual

**Archivos:**
- `game/engine.js` — `simularCombate()`, `procesarTurno()`, `calcularDaño()`
- `routes/combate.js` — Endpoint `POST /api/arena/combatir/:oponente_id`
- `public/js/combate.js` — `reproducirCombate()`, animación con delays

**Sistema actual (simplificado):**
- Sin rangos (distancia fija)
- Sin PA (un ataque por turno por luchador)
- El que tiene más velocidad ataca primero
- Daño: fuerza + arma, modificado por habilidades
- Esquiva, crítico, contraataque, mascotas
- Máximo 50 turnos

### Cambios aplicados al sistema actual

#### Precisión de golpe (dodge nerf)
```js
probAcierto = clamp(0.20, 0.98, 0.85 + (atacante.agilidad - defensor.agilidad) * 0.02)
```
85% base de acierto. La diferencia de agilidad modifica ±2% por punto. Antes era ~52% base.

#### Uso de armas en combate
```js
probUsarArma = Math.min(0.85, 0.25 + atacante.agilidad * 0.02)
```
- Por cada ataque, se tira probabilidad de usar arma vs puños.
- Si usa arma, se suma daño del arma al daño base.

#### UI de armas en combate
- **Weapon reserve**: en `public/arena.html`, div `.weapon-reserve` en la esquina superior derecha de cada cuadrado de luchador. Muestra todas las armas del inventario como badges (`🗡️ Espadón`).
- **Weapon equipped**: div `.weapon-equipada` oculto bajo el nombre del luchador. Cuando un ataque usa arma, aparece `⚔️ [NombreArma]` con fadeIn; se oculta al inicio del siguiente turno.
- Estilos en `public/css/style.css`: `.weapon-reserve`, `.weapon-equipada`.

#### Mensajes de daño
- Daño con arma: `X golpeó a Y -5HP con Espadón`
- Daño sin arma (puños): `X golpeó a Y -5HP con puños`
- Implementado en `public/js/combate.js` — `renderResultadoVisual()` y `renderResultadoDirecto()`.

#### Archivos modificados
- `game/engine.js` — fórmula de `probAcierto` y `probUsarArma`
- `public/js/combate.js` — weapon badge show/hide, mensajes de daño
- `public/arena.html` — estructura con weapon-reserve / weapon-equipada
- `public/css/style.css` — estilos de armas en combate

**Sistema nuevo (especificado arriba):**
- Rangos 0-4
- PA por turno
- Qi y Armonía
- Stats relativas
- Armas con eficacia por rango
- IA automática priorizada
- Eventos frontend tipados
