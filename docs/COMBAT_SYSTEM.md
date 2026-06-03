# Sistema de Combate — Diseño Completo

> Documento oficial de diseño del sistema de combate. Describe todas las mecánicas,
> la estructura de armas por familias y tiers, y el motor de resolución.

---

## 1. Armas — Familias y Tiers

### 1.1 Familias

Seis familias de armas, cada una con comportamiento único:

| Familia     | Símbolo    | Característica                     |
|-------------|------------|-------------------------------------|
| Puño        | `puño`     | Mano desnuda, máxima velocidad      |
| Dao         | `dao`      | Cuchillo/espada curva, versátil     |
| Jian        | `jian`     | Espada recta, preciso               |
| Gun         | `gun`      | Bastón/lanza, largo alcance         |
| Shuanggou   | `shuanggou`| Gancho/exótica, defensiva           |
| Fei Biao    | `fei_biao` | Proyectil, alcance máximo           |

### 1.2 Tiers

Seis niveles de calidad que escalan daño y modificadores:

| Tier               | Índice | Bonus daño |
|--------------------|--------|------------|
| Hierro             | 0      | +0         |
| Acero              | 1      | +2         |
| Acero Fino         | 2      | +4         |
| Mitril             | 3      | +6         |
| Mitril Superior    | 4      | +8         |
| Mitril Maestro     | 5      | +10        |

### 1.3 Eficacia por Rango (por familia)

Cada familia tiene una curva `[r0, r1, r2, r3, r4]` que multiplica el daño
según la distancia de combate:

| Familia     | R0 (contacto) | R1 (corta) | R2 (media) | R3 (guardia) | R4 (larga) |
|-------------|:------------:|:----------:|:----------:|:------------:|:----------:|
| Puño        | 1.0          | 0.8        | 0.5        | 0.3          | 0.1        |
| Dao         | 0.8          | 1.0        | 0.7        | 0.4          | 0.2        |
| Jian        | 0.6          | 0.8        | 1.0        | 0.7          | 0.3        |
| Gun         | 0.3          | 0.6        | 0.9        | 1.0          | 0.5        |
| Shuanggou   | 0.7          | 1.0        | 0.8        | 0.5          | 0.2        |
| Fei Biao    | 0.1          | 0.3        | 0.6        | 0.9          | 1.0        |

---

## 2. Sistema de Bloqueo

### 2.1 Frecuencia de Bloqueo (`blockFreq`)

Probabilidad base (%) de que el defensor INTENTE bloquear:

```txt
puño=25, dao=20, jian=15, gun=15, shuanggou=25, fei_biao=5
```

### 2.2 Eficacia de Bloqueo (`blockEfficacy`)

Multiplicador de reducción de daño si el bloqueo tiene éxito:

```txt
puño=0.25, dao=0.20, jian=0.15, gun=0.15, shuanggou=0.20, fei_biao=0.05
```

### 2.3 Probabilidad final de bloqueo

```txt
probBloqueo = min(blockFreq + velocidad * 0.3 + agilidad * 0.2, 80)
```

### 2.4 Modificadores al bloqueo

1. **Ventaja de rango**: si el atacante está en rango no óptimo:
   `probBloqueo += 15`

2. **Comparación de tiers** (ver sección 6)

3. **Qi**: `probBloqueo *= (0.8 + qiArmonía * 0.2)`

4. **Blockability del arma atacante**: dificulta el bloqueo:
   `probBloqueo -= blockability * 0.5`

### 2.5 Daño bloqueado

```txt
dañoFinal = dañoOriginal * (1 - blockEfficacy)
```

Si el arma defensora tiene tier inferior al arma atacante, la eficacia
se reduce según la diferencia de tiers (ver sección 6).

---

## 3. Sistema de Esquiva

### 3.1 Dodgeability por familia

```txt
puño=25, dao=10, jian=15, gun=5, shuanggou=20, fei_biao=30
```

### 3.2 Probabilidad final de esquiva

```txt
probEsquiva = min(agilidad * 0.6 + velocidad * 0.3 + dodgeability - 15, 60)
```

