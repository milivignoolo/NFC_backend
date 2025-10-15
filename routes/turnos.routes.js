const express = require('express');
const router = express.Router();
const db = require('../db');
const { ok, created, fail } = require('../utils/responses');
const { errorLog } = require('../utils/logger');

router.post('/', async (req, res, next) => {
  try {
    const result = await db.registrarTurno(req.body);
    return created(res, result);
  } catch (error) {
    errorLog('POST /api/turnos', error);
    next(error);
  }
});

router.get('/', async (req, res, next) => {
  try {
    const turnos = await db.obtenerTurnos();
    return ok(res, turnos);
  } catch (error) {
    errorLog('GET /api/turnos', error);
    next(error);
  }
});

module.exports = router;
