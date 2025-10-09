// database.js
const sqlite3 = require('sqlite3').verbose();
const path = require('path');

class NFCDatabase {
    constructor(dbPath = path.join(__dirname, 'biblioteca_nfc.db')) {
        this.dbPath = dbPath;
        this.db = null;
        this.init();
    }

    // ================================
    // 📦 Inicialización
    // ================================
    async init() {
        try {
            this.db = new sqlite3.Database(this.dbPath, (err) => {
                if (err) {
                    console.error('❌ Error al conectar con la base de datos:', err.message);
                } else {
                    console.log('✅ Conectado a la base de datos SQLite');
                    this.createTables();
                }
            });
        } catch (error) {
            console.error('⚠️ Error en init():', error);
        }
    }

    // ================================
    // 🧱 Creación de tablas
    // ================================
    createTables() {
        return new Promise((resolve, reject) => {
            const usuarioSql = `
                CREATE TABLE IF NOT EXISTS usuario (
                    id_usuario TEXT PRIMARY KEY,
                    tipo_usuario TEXT NOT NULL CHECK(tipo_usuario IN (
                        'Aspirante', 'Cursante', 'No cursante', 
                        'Docente', 'No docente', 'Egresado', 'Externo'
                    )),
                    nombre_completo TEXT NOT NULL,
                    email TEXT,
                    telefono TEXT,
                    domicilio TEXT,
                    codigo_postal TEXT,
                    ciudad TEXT,
                    provincia TEXT,
                    sexo TEXT,
                    fecha_alta DATETIME DEFAULT CURRENT_TIMESTAMP,
                    operador TEXT,
                    uid_tarjeta TEXT UNIQUE, -- Puede ser NULL
                    contrasena TEXT,          -- Nuevo campo
                    legajo TEXT,
                    carreras TEXT,
                    materias TEXT
                )
            `;

            const libroSql = `
                CREATE TABLE IF NOT EXISTS libro (
                    id_libro TEXT PRIMARY KEY,
                    titulo TEXT NOT NULL,
                    sub_titulo TEXT,
                    signatura TEXT,
                    autor TEXT,
                    segundo_autor TEXT,
                    tercer_autor TEXT,
                    isbn TEXT,
                    serie TEXT,
                    editorial TEXT,
                    edicion TEXT,
                    lugar TEXT,
                    anio INTEGER,
                    cant_paginas INTEGER,
                    tamano TEXT,
                    idioma TEXT,
                    origen TEXT,
                    fecha_de_ingreso DATETIME DEFAULT CURRENT_TIMESTAMP,
                    ubicacion TEXT,
                    nivel TEXT,
                    dias_de_prestamo INTEGER DEFAULT 7,
                    palabra_clave TEXT,
                    observaciones TEXT
                )
            `;

            const prestamoLibroSql = `
                CREATE TABLE IF NOT EXISTS prestamo_libro (
                    id_prestamo INTEGER PRIMARY KEY AUTOINCREMENT,
                    fecha_inicial DATETIME DEFAULT CURRENT_TIMESTAMP,
                    fecha_final DATETIME,
                    operador TEXT,
                    estado TEXT NOT NULL CHECK(estado IN ('en_prestamo', 'reservado', 'libre')),
                    id_usuario TEXT NOT NULL,
                    id_libro TEXT NOT NULL,
                    FOREIGN KEY (id_usuario) REFERENCES usuario(id_usuario),
                    FOREIGN KEY (id_libro) REFERENCES libro(id_libro)
                )
            `;

            const entradaSql = `
                CREATE TABLE IF NOT EXISTS entrada (
                    id_entrada INTEGER PRIMARY KEY AUTOINCREMENT,
                    fecha TEXT NOT NULL,
                    hora TEXT NOT NULL,
                    tipo_uso TEXT,
                    observacion TEXT,
                    id_usuario TEXT NOT NULL,
                    FOREIGN KEY (id_usuario) REFERENCES usuario(id_usuario)
                )
            `;

            const turnoSql = `
                CREATE TABLE IF NOT EXISTS turno (
                    id_turno INTEGER PRIMARY KEY AUTOINCREMENT,
                    fecha TEXT NOT NULL,
                    hora TEXT NOT NULL,
                    tipo_uso TEXT,
                    id_usuario TEXT NOT NULL,
                    FOREIGN KEY (id_usuario) REFERENCES usuario(id_usuario)
                )
            `;

            const computadoraSql = `
                CREATE TABLE IF NOT EXISTS computadora (
                    id_computadora TEXT PRIMARY KEY,
                    marca TEXT,
                    modelo TEXT,
                    estado TEXT CHECK(estado IN ('disponible', 'en_uso', 'mantenimiento')) DEFAULT 'disponible',
                    sistema_operativo TEXT,
                    observacion TEXT
                )
            `;

            const prestamoComputadoraSql = `
                CREATE TABLE IF NOT EXISTS prestamo_computadora (
                    id_prestamo_compu INTEGER PRIMARY KEY AUTOINCREMENT,
                    id_usuario TEXT NOT NULL,
                    fecha TEXT NOT NULL,
                    hora_inicio TEXT NOT NULL,
                    hora_fin TEXT,
                    operador TEXT,
                    id_computadora TEXT NOT NULL,
                    FOREIGN KEY (id_usuario) REFERENCES usuario(id_usuario),
                    FOREIGN KEY (id_computadora) REFERENCES computadora(id_computadora)
                )
            `;

            this.db.serialize(() => {
                this.db.run(usuarioSql);
                this.db.run(libroSql);
                this.db.run(prestamoLibroSql);
                this.db.run(entradaSql);
                this.db.run(turnoSql);
                this.db.run(computadoraSql);
                this.db.run(prestamoComputadoraSql, (err) => {
                    if (err) reject(err);
                    else {
                        console.log('📘 Tablas creadas o ya existentes');
                        resolve();
                    }
                });
            });
        });
    }

