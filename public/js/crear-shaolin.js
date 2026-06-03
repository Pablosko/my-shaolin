let pasoActual = 1;
let shaolinData = {};
let opcionesDisponibles = [];

function mostrarPaso(n) {
  document.querySelectorAll('.creacion-paso').forEach(p => p.classList.remove('active'));
  document.getElementById(`paso-${n}`).classList.add('active');
  pasoActual = n;
}

function seleccionarGenero(genero) {
  document.querySelectorAll('.genero-opcion').forEach(g => g.classList.remove('selected'));
  document.querySelector(`.genero-opcion[data-genero="${genero}"]`).classList.add('selected');
  shaolinData.genero = genero;
}

function siguientePaso() {
  if (pasoActual === 1) {
    const name = document.getElementById('shaolin-name').value.trim();
    if (!name) { alert('Elige un nombre para tu guerrero'); return; }
    if (!shaolinData.genero) { alert('Selecciona un género'); return; }
    shaolinData.name = name;
    mostrarPaso(2);
    generarStatsPreview();
  } else if (pasoActual === 2) {
    mostrarPaso(3);
    cargarOpciones();
  }
}

async function generarStatsPreview() {
  document.getElementById('stats-preview').classList.remove('hidden');
}

async function cargarOpciones() {
  const container = document.getElementById('opciones-container');
  container.innerHTML = '<div style="text-align:center;color:#8b6fa0;grid-column:1/-1;padding:20px">Generando opciones...</div>';
  try {
    const data = await API.post('/shaolins/opciones', {});
    opcionesDisponibles = data.opciones;
    container.innerHTML = '';
    opcionesDisponibles.forEach((op, i) => {
      const div = document.createElement('div');
      div.className = 'eleccion-item';
      div.setAttribute('data-index', i);
      div.innerHTML = `
        <div class="icono">${op.icono}</div>
        <div class="titulo">${op.nombre}</div>
        <div class="desc">${op.tipo === 'arma' ? '🗡️ Arma' : '✨ Habilidad'}${op.descripcion ? '<br>' + op.descripcion : ''}</div>
      `;
      div.addEventListener('click', () => elegirOpcion(i));
      container.appendChild(div);
    });
  } catch (err) {
    container.innerHTML = `<div style="text-align:center;color:#ef4444;grid-column:1/-1">Error: ${err.message}</div>`;
  }
}

function elegirOpcion(index) {
  shaolinData.indiceOpcion = index;
  document.getElementById('crear-btn').disabled = false;
  document.querySelectorAll('.eleccion-item').forEach(el => {
    el.style.borderColor = '#4a3060';
  });
  document.querySelectorAll('.eleccion-item')[index].style.borderColor = '#8b5cf6';
}

async function crearShaolin() {
  if (!shaolinData.name || shaolinData.genero === undefined || shaolinData.indiceOpcion === undefined) return;

  document.getElementById('crear-btn').disabled = true;
  document.getElementById('crear-btn').textContent = 'Creando...';

  try {
    const data = await API.post('/shaolins', {
      name: shaolinData.name,
      genero: shaolinData.genero,
      indiceOpcion: shaolinData.indiceOpcion,
      opciones: opcionesDisponibles,
    });

    mostrarPaso(4);
    const elegida = opcionesDisponibles[shaolinData.indiceOpcion];
    document.getElementById('resultado-creacion').innerHTML = `
      <div style="text-align:center">
        <div id="resultado-avatar" style="width:120px;height:120px;border-radius:50%;margin:0 auto 16px;overflow:hidden;border:4px solid ${getColor(shaolinData.genero)}"></div>
        <h2>¡${data.name} ha nacido!</h2>
        <div class="stats-creacion" style="margin-top:20px">
          <div class="stat-item"><span class="stat-label">Nivel</span><span class="stat-value">${data.level}</span></div>
          <div class="stat-item"><span class="stat-label">❤️ Vida</span><span class="stat-value">${data.hp}</span></div>
          <div class="stat-item"><span class="stat-label">💪 Fuerza</span><span class="stat-value">${data.fuerza}</span></div>
          <div class="stat-item"><span class="stat-label">🏃 Agilidad</span><span class="stat-value">${data.agilidad}</span></div>
          <div class="stat-item"><span class="stat-label">⚡ Velocidad</span><span class="stat-value">${data.velocidad}</span></div>
        </div>
        <div class="card mt-20" style="border-color:#8b5cf6">
          <div style="font-size:32px;margin-bottom:8px">${elegida.icono}</div>
          <div style="font-weight:bold">¡Has recibido un${elegida.tipo === 'habilidad' ? 'a' : ''} ${elegida.tipo}!</div>
          <div style="color:#a78bfa;font-size:18px;margin-top:4px">${data.item.nombre}</div>
          ${data.item.descripcion ? `<div style="color:#8b6fa0;font-size:13px;margin-top:4px">${data.item.descripcion}</div>` : ''}
        </div>
        <a href="/dashboard.html" class="btn btn-primario mt-20">Ir al dashboard</a>
      </div>
    `;
    document.getElementById('resultado-avatar').appendChild(crearAvatarImg(shaolinData.genero, 'default'));
  } catch (err) {
    alert('Error: ' + err.message);
    document.getElementById('crear-btn').disabled = false;
    document.getElementById('crear-btn').textContent = 'Crear Guerrero';
  }
}

document.addEventListener('DOMContentLoaded', () => {
  checkAuth();
  mostrarPaso(1);
});
