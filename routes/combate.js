const express = require('express');
const db = require('../db/database');
const { verificarToken } = require('../middleware/auth');
const { simularCombate } = require('../game/engine');
const { generarBots, aplicarSkillsYQi, resolverArma } = require('../game/data');

const router = express.Router();

router.get('/oponentes', verificarToken, async (req, res) => {
  const level = parseInt(req.query.level) || 0;
  let shaolins;
  if (level > 0) {
    shaolins = await db.query(
      'SELECT * FROM shaolins WHERE user_id != ? AND level BETWEEN ? AND ?',
      [req.userId, Math.max(1, level - 3), level + 3]
    );
  } else {
    shaolins = await db.query('SELECT * FROM shaolins WHERE user_id != ?', [req.userId]);
  }

  const result = await Promise.all(shaolins.map(async b => {
    const armas = await db.query('SELECT * FROM armas WHERE shaolin_id = ?', [b.id]);
    const habilidades = await db.query('SELECT * FROM habilidades WHERE shaolin_id = ?', [b.id]);
    const user = await db.get('SELECT username FROM users WHERE id = ?', [b.user_id]);
    const qiData = aplicarSkillsYQi({ ...b, habilidades });
    return {
      ...b,
      username: user ? user.username : 'Desconocido',
      armas,
      habilidades,
      ...qiData,
    };
  }));

  res.json(result);
});

router.get('/oponentes-todos', verificarToken, async (req, res) => {
  const shaolins = await db.query('SELECT * FROM shaolins WHERE user_id != ?', [req.userId]);

  const result = await Promise.all(shaolins.map(async b => {
    const armas = await db.query('SELECT * FROM armas WHERE shaolin_id = ?', [b.id]);
    const habilidades = await db.query('SELECT * FROM habilidades WHERE shaolin_id = ?', [b.id]);
    const user = await db.get('SELECT username FROM users WHERE id = ?', [b.user_id]);
    const qiData = aplicarSkillsYQi({ ...b, habilidades });
    return {
      ...b,
      username: user ? user.username : 'Desconocido',
      armas,
      habilidades,
      ...qiData,
    };
  }));

  res.json(result);
});

router.get('/bots', verificarToken, (req, res) => {
  const nivel = parseInt(req.query.level) || 1;
  const bots = generarBots(5, nivel).map(b => {
    const qiData = aplicarSkillsYQi(b);
    return { ...b, ...qiData };
  });
  res.json(bots);
});

router.get('/historial/:shaolin_id', verificarToken, async (req, res) => {
  const { shaolin_id } = req.params;
  const combates = await db.query(`
    SELECT c.*, b1.name as b1_name, b2.name as b2_name
    FROM combates c
    JOIN shaolins b1 ON c.shaolin1_id = b1.id
    JOIN shaolins b2 ON c.shaolin2_id = b2.id
    WHERE c.shaolin1_id = ? OR c.shaolin2_id = ?
    ORDER BY c.created_at DESC
    LIMIT 20
  `, [parseInt(shaolin_id), parseInt(shaolin_id)]);

  res.json(combates);
});

