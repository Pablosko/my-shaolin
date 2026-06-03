# Habilidades

## Lista actual (10 habilidades)

| Habilidad | Stat | Efecto | Valores |
|-----------|------|--------|---------|
| Fuerza de Hércules | fuerza | Aumenta fuerza | +5 a +20 |
| Agilidad felina | agilidad | Aumenta agilidad | +5 a +20 |
| Golpe del rayo | velocidad | Aumenta velocidad | +5 a +20 |
| Vitalidad | hp | Aumenta vida máxima | +5 a +20 |
| Escudo | defensa | Reduce daño recibido 25% | 15%-35% |
| Puñal trapero | contraataque | Probabilidad de contraatacar | 10%-30% |
| Intocable | esquiva | Probabilidad de esquivar | 10%-25% |
| Tornado de golpes | multigolpe | Probabilidad de golpe múltiple | 10%-20% |
| Piel reforzada | resistencia | Reduce daño cuerpo a cuerpo | 10%-30% |
| Inmortal | hp_porcentual | Aumenta vida 5%-50% | 5%-50% |

## Efectos en combate

Cada habilidad tiene un `efecto` almacenado como JSON:

```json
{ "stat": "fuerza", "valor": { "min": 5, "max": 20 } }
```

- **Stats directas** (fuerza, agilidad, velocidad, hp): se suman al multiplicador de daño.
- **Defensa**: reduce el daño recibido porcentualmente.
- **Esquiva**: aumenta la probabilidad base de esquivar (de 10% a hasta 20%).
- **Contraataque**: probabilidad de contraatacar al recibir daño (si el arma lo permite).
- **Multigolpe**: probabilidad de ataque adicional.
- **Resistencia**: se omite en el cálculo de daño ofensivo (es defensiva).
- **hp_porcentual**: aumenta vida máxima porcentualmente.

## Implementación actual

**Archivo:** `game/data.js:16-27` — Array `habilidades`.

**Uso en combate:**
- `game/engine.js:15-25` — Las habilidades que afectan stats (fuerza, agilidad, velocidad, hp) aumentan el multiplicador de daño.
- `game/engine.js:35-44` — Esquiva: comprueba si hay habilidad 'esquiva' para aumentar probabilidad.
- `game/engine.js:46-54` — Defensa: reduce daño `dañoFinal * (1 - defensa)`.
- `game/engine.js:64-75` — Multigolpe: probabilidad de ataque extra.
- `game/engine.js:85-97` — Contraataque: probabilidad tras recibir daño.

**Tabla BD:** `habilidades` — `shaolin_id`, `nombre`, `descripcion`, `efecto` (JSON string).
