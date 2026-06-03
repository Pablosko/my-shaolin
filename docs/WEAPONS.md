# Armas

## Lista actual (12 armas)

| Arma | Tipo | Daño min | Daño max |
|------|------|----------|----------|
| Cuchillo | corto | 2 | 5 |
| Espadón | pesado | 4 | 8 |
| Maza | contundente | 3 | 7 |
| Hacha | pesado | 5 | 9 |
| Látigo | corto | 2 | 6 |
| Shuriken | corto | 1 | 4 |
| Sai | corto | 2 | 5 |
| Mangual | contundente | 4 | 8 |
| Martillo | contundente | 6 | 10 |
| Lanza | pesado | 3 | 7 |
| Cimitarra | pesado | 4 | 8 |
| Alabarda | pesado | 5 | 9 |

## Eficacia por rango (nuevo sistema)

Cada arma tiene eficacia según el rango de distancia. La eficacia afecta a precisión, daño y probabilidad de técnica.

```js
const weapon = {
  name: "Lanza",
  rangeEffectiveness: {
    0: 0.15,  // contacto: muy mala
    1: 0.35,  // corta: mala
    2: 0.75,  // media: buena
    3: 1.0,   // guardia: óptima
    4: 0.25,  // proyectil: muy mala
  },
  baseDamage: 10,
  actionCost: 50
}
```

Fórmulas:

```txt
eficaciaRango = weapon.rangeEffectiveness[currentRange]
precisionFinal = precisionBase * eficaciaRango
dañoFinal = dañoBase * (0.5 + eficaciaRango * 0.5)
```

## Tabla de eficacia por arma

| Arma | Rango óptimo | Usable | Malo |
|------|-------------|--------|------|
| Puños | 0-1 | 2 | 3-4 |
| Cuchillo | 0-1 | 2 | 3-4 |
| Espada corta | 1 | 0, 2 | 3-4 |
| Espada recta | 2 | 1, 3 | 0, 4 |
| Bastón | 2-3 | 1 | 0, 4 |
| Lanza | 3 | 2 | 0-1, 4 |
| Guandao | 2-3 | 1 | 0, 4 |
| Shuriken | 3-4 | 2 | 0-1 |
| Dardos | 3-4 | 2 | 0-1 |

## Acciones especiales por arma

### Lanza en corta distancia (rango 0-1)

Opciones:
- **Empujar con asta** (50 PA): si acierta, aumenta distancia +1. Escala con Fuerza y Agilidad.
- **Golpe con mango** (50 PA): daño bajo, puede empujar si acierta. Usable en rango 0-1.

## Implementación actual

**Archivo:** `game/data.js:1-14` — Array `armas` con nombre, tipo, dano_min, dano_max.

**Uso en combate:**
- `game/engine.js:2-11` — Busca arma equipada, calcula daño del arma como `dano_min + random(dano_max - dano_min)`, lo suma al daño base.
- `routes/shaolin.js:59-64` — Asignación de arma al crear personaje (elección 0).

**Tabla BD:** `armas` — `shaolin_id`, `nombre`, `tipo`, `dano_min`, `dano_max`, `equipada`.
