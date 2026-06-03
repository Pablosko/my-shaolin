const { getValorHabilidadPorNivel } = require('./data');

function aplicarSkillsACombate(b) {
  if (!b.habilidades) return;
  for (const hab of b.habilidades) {
    const e = typeof hab.efecto === 'string' ? JSON.parse(hab.efecto) : hab.efecto;
    const valor = getValorHabilidadPorNivel(hab.efecto, hab.nivel || 1);
    if (e.stat === 'fuerza_porcentual' && b.statsBase) {
      b.fuerza = Math.floor(b.statsBase.fuerza * (1 + valor));
    } else if (e.stat === 'agilidad_porcentual' && b.statsBase) {
      b.agilidad = Math.floor(b.statsBase.agilidad * (1 + valor));
    } else if (e.stat === 'velocidad_porcentual' && b.statsBase) {
      b.velocidad = Math.floor(b.statsBase.velocidad * (1 + valor));
    } else if (e.stat === 'hp_porcentual' && b.statsBase) {
      b.max_hp = Math.floor(b.statsBase.max_hp * (1 + valor));
    }
  }
}

const MAX_TURNOS = 50;
const PA_CAP = 250;
const COST_MOVE = [25, 50, 50, 75];
const COST_SIMPLE = 50;
const COST_COMPUESTA = 75;
const COST_PESADA = 100;
const COST_PROYECTIL = 125;
const COST_DEFENSA = 50;

const RANGO = { CONTACTO: 0, CORTA: 1, MEDIA: 2, GUARDIA: 3, LARGA: 4 };
const RANGO_NOMBRE = ['Contacto', 'Corta', 'Media', 'Guardia', 'Larga'];

function paPorTurno(velocidad) {
  return Math.max(100, Math.min(PA_CAP, 100 + Math.floor(Math.sqrt(velocidad) * 12)));
}

function distanciaEntre(r1, r2) {
  return Math.abs(r1 - r2);
}

function calcularDañoBásico(atacante, defensor, armaEquipada, rangeEffect) {
  const usaArma = !!armaEquipada;
  let dañoBase;
  let accion;
  if (usaArma) {
    const d = armaEquipada;
    const dañoArma = d.dano_min + Math.floor(Math.random() * (d.dano_max - d.dano_min + 1));
    dañoBase = atacante.fuerza + dañoArma;
    accion = 'atacó con ' + d.nombre;
  } else {
    if (Math.random() < 0.4) {
      dañoBase = Math.floor(atacante.fuerza * 0.3) + (7 + Math.floor(Math.random() * 3));
      accion = 'pateó';
    } else {
      dañoBase = Math.floor(atacante.fuerza * 0.3) + (5 + Math.floor(Math.random() * 3));
      accion = 'golpeó';
    }
  }
  dañoBase = Math.floor(dañoBase * rangeEffect);
  return { dañoBase, usaArma, nombreArma: usaArma ? armaEquipada.nombre : null, accion };
}

