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

    // Generar fechas para los próximos 7 días
    const hoy = new Date();
    const fechas = [];
    for (let i = 0; i < 7; i++) {
        const fecha = new Date(hoy);
        fecha.setDate(hoy.getDate() + i);
        fechas.push(fecha.toISOString().split('T')[0]); // Formato YYYY-MM-DD
    }

    // Horarios de la biblioteca (8:00 a 22:00)
    const horarios = [
        '08:00', '08:30', '09:00', '09:30', '10:00', '10:30', '11:00', '11:30',
        '12:00', '12:30', '13:00', '13:30', '14:00', '14:30', '15:00', '15:30',
        '16:00', '16:30', '17:00', '17:30', '18:00', '18:30', '19:00', '19:30',
        '20:00', '20:30', '21:00', '21:30', '22:00'
    ];

    // Tipos de uso de salas
    const tiposUso = [
        'Estudio individual',
        'Estudio grupal',
        'Reunión de estudio',
        'Trabajo en equipo',
        'Preparación de examen',
        'Investigación',
        'Lectura'
    ];

    // Estados posibles
    const estados = ['pendiente', 'ya_llego', 'perdido'];

    let turnosCreados = 0;
    let turnosPorDia = 0;

    for (const fecha of fechas) {
        turnosPorDia = 0;
        
        // Generar entre 15-25 turnos por día
        const cantidadTurnos = Math.floor(Math.random() * 11) + 15;
        
        // Seleccionar horarios aleatorios
        const horariosSeleccionados = horarios
            .sort(() => Math.random() - 0.5)
            .slice(0, cantidadTurnos)
            .sort();

        for (const hora of horariosSeleccionados) {
            // Seleccionar usuario aleatorio
            const usuario = usuarios[Math.floor(Math.random() * usuarios.length)];
            
            // Seleccionar tipo de uso aleatorio
            const tipoUso = tiposUso[Math.floor(Math.random() * tiposUso.length)];
            
            // Seleccionar estado (70% pendiente, 20% ya_llego, 10% perdido)
            const randomEstado = Math.random();
            let estado;
            if (randomEstado < 0.7) {
                estado = 'pendiente';
            } else if (randomEstado < 0.9) {
                estado = 'ya_llego';
            } else {
                estado = 'perdido';
            }

            try {
                await db.registrarTurno({
                    fecha: fecha,
                    hora: hora,
                    tipo_uso: tipoUso,
                    id_usuario: usuario.id_usuario
                });

                // Actualizar el estado del turno
                await db.actualizarEstadoTurno(turnosCreados + 1, estado);
                
                turnosCreados++;
                turnosPorDia++;
                
            } catch (error) {
                console.error(`Error creando turno para ${usuario.nombre_completo} en ${fecha} ${hora}:`, error.message);
            }
        }
        
        console.log(`📅 ${fecha}: ${turnosPorDia} turnos creados`);
    }

    console.log(`✅ Total de turnos creados: ${turnosCreados}`);
    console.log(`📊 Promedio por día: ${Math.round(turnosCreados / fechas.length)} turnos`);
    
    // Mostrar estadísticas por estado
    const turnos = await db.obtenerTurnos();
    const estadisticas = turnos.reduce((acc, turno) => {
        acc[turno.estado] = (acc[turno.estado] || 0) + 1;
        return acc;
    }, {});
    
    console.log('\n📈 Estadísticas de turnos:');
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