### 3.3 Modificadores a la esquiva

1. **Penalización por equipo pesado** (tier alto en armas no-ágiiles): -10
2. **Bonificación por velocidad efectiva** (ver sección 5): +5 si > 30
3. **Bonificación por rango**: si rango ≥ 3: `+ dodgeability * 0.2`

### 3.4 Esquiva exitosa

Anula TODO el daño. No hay daño parcial por esquiva.

---

## 4. Contraataque

### 4.1 Activación

Solo ocurre tras una defensa exitosa (bloqueo o esquiva)
Y el defensor tiene ≥ 50 PA de reacción restantes.

### 4.2 Probabilidad

```txt
probContraataque = min(velocidad * 0.4 + agilidad * 0.2 + skill, 50)
```

### 4.3 Daño de contraataque

```txt
dañoContra = max(1, floor(fuerza * 0.5))
```

El contraataque NO puede ser bloqueado o esquivado (es un castigo automático).

---

## 5. Velocidad Efectiva

Determina el orden de actuación por turno.

```txt
velocidadEfectiva = velocidad * weaponSpeed
```

Donde `weaponSpeed` por familia:

| Familia     | weaponSpeed |
|-------------|:-----------:|
| Puño        | 1.2         |
| Dao         | 0.9         |
| Jian        | 1.0         |
| Gun         | 0.7         |
| Shuanggou   | 1.1         |
| Fei Biao    | 1.3         |

El combatiente con MAYOR `velocidadEfectiva` actúa primero cada turno.

---

## 6. Matriz de Familias

### 6.1 Modificador de ataque (familia atacante → familia defensora)

| Ataca ↓ \ Defiende → | Puño  | Dao   | Jian  | Gun   | Shuanggou | Fei Biao |
|-----------------------|:-----:|:-----:|:-----:|:-----:|:---------:|:--------:|
| Puño                  | 1.0   | 0.8   | 0.7   | 0.9   | 0.8       | 0.6      |
| Dao                   | 0.9   | 1.0   | 0.8   | 0.7   | 0.9       | 0.8      |
| Jian                  | 0.8   | 0.9   | 1.0   | 0.8   | 0.7       | 0.9      |
| Gun                   | 1.0   | 0.7   | 0.8   | 1.0   | 0.8       | 0.6      |
| Shuanggou             | 0.9   | 0.9   | 0.7   | 0.8   | 1.0       | 0.7      |
| Fei Biao              | 0.7   | 0.8   | 0.9   | 0.6   | 0.7       | 1.0      |

### 6.2 Modificador de defensa (familia defensora)

La familia del arma defensora modifica `blockEfficacy`:

```txt
blockEfficacy *= (1 + familyDefenseBonus)
```

| Familia     | Bonus defensa |
|-------------|:-------------:|
| Puño        | 0.00          |
| Dao         | 0.05          |
| Jian        | 0.10          |
| Gun         | 0.15          |
| Shuanggou   | 0.20          |
| Fei Biao    | -0.10         |

---

## 7. Comparación de Tiers

### 7.1 Modificador de daño por tier

Cuando el arma atacante y el arma defensora tienen tiers distintos:

| Diferencia (atkTierIdx - defTierIdx) | Modificador daño |
|:------------------------------------:|:----------------:|
| ≥ 2                                  | 1.3              |
| 1                                    | 1.15             |
| 0                                    | 1.0              |
| -1                                   | 0.85             |
| ≤ -2                                 | 0.7              |

### 7.2 Modificador de bloqueo por tier

Cuando el arma defensora es de tier inferior al arma atacante, la
eficacia de bloqueo se reduce proporcionalmente:

```txt
factorTierBloqueo = max(0.5, 1 - diff * 0.15)
blockEfficacy *= factorTierBloqueo
```

---

## 8. Qi en Defensa

El Qi del defensor influye en todas las capacidades defensivas:

### 8.1 Factor de armonía

```txt
factorQi = 0.5 + qi / 100
armoníaFactor = factorQi * qiBoostSkill
```