function simularCombate(b1, b2, skills1, skills2, onPerderArma) {
  const s1 = skills1 || { dañoArma: 1, dañoPuño: 1, extraDefensa: 0, extraResistencia: 0, extraCritico: 0, extraEsquiva: 0, extraCombo: 0, extraContra: 0, roboVida: 0 };
  const s2 = skills2 || { dañoArma: 1, dañoPuño: 1, extraDefensa: 0, extraResistencia: 0, extraCritico: 0, extraEsquiva: 0, extraCombo: 0, extraContra: 0, roboVida: 0 };

  const c1 = {
    ...b1, hp_actual: b1.max_hp, armas: b1.armas || [], habilidades: b1.habilidades || [],
    statsBase: { fuerza: b1.fuerza, agilidad: b1.agilidad, velocidad: b1.velocidad, max_hp: b1.max_hp },
    qi: b1.qi || 50, arma_equipada: null,
  };
  const c2 = {
    ...b2, hp_actual: b2.max_hp, armas: b2.armas || [], habilidades: b2.habilidades || [],
    statsBase: { fuerza: b2.fuerza, agilidad: b2.agilidad, velocidad: b2.velocidad, max_hp: b2.max_hp },
    qi: b2.qi || 50, arma_equipada: null,
  };

  aplicarSkillsACombate(c1);
  aplicarSkillsACombate(c2);

  const log = [];
  let rango = RANGO.GUARDIA;
  let turno = 0;

  log.push({ type: 'combat_start', rango, rangoNombre: RANGO_NOMBRE[rango] });

  function e(type, data) {
    log.push({ ...data, type });
  }

  function getSkillSet(combat) {
    return combat === c1 ? s1 : s2;
  }

  function getArmaEfectoRango(arma, r) {
    if (!arma) return 1;
    const tipo = arma.tipo || 'corto';
    const eficacia = { corto: [1, 1, 0.7, 0.4, 0.2], pesado: [0.6, 0.8, 1, 0.7, 0.3], contundente: [1, 1, 0.8, 0.5, 0.2] };
    return (eficacia[tipo] || eficacia.corto)[r] || 0.5;
  }

  function puedeAtacar(distancia, arma) {
    if (!arma) return distancia <= 2;
    const tipo = arma.tipo || 'corto';
    const efectivo = { corto: [true, true, false, false, false], pesado: [true, true, true, false, false], contundente: [true, true, false, false, false] };
    return (efectivo[tipo] || efectivo.corto)[distancia];
  }

  function intentarDibujar(combat) {
    if (combat.armas.length === 0) return null;
    if (!combat.arma_equipada) {
      if (Math.random() < 0.33) {
        return combat.armas.find(a => a.equipada) || combat.armas[0];
      }
      return null;
    }
    const otras = combat.armas.filter(a => a.nombre !== combat.arma_equipada.nombre);
    if (otras.length > 0 && Math.random() < 0.3) {
      return otras[Math.floor(Math.random() * otras.length)];
    }
    return null;
  }

  function procesarAtaque(atk, def, skillsAtk, skillsDef, dist) {
    const arma = atk.arma_equipada;
    const rangeEff = getArmaEfectoRango(arma, dist);
    const ataque = calcularDañoBásico(atk, def, arma, rangeEff);

    const probAcierto = Math.min(0.98, Math.max(0.20, 0.85 + (atk.agilidad - def.agilidad) * 0.02));
    const acierta = Math.random() < probAcierto;
    if (!acierta) {
      return { daño: 0, esquivo: true, critico: false, ...ataque, probAcierto };
    }

    const probEsquiva = 0.1 + skillsDef.extraEsquiva;
    if (Math.random() < probEsquiva) {
      return { daño: 0, esquivo: true, critico: false, ...ataque, probAcierto };
    }

    let defensa = skillsDef.extraDefensa + skillsDef.extraResistencia;
    const mult = ataque.usaArma ? skillsAtk.dañoArma : skillsAtk.dañoPuño;
    const dañoPot = Math.max(1, Math.floor(ataque.dañoBase * mult));
    const dañoFinal = Math.max(1, Math.floor(dañoPot * (1 - defensa)));

    const probCrit = atk.velocidad * 0.01 + skillsAtk.extraCritico;
    const critico = Math.random() < probCrit;

    return { daño: critico ? Math.floor(dañoFinal * 1.5) : dañoFinal, esquivo: false, critico, ...ataque, probAcierto };
  }

  function procesarDefensa(def, skillsDef, ataque) {
    if (ataque.esquivo) return { bloqueo: false, contraataca: false, daño_contra: 0 };
    const probContra = skillsDef.extraContra;
    const contra = Math.random() < probContra;
    const dañoContra = contra ? Math.max(1, Math.floor(def.fuerza * 0.5)) : 0;
    return { bloqueo: false, contraataca: contra, daño_contra: dañoContra };
  }

  function procesarActor(atk, def, skillsAtk, skillsDef) {
    const turnoPa = paPorTurno(atk.velocidad);
    e('pa', { actor: atk.name, pa: turnoPa });

    const armaAntes = atk.arma_equipada;
    const drawn = intentarDibujar(atk);
    if (drawn) {
      atk.arma_equipada = drawn;
      if (!armaAntes) {
        e('draw_weapon', { actor: atk.name, arma: drawn.nombre });
      } else if (drawn.nombre !== armaAntes.nombre) {
        e('switch_weapon', { actor: atk.name, arma_vieja: armaAntes.nombre, arma_nueva: drawn.nombre });
      }
    }

    let paDisponible = turnoPa;
    let accionesTomadas = 0;

    while (paDisponible >= COST_SIMPLE && accionesTomadas < 4) {
      const dist = distanciaEntre(rango, 0);
      const armaAtk = atk.arma_equipada;
      const puede = puedeAtacar(dist, armaAtk);

      if (puede) {
        if (paDisponible >= COST_SIMPLE) {
          paDisponible -= COST_SIMPLE;
          accionesTomadas++;

          const a = procesarAtaque(atk, def, skillsAtk, skillsDef, dist);

          if (a.usaArma && a.nombreArma && !a.esquivo) {
            const probPerder = Math.min(0.05, (a.daño / def.max_hp) * 0.05);
            if (Math.random() < probPerder && def.arma_equipada) {
              e('drop_weapon', { actor: def.name, arma: def.arma_equipada.nombre });
              if (onPerderArma && def.id > 0) onPerderArma(def.id, def.arma_equipada.id);
              def.arma_equipada = null;
            }
          }

          if (a.esquivo) {
            e('miss', { actor: atk.name, target: def.name, accion: a.accion });
            e('dodge', { actor: def.name });
          } else {
            def.hp_actual = Math.max(0, def.hp_actual - a.daño);
            if (a.critico) {
              e('critical_hit', { actor: atk.name, target: def.name, damage: a.daño, accion: a.accion, conArma: a.usaArma, nombreArma: a.nombreArma });
            } else {
              e('hit', { actor: atk.name, target: def.name, damage: a.daño, accion: a.accion, conArma: a.usaArma, nombreArma: a.nombreArma });
            }

            const defResult = procesarDefensa(def, skillsDef, a);
            if (defResult.contraataca && def.hp_actual > 0 && a.daño > 0) {
              const dañoContra = defResult.daño_contra;
              atk.hp_actual = Math.max(0, atk.hp_actual - dañoContra);
              e('counter_hit', { actor: def.name, target: atk.name, damage: dañoContra });
            }

            if (skillsAtk.roboVida > 0 && a.daño > 0) {
              const qi = atk.qi || 50;
              const robo = Math.floor(a.daño * (qi * 0.001));
              if (robo > 0) {
                atk.hp_actual = Math.min(atk.max_hp, atk.hp_actual + robo);
                e('life_steal', { actor: atk.name, amount: robo });
              }
            }

            e('hp_update', { actor: atk.name, hp: atk.hp_actual, maxHp: atk.max_hp });
            e('hp_update', { actor: def.name, hp: Math.max(0, def.hp_actual), maxHp: def.max_hp });
          }

          if (def.hp_actual <= 0) return;
        }
      } else {
          if (paDisponible >= COST_MOVE[dist - 1]) {
            const cost = COST_MOVE[dist - 1];
            paDisponible -= cost;
            if (rango > 0) {
              rango--;
              e('move', { actor: atk.name, from: rango + 1, to: rango, cost, retrocede: false });
              e('range_change', { rango, nombre: RANGO_NOMBRE[rango] });
            }
            continue;
          }
      }
      break;
    }

    if (rango <= 1) {
      e('exposed', { actor: 'Ninguno', mensaje: 'Distancia corta, combate intenso' });
    }
  }

  while (turno < MAX_TURNOS) {
    turno++;

    let p1, p2;
    if (c1.velocidad >= c2.velocidad) {
      p1 = c1; p2 = c2;
    } else {
      p1 = c2; p2 = c1;
    }

    e('turn_start', { turno });

    procesarActor(p1, p2, p1 === c1 ? s1 : s2, p1 === c1 ? s2 : s1);
    if (p2.hp_actual <= 0) { e('hp_update', { actor: p2.name, hp: 0, maxHp: p2.max_hp }); break; }

    procesarActor(p2, p1, p2 === c1 ? s1 : s2, p2 === c1 ? s2 : s1);
    if (p1.hp_actual <= 0) { e('hp_update', { actor: p1.name, hp: 0, maxHp: p1.max_hp }); break; }
  }

  const winner = c1.hp_actual > c2.hp_actual ? b1.id : b2.id;
  e('combat_end', { winner, nombre: winner === b1.id ? b1.name : b2.name });

  return {
    winner_id: winner,
    log: JSON.stringify(log),
    hp_final_combat1: c1.hp_actual,
    hp_final_combat2: c2.hp_actual,
  };
}

module.exports = { simularCombate };
