const express = require('express');
const cors = require('cors');
const path = require('path');
const NFCDatabase = require('./database');
const app = express();
const port = 3000;
const db = new NFCDatabase();
const { verificarPrestamosAVencer } = require('./utils/notificaciones');


app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

(async () => {
  try {
    await db.actualizarTurnosAutomaticamente();
    console.log('Turnos actualizados automáticamente al iniciar el servidor');
  } catch (error) {
    console.error('Error actualizando turnos al inicio:', error);
  }
})();

setInterval(async () => {
  try {
    await db.actualizarTurnosAutomaticamente();
    console.log('Turnos actualizados automáticamente (intervalo)');
  } catch (error) {
    console.error('Error actualizando turnos en intervalo:', error);
  }
}, 120 * 60 * 1000);

// Ruta principal
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Verificar UID (usuario, libro, computadora)
app.get("/api/uid/verificar/:uid", async (req, res) => {
  const { uid } = req.params;
  if (!uid) return res.status(400).json({ error: "UID no proporcionado" });

  try {
      // Consultar en paralelo
      const [usuario, libro, computadora] = await Promise.all([
          db.obtenerUsuarioPorUID(uid),
          db.obtenerLibroPorUID(uid),
          db.obtenerComputadoraPorUID(uid)
      ]);

      if (usuario) return res.json({ tipo: "usuario", info: usuario });
      if (libro) return res.json({ tipo: "libro", info: libro });
      if (computadora) return res.json({ tipo: "computadora", info: computadora });

      return res.json({ tipo: "libre" });

  } catch (err) {
      console.error("Error verificando UID:", err);
      res.status(500).json({ error: "Error interno" });
  }
});

// Operadores
app.get('/api/operadores', async (req, res) => {
  try {
    const operadores = await db.obtenerOperadores();
    res.json(operadores);
  } catch (error) {
    console.error('Error al obtener operadores:', error);
    res.status(500).json({ error: 'Error al obtener operadores' });
  }
});

app.post('/api/operadores', async (req, res) => {
  try {
    const result = await db.registrarOperador(req.body);
    res.status(201).json(result);
  } catch (error) {
    console.error('Error al registrar operador:', error);
    res.status(500).json({ error: 'Error al registrar operador' });
  }
});

app.delete('/api/operadores/:id', async (req, res) => {
  try {
    const result = await db.eliminarOperador(req.params.id);
    if (result.deleted > 0) res.json({ message: 'Operador eliminado correctamente' });
    else res.status(404).json({ error: 'Operador no encontrado' });
  } catch (error) {
    console.error('Error al eliminar operador:', error);
    res.status(500).json({ error: error.message });
  }
});

