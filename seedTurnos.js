// seedTurnos.js
const NFCDatabase = require("./database");

async function cargarTurnos() {
    const db = new NFCDatabase();

    // Esperamos que se inicialice la base de datos
    await new Promise(resolve => setTimeout(resolve, 500));

    // Obtener usuarios existentes para asignar turnos
    const usuarios = await db.obtenerUsuarios();
    
    if (usuarios.length === 0) {
        console.log("⚠️ No hay usuarios en la base de datos. Ejecuta primero seedOperadores.js");
        return;
    }

    // Fechas posibles (hoy y mañana, por ejemplo)
    const hoy = new Date();
    const fechas = [hoy.toISOString().split('T')[0]];

    // Horarios de la biblioteca (8:00 a 22:00 cada 30 min)
    const horarios = [];
    for (let h = 8; h <= 22; h++) {
        horarios.push(`${h.toString().padStart(2, '0')}:00`);
        horarios.push(`${h.toString().padStart(2, '0')}:30`);
    }

    // Áreas disponibles
    const areas = ['sala', 'notebooks'];

    let turnosCreados = 0;

    while (turnosCreados < 20) {
        const fecha = fechas[0]; // todos los turnos hoy
        const hora = horarios[Math.floor(Math.random() * horarios.length)];
        const usuario = usuarios[Math.floor(Math.random() * usuarios.length)];
        const area = areas[Math.floor(Math.random() * areas.length)];
        const tematica = area === 'sala' ? 'Uso de Salas para Estudio' : '1 Notebook';
        const tipoAsistencia = Math.random() > 0.5 ? 'presencial' : 'virtual';

        // Estado aleatorio para pruebas
        const rand = Math.random();
        let estadoTurno;
        if (rand < 0.7) estadoTurno = 'pendiente';
        else if (rand < 0.9) estadoTurno = 'ingreso';
        else estadoTurno = 'perdido';

        try {
            // Crear el turno (se crea con estado 'pendiente' por defecto)
            const turnoCreado = await db.registrarTurno({
                fecha,
                hora,
                area,
                tematica,
                tipo_asistencia: tipoAsistencia,
                id_usuario: usuario.id_usuario
            });

            // Actualizar al estado aleatorio para pruebas/desarrollo
            if (estadoTurno !== 'pendiente') {
                await db.actualizarEstadoTurno(turnoCreado.id_turno, estadoTurno);
            }

            turnosCreados++;
        } catch (error) {
            console.error(`Error creando turno para ${usuario.nombre_completo} en ${fecha} ${hora}:`, error.message);
        }
    }

    console.log(`✅ Total de turnos creados: ${turnosCreados}`);

    // Estadísticas por estado
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

// Ejecutar si se llama directamente
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
