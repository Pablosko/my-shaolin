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

function calcularDaño(atacante, defensor, turno, skillsAtk, skillsDef, armaEquipada) {
  const usaArma = !!armaEquipada;
  const nombreArma = usaArma ? armaEquipada.nombre : null;

  let dañoBase;
  if (usaArma && armaEquipada) {
    const dañoArma = armaEquipada.dano_min + Math.floor(Math.random() * (armaEquipada.dano_max - armaEquipada.dano_min + 1));
    dañoBase = atacante.fuerza + dañoArma;
  } else {
    dañoBase = atacante.fuerza + (5 + Math.floor(Math.random() * 3));
  }

  let multiplicador = 1;

  if (usaArma) {
    multiplicador *= (skillsAtk.dañoArma);
  } else {
    multiplicador *= (skillsAtk.dañoPuño);
  }

  for (const hab of (atacante.habilidades || [])) {
    const e = typeof hab.efecto === 'string' ? JSON.parse(hab.efecto) : hab.efecto;
    if (['fuerza_porcentual', 'agilidad_porcentual', 'velocidad_porcentual', 'hp_porcentual', 'daño_arma', 'daño_puño', 'qi_boost', 'robo_vida', 'defensa', 'resistencia', 'esquiva', 'contraataque', 'combo', 'critico'].includes(e.stat)) continue;
    const valor = getValorHabilidadPorNivel(hab.efecto, hab.nivel || 1);
    multiplicador += valor;
  }

  const dañoPotencial = Math.max(1, Math.floor(dañoBase * multiplicador));
  const probAcierto = Math.min(0.98, Math.max(0.20, 0.85 + (atacante.agilidad - defensor.agilidad) * 0.02));
  const acierta = Math.random() < probAcierto;

  if (!acierta) {
    return { daño: 0, esquivo: true, critico: false, multiGolpe: false, usaArma, nombreArma };
  }

  const probEsquiva = 0.1 + skillsDef.extraEsquiva;
  if (Math.random() < probEsquiva) {
    return { daño: 0, esquivo: true, critico: false, multiGolpe: false, usaArma, nombreArma };
  }

  let defensa = skillsDef.extraDefensa + skillsDef.extraResistencia;
  const dañoFinal = Math.max(1, Math.floor(dañoPotencial * (1 - defensa)));

  const probCritico = atacante.velocidad * 0.01 + skillsAtk.extraCritico;
  const critico = Math.random() < probCritico;
  if (critico) {
    return { daño: Math.floor(dañoFinal * 1.5), esquivo: false, critico: true, multiGolpe: false, usaArma, nombreArma };
  }

  let multiGolpe = false;
  if (Math.random() < skillsAtk.extraCombo) {
    multiGolpe = true;
  }

  return { daño: dañoFinal, esquivo: false, critico: false, multiGolpe, usaArma, nombreArma };
}

function procesarTurno(atacante, defensor, turno, skillsAtk, skillsDef, armaEquipada) {
  const ataque = calcularDaño(atacante, defensor, turno, skillsAtk, skillsDef, armaEquipada);

  let contraataca = false;
  let dañoContra = 0;

  if (!ataque.esquivo && ataque.daño > 0) {
    const probContra = skillsDef.extraContra;
    if (Math.random() < probContra) {
      contraataca = true;
      dañoContra = Math.max(1, Math.floor(defensor.fuerza * 0.5));
    }
  }

  if (!ataque.esquivo) {
    defensor.hp_actual = Math.max(0, defensor.hp_actual - ataque.daño);
  }

  let roboVida = 0;
  if (!ataque.esquivo && ataque.daño > 0 && skillsAtk.roboVida > 0) {
    const qi = atacante.qi || 50;
    roboVida = Math.floor(ataque.daño * (qi * 0.001));
    if (roboVida > 0) {
      atacante.hp_actual = Math.min(atacante.max_hp, atacante.hp_actual + roboVida);
    }
  }

  if (contraataca && defensor.hp_actual > 0) {
    atacante.hp_actual = Math.max(0, atacante.hp_actual - dañoContra);
  }

  return {
    turno,
    atacante_nombre: atacante.name,
    defensor_nombre: defensor.name,
    accion: ataque.esquivo ? 'falló' : 'golpeó',
    daño: ataque.daño,
    critico: ataque.critico,
    multiGolpe: ataque.multiGolpe,
    usaArma: ataque.usaArma,
    nombreArma: ataque.nombreArma,
    contraataca,
    daño_contra: dañoContra,
    robo_vida: roboVida,
    hp_atacante: atacante.hp_actual,
    hp_defensor: defensor.hp_actual,
  };
}