### 8.2 Aplicación a defensa

```txt
probBloqueo *= armoníaFactor
probEsquiva *= armoníaFactor
blockEfficacy *= armoníaFactor
```

---

## 9. Puntos de Acción (PA)

### 9.1 PA por turno

```txt
paTurno = clamp(100, 250, 100 + floor(sqrt(velocidad) * 12))
paReaccion = floor(paTurno * 0.5)
```

### 9.2 Costes de acciones

| Acción                        | Coste PA    | Tipo        |
|-------------------------------|-------------|-------------|
| Puño                          | 50          | simple      |
| Patada corta                  | 50          | simple      |
| Ataque con arma               | 50          | simple      |
| Lanzar proyectil              | 50          | simple      |
| Sacar arma / Cambiar arma     | 50          | simple      |
| Mover 1 rango                 | 25-75       | movimiento  |
| Bloquear (reacción)           | 50          | reacción    |
| Esquivar (reacción)           | 50          | reacción    |
| Contraatacar (reacción)       | 50 adicional| reacción    |
| Acción compuesta              | 75          | compuesta   |
| Carga                         | 100         | pesada      |
| Patada voladora               | 100         | pesada      |
| Rodar atrás                   | 100         | pesada      |
| Técnica especial              | 75-150      | especial    |
| Rodar + lanzar proyectil      | 125         | combo       |

### 9.3 Costes de movimiento por transición

| Transición | Coste |
|------------|-------|
| 0 ↔ 1      | 25    |
| 1 ↔ 2      | 50    |
| 2 ↔ 3      | 50    |
| 3 ↔ 4      | 75    |

### 9.4 Acciones compuestas (75 PA)

Combinan movimiento + ataque. El movimiento cuesta el 50%:

```txt
costeCompuesto = costeAtaque + costeMovimiento * 0.5
```

Ejemplos:
| Acción              | Efecto                                              |
|---------------------|------------------------------------------------------|
| Patada de entrada   | Ataca y reduce distancia en 1 (ideal rango 2)       |
| Patada de empuje    | Ataca y aumenta distancia en 1 (ideal rango 1-2)    |
| Estocada            | Ataca, mantiene distancia (ideal rango 2-3)         |
| Paso + puño         | Avanza 1 rango y golpea                             |
| Empujar + retroceder| Empuja al rival y retrocede 1 rango                 |

### 9.5 Defensa desesperada

Si el defensor no tiene PA de reacción suficientes:

```txt
efectividadDefensa *= 0.35
```

Nunca se impide la defensa por completo — solo se penaliza.

---

## 10. Exposición

### 10.1 Condición

Un luchador termina su turno en rango 0-1 y NO tiene PA de reacción
suficientes (≤ 25 PA restantes).

### 10.2 Efecto

```txt
penalizaciónDefensaExpuesto = -20%
```

---

## 11. Resolución de Turno (IA)

```
1. Calcular PA del actor (paTurno, paReaccion)
2. Elegir acción según prioridades:
    1. Si HP ≤ 0, no actuar
    2. Si arma en rango malo → corregir distancia o cambiar arma
    3. Si rival expuesto y PA suficiente → atacar
    4. Si arma proyectil y rango 3-4 → lanzar
    5. Si arma larga (Gun) y rango 0-1 → empujar o retroceder
    6. Si arma corta y rango alto → intentar entrar con compuesta
    7. Si PA para atacar y retirarse → preferir secuencia segura
    8. Si PA para combo → atacar varias veces
    9. Si no hay buena acción → recuperar postura
3. Comprobar rango y viabilidad de acción elegida
4. Aplicar coste de PA
5. Resolver ataque (con matriz de familias, eficacia de rango, tier)
6. Defensor intenta defensa (bloqueo o esquiva automática según stats)
7. Si defensa exitosa → posible contraataque (si PA reacción suficiente)
8. Aplicar cambios de distancia
9. Verificar exposición
10. Registrar eventos para frontend
11. Pasar al siguiente actor
```

---

## 12. Límites de Seguridad

