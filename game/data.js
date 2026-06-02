const armas = [
  { nombre: 'Cuchillo', tipo: 'corto', dano_min: 2, dano_max: 5 },
  { nombre: 'Espadón', tipo: 'pesado', dano_min: 4, dano_max: 8 },
  { nombre: 'Maza', tipo: 'contundente', dano_min: 3, dano_max: 7 },
  { nombre: 'Hacha', tipo: 'pesado', dano_min: 5, dano_max: 9 },
  { nombre: 'Látigo', tipo: 'corto', dano_min: 2, dano_max: 6 },
  { nombre: 'Shuriken', tipo: 'corto', dano_min: 1, dano_max: 4 },
  { nombre: 'Sai', tipo: 'corto', dano_min: 2, dano_max: 5 },
  { nombre: 'Mangual', tipo: 'contundente', dano_min: 4, dano_max: 8 },
  { nombre: 'Martillo', tipo: 'contundente', dano_min: 6, dano_max: 10 },
  { nombre: 'Lanza', tipo: 'pesado', dano_min: 3, dano_max: 7 },
  { nombre: 'Cimitarra', tipo: 'pesado', dano_min: 4, dano_max: 8 },
  { nombre: 'Alabarda', tipo: 'pesado', dano_min: 5, dano_max: 9 },
];

const habilidades = [
  { nombre: 'Fuerza de Hércules', descripcion: 'Aumenta la fuerza entre 5 y 20 puntos', efecto: JSON.stringify({ stat: 'fuerza', valor: { min: 5, max: 20 } }) },
  { nombre: 'Agilidad felina', descripcion: 'Aumenta la agilidad entre 5 y 20 puntos', efecto: JSON.stringify({ stat: 'agilidad', valor: { min: 5, max: 20 } }) },
  { nombre: 'Golpe del rayo', descripcion: 'Aumenta la velocidad entre 5 y 20 puntos', efecto: JSON.stringify({ stat: 'velocidad', valor: { min: 5, max: 20 } }) },
  { nombre: 'Vitalidad', descripcion: 'Aumenta la vida máxima entre 5 y 20 puntos', efecto: JSON.stringify({ stat: 'hp', valor: { min: 5, max: 20 } }) },
  { nombre: 'Escudo', descripcion: 'Reduce el daño recibido un 25%', efecto: JSON.stringify({ stat: 'defensa', valor: { min: 0.15, max: 0.35 } }) },
  { nombre: 'Puñal trapero', descripcion: 'Probabilidad de contraatacar al recibir daño', efecto: JSON.stringify({ stat: 'contraataque', valor: { min: 0.1, max: 0.3 } }) },
  { nombre: 'Intocable', descripcion: 'Aumenta la probabilidad de esquivar', efecto: JSON.stringify({ stat: 'esquiva', valor: { min: 0.1, max: 0.25 } }) },
  { nombre: 'Tornado de golpes', descripcion: 'Probabilidad de golpe múltiple', efecto: JSON.stringify({ stat: 'multigolpe', valor: { min: 0.1, max: 0.2 } }) },
  { nombre: 'Piel reforzada', descripcion: 'Reduce daño de golpes cuerpo a cuerpo', efecto: JSON.stringify({ stat: 'resistencia', valor: { min: 0.1, max: 0.3 } }) },
  { nombre: 'Inmortal', descripcion: 'Aumenta la vida entre 5% y 50%', efecto: JSON.stringify({ stat: 'hp_porcentual', valor: { min: 0.05, max: 0.5 } }) },
];

const mascotas = [
  { nombre: 'Perro', tipo: 'perro', hp: 15, ataque: 5 },
  { nombre: 'Lobo', tipo: 'lobo', hp: 30, ataque: 10 },
  { nombre: 'Oso', tipo: 'oso', hp: 50, ataque: 8 },
  { nombre: 'Pantera', tipo: 'felino', hp: 35, ataque: 12 },
  { nombre: 'Águila', tipo: 'ave', hp: 20, ataque: 7 },
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

function getRandomMascota() {
  return { ...getRandomItem(mascotas) };
}

function generarStatsIniciales() {
  return {
    hp: 60 + Math.floor(Math.random() * 21),
    max_hp: 60 + Math.floor(Math.random() * 21),
    fuerza: 3 + Math.floor(Math.random() * 8),
    agilidad: 3 + Math.floor(Math.random() * 8),
    velocidad: 3 + Math.floor(Math.random() * 8),
  };
}

module.exports = {
  armas, habilidades, mascotas,
  getRandomArma, getRandomHabilidad, getRandomMascota,
  generarStatsIniciales,
};
