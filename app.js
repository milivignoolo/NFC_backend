const express = require('express');
const cors = require('cors');
const path = require('path');
const NFCDatabase = require('./database');
const app = express();
const port = 3000;
const db = new NFCDatabase();

// -------------------- MIDDLEWARES --------------------
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// -------------------- RUTA PRINCIPAL --------------------
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// ======================================================
//          VERIFICAR UID (USUARIO, LIBRO, COMPUTADORA)
// ======================================================
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

// ======================================================
//                RUTAS DE OPERADORES
// ======================================================
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

// ======================================================
//                RUTAS DE USUARIOS
// ======================================================

// ⚠️ IMPORTANTE: Rutas específicas ANTES de rutas con parámetros dinámicos
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

// ======================================================
//                LOGIN DE USUARIOS
// ======================================================
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

// ======================================================
//                RUTAS DE TURNOS
// ======================================================
app.get('/api/turnos', async (req, res) => {
  try {
    const turnos = await db.obtenerTurnos();
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
    const result = await db.actualizarEstadoTurno(req.params.id, req.body.estado);
    res.json(result);
  } catch (error) {
    console.error('Error al actualizar estado de turno:', error);
    res.status(500).json({ error: 'Error al actualizar estado' });
  }
});

// ======================================================
//                RUTAS DE COMPUTADORAS
// ======================================================
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

// ======================================================
//            RUTAS DE PRÉSTAMOS DE COMPUTADORA
// ======================================================
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

// ======================================================
//                   RUTAS DE ENTRADAS
// ======================================================
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





// ======================================================
//          REGISTRO DE LECTURA NFC (ENTRADA)
// ======================================================
app.post('/api/nfc', async (req, res) => {
  try {
    const { uid_tarjeta } = req.body;

    if (!uid_tarjeta) {
      return res.status(400).json({ error: 'Falta UID de la tarjeta' });
    }

    // Llamamos a la función corregida en la DB
    const nuevaEntrada = await db.registrarLecturaNFC(uid_tarjeta);

    res.status(201).json({
      message: 'Lectura registrada correctamente',
      data: nuevaEntrada
    });
  } catch (error) {
    console.error('Error al registrar lectura NFC:', error);
    res.status(500).json({ error: error.message });
  }
});



// ======================================================
//                   RUTAS DE LIBROS
// ======================================================

// ⚠️ IMPORTANTE: Rutas específicas ANTES de rutas con parámetros dinámicos
app.get('/api/libros/buscar', async (req, res) => {
  try {
    const { query } = req.query;
    if (!query) {
      return res.status(400).json({ error: 'Falta parámetro de búsqueda' });
    }
    const libros = await db.buscarLibros(query);
    res.json(libros);
  } catch (error) {
    console.error('Error al buscar libros:', error);
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

// ======================================================
//              RUTAS DE PRÉSTAMOS DE LIBROS
// ======================================================
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




// ======================================================
//               INICIO DEL SERVIDOR
// ======================================================
app.listen(port, '0.0.0.0', async () => {
  console.log(`Servidor escuchando en http://0.0.0.0:${port}`);
  
  setTimeout(async () => {
    try {
      await db.actualizarTurnosPendientes();
      console.log('Turnos pendientes actualizados correctamente');
    } catch (err) {
      console.warn('No se pudo actualizar turnos pendientes:', err.message);
    }
  }, 2000);
});




process.on('SIGINT', async () => {
  console.log('\nCerrando servidor...');
  await db.close();
  process.exit(0);
});