- PA máximo por turno: 250
- PA de reacción máximo: 125
- Máximo 3 ataques ofensivos consecutivos por turno
- Proyectiles: máximo 5 usos por combate
- Rango máximo: 4
- Máximo 50 turnos por combate

---

## 13. Eventos para Frontend

```js
// Tipos de evento que genera el motor
[
  { type: "combat_start", rango, rangoNombre },
  { type: "turn_start", turno },
  { type: "pa", actor, pa, paReaccion },
  { type: "move", actor, fromRange, toRange, cost },
  { type: "range_change", fromRange, toRange, nombre },
  { type: "draw_weapon", actor, arma, cost },
  { type: "switch_weapon", actor, arma_vieja, arma_nueva, cost },
  { type: "attack_attempt", actor, target, action, cost, rango },
  { type: "hit", actor, target, damage, accion, conArma, nombreArma },
  { type: "glancing_hit", actor, target, damage, accion },
  { type: "critical_hit", actor, target, damage, accion },
  { type: "miss", actor, target, accion },
  { type: "block_attempt", actor, success, cost },
  { type: "block_success", actor, damageReduced, efficacy },
  { type: "dodge_attempt", actor, success, cost },
  { type: "dodge_success", actor },
  { type: "counter_attempt", actor, target, cost },
  { type: "counter_hit", actor, target, damage },
  { type: "exposed", actor, rango },
  { type: "hp_update", actor, hp, maxHp },
  { type: "combat_end", winner, nombre },
]
```

---

## 14. Inventario Completo de Armas (28)

### 14.1 Puño (6)

| # | Nombre                | Tier           | Daño   | BFrec | BEff  | Dodge | Block | wSpd |
|---|-----------------------|----------------|--------|:-----:|:-----:|:-----:|:-----:|:----:|
| 1 | Puño                  | hierro         | 2-4    | 25    | 0.25  | 25    | 20    | 1.2  |
| 2 | Puño de Hierro        | hierro         | 3-6    | 25    | 0.25  | 25    | 20    | 1.2  |
| 3 | Puño de Acero         | acero          | 4-8    | 25    | 0.25  | 25    | 20    | 1.2  |
| 4 | Puño de Acero Fino    | acero_fino     | 5-10   | 25    | 0.25  | 25    | 20    | 1.2  |
| 5 | Puño de Mitril        | mitril         | 7-13   | 30    | 0.30  | 25    | 20    | 1.2  |
| 6 | Puño de Mitril Maestro| mitril_maestro | 9-17   | 30    | 0.30  | 25    | 20    | 1.2  |

### 14.2 Dao (6)

| # | Nombre                   | Tier           | Daño   | BFrec | BEff  | Dodge | Block | wSpd |
|---|--------------------------|----------------|--------|:-----:|:-----:|:-----:|:-----:|:----:|
| 7 | Cuchillo                 | hierro         | 4-7    | 20    | 0.20  | 10    | 30    | 0.9  |
| 8 | Daga                     | hierro         | 3-6    | 20    | 0.15  | 15    | 25    | 1.0  |
| 9 | Cimitarra                | acero          | 6-11   | 20    | 0.20  | 10    | 30    | 0.9  |
| 10| Hacha                    | acero_fino     | 8-14   | 15    | 0.15  | 5     | 35    | 0.7  |
| 11| Sable                    | mitril         | 10-16  | 20    | 0.20  | 10    | 30    | 0.9  |
| 12| Dao de Mitril Maestro    | mitril_maestro | 12-19  | 20    | 0.25  | 10    | 30    | 0.9  |

### 14.3 Jian (6)