router.post('/combatir/:oponente_id', verificarToken, async (req, res) => {
  const { shaolin_id, oponente_data, esEntrenamiento } = req.body;
  const oponente_id = parseInt(req.params.oponente_id);

  if (!shaolin_id) {
    return res.status(400).json({ error: 'Selecciona un shaolin para combatir' });
  }

  const miShaolin = await db.get('SELECT * FROM shaolins WHERE id = ? AND user_id = ?', [shaolin_id, req.userId]);
  if (!miShaolin) {
    return res.status(404).json({ error: 'Shaolin no encontrado' });
  }

  if (miShaolin.pending_level) {
    return res.status(400).json({ error: 'Debes subir de nivel antes de combatir' });
  }

  const esEntreno = esEntrenamiento === true;
  const esBot = oponente_id < 0;
  const hoy = new Date().toISOString().split('T')[0];

  let oponente;
  if (esBot && oponente_data) {
    oponente = oponente_data;
  } else if (!esBot) {
    oponente = await db.get('SELECT * FROM shaolins WHERE id = ?', [oponente_id]);
    if (!oponente) {
      return res.status(404).json({ error: 'Oponente no encontrado' });
    }
    if (miShaolin.user_id === oponente.user_id) {
      return res.status(400).json({ error: 'No puedes combatir contra tu propio shaolin' });
    }
  } else {
    return res.status(400).json({ error: 'Datos de bot no proporcionados' });
  }

  if (!esEntreno) {
    if (miShaolin.ultimo_combate === hoy && miShaolin.combates_hoy >= 500) {
      return res.status(400).json({ error: 'Límite de 500 combates diarios alcanzado' });
    }
  }

  const b1Habilidades = await db.query('SELECT * FROM habilidades WHERE shaolin_id = ?', [miShaolin.id]);
  const b1Armas = (await db.query('SELECT * FROM armas WHERE shaolin_id = ?', [miShaolin.id])).map(resolverArma);
  const b1Qi = aplicarSkillsYQi({ ...miShaolin, habilidades: b1Habilidades });

  const b2Habilidades = oponente.habilidades || [];
  const b2Armas = (oponente.armas || []).map(resolverArma);
  const b2Qi = aplicarSkillsYQi({ ...oponente, habilidades: b2Habilidades });

  const b1Completo = {
    ...miShaolin,
    hp: b1Qi.real_max_hp,
    armas: b1Armas,
    habilidades: b1Habilidades,
    qi: b1Qi.qi,
    fuerza: b1Qi.real_fuerza,
    agilidad: b1Qi.real_agilidad,
    velocidad: b1Qi.real_velocidad,
    max_hp: b1Qi.real_max_hp,
  };

  const b2Completo = {
    ...oponente,
    hp: b2Qi.real_max_hp,
    armas: b2Armas,
    habilidades: b2Habilidades,
    qi: b2Qi.qi,
    fuerza: b2Qi.real_fuerza,
    agilidad: b2Qi.real_agilidad,
    velocidad: b2Qi.real_velocidad,
    max_hp: b2Qi.real_max_hp,
  };

  async function onPerderArma(shaolinId, armaId) {
    if (armaId && shaolinId > 0) {
      await db.run('UPDATE armas SET equipada = 0 WHERE id = ? AND shaolin_id = ?', [armaId, shaolinId]);
    }
  }

  const skills1 = {
    dañoArma: b1Qi.dañoArma,
    dañoPuño: b1Qi.dañoPuño,
    extraDefensa: b1Qi.extraDefensa,
    extraResistencia: b1Qi.extraResistencia,
    extraCritico: b1Qi.extraCritico,
    extraEsquiva: b1Qi.extraEsquiva,
    extraCombo: b1Qi.extraCombo,
    extraContra: b1Qi.extraContra,
    roboVida: b1Qi.roboVida,
  };

  const skills2 = {
    dañoArma: b2Qi.dañoArma,
    dañoPuño: b2Qi.dañoPuño,
    extraDefensa: b2Qi.extraDefensa,
    extraResistencia: b2Qi.extraResistencia,
    extraCritico: b2Qi.extraCritico,
    extraEsquiva: b2Qi.extraEsquiva,
    extraCombo: b2Qi.extraCombo,
    extraContra: b2Qi.extraContra,
    roboVida: b2Qi.roboVida,
  };

  const resultado = simularCombate(b1Completo, b2Completo, skills1, skills2, onPerderArma);

  if (!esBot && !esEntreno) {
    await db.run(
      'INSERT INTO combates (shaolin1_id, shaolin2_id, winner_id, log) VALUES (?, ?, ?, ?)',
      [miShaolin.id, oponente.id, resultado.winner_id, resultado.log]
    );
  }

  const nombre = miShaolin.name || '';
  const esPablosko = nombre.toLowerCase() === 'pablosko';
  const esArtego7 = nombre.toLowerCase() === 'artego7';

  let xpGanada = 0;

  if (!esEntreno) {
    if (esPablosko) {
      const xpParaSubir = 6 + miShaolin.level * 2;
      xpGanada = xpParaSubir;
      await db.run('UPDATE shaolins SET xp = ?, combates_hoy = combates_hoy + 1, ultimo_combate = ? WHERE id = ?',
        [xpGanada, hoy, miShaolin.id]);
    } else if (esArtego7 && resultado.winner_id === miShaolin.id) {
      xpGanada = 4;
      await db.run('UPDATE shaolins SET xp = xp + ?, combates_hoy = combates_hoy + 1, ultimo_combate = ? WHERE id = ?',
        [xpGanada, hoy, miShaolin.id]);
    } else if (resultado.winner_id === miShaolin.id) {
      if (oponente.level >= miShaolin.level) {
        xpGanada = 2;
      }
      await db.run('UPDATE shaolins SET xp = xp + ?, combates_hoy = combates_hoy + 1, ultimo_combate = ? WHERE id = ?',
        [xpGanada, hoy, miShaolin.id]);
    } else {
      xpGanada = 1;
      await db.run('UPDATE shaolins SET xp = xp + ?, combates_hoy = combates_hoy + 1, ultimo_combate = ? WHERE id = ?',
        [xpGanada, hoy, miShaolin.id]);
    }
  }

  let tieneNivelPendiente = false;
  if (!esEntreno && !esPablosko) {
    let miShaolinActualizado = await db.get('SELECT * FROM shaolins WHERE id = ?', [miShaolin.id]);
    const xpNeeded = 6 + miShaolinActualizado.level * 2;
    if (miShaolinActualizado.xp >= xpNeeded) {
      await db.run('UPDATE shaolins SET pending_level = 1 WHERE id = ?', [miShaolin.id]);
      tieneNivelPendiente = true;
    }
  }

  const shaolinFinal = await db.get('SELECT * FROM shaolins WHERE id = ?', [miShaolin.id]);

  let easterEgg = false;
  let easterEggMsg = '';
  if (esPablosko && tieneNivelPendiente) {
    easterEgg = true;
    easterEggMsg = '🐉 El Maestro Pablosko ha ganado. El templo entero se inclina ante ti. 🥋';
  } else if (esArtego7 && resultado.winner_id === miShaolin.id) {
    easterEgg = true;
    easterEggMsg = '⚡ ¡Artego7 domina el combate! La energía fluye a través de ti. +4 XP ✨';
  }
  shaolinFinal.easterEgg = easterEgg;
  shaolinFinal.easterEggMsg = easterEggMsg;

  res.json({
    oponente_username: !esBot ? (oponente.username || 'Desconocido') : null,
    oponente_name: oponente.name,
    resultado: resultado.winner_id === miShaolin.id ? 'victoria' : 'derrota',
    winner_id: resultado.winner_id,
    log: JSON.parse(resultado.log),
    shaolin_actualizado: shaolinFinal,
    tiene_nivel_pendiente: tieneNivelPendiente,
    es_entrenamiento: esEntreno,
    xp_ganada: xpGanada,
  });
});

