const express = require('express');
const router = express.Router();
const db = require('../db');
const { ok, created, fail } = require('../utils/responses');
const { errorLog } = require('../utils/logger');

// Nuevo nombre recomendado: /api/entradas/nfc (montado desde app.js)
router.post('/', async (req, res, next) => {
  try {
    const { uid_tarjeta } = req.body || {};
    if (!uid_tarjeta) return fail(res, 400, 'Falta UID de la tarjeta');
    const nuevaEntrada = await db.registrarLecturaNFC(uid_tarjeta);
    return created(res, nuevaEntrada, 'Lectura registrada correctamente');
  } catch (error) {
    errorLog('POST /api/entradas/nfc', error);
    next(error);
  }
});

router.get('/ultimo', async (req, res, next) => {
  try {
    const row = await db.getUltimoUID();
    if (!row) return fail(res, 404, 'No hay entradas');
    return ok(res, row);
  } catch (error) {
    errorLog('GET /api/entradas/nfc/ultimo', error);
    next(error);
  }
});

module.exports = router;