// Usuarios
app.get('/api/usuarios/uid/:uid', async (req, res) => {
  try {
    const { uid } = req.params;
    const usuario = await db.obtenerUsuarioPorUID(uid);
    if (!usuario) return res.status(404).json({ error: 'UID no encontrado' });
    res.json(usuario);
  } catch (error) {
    console.error('Error al buscar usuario por UID:', error);
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/usuarios', async (req, res) => {
  try {
    const usuarios = await db.obtenerUsuarios();
    res.json(usuarios);
  } catch (error) {
    console.error('Error al obtener usuarios:', error);
    res.status(500).json({ error: 'Error al obtener usuarios' });
  }
});

app.get('/api/usuarios/login', async (req, res) => {
  try {
    const { id_usuario, contrasena } = req.query;

    if (!id_usuario || !contrasena) {
      return res.status(400).json({ error: 'Faltan credenciales' });
    }

    const usuario = await db.recuperarLogin(id_usuario, contrasena);

    if (!usuario) {
      return res.status(401).json({ error: 'Credenciales inválidas' });
    }

    res.json({
      message: `Bienvenido ${usuario.nombre_completo}`,
      data: usuario
    });
  } catch (error) {
    console.error('Error en login:', error);
    res.status(500).json({ error: 'Error al intentar iniciar sesión' });
  }
});


app.post('/api/usuarios', async (req, res) => {
  try {
    const data = req.body;

    if (!data.operador) {
      data.operador = 999999;
    }

    if (!data.id_usuario || !data.tipo_usuario || !data.nombre_completo) {
      return res.status(400).json({ error: 'Campos obligatorios faltantes' });
    }

    const usuario = await db.registrarUsuario(data);
    res.status(201).json(usuario);
  } catch (error) {
    console.error('Error al registrar usuario:', error);
    res.status(500).json({ error: error.message });
  }
});

app.put('/api/usuarios/:id_usuario', async (req, res) => {
  try {
    const result = await db.actualizarUsuario(req.params.id_usuario, req.body);
    if (result.updatedRows > 0) {
      res.json({ message: 'Usuario actualizado correctamente' });
    } else {
      res.status(404).json({ error: 'Usuario no encontrado' });
    }
  } catch (error) {
    console.error('Error al actualizar usuario:', error);
    res.status(500).json({ error: 'Error al actualizar usuario' });
  }
});

app.delete('/api/usuarios/:id_usuario', async (req, res) => {
  try {
    const result = await db.eliminarUsuario(req.params.id_usuario);
    if (result.deleted > 0) {
      res.json({ message: 'Usuario eliminado correctamente' });
    } else {
      res.status(404).json({ error: 'Usuario no encontrado' });
    }
  } catch (error) {
    console.error('Error al eliminar usuario:', error);
    res.status(500).json({ error: 'Error al eliminar usuario' });
  }
});

// Turnos
app.get('/api/turnos', async (req, res) => {
  try {
    const { fecha } = req.query;
    
    let turnos;
    if (fecha) {
      turnos = await db.obtenerTurnosPorFecha(fecha);
    } else {
      turnos = await db.obtenerTurnos();
    }
    
    res.json(turnos);
  } catch (error) {
    console.error('Error al obtener turnos:', error);
    res.status(500).json({ error: 'Error al obtener turnos' });
  }
});

app.post('/api/turnos', async (req, res) => {
  try {
    const result = await db.registrarTurno(req.body);
    res.status(201).json(result);
  } catch (error) {
    console.error('Error al registrar turno:', error);
    res.status(500).json({ error: 'Error al registrar turno' });
  }
});

app.put('/api/turnos/:id/estado', async (req, res) => {
  try {
    const { id } = req.params;
    const { estado } = req.body;

    // Validar que se proporcione un estado
    if (!estado) {
      return res.status(400).json({ error: 'El estado es requerido' });
    }

    // Validar que el estado sea uno de los valores permitidos
    const estadosValidos = ['pendiente', 'ingreso', 'finalizado', 'perdido'];
    if (!estadosValidos.includes(estado)) {
      return res.status(400).json({ 
        error: 'Estado inválido',
        estadosValidos: estadosValidos
      });
    }

    // Actualizar el estado
    const result = await db.actualizarEstadoTurno(id, estado);
    
    // Verificar si se actualizó algún registro
    if (result.updated === 0) {
      return res.status(404).json({ error: 'Turno no encontrado' });
    }

    res.json({ 
      message: 'Estado actualizado correctamente',
      id_turno: id,
      nuevo_estado: estado,
      updated: result.updated
    });
  } catch (error) {
    console.error('Error al actualizar estado de turno:', error);
    res.status(500).json({ error: 'Error al actualizar estado de turno', details: error.message });
  }
});

// POST login (credenciales en body JSON)
app.post('/api/usuarios/login', async (req, res) => {
  try {
    const { id_usuario, contrasena } = req.body;
    if (!id_usuario || !contrasena) {
      return res.status(400).json({ error: 'Faltan credenciales' });
    }

    const usuario = await db.recuperarLogin(id_usuario, contrasena);
    if (!usuario) return res.status(401).json({ error: 'Credenciales inválidas' });

    // Devolver el usuario directo, no dentro de { data: ... }
    return res.json(usuario);
  } catch (error) {
    console.error('Error en login:', error);
    res.status(500).json({ error: 'Error al intentar iniciar sesión' });
  }
});
// ==========================
// ENDPOINTS PARA DASHBOARD (versión con promesas)
// ==========================

// Helper function para ejecutar queries
const executeQuery = (sql, params = []) => {
  return new Promise((resolve, reject) => {
    db.db.all(sql, params, (err, rows) => {
      if (err) reject(err);
      else resolve(rows);
    });
  });
};

// Accesos de hoy
app.get('/api/dashboard/accesos-hoy', async (req, res) => {
  try {
    const hoy = new Date().toISOString().split('T')[0];
    const result = await executeQuery(
      `SELECT COUNT(*) as count FROM entrada WHERE fecha = ? AND accion IN ('entrada')`,
      [hoy]
    );
    res.json({ accesosHoy: result[0]?.count || 0 });
  } catch (error) {
    console.error('Error al obtener accesos de hoy:', error);
    res.status(500).json({ error: error.message });
  }
});

// Personas actualmente dentro
app.get('/api/dashboard/personas-dentro', async (req, res) => {
  try {
    const result = await executeQuery(`
      SELECT COUNT(DISTINCT e1.id_usuario) as count
      FROM entrada e1
      WHERE e1.accion = 'entrada'
      AND e1.id_usuario IS NOT NULL
      AND NOT EXISTS (
        SELECT 1 
        FROM entrada e2 
        WHERE e2.id_usuario = e1.id_usuario 
        AND e2.accion = 'salida'
        AND (e2.fecha > e1.fecha OR (e2.fecha = e1.fecha AND e2.hora > e1.hora))
      )
    `);
    res.json({ personasDentro: result[0]?.count || 0 });
  } catch (error) {
    console.error('Error al obtener personas dentro:', error);
    res.status(500).json({ error: error.message });
  }
});

// Última actividad
app.get('/api/dashboard/ultima-actividad', async (req, res) => {
  try {
    const result = await executeQuery(`
      SELECT e.*, u.nombre_completo 
      FROM entrada e 
      LEFT JOIN usuario u ON e.id_usuario = u.id_usuario 
      ORDER BY e.fecha DESC, e.hora DESC 
      LIMIT 1
    `);
    res.json(result[0] || null);
  } catch (error) {
    console.error('Error al obtener última actividad:', error);
    res.status(500).json({ error: error.message });
  }
});

// Registro de accesos de hoy
app.get('/api/dashboard/accesos-hoy-detalle', async (req, res) => {
  try {
    const hoy = new Date().toISOString().split('T')[0];
    const result = await executeQuery(`
      SELECT 
        e.id_entrada,
        e.accion as movimiento,
        e.fecha,
        e.hora,
        e.uid_tarjeta,
        e.id_usuario,
        u.nombre_completo,
        e.tipo_uso
      FROM entrada e
      LEFT JOIN usuario u ON e.id_usuario = u.id_usuario
      WHERE e.fecha = ?
      ORDER BY e.fecha DESC, e.hora DESC
    `, [hoy]);
    res.json(result);
  } catch (error) {
    console.error('Error al obtener accesos detalle:', error);
    res.status(500).json({ error: error.message });
  }
});

// Computadoras
app.get('/api/computadoras', async (req, res) => {
  try {
    const computadoras = await db.obtenerComputadoras();
    res.json(computadoras);
  } catch (error) {
    console.error('Error al obtener computadoras:', error);
    res.status(500).json({ error: 'Error al obtener computadoras' });
  }
});

app.post('/api/computadoras', async (req, res) => {
  try {
    const compu = await db.registrarComputadora(req.body);
    res.status(201).json(compu);
  } catch (error) {
    console.error('Error al registrar computadora:', error);
    res.status(500).json({ error: 'Error al registrar computadora' });
  }
});

app.put('/api/computadoras/:id/estado', async (req, res) => {
  try {
    const result = await db.actualizarEstadoComputadora(req.params.id, req.body.estado);
    res.json(result);
  } catch (error) {
    console.error('Error al actualizar estado de computadora:', error);
    res.status(500).json({ error: 'Error al actualizar estado' });
  }
});

app.delete('/api/computadoras/:id', async (req, res) => {
  try {
    const result = await db.eliminarComputadora(req.params.id);
    if (result.deleted > 0) res.json({ message: 'Computadora eliminada correctamente' });
    else res.status(404).json({ error: 'Computadora no encontrada' });
  } catch (error) {
    console.error('Error al eliminar computadora:', error);
    res.status(500).json({ error: error.message });
  }
});

// Préstamos de computadoras
app.get('/api/prestamos-computadora', async (req, res) => {
  try {
    const prestamos = await db.obtenerPrestamosComputadora();
    res.json(prestamos);
  } catch (error) {
    console.error('Error al obtener préstamos de computadora:', error);
    res.status(500).json({ error: 'Error al obtener préstamos' });
  }
});

app.post('/api/prestamos-computadora', async (req, res) => {
  try {
    const result = await db.registrarPrestamoComputadora(req.body);
    res.status(201).json(result);
  } catch (error) {
    console.error('Error al registrar préstamo de computadora:', error);
    res.status(500).json({ error: 'Error al registrar préstamo' });
  }
});

app.put('/api/prestamos-computadora/:id/estado', async (req, res) => {
  try {
    const { hora_fin } = req.body;
    const { id } = req.params;

    // Validación mínima
    if (!id) return res.status(400).json({ error: 'Falta el ID del préstamo' });

    // Llamamos a la función de finalización
    const result = await db.finalizarPrestamoComputadora(id, hora_fin || null);

    // Si la función devuelve algo tipo "no encontrado", manejamos el error
    if (!result) {
      return res.status(404).json({ error: 'Préstamo no encontrado o ya finalizado' });
    }

    res.json({
      message: 'Préstamo finalizado correctamente',
      data: result
    });
  } catch (error) {
    console.error('Error al finalizar préstamo computadora:', error);
    res.status(500).json({ error: error.message });
  }
});

app.delete('/api/prestamos-computadora/:id', async (req, res) => {
  try {
    const result = await db.eliminarPrestamoComputadora(req.params.id);
    if (result.deleted > 0) res.json({ message: 'Préstamo de computadora eliminado' });
    else res.status(404).json({ error: 'Préstamo no encontrado' });
  } catch (error) {
    console.error('Error al eliminar préstamo de computadora:', error);
    res.status(500).json({ error: error.message });
  }
});

// Entradas de usuarios activos
app.get('/api/entradas/activos', async (req, res) => {
  try {
    const activos = await db.obtenerUsuariosActivos();
    res.json(activos);
  } catch (error) {
    console.error('Error al obtener usuarios activos:', error);
    res.status(500).json({ error: error.message });
  }
});

app.get("/api/uid/ultimo", async (req, res) => {
  try {
      const ultimo = await db.getUltimoUID();
      console.log("Último UID obtenido:", ultimo);
      if (!ultimo) return res.json({ uid_tarjeta: null });
      res.json({ uid_tarjeta: ultimo.uid_tarjeta });
  } catch (err) {
      console.error("Error al obtener último UID:", err);
      res.status(500).json({ error: "Error interno" });
  }
});

// Registro de lectura NFC (entrada)
app.post('/api/nfc', async (req, res) => {
  try {
    const { uid_tarjeta } = req.body;

    if (!uid_tarjeta) {
      return res.status(400).json({ error: 'Falta UID de la tarjeta' });
    }

    // Llamamos a la función corregida en la DB
    const nuevaEntrada = await db.registrarLecturaNFC(uid_tarjeta);
    // Enviar el nuevo UID a todos los clientes WebSocket
    broadcast({ tipo: 'lectura_nfc', data: nuevaEntrada });

    res.status(201).json({
      message: 'Lectura registrada correctamente',
      data: nuevaEntrada
    });
  } catch (error) {
    console.error('Error al registrar lectura NFC:', error);
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/libros/uid/:uid', async (req, res) => {
  try {
    const { uid } = req.params;
    const [libro] = await db.query(
      'SELECT * FROM libros WHERE uid_tarjeta = ?',
      [uid]
    );
    if (!libro || libro.length === 0) {
      return res.status(404).json({ error: 'Libro no encontrado' });
    }
    res.json(Array.isArray(libro) ? libro[0] : libro);
  } catch (error) {
    console.error('Error al buscar libro por UID:', error);
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/libros', async (req, res) => {
  try {
    const libros = await db.obtenerLibros();
    res.json(libros);
  } catch (error) {
    console.error('Error al obtener libros:', error);
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/libros', async (req, res) => {
  try {
    const result = await db.registrarLibro(req.body);
    res.status(201).json(result);
  } catch (error) {
    console.error('Error al registrar libro:', error);
    res.status(500).json({ error: error.message });
  }
});

app.delete('/api/libros/:id_libro', async (req, res) => {
  try {
    const result = await db.eliminarLibro(req.params.id_libro);
    if (result.deleted > 0) res.json({ message: 'Libro eliminado correctamente' });
    else res.status(404).json({ error: 'Libro no encontrado' });
  } catch (error) {
    console.error('Error al eliminar libro:', error);
    res.status(500).json({ error: error.message });
  }
});

// Préstamos de libros
app.get('/api/prestamos-libros', async (req, res) => {
  try {
    const prestamos = await db.obtenerPrestamosLibros();
    res.json(prestamos);
  } catch (error) {
    console.error('Error al obtener préstamos de libros:', error);
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/prestamos-libros', async (req, res) => {
  try {
    const result = await db.registrarPrestamoLibro(req.body);
    res.status(201).json(result);
  } catch (error) {
    console.error('Error al registrar préstamo de libro:', error);
    res.status(500).json({ error: error.message });
  }
});

app.put('/api/prestamos-libros/:id/finalizar', async (req, res) => {
  try {
    const result = await db.finalizarPrestamoLibro(req.params.id);
    res.json(result);
  } catch (error) {
    console.error('Error al finalizar préstamo de libro:', error);
    res.status(500).json({ error: error.message });
  }
});

// Inicio del servidor + WebSocket
const http = require('http');
const WebSocket = require('ws');

// Crear servidor HTTP a partir de Express
const server = http.createServer(app);

// Crear servidor WebSocket asociado
const wss = new WebSocket.Server({ server });

// Evento: cuando un cliente web se conecta
wss.on('connection', (ws) => {
  console.log('Cliente WebSocket conectado');

  ws.send(JSON.stringify({ message: 'Conectado al servidor WebSocket' }));

  ws.on('close', () => console.log('Cliente desconectado'));
});

// Función para emitir un mensaje a todos los clientes conectados
function broadcast(data) {
  const json = JSON.stringify(data);
  wss.clients.forEach(client => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(json);
    }
  });
}

// --- Notificaciones automáticas de préstamos ---
async function iniciarVerificacionPrestamos() {
  console.log('Iniciando verificación automática de préstamos...');
  await verificarPrestamosAVencer(db); // Primera ejecución inmediata
  setInterval(async () => {
    console.log('Ejecutando verificación diaria de préstamos...');
    await verificarPrestamosAVencer(db);
  }, 24 * 60 * 60 * 1000); // Cada 24 horas
}

iniciarVerificacionPrestamos();


// Iniciar servidor en el mismo puerto
server.listen(port, '0.0.0.0', async () => {
  console.log(`Servidor HTTP+WS corriendo`);});


// Cerrar servidor limpiamente
process.on('SIGINT', async () => {
  console.log('\nCerrando servidor...');
  await db.close();
  process.exit(0);
});