    // ================================
    // 👤 USUARIOS
    // ================================
    registrarUsuario(data) {
        return new Promise((resolve, reject) => {
            const {
                id_usuario, tipo_usuario, nombre_completo, email, telefono,
                domicilio, codigo_postal, ciudad, provincia, sexo,
                operador, uid_tarjeta, contrasena, legajo, carreras, materias
            } = data;

            if (!id_usuario || !tipo_usuario || !nombre_completo) {
                reject(new Error('Faltan campos obligatorios'));
                return;
            }

            const sql = `
                INSERT INTO usuario (
                    id_usuario, tipo_usuario, nombre_completo, email, telefono, domicilio,
                    codigo_postal, ciudad, provincia, sexo, operador, uid_tarjeta,
                    contrasena, legajo, carreras, materias
                )
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            `;

            this.db.run(sql, [
                id_usuario, tipo_usuario, nombre_completo, email, telefono,
                domicilio, codigo_postal, ciudad, provincia, sexo, operador, uid_tarjeta || null,
                contrasena || null, legajo || null,
                carreras ? JSON.stringify(carreras) : null,
                materias ? JSON.stringify(materias) : null
            ], function (err) {
                if (err) reject(err);
                else {
                    console.log(`👤 Usuario registrado: ${nombre_completo}`);
                    resolve({ id_usuario, nombre_completo });
                }
            });
        });
    }

    obtenerUsuarios() {
        return new Promise((resolve, reject) => {
            const sql = `SELECT * FROM usuario ORDER BY nombre_completo`;
            this.db.all(sql, [], (err, rows) => {
                if (err) reject(err);
                else {
                    const parsed = rows.map(u => ({
                        ...u,
                        carreras: u.carreras ? JSON.parse(u.carreras) : [],
                        materias: u.materias ? JSON.parse(u.materias) : []
                    }));
                    resolve(parsed);
                }
            });
        });
    }

    obtenerUsuarioPorUID(uid_tarjeta) {
        return new Promise((resolve, reject) => {
            this.db.get('SELECT * FROM usuario WHERE uid_tarjeta = ?', [uid_tarjeta], (err, row) => {
                if (err) reject(err);
                else if (row) {
                    row.carreras = row.carreras ? JSON.parse(row.carreras) : [];
                    row.materias = row.materias ? JSON.parse(row.materias) : [];
                    resolve(row);
                } else resolve(null);
            });
        });
    }

    eliminarUsuario(id_usuario) {
        return new Promise((resolve, reject) => {
            const sql = 'DELETE FROM usuario WHERE id_usuario = ?';
            this.db.run(sql, [id_usuario], function (err) {
                if (err) reject(err);
                else resolve({ deletedRows: this.changes });
            });
        });
    }

