const {
  FAMILIA_BLOCK, FAMILIA_DODGE, FAMILIA_BLOCKABILITY,
  FAMILIA_WEAPON_SPEED, RANGO_EFICACIA, familyMatrix,
  TIERS,
  modificadorTier,
} = require('./data');

const MAX_TURNOS = 50;
const MAX_PA = 250;
const PA_SIMPLE = 50;
const PA_DRAW = 50;
const PA_COMPUESTA = 75;
const PA_PESADA = 100;
const PA_DEFENSA = 50;
const PA_PROYECTIL_COMBO = 125;
const MAX_ATAQUES = 3;
const MAX_PROYECTILES = 5;

const DIST_NOMBRE = ['', 'Contacto', 'Corta', 'Corta', 'Media', 'Media', 'Guardia', 'Guardia', 'Larga', 'Larga'];

const IDEAL_DISTANCIA = {
  puño: 1,
  dao: 2,
  jian: 4,
  gun: 6,
  shuanggou: 2,
  fei_biao: 6,
};

function distanciaAIndice(dist) {
  if (dist <= 1) return 0;
  if (dist <= 3) return 1;
  if (dist <= 5) return 2;
  if (dist <= 7) return 3;
  return 4;
}

function nombreDistancia(dist) {
  return DIST_NOMBRE[Math.min(Math.max(1, dist), 9)] || 'Desconocido';
}

function paPorTurno(velocidad) {
  return Math.max(100, Math.min(MAX_PA, 100 + Math.floor(Math.sqrt(velocidad) * 12)));
}

function velocidadEf(combat) {
  const arma = combat.arma_equipada;
  const wSpeed = arma ? (FAMILIA_WEAPON_SPEED[arma.familia] || 1.0) : 1.2;
  return Math.floor(combat.velocidad * wSpeed);
}

function rangoIdealDist(arma) {
  if (!arma) return 1;
  return IDEAL_DISTANCIA[arma.familia] || 2;
}

function rangoEficacia(familia, rangoIdx) {
  const curva = RANGO_EFICACIA[familia];
  if (!curva) return 0.5;
  return curva[Math.min(Math.max(0, rangoIdx), 4)] ?? 0.5;
}

function probEsquiva(defensor, armaAtacante) {
  const familiaAtk = armaAtacante ? armaAtacante.familia : 'puño';
  const dodgeability = FAMILIA_DODGE[familiaAtk] || 10;
  const prob = defensor.agilidad * 0.6 + defensor.velocidad * 0.3 + dodgeability - 15;
  return Math.max(2, Math.min(60, prob));
}

function probBloqueo(defensor, armaAtacante, armaDef, dist, distIdealAtk) {
  const familiaDef = armaDef ? armaDef.familia : 'puño';
  const bFreq = (FAMILIA_BLOCK[familiaDef] || { freq: 10 }).freq;
  const blockability = armaAtacante ? (FAMILIA_BLOCKABILITY[armaAtacante.familia] || 20) : 20;

  let prob = bFreq + defensor.velocidad * 0.3 + defensor.agilidad * 0.2;
  if (dist !== distIdealAtk) prob += 15;
  prob -= blockability * 0.5;

  const qi = defensor.qi || 50;
  prob *= (0.8 + (qi / 100) * 0.2);

  return Math.max(2, Math.min(80, prob));
}

function blockEff(armaDef, armaAtacante) {
  const familiaDef = armaDef ? armaDef.familia : 'puño';
  let efficacy = (FAMILIA_BLOCK[familiaDef] || { efficacy: 0.10 }).efficacy;
  if (armaDef && armaAtacante && armaDef.tier && armaAtacante.tier) {
    const idxDef = TIERS.indexOf(armaDef.tier);
    const idxAtk = TIERS.indexOf(armaAtacante.tier);
    if (idxDef !== -1 && idxAtk !== -1 && idxAtk > idxDef) {
      efficacy *= Math.max(0.5, 1 - (idxAtk - idxDef) * 0.15);
    }
  }
  return efficacy;
}