router.post('/random', verificarToken, async (req, res) => {
  const { shaolin_id, esEntrenamiento } = req.body;
  const miShaolin = await db.get('SELECT * FROM shaolins WHERE id = ? AND user_id = ?', [shaolin_id, req.userId]);
  if (!miShaolin) return res.status(404).json({ error: 'Shaolin no encontrado' });

  if (esEntrenamiento) {
    const candidates = await db.query(
      'SELECT s.*, u.username FROM shaolins s JOIN users u ON s.user_id = u.id WHERE s.id != ? AND s.user_id != ? ORDER BY RANDOM() LIMIT 1',
      [shaolin_id, req.userId]
    );
    if (candidates.length > 0) {
      const op = candidates[0];
      op.armas = await db.query('SELECT * FROM armas WHERE shaolin_id = ?', [op.id]);
      op.habilidades = await db.query('SELECT * FROM habilidades WHERE shaolin_id = ?', [op.id]);
      const qiData = aplicarSkillsYQi(op);
      Object.assign(op, qiData);
      return res.json({ type: 'player', opponent: op });
    }
    const [bot] = generarBots(1, miShaolin.level);
    const qiData = aplicarSkillsYQi(bot);
    Object.assign(bot, qiData);
    return res.json({ type: 'bot', opponent: bot });
  }

  const candidates = await db.query(
    'SELECT s.*, u.username FROM shaolins s JOIN users u ON s.user_id = u.id WHERE s.id != ? AND s.user_id != ? AND s.level BETWEEN ? AND ? ORDER BY RANDOM() LIMIT 1',
    [shaolin_id, req.userId, Math.max(1, miShaolin.level - 3), miShaolin.level + 3]
  );

  if (candidates.length > 0) {
    const op = candidates[0];
    op.armas = await db.query('SELECT * FROM armas WHERE shaolin_id = ?', [op.id]);
    op.habilidades = await db.query('SELECT * FROM habilidades WHERE shaolin_id = ?', [op.id]);
    const qiData = aplicarSkillsYQi(op);
    Object.assign(op, qiData);
    return res.json({ type: 'player', opponent: op });
  }

  const [bot] = generarBots(1, miShaolin.level);
  const qiData = aplicarSkillsYQi(bot);
  Object.assign(bot, qiData);
  res.json({ type: 'bot', opponent: bot });
});

module.exports = router;
