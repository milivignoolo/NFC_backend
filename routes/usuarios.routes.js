const express = require('express');
const router = express.Router();
const db = require('../db');
const { ok, created, fail } = require('../utils/responses');
const { errorLog } = require('../utils/logger');

router.get('/', async (req, res, next) => {
  try {
    const usuarios = await db.obtenerUsuarios();
    return ok(res, usuarios);
  } catch (error) {
    errorLog('GET /api/usuarios', error);
    next(error);
  }
});

router.post('/', async (req, res, next) => {
  try {
    const data = req.body;
    if (!data.id_usuario || !data.tipo_usuario || !data.nombre_completo) {
      return fail(res, 400, 'Campos obligatorios faltantes');
    }

    if (await db.usuarioExistePorId(data.id_usuario)) {
      return fail(res, 409, 'El id_usuario ya está registrado (campo único)');
    }
    if (await db.usuarioExistePorLegajo(data.legajo)) {
      return fail(res, 409, 'El legajo ya está registrado (campo único)');
    }
    if (await db.usuarioExistePorUID(data.uid_tarjeta)) {
      return fail(res, 409, 'El uid_tarjeta ya está registrado (campo único)');
    }

    const usuario = await db.registrarUsuario(data);
    return created(res, usuario, 'Usuario creado');
  } catch (error) {
    errorLog('POST /api/usuarios', error);
    if (error.message && error.message.includes('UNIQUE constraint')) {
      return fail(res, 409, 'El valor ya está registrado (campo único)');
    }
    next(error);
  }
});

router.get('/uid/:uid', async (req, res, next) => {
  try {
    const usuario = await db.obtenerUsuarioPorUID(req.params.uid);
    if (!usuario) return fail(res, 404, 'Usuario no encontrado');
    return ok(res, usuario);
  } catch (error) {
    errorLog('GET /api/usuarios/uid/:uid', error);
    next(error);
  }
});

router.get('/id_usuario/:id_usuario', async (req, res, next) => {
  try {
    const usuario = await db.obtenerUsuarioPorDNI(req.params.id_usuario);
    if (!usuario) return fail(res, 404, 'Usuario no encontrado');
    return ok(res, usuario);
  } catch (error) {
    errorLog('GET /api/usuarios/id_usuario/:id_usuario', error);
    next(error);
  }
});

router.delete('/:id', async (req, res, next) => {
  try {
    const result = await db.eliminarUsuario(req.params.id);
    if (result.deletedRows > 0) return ok(res, result, 'Usuario eliminado correctamente');
    else return fail(res, 404, 'Usuario no encontrado');
  } catch (error) {
    errorLog('DELETE /api/usuarios/:id', error);
    next(error);
  }
});

router.post('/login', async (req, res, next) => {
  try {
    const { id_usuario, contrasena } = req.body || {};
    if (!id_usuario || !contrasena) {
      return fail(res, 400, 'Faltan credenciales');
    }
    const usuario = await db.recuperarLogin(id_usuario, contrasena);
    if (!usuario) return fail(res, 401, 'Credenciales inválidas');
    return ok(res, usuario, `Bienvenido ${usuario.nombre_completo}`);
  } catch (error) {
    errorLog('POST /api/usuarios/login', error);
    next(error);
  }
});

module.exports = router;