| # | Nombre                   | Tier           | Daño   | BFrec | BEff  | Dodge | Block | wSpd |
|---|--------------------------|----------------|--------|:-----:|:-----:|:-----:|:-----:|:----:|
| 13| Espada Corta             | hierro         | 4-7    | 15    | 0.15  | 15    | 25    | 1.0  |
| 14| Sai                      | hierro         | 3-7    | 20    | 0.20  | 12    | 28    | 1.0  |
| 15| Espadón                  | acero          | 7-13   | 15    | 0.15  | 10    | 30    | 0.9  |
| 16| Espada Larga             | acero_fino     | 8-14   | 15    | 0.15  | 15    | 25    | 1.0  |
| 17| Jian de Mitril           | mitril         | 9-16   | 15    | 0.20  | 15    | 25    | 1.0  |
| 18| Jian de Mitril Maestro   | mitril_maestro | 11-20  | 20    | 0.20  | 15    | 25    | 1.0  |

### 14.4 Gun (6)

| # | Nombre                   | Tier           | Daño   | BFrec | BEff  | Dodge | Block | wSpd |
|---|--------------------------|----------------|--------|:-----:|:-----:|:-----:|:-----:|:----:|
| 19| Bastón                   | hierro         | 4-7    | 15    | 0.15  | 5     | 35    | 0.7  |
| 20| Mangual                  | acero          | 6-11   | 10    | 0.10  | 5     | 30    | 0.6  |
| 21| Lanza                    | acero          | 5-10   | 15    | 0.15  | 5     | 35    | 0.7  |
| 22| Alabarda                 | acero_fino     | 7-13   | 15    | 0.15  | 5     | 35    | 0.7  |
| 23| Gun de Mitril            | mitril         | 9-16   | 15    | 0.15  | 5     | 35    | 0.7  |
| 24| Gun de Mitril Maestro    | mitril_maestro | 10-18  | 15    | 0.20  | 5     | 35    | 0.7  |

### 14.5 Shuanggou (2)

| # | Nombre                   | Tier           | Daño   | BFrec | BEff  | Dodge | Block | wSpd |
|---|--------------------------|----------------|--------|:-----:|:-----:|:-----:|:-----:|:----:|
| 25| Gancho                   | acero          | 5-9    | 25    | 0.20  | 20    | 20    | 1.1  |
| 26| Shuanggou de Mitril      | mitril         | 8-14   | 25    | 0.25  | 20    | 20    | 1.1  |

### 14.6 Fei Biao (2)

| # | Nombre                        | Tier           | Daño   | BFrec | BEff  | Dodge | Block | wSpd |
|---|-------------------------------|----------------|--------|:-----:|:-----:|:-----:|:-----:|:----:|
| 27| Shuriken                      | hierro         | 3-6    | 5     | 0.05  | 30    | 10    | 1.3  |
| 28| Fei Biao de Acero             | acero          | 4-8    | 5     | 0.05  | 30    | 10    | 1.3  |

---

## 15. Fórmulas de Daño

### 15.1 Daño base

```txt
dañoBase = fuerza + aleatorio(dano_min, dano_max)
```

### 15.2 Daño con modificadores

```txt
dañoBruto = dañoBase * factorRango * factorFamilia * factorTier
```

Donde:
- `factorRango` = `rangoEficacia[familia][rango]`
- `factorFamilia` = `familyMatrix[famAtaque][famDefensa]`
- `factorTier` = modificador por diferencia de tiers (sección 7)

### 15.3 Daño final

```txt
dañoFinal = max(1, floor(dañoBruto * skillMultiplier * (1 - defensa)))
```

### 15.4 Golpe crítico

```txt
probCritico = min(velocidad * 0.01 + skillExtraCritico, 30)
dañoCritico = floor(dañoFinal * 1.5)
```

---

## 16. Flujo de Combate (Diagrama)

```
INICIO COMBATE
  ├── Rango = 3 (Guardia)
  ├── c1.hp = max_hp, c2.hp = max_hp
  └── PA = 0

CADA TURNO (por combatiente, ordenado por velocidadEfectiva):
  1. Calcular paTurno, paReaccion
  2. Elegir acción según IA
  3. Si requiere movimiento → aplicar coste, cambiar rango
  4. Si requiere sacar arma → aplicar coste (50 PA)
  5. Si ataque:
      a. Calcular daño base
      b. Aplicar eficacia de rango
      c. Aplicar matriz de familias
      d. Aplicar comparación de tiers
      e. Aplicar skills
  6. Defensor (si aplica):
      a. ¿Tiene PA reacción? Si no → defensa desesperada
      b. Elegir defensa: bloqueo o esquiva (según stats)
      c. Calcular probBloqueo/probEsquiva
      d. Si éxito → reducir/anular daño
      e. Si éxito y PA reacción suficiente → posible contraataque
  7. Aplicar daño
  8. Verificar exposición
  9. Generar eventos
  └── Pasar al siguiente combatiente

FIN: cuando un combatiente tiene hp ≤ 0 o se alcanzan 50 turnos
```