function probContra(defensor) {
  const prob = defensor.velocidad * 0.4 + defensor.agilidad * 0.2;
  return Math.max(0, Math.min(50, prob));
}

function costoPaso(pos) {
  if (pos === 1) return 25;
  if (pos <= 3) return 50;
  return 75;
}

function calcularDaño(atk, def, skillsAtk, skillsDef, dist, arma) {
  const rIdx = distanciaAIndice(dist);
  const familia = arma ? arma.familia : 'puño';
  const rEff = arma ? rangoEficacia(familia, rIdx) : rangoEficacia('puño', rIdx);

  const usaArma = !!arma;
  let dañoBase;
  let accion;
  let nombreArma = null;

  if (usaArma) {
    const d = arma;
    const dañoArma = d.dano_min + Math.floor(Math.random() * (d.dano_max - d.dano_min + 1));
    dañoBase = atk.fuerza + dañoArma;
    accion = 'atacó con ' + d.nombre;
    nombreArma = d.nombre;
  } else {
    if (Math.random() < 0.4) {
      dañoBase = Math.floor(atk.fuerza * 0.3) + (7 + Math.floor(Math.random() * 3));
      accion = 'pateó';
    } else {
      dañoBase = Math.floor(atk.fuerza * 0.3) + (5 + Math.floor(Math.random() * 3));
      accion = 'golpeó';
    }
  }

  const defFamilia = def.arma_equipada ? def.arma_equipada.familia : 'puño';
  const famMult = familyMatrix[familia]?.[defFamilia] || 1.0;

  let tierMult = 1;
  if (arma && def.arma_equipada && arma.tier && def.arma_equipada.tier) {
    tierMult = modificadorTier(def.arma_equipada.tier, arma.tier);
  }

  const dañoBruto = Math.floor(dañoBase * rEff * famMult * tierMult);
  const mult = usaArma ? skillsAtk.dañoArma : skillsAtk.dañoPuño;
  const dañoPot = Math.max(1, Math.floor(dañoBruto * mult));
  const defensa = skillsDef.extraDefensa + skillsDef.extraResistencia;
  const dañoFinal = Math.max(1, Math.floor(dañoPot * (1 - defensa)));

  return { dañoFinal, usaArma, nombreArma, accion };
}

