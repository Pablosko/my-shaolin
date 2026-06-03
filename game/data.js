const armas = [
  { nombre: 'Cuchillo', tipo: 'corto', dano_min: 6, dano_max: 10 },
  { nombre: 'Espadón', tipo: 'pesado', dano_min: 9, dano_max: 15 },
  { nombre: 'Maza', tipo: 'contundente', dano_min: 8, dano_max: 14 },
  { nombre: 'Hacha', tipo: 'pesado', dano_min: 10, dano_max: 16 },
  { nombre: 'Látigo', tipo: 'corto', dano_min: 5, dano_max: 10 },
  { nombre: 'Shuriken', tipo: 'corto', dano_min: 4, dano_max: 8 },
  { nombre: 'Sai', tipo: 'corto', dano_min: 5, dano_max: 9 },
  { nombre: 'Mangual', tipo: 'contundente', dano_min: 8, dano_max: 14 },
  { nombre: 'Martillo', tipo: 'contundente', dano_min: 10, dano_max: 17 },
  { nombre: 'Lanza', tipo: 'pesado', dano_min: 7, dano_max: 13 },
  { nombre: 'Cimitarra', tipo: 'pesado', dano_min: 8, dano_max: 14 },
  { nombre: 'Alabarda', tipo: 'pesado', dano_min: 9, dano_max: 15 },
];

const habilidades = [
  { nombre: 'Armonía Interior', descripcion: 'Mejora el efecto del Qi en las stats', efecto: JSON.stringify({ stat: 'qi_boost', valorPorNivel: { 1: 0.15, 2: 0.30, 3: 0.50 } }) },
  { nombre: 'Cuerpo de Roca', descripcion: 'Aumenta la vida máxima un %', efecto: JSON.stringify({ stat: 'hp_porcentual', valorPorNivel: { 1: 0.20, 2: 0.35, 3: 0.50 } }) },
  { nombre: 'Furia del Dragón', descripcion: 'Aumenta la fuerza un %', efecto: JSON.stringify({ stat: 'fuerza_porcentual', valorPorNivel: { 1: 0.15, 2: 0.30, 3: 0.50 } }) },
  { nombre: 'Viento Veloz', descripcion: 'Aumenta la velocidad un %', efecto: JSON.stringify({ stat: 'velocidad_porcentual', valorPorNivel: { 1: 0.15, 2: 0.30, 3: 0.45 } }) },
  { nombre: 'Paso Ágil', descripcion: 'Aumenta la agilidad un %', efecto: JSON.stringify({ stat: 'agilidad_porcentual', valorPorNivel: { 1: 0.15, 2: 0.30, 3: 0.45 } }) },
  { nombre: 'Sangre de Shaolin', descripcion: 'Roba vida al golpear basado en Qi', efecto: JSON.stringify({ stat: 'robo_vida', valorPorNivel: { 1: 0.01, 2: 0.02, 3: 0.04 } }) },
  { nombre: 'Muro de Acero', descripcion: 'Reduce el daño recibido', efecto: JSON.stringify({ stat: 'defensa', valorPorNivel: { 1: 0.15, 2: 0.25, 3: 0.35 } }) },
  { nombre: 'Mano del Maestro', descripcion: 'Aumenta el daño con armas', efecto: JSON.stringify({ stat: 'daño_arma', valorPorNivel: { 1: 0.15, 2: 0.30, 3: 0.50 } }) },
  { nombre: 'Puño de Hierro', descripcion: 'Aumenta el daño sin armas', efecto: JSON.stringify({ stat: 'daño_puño', valorPorNivel: { 1: 0.20, 2: 0.35, 3: 0.55 } }) },
  { nombre: 'Cascada de Golpes', descripcion: 'Probabilidad de golpe múltiple', efecto: JSON.stringify({ stat: 'combo', valorPorNivel: { 1: 0.15, 2: 0.25, 3: 0.40 } }) },
  { nombre: 'Ojo de Halcón', descripcion: 'Aumenta la probabilidad de crítico', efecto: JSON.stringify({ stat: 'critico', valorPorNivel: { 1: 0.10, 2: 0.20, 3: 0.30 } }) },
  { nombre: 'Paso de Sombra', descripcion: 'Aumenta la probabilidad de esquivar', efecto: JSON.stringify({ stat: 'esquiva', valorPorNivel: { 1: 0.10, 2: 0.20, 3: 0.30 } }) },
  { nombre: 'Reflejo de Serpiente', descripcion: 'Probabilidad de contraatacar', efecto: JSON.stringify({ stat: 'contraataque', valorPorNivel: { 1: 0.12, 2: 0.22, 3: 0.35 } }) },
  { nombre: 'Piel de Piedra', descripcion: 'Resistencia adicional al daño', efecto: JSON.stringify({ stat: 'resistencia', valorPorNivel: { 1: 0.15, 2: 0.25, 3: 0.35 } }) },
];

