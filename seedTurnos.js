const NFCDatabase = require("./database");

async function cargarTurnos() {
  const db = new NFCDatabase();

  await new Promise(resolve => setTimeout(resolve, 500));

  const usuarios = await db.obtenerUsuarios();

  if (!usuarios || usuarios.length === 0) {
    console.log("⚠️ No hay usuarios en la base de datos. Ejecuta primero seedOperadores.js");
    return;
  }

  const hoy = new Date().toISOString().split('T')[0];

  const horarios = [];
  for (let h = 8; h <= 22; h++) {
    horarios.push(`${h.toString().padStart(2, '0')}:00`);
    horarios.push(`${h.toString().padStart(2, '0')}:30`);
  }

  const areas = ['sala', 'notebooks'];
  const estadosValidos = ['pendiente', 'ingreso', 'finalizado', 'perdido'];

  let turnosCreados = 0;

  while (turnosCreados < 20) {
    const hora = horarios[Math.floor(Math.random() * horarios.length)];
    const usuario = usuarios[Math.floor(Math.random() * usuarios.length)];
    const area = areas[Math.floor(Math.random() * areas.length)];
    const tematica = area === 'sala' ? 'Uso de Salas para Estudio' : '1 Notebook';
    const tipoAsistencia = Math.random() > 0.5 ? 'presencial' : 'virtual';

    // Estado aleatorio entre los válidos
    const estadoTurno = estadosValidos[Math.floor(Math.random() * estadosValidos.length)];

    try {
      const turnoCreado = await db.registrarTurno({
        fecha: hoy,
        hora,
        area,
        tematica,
        tipo_asistencia: tipoAsistencia,
        id_usuario: usuario.id_usuario
      });

      // Actualizar estado si no es 'pendiente'
      if (estadoTurno !== 'pendiente') {
        await db.actualizarEstadoTurno(turnoCreado.id_turno, estadoTurno);
      }

      turnosCreados++;
    } catch (error) {
      console.error(`❌ Error creando turno para ${usuario.nombre_completo} en ${hora}:`, error.message);
    }
  }

  console.log(`✅ Total de turnos creados: ${turnosCreados}`);

  const turnos = await db.obtenerTurnos();
  const estadisticas = turnos.reduce((acc, turno) => {
    acc[turno.estado] = (acc[turno.estado] || 0) + 1;
    return acc;
  }, {});

  console.log('\n📊 Estadísticas de turnos:');
  Object.entries(estadisticas).forEach(([estado, cantidad]) => {
    const porcentaje = ((cantidad / turnos.length) * 100).toFixed(1);
    console.log(`   ${estado}: ${cantidad} (${porcentaje}%)`);
  });
}

if (require.main === module) {
  cargarTurnos()
    .then(() => {
      console.log('🎉 Seed de turnos completado exitosamente');
      process.exit(0);
    })
    .catch(error => {
      console.error('❌ Error ejecutando seed de turnos:', error);
      process.exit(1);
    });
}

module.exports = cargarTurnos;