---

## 17. Implementación

### Archivos del sistema

- `game/data.js` — definiciones de armas, familias, tiers, helpers
- `game/engine.js` — `simularCombate()`, resolución de turnos, IA, eventos
- `routes/combate.js` — endpoints de combate, carga de stats vía `aplicarSkillsYQi`
- `public/js/combate.js` — reproductor de eventos del frontend

### Constantes y estructuras clave

```js
const FAMILIES = ['puño','dao','jian','gun','shuanggou','fei_biao'];
const TIERS = ['hierro','acero','acero_fino','mitril','mitril_superior','mitril_maestro'];

const familyMatrix = {
  puño:       { puño:1.0, dao:0.8, jian:0.7, gun:0.9, shuanggou:0.8, fei_biao:0.6 },
  dao:        { puño:0.9, dao:1.0, jian:0.8, gun:0.7, shuanggou:0.9, fei_biao:0.8 },
  jian:       { puño:0.8, dao:0.9, jian:1.0, gun:0.8, shuanggou:0.7, fei_biao:0.9 },
  gun:        { puño:1.0, dao:0.7, jian:0.8, gun:1.0, shuanggou:0.8, fei_biao:0.6 },
  shuanggou:  { puño:0.9, dao:0.9, jian:0.7, gun:0.8, shuanggou:1.0, fei_biao:0.7 },
  fei_biao:   { puño:0.7, dao:0.8, jian:0.9, gun:0.6, shuanggou:0.7, fei_biao:1.0 },
};

const RANGO_EFICACIA = {
  puño:       [1.0, 0.8, 0.5, 0.3, 0.1],
  dao:        [0.8, 1.0, 0.7, 0.4, 0.2],
  jian:       [0.6, 0.8, 1.0, 0.7, 0.3],
  gun:        [0.3, 0.6, 0.9, 1.0, 0.5],
  shuanggou:  [0.7, 1.0, 0.8, 0.5, 0.2],
  fei_biao:   [0.1, 0.3, 0.6, 0.9, 1.0],
};

const FAMILIA_BLOCK = {
  puño:       { freq: 25, efficacy: 0.25 },
  dao:        { freq: 20, efficacy: 0.20 },
  jian:       { freq: 15, efficacy: 0.15 },
  gun:        { freq: 15, efficacy: 0.15 },
  shuanggou:  { freq: 25, efficacy: 0.20 },
  fei_biao:   { freq: 5,  efficacy: 0.05 },
};

const FAMILIA_DODGE = {
  puño:       25, dao: 10, jian: 15,
  gun:        5,  shuanggou: 20, fei_biao: 30,
};

const FAMILIA_BLOCKABILITY = {
  puño: 20, dao: 30, jian: 25,
  gun: 35, shuanggou: 20, fei_biao: 10,
};

const FAMILIA_WEAPON_SPEED = {
  puño: 1.2, dao: 0.9, jian: 1.0,
  gun: 0.7, shuanggou: 1.1, fei_biao: 1.3,
};
```

### Cómo se integra con el sistema existente

1. `resolverArma()` sigue funcionando para retrocompatibilidad
2. El nuevo `getArmaStatsCompletas()` devuelve todos los campos del arma
   incluyendo los específicos de familia con defaults sensatos
3. `aplicarSkillsYQi()` ya calcula `qi` y stats reales — el motor nuevo
   usa esos valores + los nuevos campos de armas
4. El bot genera armas usando `getRandomArma()` que ahora devuelve
   objetos con todos los campos nuevos