function simularCombate(b1, b2, skills1, skills2, onPerderArma) {
  const MAX_TURNOS = 50;

  const s1 = skills1 || { dañoArma: 1, dañoPuño: 1, extraDefensa: 0, extraResistencia: 0, extraCritico: 0, extraEsquiva: 0, extraCombo: 0, extraContra: 0, roboVida: 0 };
  const s2 = skills2 || { dañoArma: 1, dañoPuño: 1, extraDefensa: 0, extraResistencia: 0, extraCritico: 0, extraEsquiva: 0, extraCombo: 0, extraContra: 0, roboVida: 0 };

  const combat1 = {
    ...b1,
    hp_actual: b1.max_hp,
    armas: b1.armas || [],
    habilidades: b1.habilidades || [],
    statsBase: { fuerza: b1.fuerza, agilidad: b1.agilidad, velocidad: b1.velocidad, max_hp: b1.max_hp },
    qi: b1.qi || 50,
  };

  const combat2 = {
    ...b2,
    hp_actual: b2.max_hp,
    armas: b2.armas || [],
    habilidades: b2.habilidades || [],
    statsBase: { fuerza: b2.fuerza, agilidad: b2.agilidad, velocidad: b2.velocidad, max_hp: b2.max_hp },
    qi: b2.qi || 50,
  };

  aplicarSkillsACombate(combat1);
  aplicarSkillsACombate(combat2);

  let armaEq1 = null;
  let armaEq2 = null;

  const log = [];
  let turno = 0;

  function intentarDibujarArma(combat) {
    if (combat.armas.length === 0) return null;
    const drawChance = Math.min(0.9, 0.3 + combat.velocidad * 0.01);
    if (Math.random() < drawChance) {
      return combat.armas.find(a => a.equipada) || combat.armas[0];
    }
    return null;
  }

  function intentarPerderArma(armaActual, daño, hpMax) {
    if (!armaActual) return null;
    const probPerder = Math.min(0.05, (daño / hpMax) * 0.05);
    if (Math.random() < probPerder) {
      return armaActual;
    }
    return null;
  }

  function procesarActor(atk, def, skillsAtk, skillsDef, turnoActual) {
    const armaAtk = atk === combat1 ? armaEq1 : armaEq2;
    const armaDef = def === combat1 ? armaEq1 : armaEq2;

    if (!armaAtk) {
      const drawn = intentarDibujarArma(atk);
      if (drawn) {
        if (atk === combat1) armaEq1 = drawn;
        else armaEq2 = drawn;
        log.push({ turno: turnoActual, type: 'draw', nombre: atk.name, arma: drawn.nombre });
      }
    }

    const arma = (atk === combat1 ? armaEq1 : armaEq2);
    const resultado = procesarTurno(atk, def, turnoActual, skillsAtk, skillsDef, arma);
    log.push(resultado);

    if (resultado.daño > 0 && !resultado.esquivo) {
      const perdida = intentarPerderArma(armaDef, resultado.daño, def.max_hp);
      if (perdida) {
        if (def === combat1) armaEq1 = null;
        else armaEq2 = null;
        log.push({ turno: turnoActual, type: 'drop', nombre: def.name, arma: perdida.nombre });
        if (onPerderArma && def.id > 0) {
          onPerderArma(def.id, perdida.id);
        }
      }
    }

    return resultado;
  }

  while (turno < MAX_TURNOS) {
    turno++;

    if (combat1.velocidad >= combat2.velocidad) {
      const r1 = procesarActor(combat1, combat2, s1, s2, turno);
      if (combat2.hp_actual <= 0) break;

      const r2 = procesarActor(combat2, combat1, s2, s1, turno + 0.5);
      if (combat1.hp_actual <= 0) break;
    } else {
      const r1 = procesarActor(combat2, combat1, s2, s1, turno);
      if (combat1.hp_actual <= 0) break;

      const r2 = procesarActor(combat1, combat2, s1, s2, turno + 0.5);
      if (combat2.hp_actual <= 0) break;
    }
  }

  const winner = combat1.hp_actual > combat2.hp_actual ? b1.id : b2.id;

  return {
    winner_id: winner,
    log: JSON.stringify(log),
    hp_final_combat1: combat1.hp_actual,
    hp_final_combat2: combat2.hp_actual,
  };
}

module.exports = { simularCombate, calcularDaño, procesarTurno };
