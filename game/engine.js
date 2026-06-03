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

function calcularDaño(atacante, defensor, turno, skillsAtk, skillsDef) {
  let arma = null;
  let usaArma = false;
  if (atacante.armas && atacante.armas.length > 0) {
    arma = atacante.armas.find(a => a.equipada) || atacante.armas[0];
    const probUsarArma = Math.min(0.85, 0.25 + atacante.agilidad * 0.02);
    usaArma = Math.random() < probUsarArma && arma;
  }

  let dañoBase = atacante.fuerza;
  if (usaArma && arma) {
    const dañoArma = arma.dano_min + Math.floor(Math.random() * (arma.dano_max - arma.dano_min + 1));
    dañoBase += dañoArma;
  }

  let multiplicador = 1;

  if (usaArma && arma) {
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
    return { daño: 0, esquivo: true, critico: false, multiGolpe: false, usaArma, nombreArma: usaArma && arma ? arma.nombre : null };
  }

  const probEsquiva = 0.1 + skillsDef.extraEsquiva;
  if (Math.random() < probEsquiva) {
    return { daño: 0, esquivo: true, critico: false, multiGolpe: false, usaArma, nombreArma: usaArma && arma ? arma.nombre : null };
  }

  let defensa = skillsDef.extraDefensa + skillsDef.extraResistencia;
  const dañoFinal = Math.max(1, Math.floor(dañoPotencial * (1 - defensa)));

  const probCritico = atacante.velocidad * 0.01 + skillsAtk.extraCritico;
  const critico = Math.random() < probCritico;
  if (critico) {
    return { daño: Math.floor(dañoFinal * 1.5), esquivo: false, critico: true, multiGolpe: false, usaArma, nombreArma: usaArma && arma ? arma.nombre : null };
  }

  let multiGolpe = false;
  if (Math.random() < skillsAtk.extraCombo) {
    multiGolpe = true;
  }

  return { daño: dañoFinal, esquivo: false, critico: false, multiGolpe, usaArma, nombreArma: usaArma && arma ? arma.nombre : null };
}

function procesarTurno(atacante, defensor, turno, skillsAtk, skillsDef, onPerderArma) {
  const ataque = calcularDaño(atacante, defensor, turno, skillsAtk, skillsDef);

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

  if (!ataque.esquivo && ataque.daño > 0 && ataque.usaArma && ataque.nombreArma && onPerderArma) {
    const probPerder = Math.min(0.25, ataque.daño / defensor.max_hp * 0.5);
    if (Math.random() < probPerder) {
      const armaPerdida = (defensor.armas || []).find(a => a.equipada);
      if (armaPerdida) {
        onPerderArma(defensor.id, armaPerdida.id);
      }
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

  const log = [];
  let turno = 0;

  while (turno < MAX_TURNOS) {
    turno++;

    let resultado;
    if (combat1.velocidad >= combat2.velocidad) {
      resultado = procesarTurno(combat1, combat2, turno, s1, s2, onPerderArma);
      log.push(resultado);
      if (combat2.hp_actual <= 0) break;

      resultado = procesarTurno(combat2, combat1, turno + 0.5, s2, s1, onPerderArma);
      log.push(resultado);
      if (combat1.hp_actual <= 0) break;
    } else {
      resultado = procesarTurno(combat2, combat1, turno, s2, s1, onPerderArma);
      log.push(resultado);
      if (combat1.hp_actual <= 0) break;

      resultado = procesarTurno(combat1, combat2, turno + 0.5, s1, s2, onPerderArma);
      log.push(resultado);
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
