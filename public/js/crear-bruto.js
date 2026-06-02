let pasoActual = 1;
let brutoData = {};

function mostrarPaso(n) {
  document.querySelectorAll('.creacion-paso').forEach(p => p.classList.remove('active'));
  document.getElementById(`paso-${n}`).classList.add('active');
  pasoActual = n;
}

function seleccionarGenero(genero) {
  document.querySelectorAll('.genero-opcion').forEach(g => g.classList.remove('selected'));
  document.querySelector(`.genero-opcion[data-genero="${genero}"]`).classList.add('selected');
  brutoData.genero = genero;
}

function siguientePaso() {
  if (pasoActual === 1) {
    const name = document.getElementById('bruto-name').value.trim();
    if (!name) { alert('Elige un nombre para tu guerrero'); return; }
    if (!brutoData.genero) { alert('Selecciona un género'); return; }
    brutoData.name = name;
    mostrarPaso(2);
    generarStatsPreview();
  } else if (pasoActual === 2) {
    mostrarPaso(3);
  }
}

async function generarStatsPreview() {
  document.getElementById('stats-preview').classList.remove('hidden');
}

function elegirOpcion(opcion) {
  brutoData.eleccion = opcion;
  document.getElementById('crear-btn').disabled = false;
  document.querySelectorAll('.eleccion-item').forEach(el => {
    el.style.borderColor = '#4a3060';
  });
  document.querySelectorAll('.eleccion-item')[opcion].style.borderColor = '#8b5cf6';
}

async function crearBruto() {
  if (!brutoData.name || brutoData.genero === undefined || brutoData.eleccion === undefined) return;

  document.getElementById('crear-btn').disabled = true;
  document.getElementById('crear-btn').textContent = 'Creando...';

  try {
    const data = await API.post('/brutos', {
      name: brutoData.name,
      genero: brutoData.genero,
      eleccion: brutoData.eleccion,
    });

    mostrarPaso(4);
    document.getElementById('resultado-creacion').innerHTML = `
      <div style="text-align:center">
        <div style="font-size:64px;margin-bottom:16px">${brutoData.genero === 'femenino' ? '👩' : '👨'}</div>
        <h2>¡${data.name} ha nacido!</h2>
        <div class="stats-creacion" style="margin-top:20px">
          <div class="stat-item"><span class="stat-label">Nivel</span><span class="stat-value">${data.level}</span></div>
          <div class="stat-item"><span class="stat-label">❤️ HP</span><span class="stat-value">${data.hp}</span></div>
          <div class="stat-item"><span class="stat-label">💪 Fuerza</span><span class="stat-value">${data.fuerza}</span></div>
          <div class="stat-item"><span class="stat-label">🏃 Agilidad</span><span class="stat-value">${data.agilidad}</span></div>
          <div class="stat-item"><span class="stat-label">⚡ Velocidad</span><span class="stat-value">${data.velocidad}</span></div>
        </div>
        <div class="card mt-20" style="border-color:#8b5cf6">
          <div style="font-size:32px;margin-bottom:8px">
            ${data.item.tipo === 'arma' ? '🗡️' : data.item.tipo === 'habilidad' ? '✨' : '🐾'}
          </div>
          <div style="font-weight:bold">¡Has recibido un${data.item.tipo === 'habilidad' ? 'a' : ''} ${data.item.tipo}!</div>
          <div style="color:#a78bfa;font-size:18px;margin-top:4px">${data.item.nombre}</div>
          ${data.item.descripcion ? `<div style="color:#8b6fa0;font-size:13px;margin-top:4px">${data.item.descripcion}</div>` : ''}
        </div>
        <a href="/dashboard.html" class="btn btn-primario mt-20">Ir al dashboard</a>
      </div>
    `;
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
