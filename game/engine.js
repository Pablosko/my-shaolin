function calcularDaño(atacante, defensor, turno) {
  let arma = null;
  if (atacante.armas && atacante.armas.length > 0) {
    arma = atacante.armas.find(a => a.equipada) || atacante.armas[0];
  }

  let dañoBase = atacante.fuerza;
  if (arma) {
    const dañoArma = arma.dano_min + Math.floor(Math.random() * (arma.dano_max - arma.dano_min + 1));
    dañoBase += dañoArma;
  }

  let multiplicador = 1;

  if (atacante.habilidades) {
    for (const hab of atacante.habilidades) {
      const efecto = JSON.parse(hab.efecto);
      if (efecto.stat === 'resistencia') continue;
      if (efecto.stat === 'defensa') continue;
      if (efecto.stat === 'esquiva') continue;
      if (efecto.stat === 'contraataque') continue;
      if (efecto.stat === 'multigolpe') continue;
      multiplicador += (efecto.valor.min + Math.random() * (efecto.valor.max - efecto.valor.min));
    }
  }

  const dañoPotencial = Math.max(1, Math.floor(dañoBase * multiplicador));
  const probAcierto = (atacante.agilidad / (atacante.agilidad + defensor.agilidad + 1)) * 0.8 + 0.2;
  const acierta = Math.random() < probAcierto;

  if (!acierta) {
    return { daño: 0, esquivo: true, critico: false, multiGolpe: false };
  }

  const probEsquiva = defensor.habilidades
    ? defensor.habilidades.some(h => {
        const e = JSON.parse(h.efecto);
        return e.stat === 'esquiva';
      }) ? 0.2 : 0.1
    : 0.1;

  if (Math.random() < probEsquiva) {
    return { daño: 0, esquivo: true, critico: false, multiGolpe: false };
  }

  let defensa = 0;
  if (defensor.habilidades) {
    for (const hab of defensor.habilidades) {
      const efecto = JSON.parse(hab.efecto);
      if (efecto.stat === 'defensa') {
        defensa += (efecto.valor.min + Math.random() * (efecto.valor.max - efecto.valor.min));
      }
    }
  }

  const dañoFinal = Math.max(1, Math.floor(dañoPotencial * (1 - defensa)));

  const probCritico = atacante.velocidad * 0.01;
  const critico = Math.random() < probCritico;
  if (critico) {
    return { daño: Math.floor(dañoFinal * 1.5), esquivo: false, critico: true, multiGolpe: false };
  }

  let multiGolpe = false;
  if (atacante.habilidades) {
    for (const hab of atacante.habilidades) {
      const efecto = JSON.parse(hab.efecto);
      if (efecto.stat === 'multigolpe') {
        const probMulti = efecto.valor.min + Math.random() * (efecto.valor.max - efecto.valor.min);
        if (Math.random() < probMulti) {
          multiGolpe = true;
        }
      }
    }
  }

  return { daño: dañoFinal, esquivo: false, critico: false, multiGolpe };
}

function procesarTurno(atacante, defensor, turno) {
  const ataque = calcularDaño(atacante, defensor, turno);
  let contraataca = false;
  let dañoContra = 0;

  if (!ataque.esquivo && ataque.daño > 0 && defensor.habilidades) {
    for (const hab of defensor.habilidades) {
      const efecto = JSON.parse(hab.efecto);
      if (efecto.stat === 'contraataque') {
        const probContra = efecto.valor.min + Math.random() * (efecto.valor.max - efecto.valor.min);
        if (Math.random() < probContra) {
          contraataca = true;
          dañoContra = Math.max(1, Math.floor(defensor.fuerza * 0.5));
          break;
        }
      }
    }
  }

  if (!ataque.esquivo) {
    defensor.hp_actual = Math.max(0, defensor.hp_actual - ataque.daño);
  }

  let dañoMascota = 0;
  if (atacante.mascota && defensor.hp_actual > 0) {
    dañoMascota = Math.max(1, Math.floor(atacante.mascota.ataque * (0.5 + Math.random() * 0.5)));
    if (Math.random() < 0.4) {
      defensor.hp_actual = Math.max(0, defensor.hp_actual - dañoMascota);
    } else {
      dañoMascota = 0;
    }
  }

  let dañoMascotaDef = 0;
  if (defensor.mascota && defensor.hp_actual > 0) {
    dañoMascotaDef = Math.max(1, Math.floor(defensor.mascota.ataque * (0.5 + Math.random() * 0.5)));
    if (Math.random() < 0.4) {
      atacante.hp_actual = Math.max(0, atacante.hp_actual - dañoMascotaDef);
    } else {
      dañoMascotaDef = 0;
    }
  }

  if (contraataca && defensor.hp_actual > 0) {
    atacante.hp_actual = Math.max(0, atacante.hp_actual - dañoContra);
  }

  return {
    turno,
    atacante_nombre: atacante.nombre,
    defensor_nombre: defensor.nombre,
    accion: ataque.esquivo ? 'falló' : 'golpeó',
    daño: ataque.daño,
    critico: ataque.critico,
    multiGolpe: ataque.multiGolpe,
    contraataca,
    daño_contra: dañoContra,
    daño_mascota_atq: dañoMascota,
    daño_mascota_def: dañoMascotaDef,
    hp_atacante: atacante.hp_actual,
    hp_defensor: defensor.hp_actual,
  };
}

function simularCombate(bruto1, bruto2) {
  const MAX_TURNOS = 50;

  const b1 = {
    ...bruto1,
    hp_actual: bruto1.max_hp,
    armas: bruto1.armas || [],
    habilidades: bruto1.habilidades || [],
    mascota: bruto1.mascota || null,
  };

  const b2 = {
    ...bruto2,
    hp_actual: bruto2.max_hp,
    armas: bruto2.armas || [],
    habilidades: bruto2.habilidades || [],
    mascota: bruto2.mascota || null,
  };

  const log = [];
  let turno = 0;

  while (turno < MAX_TURNOS) {
    turno++;

    let resultado;
    if (b1.velocidad >= b2.velocidad) {
      resultado = procesarTurno(b1, b2, turno);
      log.push(resultado);
      if (b2.hp_actual <= 0) break;

      resultado = procesarTurno(b2, b1, turno + 0.5);
      log.push(resultado);
      if (b1.hp_actual <= 0) break;
    } else {
      resultado = procesarTurno(b2, b1, turno);
      log.push(resultado);
      if (b1.hp_actual <= 0) break;

      resultado = procesarTurno(b1, b2, turno + 0.5);
      log.push(resultado);
      if (b2.hp_actual <= 0) break;
    }
  }

  const winner = b1.hp_actual > b2.hp_actual ? bruto1.id : bruto2.id;

  return {
    winner_id: winner,
    log: JSON.stringify(log),
    hp_final_b1: b1.hp_actual,
    hp_final_b2: b2.hp_actual,
  };
}

module.exports = { simularCombate, calcularDaño, procesarTurno };
