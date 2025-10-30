// seedDashboard.js
const NFCDatabase = require('./database');
const db = new NFCDatabase();

async function seedDashboardData() {
  try {
    console.log('🌱 Insertando datos de prueba para el dashboard...');

    // Obtener algunos usuarios existentes
    const usuarios = await new Promise((resolve, reject) => {
      db.db.all('SELECT * FROM usuario LIMIT 5', (err, rows) => {
        if (err) reject(err);
        else resolve(rows);
      });
    });

    if (usuarios.length === 0) {
      console.log('❌ No hay usuarios en la base de datos. Primero crea algunos usuarios.');
      return;
    }

    const hoy = new Date().toISOString().split('T')[0];

    // Crear entradas de prueba para hoy
    const entradasPrueba = [
      {
        accion: 'entrada',
        fecha: hoy,
        hora: '08:30:00',
        tipo_uso: 'sala',
        id_usuario: usuarios[0].id_usuario,
        uid_tarjeta: usuarios[0].uid_tarjeta || 'TEST001'
      },
      {
        accion: 'entrada',
        fecha: hoy,
        hora: '09:15:00',
        tipo_uso: 'sala',
        id_usuario: usuarios[1]?.id_usuario,
        uid_tarjeta: usuarios[1]?.uid_tarjeta || 'TEST002'
      },
      {
        accion: 'salida',
        fecha: hoy,
        hora: '12:45:00',
        tipo_uso: 'sala',
        id_usuario: usuarios[0].id_usuario,
        uid_tarjeta: usuarios[0].uid_tarjeta || 'TEST001'
      },
      {
        accion: 'entrada',
        fecha: hoy,
        hora: '14:20:00',
        tipo_uso: 'computadora',
        id_usuario: usuarios[2]?.id_usuario,
        uid_tarjeta: usuarios[2]?.uid_tarjeta || 'TEST003'
      }
    ];

    // Insertar entradas de prueba
    for (const entrada of entradasPrueba) {
      await new Promise((resolve, reject) => {
        db.db.run(`
          INSERT INTO entrada (accion, fecha, hora, tipo_uso, id_usuario, uid_tarjeta)
          VALUES (?, ?, ?, ?, ?, ?)
        `, [
          entrada.accion,
          entrada.fecha,
          entrada.hora,
          entrada.tipo_uso,
          entrada.id_usuario,
          entrada.uid_tarjeta
        ], function(err) {
          if (err) reject(err);
          else resolve();
        });
      });
    }

    console.log('✅ Datos de prueba insertados correctamente');

  } catch (error) {
    console.error('❌ Error insertando datos de prueba:', error);
  } finally {
    await db.close();
  }
}

if (require.main === module) {
  seedDashboardData();
}

module.exports = seedDashboardData;