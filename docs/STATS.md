# Stats

## 4 Estadísticas principales

### Vida

Determina los puntos de vida máximos.

```txt
pvMax = 50 + vida * 10
```

- Vida simple y fácil de entender.
- No da demasiadas ventajas secundarias (evita builds full vida dominantes).
- La resistencia real al daño se apoya más en Fuerza.

### Fuerza

Determina el daño físico y la resistencia a los golpes.

```txt
dañoBase = 3 + fuerza * 1.2
resistenciaFisica = fuerza * 0.25
```

El daño final aplicado considera la resistencia del defensor:

```txt
dañoFinal = max(1, dañoShaolin - resistenciaFisicaDefensor)
```

- Fuerza alta = más daño.
- Fuerza alta también ayuda a absorber impactos (papel defensivo moderado).

### Agilidad

Determina la calidad del movimiento.

- Esquivar
- Bloquear de forma limpia
- Contraatacar
- Entrar bajo armas largas
- Salir sin quedar expuesto
- Ejecutar acciones con desplazamiento

**Regla de diseño**: Agilidad = qué tan bien ejecutas. Velocidad = cuántas cosas puedes hacer.

**Probabilidad de esquiva**:

```txt
probEsquiva = clamp(2, 45, agilidad * (0.75 + velocidad / 60))
```

Ejemplos:
- Agilidad 3 / Velocidad 20 → esquiva baja
- Agilidad 20 / Velocidad 3 → esquiva media/alta
- Agilidad 20 / Velocidad 20 → esquiva alta

### Velocidad

Determina el presupuesto de acciones por turno (PA) y el tempo del luchador.

- PA por turno
- Iniciativa (ataca primero quien tiene más velocidad)
- Acciones encadenadas
- Defensas reactivas
- Contraataques
- Cambios de arma rápidos
- Entrar y salir de distancia

**Fórmula MVP** (sin reducción por nivel):

```txt
paTurno = clamp(100, 250, 100 + floor(sqrt(velocidad) * 12))
```

**Fórmula con reducción por nivel** (recomendada para late-game):

```txt
factorNivel = 1 / (1 + nivel / 120)
paTurno = clamp(100, 250, 100 + floor(sqrt(velocidad) * 18 * factorNivel))
```

Ejemplos con fórmula MVP:

| Velocidad | PA/turno |
|-----------|----------|
| 3         | ~120     |
| 10        | ~138     |
| 25        | ~160     |
| 50        | ~184     |
| 100       | ~220     |
| 200       | 250 cap  |

**Probabilidad de crítico** (implementación actual):

```txt
probCritico = velocidad * 0.01
```

**Probabilidad de contraataque**:

```txt
probContraataque = clamp(0, 60, velocidad * (0.5 + agilidad / 80))
```

Requiere defensa exitosa y ≥50 PA de reacción.

---

## Qi (Armonía interna)

### Definición

El Qi no es una stat que se sube directamente. Se calcula a partir del equilibrio entre las 4 stats principales y el nivel.

```txt
Qi = PotencialQiPorNivel * ArmoniaStats
```

### Potencial de Qi por nivel

```txt
potencialQi = nivel >= 70 ? 100 : 29 + nivel
```

| Nivel | Potencial Qi |
|-------|-------------|
| 1     | 30%         |
| 10    | 39%         |
| 40    | 69%         |
| 70    | 100%        |

### Armonía de stats

Mide cuánto se desvían las stats respecto a su media.

```txt
media = promedio(vida, fuerza, agilidad, velocidad)

desviacionRelativa = promedio(
  abs(stat - media) / media
)

bonusMaestriaPost70 = nivel <= 70 ? 0 : min(0.07, (nivel - 70) * 0.001)
tolerancia = 0.08 + bonusMaestriaPost70
desviacionEfectiva = max(0, desviacionRelativa - tolerancia)
armonia = clamp(0.50, 1.00, 1 - desviacionEfectiva * 2.2)
```

- La tolerancia permite pequeñas especializaciones sin penalización.
- A partir de nivel 70 se permite más especialización sin romper el Qi.
- Qi 100 debe ser raro.

### Qi final

```txt
qi = round(potencialQi * armonia)
```

### Uso del Qi

**Armonía** afecta a eficiencia general: precisión, esquiva, bloqueo, contraataque, técnicas internas.
**Qi visible** desbloquea técnicas:

| Qi mínimo | Técnicas |
|-----------|----------|
| 60+       | Internas básicas |
| 75+       | Avanzadas |
| 90+       | Maestras |
| 95+       | Legendarias |

---

## Stats relativas

El combate usa diferencias relativas, no solo valores absolutos.

```txt
ventajaStat = miStat / (miStat + statRival)
```

| Rango | Estado |
|-------|--------|
| 0.45–0.55 | Armonía |
| 0.56–0.65 | Ligera ventaja |
| 0.66–0.75 | Ventaja clara |
| 0.76–0.85 | Dominio |
| 0.86+     | Dominio absoluto |

---

## Stats iniciales por género

A nivel 1 las stats son fijas según el género, más 1 punto extra aleatorio:

| Género     | Fuerza | Agilidad | Velocidad | HP base |
|------------|--------|----------|-----------|---------|
| Masculino  | 3      | 2        | 2         | 55      |
| Femenino   | 2      | 3        | 3         | 50      |

**1 punto extra aleatorio** se reparte entre: +1 Fuerza, +1 Agilidad, +1 Velocidad o +5 HP.

> **Regla:** 5 HP = 1 punto de habilidad.

## Implementación actual

**Archivos relevantes:**
- `game/engine.js:1-78` — `calcularDaño()`, lógica de daño actual
- `game/data.js:53-67` — `generarStatsIniciales(genero)`, stats de creación por género
- `routes/shaolin.js:49-54` — Inserción de stats en BD al crear
- `routes/combate.js:124-130` — Subida de nivel (incremento de stats)

**Tabla BD:** `shaolins` tiene columnas: `hp`, `max_hp`, `fuerza`, `agilidad`, `velocidad`, `level`, `xp`.

### Ajustes aplicados

#### Precisión de golpe (reemplaza esquiva pura)
La probabilidad de acierto se calcula como:
```js
probAcierto = clamp(0.20, 0.98, 0.85 + (atacante.agilidad - defensor.agilidad) * 0.02)
```
- Antes: ~52% base de acierto vs. dodge puro de ~45%.
- Ahora: 85% base, la agilidad del atacante aumenta y la del defensor reduce.
- La esquiva como habilidad (10% base) se mantiene como capa separada en `engine.js`.

#### Barras de stat — visualización
- **10 segmentos fijos** por barra (sin importar el valor de la stat).
- Color por posición: 1 (izquierda) = verde, 10 (derecha) = rojo, gradiente entre medias.
- Se llenan `Math.min(valor, 10)` segmentos. Valores >10 no dibujan más allá del segmento 10.
- **HP no tiene barra**: solo muestra ❤️ + número.
- Implementado en `public/js/shaolin.js:renderSegBar()`, CSS en `public/css/style.css`.
