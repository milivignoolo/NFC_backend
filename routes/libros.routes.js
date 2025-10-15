const express = require('express');
const router = express.Router();
const db = require('../db');
const { ok, created, fail } = require('../utils/responses');
const { errorLog } = require('../utils/logger');

router.get('/', async (req, res, next) => {
  try {
    const libros = await db.obtenerLibros();
    return ok(res, libros);
  } catch (error) {
    errorLog('GET /api/libros', error);
    next(error);
  }
});

router.post('/', async (req, res, next) => {
  try {
    const data = req.body;
    if (!data.id_libro || !data.titulo) {
      return fail(res, 400, 'Faltan campos obligatorios para libro');
    }

    // Prevalidación duplicados
    if (await db.libroExistePorId(data.id_libro)) {
      return fail(res, 409, 'El id_libro ya está registrado (campo único)');
    }
    if (await db.libroExistePorISBN(data.isbn)) {
      return fail(res, 409, 'El ISBN ya está registrado (campo único)');
    }
    if (await db.libroExistePorUID(data.uid_tarjeta)) {
      return fail(res, 409, 'El uid_tarjeta ya está registrado (campo único)');
    }

    const result = await db.registrarLibro(data);
    return created(res, result);
  } catch (error) {
    errorLog('POST /api/libros', error);
    if (error.message && error.message.includes('UNIQUE constraint')) {
      return fail(res, 409, 'El valor ya está registrado (campo único)');
    }
    next(error);
  }
});

module.exports = router;