function simularCombate(b1, b2, skills1, skills2, onPerderArma) {
  const s1 = skills1 || { dañoArma: 1, dañoPuño: 1, extraDefensa: 0, extraResistencia: 0, extraCritico: 0, extraEsquiva: 0, extraCombo: 0, extraContra: 0, roboVida: 0 };
  const s2 = skills2 || { dañoArma: 1, dañoPuño: 1, extraDefensa: 0, extraResistencia: 0, extraCritico: 0, extraEsquiva: 0, extraCombo: 0, extraContra: 0, roboVida: 0 };

  const c1 = {
    ...b1, hp_actual: b1.max_hp, armas: (b1.armas || []).slice(),
    habilidades: b1.habilidades || [], qi: b1.qi || 50,
    arma_equipada: null, exposed: false, proyectiles: 0, pos: 2,
  };
  const c2 = {
    ...b2, hp_actual: b2.max_hp, armas: (b2.armas || []).slice(),
    habilidades: b2.habilidades || [], qi: b2.qi || 50,
    arma_equipada: null, exposed: false, proyectiles: 0, pos: 2,
  };

  const log = [];
  let turno = 0;

  function distancia() {
    return c1.pos + c2.pos - 1;
  }

  function ev(type, data) {
    log.push({ ...data, type });
  }

  ev('combat_start', { distancia: distancia(), nombre: nombreDistancia(distancia()), p1: c1.pos, p2: c2.pos });

  function getSkills(combat) {
    return combat === c1 ? s1 : s2;
  }

  function getOppositeSkills(combat) {
    return combat === c1 ? s2 : s1;
  }

  function getOpponent(combat) {
    return combat === c1 ? c2 : c1;
  }

  function tryDraw(combat) {
    if (combat.armas.length === 0) return null;
    const equipada = combat.arma_equipada;
    if (!equipada) {
      if (Math.random() < 0.33) {
        return combat.armas.find(a => a.equipada) || combat.armas[0];
      }
      return null;
    }
    const otras = combat.armas.filter(a => a.nombre !== equipada.nombre);
    if (otras.length > 0 && Math.random() < 0.25) {
      return otras[Math.floor(Math.random() * otras.length)];
    }
    return null;
  }

  function doMove(actor, steps) {
    const oldPos = actor.pos;
    actor.pos = Math.max(1, Math.min(5, actor.pos + steps));
    return { oldPos, newPos: actor.pos };
  }

  function processTurn(actor, defender) {
    const skillsA = getSkills(actor);
    const skillsD = getSkills(defender);

    const pa = paPorTurno(actor.velocidad);
    const react = Math.floor(pa * 0.5);
    let paLeft = pa;
    defender.pa_react = (defender.pa_react || 0) + Math.floor(paPorTurno(defender.velocidad) * 0.5);
    if (defender.pa_react > MAX_PA / 2) defender.pa_react = MAX_PA / 2;

    ev('pa', { actor: actor.name, pa, paReaccion: react });

    // Try draw weapon
    const drawn = tryDraw(actor);
    if (drawn) {
      const cost = drawn.drawCost || PA_DRAW;
      if (paLeft >= cost) {
        paLeft -= cost;
        const old = actor.arma_equipada;
        actor.arma_equipada = drawn;
        if (!old) {
          ev('draw_weapon', { actor: actor.name, arma: drawn.nombre, cost });
        } else if (old.nombre !== drawn.nombre) {
          ev('switch_weapon', { actor: actor.name, arma_vieja: old.nombre, arma_nueva: drawn.nombre, cost });
        }
      }
    }

    let ataquesTurno = 0;

    while (paLeft >= PA_SIMPLE && ataquesTurno < MAX_ATAQUES && actor.hp_actual > 0) {
      const arma = actor.arma_equipada;
      const dist = distancia();
      const rIdx = distanciaAIndice(dist);
      const idealDist = arma ? rangoIdealDist(arma) : 1;
      const enRango = arma
        ? (rangoEficacia(arma.familia, rIdx) >= 0.6)
        : (dist <= 2);

      // AI decision
      if (!enRango) {
        const diff = dist - idealDist;
        const dir = diff > 0 ? -1 : 1;

        // Aggressive charge: random 2-step advance + attack
        if (Math.random() < 0.2 && paLeft >= PA_PESADA) {
          paLeft -= PA_PESADA;
          ataquesTurno++;
          const { oldPos, newPos } = doMove(actor, dir * 2);
          const newDist = distancia();
          ev('move', { actor: actor.name, from: oldPos, to: newPos, p1: c1.pos, p2: c2.pos, distancia: newDist, cost: PA_PESADA, retrocede: actor === c2 ? diff < 0 : diff < 0 });
          ev('range_change', { distancia: newDist, p1: c1.pos, p2: c2.pos, nombre: nombreDistancia(newDist) });
          resolveAttack(actor, defender, skillsA, skillsD, newDist);
          if (defender.hp_actual <= 0) break;
          continue;
        }

        // Charge if far from ideal
        if (Math.abs(diff) >= 3 && paLeft >= PA_PESADA) {
          paLeft -= PA_PESADA;
          ataquesTurno++;
          const { oldPos, newPos } = doMove(actor, dir * 2);
          const newDist = distancia();
          ev('move', { actor: actor.name, from: oldPos, to: newPos, p1: c1.pos, p2: c2.pos, distancia: newDist, cost: PA_PESADA, retrocede: actor === c2 ? diff < 0 : diff < 0 });
          ev('range_change', { distancia: newDist, p1: c1.pos, p2: c2.pos, nombre: nombreDistancia(newDist) });
          resolveAttack(actor, defender, skillsA, skillsD, newDist);
          if (defender.hp_actual <= 0) break;
          continue;
        }

        // Single step toward ideal
        const stepCost = costoPaso(actor.pos);
        if (paLeft >= stepCost) {
          paLeft -= stepCost;
          const { oldPos, newPos } = doMove(actor, dir);
          const newDist = distancia();
          ev('move', { actor: actor.name, from: oldPos, to: newPos, p1: c1.pos, p2: c2.pos, distancia: newDist, cost: stepCost, retrocede: dir > 0 });
          ev('range_change', { distancia: newDist, p1: c1.pos, p2: c2.pos, nombre: nombreDistancia(newDist) });
          continue;
        }

        // Can't move, try switch weapon
        const alternative = actor.armas.find(a =>
          a.nombre !== (arma ? arma.nombre : '') &&
          rangoEficacia(a.familia, distanciaAIndice(dist)) >= 0.6
        );
        if (alternative && paLeft >= PA_SIMPLE) {
          paLeft -= PA_SIMPLE;
          actor.arma_equipada = alternative;
          ev('switch_weapon', { actor: actor.name, arma_vieja: arma ? arma.nombre : null, arma_nueva: alternative.nombre, cost: PA_SIMPLE });
          continue;
        }
        break;
      }

      // In range — attack
      if (paLeft >= PA_SIMPLE) {
        const distBf = distancia();
        paLeft -= PA_SIMPLE;
        ataquesTurno++;
        resolveAttack(actor, defender, skillsA, skillsD, distBf);
        if (defender.hp_actual <= 0) break;

        // Fei Biao: retreat if enemy close
        if (arma && arma.familia === 'fei_biao' && distBf <= 3 && paLeft >= (PA_SIMPLE + 25)) {
          if (defender.proyectiles < MAX_PROYECTILES && paLeft >= PA_PROYECTIL_COMBO) {
            paLeft -= PA_PROYECTIL_COMBO;
            ataquesTurno++;
            const { oldPos, newPos } = doMove(actor, 2);
            const newDist = distancia();
            ev('move', { actor: actor.name, from: oldPos, to: newPos, p1: c1.pos, p2: c2.pos, distancia: newDist, cost: PA_PROYECTIL_COMBO, retrocede: true });
            ev('range_change', { distancia: newDist, p1: c1.pos, p2: c2.pos, nombre: nombreDistancia(newDist) });
            actor.proyectiles++;
            resolveAttack(actor, defender, skillsA, skillsD, newDist);
            if (defender.hp_actual <= 0) break;
            continue;
          }
          if (paLeft >= 25) {
            paLeft -= 25;
            const { oldPos, newPos } = doMove(actor, 1);
            const newDist = distancia();
            ev('move', { actor: actor.name, from: oldPos, to: newPos, p1: c1.pos, p2: c2.pos, distancia: newDist, cost: 25, retrocede: true });
            ev('range_change', { distancia: newDist, p1: c1.pos, p2: c2.pos, nombre: nombreDistancia(newDist) });
            continue;
          }
        }

        // Gun: push back if too close
        if (arma && arma.familia === 'gun' && distBf <= 2 && paLeft >= PA_COMPUESTA) {
          paLeft -= PA_COMPUESTA;
          ataquesTurno++;
          const { oldPos, newPos } = doMove(actor, 1);
          const newDist = distancia();
          ev('move', { actor: actor.name, from: oldPos, to: newPos, p1: c1.pos, p2: c2.pos, distancia: newDist, cost: PA_COMPUESTA, retrocede: true });
          ev('range_change', { distancia: newDist, p1: c1.pos, p2: c2.pos, nombre: nombreDistancia(newDist) });
          resolveAttack(actor, defender, skillsA, skillsD, newDist);
          if (defender.hp_actual <= 0) break;
          continue;
        }

        // Multi-attack with combo skill
        if (skillsA.extraCombo > 0 && Math.random() < skillsA.extraCombo && paLeft >= PA_SIMPLE) {
          paLeft -= PA_SIMPLE;
          ataquesTurno++;
          resolveAttack(actor, defender, skillsA, skillsD, distancia());
          if (defender.hp_actual <= 0) break;
        }
      }
    }

    // Strategic retreat: 15% chance to step back after attack
    if (paLeft >= costoPaso(actor.pos) && actor.pos < 5 && Math.random() < 0.15) {
      const steps = Math.random() < 0.4 && actor.pos <= 3 ? 2 : 1;
      const totalCost = steps === 2 ? costoPaso(actor.pos) + costoPaso(actor.pos + 1) : costoPaso(actor.pos);
      if (paLeft >= totalCost) {
        paLeft -= totalCost;
        const { oldPos, newPos } = doMove(actor, steps);
        const newDist = distancia();
        ev('move', { actor: actor.name, from: oldPos, to: newPos, p1: c1.pos, p2: c2.pos, distancia: newDist, cost: totalCost, retrocede: true });
        ev('range_change', { distancia: newDist, p1: c1.pos, p2: c2.pos, nombre: nombreDistancia(newDist) });
      }
    }

    // Exposed check
    if (distancia() <= 1 && defender.pa_react < 25) {
      defender.exposed = true;
      ev('exposed', { actor: defender.name, distancia: distancia() });
    } else {
      defender.exposed = false;
    }

    return paLeft;
  }

  function resolveAttack(atk, def, skillsAtk, skillsDef, dist) {
    const arma = atk.arma_equipada;
    const acc = Math.min(0.98, Math.max(0.20, 0.85 + (atk.agilidad - def.agilidad) * 0.02));

    if (Math.random() > acc) {
      ev('miss', { actor: atk.name, target: def.name, accion: arma ? 'atacó con ' + arma.nombre : 'golpeó' });
      return;
    }

    const react = def.pa_react || 0;
    const pEsq = probEsquiva(def, arma);
    const pBlk = probBloqueo(def, arma, def.arma_equipada, dist, rangoIdealDist(arma));

    const qi = def.qi || 50;
    const qiFactor = 0.5 + qi / 100;

    const desperate = react < PA_DEFENSA;
    let actionDef = null;
    let consumed = 0;

    if (pBlk >= pEsq) {
      actionDef = 'bloqueo';
    } else {
      actionDef = 'esquiva';
    }

    let effProb;
    if (actionDef === 'bloqueo') {
      effProb = pBlk * qiFactor;
    } else {
      effProb = pEsq * qiFactor;
    }
    if (desperate) effProb *= 0.35;

    const defenseSuccess = Math.random() * 100 < effProb;

    if (defenseSuccess) {
      if (react >= PA_DEFENSA) {
        def.pa_react -= PA_DEFENSA;
        consumed = PA_DEFENSA;
      }

      if (actionDef === 'esquiva') {
        ev('dodge_attempt', { actor: def.name, success: true, cost: consumed });
        ev('dodge_success', { actor: def.name });
      } else {
        const ataque = calcularDaño(atk, def, skillsAtk, skillsDef, dist, arma);
        let eff = blockEff(def.arma_equipada, arma);
        if (desperate) eff *= 0.35;
        let dmg = Math.max(1, Math.floor(ataque.dañoFinal * (1 - eff)));
        if (def.exposed) dmg = Math.floor(dmg * 1.2);
        def.hp_actual = Math.max(0, def.hp_actual - dmg);
        ev('block_attempt', { actor: def.name, success: true, cost: consumed });
        ev('block_success', { actor: def.name, damageReduced: dmg, efficacy: Math.round(eff * 100) });
        ev('glancing_hit', { actor: atk.name, target: def.name, damage: dmg, accion: ataque.accion });
        ev('hp_update', { actor: def.name, hp: Math.max(0, def.hp_actual), maxHp: def.max_hp });
      }

      if (defenseSuccess && def.hp_actual > 0 && def.pa_react >= PA_DEFENSA) {
        const pContra = probContra(def);
        if (Math.random() * 100 < pContra) {
          def.pa_react -= PA_DEFENSA;
          const dmgContra = Math.max(1, Math.floor(def.fuerza * 0.5));
          atk.hp_actual = Math.max(0, atk.hp_actual - dmgContra);
          ev('counter_attempt', { actor: def.name, target: atk.name, cost: PA_DEFENSA });
          ev('counter_hit', { actor: def.name, target: atk.name, damage: dmgContra });
          ev('hp_update', { actor: atk.name, hp: Math.max(0, atk.hp_actual), maxHp: atk.max_hp });
        }
      }

      return;
    }

    // Defense failed — attack lands
    const ataque = calcularDaño(atk, def, skillsAtk, skillsDef, dist, arma);
    let dmg = ataque.dañoFinal;
    if (def.exposed) dmg = Math.floor(dmg * 1.2);

    const pCrit = atk.velocidad * 0.01 + skillsAtk.extraCritico;
    const isCrit = Math.random() < pCrit;
    if (isCrit) dmg = Math.floor(dmg * 1.5);

    def.hp_actual = Math.max(0, def.hp_actual - dmg);

    if (ataque.usaArma && dmg > 0 && def.arma_equipada) {
      const dropChance = Math.min(0.05, (dmg / def.max_hp) * 0.05);
      if (Math.random() < dropChance) {
        ev('drop_weapon', { actor: def.name, arma: def.arma_equipada.nombre });
        if (onPerderArma && def.id > 0) onPerderArma(def.id, def.arma_equipada.id);
        def.arma_equipada = null;
      }
    }

    if (isCrit) {
      ev('critical_hit', { actor: atk.name, target: def.name, damage: dmg, accion: ataque.accion, conArma: ataque.usaArma, nombreArma: ataque.nombreArma });
    } else {
      ev('hit', { actor: atk.name, target: def.name, damage: dmg, accion: ataque.accion, conArma: ataque.usaArma, nombreArma: ataque.nombreArma });
    }

    if (skillsAtk.roboVida > 0 && dmg > 0) {
      const qiRobo = atk.qi || 50;
      const steal = Math.floor(dmg * (qiRobo * 0.001));
      if (steal > 0) {
        atk.hp_actual = Math.min(atk.max_hp, atk.hp_actual + steal);
        ev('life_steal', { actor: atk.name, amount: steal });
      }
    }

    ev('hp_update', { actor: atk.name, hp: atk.hp_actual, maxHp: atk.max_hp });
    ev('hp_update', { actor: def.name, hp: Math.max(0, def.hp_actual), maxHp: def.max_hp });
  }

  // Main combat loop
  while (turno < MAX_TURNOS) {
    turno++;
    ev('turn_start', { turno });

    const ve1 = velocidadEf(c1);
    const ve2 = velocidadEf(c2);
    let first, second;

    if (ve1 >= ve2) {
      first = c1; second = c2;
    } else {
      first = c2; second = c1;
    }

    processTurn(first, second);
    if (second.hp_actual <= 0) { ev('hp_update', { actor: second.name, hp: 0, maxHp: second.max_hp }); break; }

    processTurn(second, first);
    if (first.hp_actual <= 0) { ev('hp_update', { actor: first.name, hp: 0, maxHp: first.max_hp }); break; }
  }

  const winner = c1.hp_actual > c2.hp_actual ? b1.id : b2.id;
  ev('combat_end', { winner, nombre: winner === b1.id ? b1.name : b2.name });

  return {
    winner_id: winner,
    log: JSON.stringify(log),
    hp_final_combat1: c1.hp_actual,
    hp_final_combat2: c2.hp_actual,
  };
}

module.exports = { simularCombate };