function getRandomItem(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function getRandomArma() {
  return { ...getRandomItem(armas) };
}

function getRandomHabilidad() {
  return { ...getRandomItem(habilidades) };
}

function generarStatsIniciales(genero) {
  const base = genero === 'masculino'
    ? { hp: 55, max_hp: 55, fuerza: 3, agilidad: 2, velocidad: 2, vitalidad: 0 }
    : { hp: 50, max_hp: 50, fuerza: 2, agilidad: 3, velocidad: 3, vitalidad: 0 };

  const r = Math.floor(Math.random() * 4);
  if (r === 0) base.fuerza += 1;
  else if (r === 1) base.agilidad += 1;
  else if (r === 2) base.velocidad += 1;
  else { base.hp += 5; base.max_hp += 5; }

  return base;
}

const nombresBot = [
  'Maestro Wong', 'Shaolin Lee', 'Dragón Xu', 'Tigre Chen',
  'Mono Zhang', 'Grulla Wang', 'Serpiente Li', 'Leopardo Wu',
  'Loto Dorado', 'Jade Feng', 'Tormenta Huang', 'Fénix Zhou',
  'Bambú Kang', 'Rayo Tsao', 'Montaña He', 'Río Ming',
  'Viento Yang', 'Fuego Bao', 'Ola Zheng', 'Sombra Yue',
];

const skins = ['default', 'tigre', 'dragon', 'grulla', 'sombra', 'loto'];

function randomSkin() {
  return skins[Math.floor(Math.random() * skins.length)];
}

function generarBot() {
  const genero = Math.random() < 0.5 ? 'masculino' : 'femenino';
  const stats = generarStatsIniciales(genero);

  const arma = Math.random() < 0.4 ? getRandomArma() : null;
  const habilidad = Math.random() < 0.3 ? getRandomHabilidad() : null;

  return {
    id: -Math.floor(Math.random() * 10000) - 1,
    user_id: -1,
    name: getRandomItem(nombresBot),
    genero,
    skin: randomSkin(),
    level: 1,
    xp: 0,
    hp: stats.hp,
    max_hp: stats.max_hp,
    fuerza: stats.fuerza,
    agilidad: stats.agilidad,
    velocidad: stats.velocidad,
    vitalidad: stats.vitalidad || 0,
    combates_hoy: 0,
    ultimo_combate: null,
    pending_level: 0,
    created_at: new Date().toISOString(),
    username: '🤖 Bot',
    armas: arma ? [{ ...arma, equipada: true }] : [],
    habilidades: habilidad ? [{ ...habilidad, nivel: 1 }] : [],
  };
}

function generarBots(cantidad) {
  const bots = [];
  const usados = new Set();
  for (let i = 0; i < cantidad; i++) {
    let bot = generarBot();
    let intentos = 0;
    while (usados.has(bot.name) && intentos < 10) {
      bot = generarBot();
      intentos++;
    }
    usados.add(bot.name);
    bots.push(bot);
  }
  return bots;
}

function generarOpcionesIniciales() {
  const opciones = [];
  for (let i = 0; i < 2; i++) {
    const rand = Math.random();
    if (rand < 0.55) {
      const item = getRandomArma();
      opciones.push({
        index: i,
        tipo: 'arma',
        icono: '🗡️',
        nombre: item.nombre,
        descripcion: `Daño ${item.dano_min}-${item.dano_max}`,
      });
    } else {
      const item = getRandomHabilidad();
      opciones.push({
        index: i,
        tipo: 'habilidad',
        icono: '✨',
        nombre: item.nombre,
        descripcion: item.descripcion,
      });
    }
  }
  return opciones;
}

function getValorHabilidadPorNivel(efecto, nivel) {
  const e = typeof efecto === 'string' ? JSON.parse(efecto) : efecto;
  return e.valorPorNivel[nivel] || e.valorPorNivel[1] || 0;
}

function calcularQi(b) {
  const { fuerza, agilidad, velocidad, max_hp, level } = b;
  const vida = Math.floor(max_hp / 10);
  const media = (vida + fuerza + agilidad + velocidad) / 4;
  if (media === 0) return 50;

  const potencial = level >= 70 ? 100 : 29 + level;
  const desviacionRelativa = (
    Math.abs(vida - media) / media +
    Math.abs(fuerza - media) / media +
    Math.abs(agilidad - media) / media +
    Math.abs(velocidad - media) / media
  ) / 4;

  const bonusMaestria = level <= 70 ? 0 : Math.min(0.07, (level - 70) * 0.001);
  const tolerancia = 0.08 + bonusMaestria;
  const desviacionEfectiva = Math.max(0, desviacionRelativa - tolerancia);
  const armonia = Math.max(0.5, Math.min(1.0, 1 - desviacionEfectiva * 2.2));

  return Math.round(potencial * armonia);
}

function aplicarSkillsYQi(b) {
  const qi = calcularQi(b);
  const skills = b.habilidades || [];

  let boostFuerza = 1;
  let boostAgilidad = 1;
  let boostVelocidad = 1;
  let boostHp = 1;
  let qiBoost = 1;
  let roboVida = 0;
  let dañoArma = 1;
  let dañoPuño = 1;
  let extraDefensa = 0;
  let extraResistencia = 0;
  let extraCritico = 0;
  let extraEsquiva = 0;
  let extraCombo = 0;
  let extraContra = 0;

  for (const hab of skills) {
    const e = typeof hab.efecto === 'string' ? JSON.parse(hab.efecto) : hab.efecto;
    const valor = getValorHabilidadPorNivel(hab.efecto, hab.nivel || 1);
    if (e.stat === 'fuerza_porcentual') boostFuerza += valor;
    else if (e.stat === 'agilidad_porcentual') boostAgilidad += valor;
    else if (e.stat === 'velocidad_porcentual') boostVelocidad += valor;
    else if (e.stat === 'hp_porcentual') boostHp += valor;
    else if (e.stat === 'qi_boost') qiBoost += valor;
    else if (e.stat === 'robo_vida') roboVida += valor;
    else if (e.stat === 'daño_arma') dañoArma += valor;
    else if (e.stat === 'daño_puño') dañoPuño += valor;
    else if (e.stat === 'defensa') extraDefensa += valor;
    else if (e.stat === 'resistencia') extraResistencia += valor;
    else if (e.stat === 'critico') extraCritico += valor;
    else if (e.stat === 'esquiva') extraEsquiva += valor;
    else if (e.stat === 'combo') extraCombo += valor;
    else if (e.stat === 'contraataque') extraContra += valor;
  }

  let factor = 0.5 + qi / 100;
  factor *= qiBoost;

  const baseFuerza = Math.floor(b.fuerza * boostFuerza);
  const baseAgilidad = Math.floor(b.agilidad * boostAgilidad);
  const baseVelocidad = Math.floor(b.velocidad * boostVelocidad);
  const baseMaxHp = Math.floor(b.max_hp * boostHp);

  return {
    qi,
    qi_boost: qiBoost,
    boostFuerza,
    boostAgilidad,
    boostVelocidad,
    boostHp,
    roboVida,
    dañoArma,
    dañoPuño,
    extraDefensa,
    extraResistencia,
    extraCritico,
    extraEsquiva,
    extraCombo,
    extraContra,
    baseFuerza,
    baseAgilidad,
    baseVelocidad,
    baseMaxHp,
    real_fuerza: Math.round(baseFuerza * factor),
    real_agilidad: Math.round(baseAgilidad * factor),
    real_velocidad: Math.round(baseVelocidad * factor),
    real_max_hp: Math.round(baseMaxHp * factor),
  };
}

function generarRewardNivel() {
  const r = Math.random();
  if (r < 0.40) {
    const item = getRandomArma();
    return { tipo: 'arma', nombre: item.nombre, item };
  }
  if (r < 0.70) {
    const item = getRandomHabilidad();
    const efecto = JSON.parse(item.efecto);
    const valorNv1 = efecto.valorPorNivel[1];
    const desc = `${item.descripcion} (Nv1: ${Math.round(valorNv1 * 100)}%)`;
    return { tipo: 'habilidad', nombre: item.nombre, descripcion: desc, item };
  }
  const stats = ['fuerza', 'agilidad', 'velocidad', 'vitalidad'];
  const stat = getRandomItem(stats);
  const valor = stat === 'vitalidad' ? 2 : 1;
  return { tipo: 'stat', stat, valor };
}

function generarStatsOpcionesNivel() {
  const pool = ['fuerza', 'agilidad', 'velocidad', 'vitalidad'];
  const shuffled = [...pool].sort(() => Math.random() - 0.5);
  const elegidas = shuffled.slice(0, 2);

  return elegidas.map(s => {
    const r = Math.random();
    let valor, rareza;
    if (r < 0.60) {
      valor = s === 'vitalidad' ? 2 : 1;
      rareza = 'bronce';
    } else if (r < 0.90) {
      valor = s === 'vitalidad' ? 4 : 2;
      rareza = 'plata';
    } else {
      valor = s === 'vitalidad' ? 6 : 3;
      rareza = 'oro';
    }
    const icono = s === 'fuerza' ? '💪' : s === 'agilidad' ? '🏃' : s === 'velocidad' ? '⚡' : '🛡️';
    const label = s === 'vitalidad' ? 'Vitalidad' : s.charAt(0).toUpperCase() + s.slice(1);
    const descHp = s === 'vitalidad' ? ` (+${valor * 5} HP)` : '';
    return { stat: s, valor, rareza, icono, label, descHp };
  });
}

module.exports = {
  armas, habilidades,
  getRandomArma, getRandomHabilidad,
  generarStatsIniciales,
  generarBots, nombresBot,
  generarOpcionesIniciales,
  calcularQi, aplicarSkillsYQi, getValorHabilidadPorNivel,
  generarRewardNivel, generarStatsOpcionesNivel,
};