    // ================================
    // 📅 TURNOS
    // ================================
    registrarTurno({ fecha, hora, tipo_uso, id_usuario }) {
        return new Promise((resolve, reject) => {
            const sql = `
                INSERT INTO turno (fecha, hora, tipo_uso, id_usuario)
                VALUES (?, ?, ?, ?)
            `;
            this.db.run(sql, [fecha, hora, tipo_uso, id_usuario], function (err) {
                if (err) reject(err);
                else resolve({ id_turno: this.lastID });
            });
        });
    }

    obtenerTurnos() {
        return new Promise((resolve, reject) => {
            const sql = `
                SELECT t.*, u.nombre_completo
                FROM turno t
                LEFT JOIN usuario u ON t.id_usuario = u.id_usuario
                ORDER BY fecha DESC, hora DESC
            `;
            this.db.all(sql, [], (err, rows) => {
                if (err) reject(err);
                else resolve(rows);
            });
        });
    }

    // ================================
    // 💻 COMPUTADORAS
    // ================================
    registrarComputadora({ id_computadora, marca, modelo, estado, sistema_operativo, observacion }) {
        return new Promise((resolve, reject) => {
            const sql = `
                INSERT INTO computadora (id_computadora, marca, modelo, estado, sistema_operativo, observacion)
                VALUES (?, ?, ?, ?, ?, ?)
            `;
            this.db.run(sql, [id_computadora, marca, modelo, estado, sistema_operativo, observacion], function (err) {
                if (err) reject(err);
                else {
                    console.log(`💻 Computadora registrada: ${marca} ${modelo}`);
                    resolve({ id_computadora });
                }
            });
        });
    }

    obtenerComputadoras() {
        return new Promise((resolve, reject) => {
            const sql = `SELECT * FROM computadora ORDER BY marca, modelo`;
            this.db.all(sql, [], (err, rows) => {
                if (err) reject(err);
                else resolve(rows);
            });
        });
    }

    actualizarEstadoComputadora(id_computadora, nuevoEstado) {
        return new Promise((resolve, reject) => {
            const sql = `
                UPDATE computadora
                SET estado = ?
                WHERE id_computadora = ?
            `;
            this.db.run(sql, [nuevoEstado, id_computadora], function (err) {
                if (err) reject(err);
                else resolve({ updated: this.changes });
            });
        });
    }

    // ================================
    // 💻 PRÉSTAMOS DE COMPUTADORAS
    // ================================
    registrarPrestamoComputadora({ id_usuario, fecha, hora_inicio, operador, id_computadora }) {
        return new Promise((resolve, reject) => {
            const sql = `
                INSERT INTO prestamo_computadora (id_usuario, fecha, hora_inicio, operador, id_computadora)
                VALUES (?, ?, ?, ?, ?)
            `;
            this.db.run(sql, [id_usuario, fecha, hora_inicio, operador, id_computadora], function (err) {
                if (err) reject(err);
                else {
                    console.log(`🖥️ Préstamo iniciado: Usuario ${id_usuario} → Computadora ${id_computadora}`);
                    resolve({ id_prestamo_compu: this.lastID });
                }
            });
        });
    }

    finalizarPrestamoComputadora(id_prestamo_compu, hora_fin) {
        return new Promise((resolve, reject) => {
            const sql = `
                UPDATE prestamo_computadora
                SET hora_fin = ?
                WHERE id_prestamo_compu = ?
            `;
            this.db.run(sql, [hora_fin, id_prestamo_compu], function (err) {
                if (err) reject(err);
                else {
                    console.log(`✅ Préstamo de computadora ${id_prestamo_compu} finalizado`);
                    resolve({ updated: this.changes });
                }
            });
        });
    }

    obtenerPrestamosComputadora() {
        return new Promise((resolve, reject) => {
            const sql = `
                SELECT p.*, u.nombre_completo, c.marca, c.modelo
                FROM prestamo_computadora p
                JOIN usuario u ON p.id_usuario = u.id_usuario
                JOIN computadora c ON p.id_computadora = c.id_computadora
                ORDER BY p.fecha DESC, p.hora_inicio DESC
            `;
            this.db.all(sql, [], (err, rows) => {
                if (err) reject(err);
                else resolve(rows);
            });
        });
    }

    // ================================
    // 🔒 Cierre
    // ================================
    close() {
        return new Promise((resolve, reject) => {
            if (this.db) {
                this.db.close((err) => {
                    if (err) reject(err);
                    else {
                        console.log('🔒 Conexión cerrada');
                        resolve();
                    }
                });
            } else resolve();
        });
    }
}

module.exports = NFCDatabase;
