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
                    this.createTables()
                        .then(() => this.migrateSchema())
                        .catch((e) => console.error('⚠️ Error creando tablas:', e));
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
                    uid_tarjeta TEXT UNIQUE,
                    contrasena TEXT,
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
                    id_usuario TEXT,
                    id_libro TEXT,
                    id_computadora TEXT,
                    accion TEXT,
                    uid_tarjeta TEXT,
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
                    observacion TEXT,
                    uid_tarjeta TEXT
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
    // 🔧 Migraciones menores (add columns / indices)
    // ================================
    async migrateSchema() {
        // utilidades
        const getColumns = async (table) => {
            const rows = await this.query(`PRAGMA table_info(${table})`);
            return rows.map((r) => r.name);
        };

        const ensureColumn = async (table, column, ddl) => {
            const cols = await getColumns(table);
            if (!cols.includes(column)) {
                await this.run(`ALTER TABLE ${table} ADD COLUMN ${ddl}`);
                console.log(`🧱 Columna añadida: ${table}.${column}`);
            }
        };

        const ensureUniqueIndex = async (indexName, table, column, whereNotNull = true) => {
            const where = whereNotNull ? ` WHERE ${column} IS NOT NULL` : '';
            await this.run(`CREATE UNIQUE INDEX IF NOT EXISTS ${indexName} ON ${table}(${column})${where}`);
        };

        try {
            // entrada: asegurar columnas para NFC
            await ensureColumn('entrada', 'accion', 'accion TEXT');
            await ensureColumn('entrada', 'id_libro', 'id_libro TEXT');
            await ensureColumn('entrada', 'id_computadora', 'id_computadora TEXT');
            await ensureColumn('entrada', 'uid_tarjeta', 'uid_tarjeta TEXT');

            // computadora: uid_tarjeta
            await ensureColumn('computadora', 'uid_tarjeta', 'uid_tarjeta TEXT');
            await ensureUniqueIndex('idx_computadora_uid', 'computadora', 'uid_tarjeta');

            // libro: uid_tarjeta + index isbn
            await ensureColumn('libro', 'uid_tarjeta', 'uid_tarjeta TEXT');
            await ensureUniqueIndex('idx_libro_uid_tarjeta', 'libro', 'uid_tarjeta');
            await ensureUniqueIndex('idx_libro_isbn', 'libro', 'isbn');

            // usuario: legajo único cuando no null
            await ensureUniqueIndex('idx_usuario_legajo', 'usuario', 'legajo');

            // turno: estado con default 'pendiente' para poder actualizar pendientes
            const turnoCols = await getColumns('turno');
            if (!turnoCols.includes('estado')) {
                await this.run(`ALTER TABLE turno ADD COLUMN estado TEXT DEFAULT 'pendiente'`);
                await this.run(`UPDATE turno SET estado = 'pendiente' WHERE estado IS NULL`);
            }
        } catch (e) {
            console.warn('⚠️ Migración parcial fallida (puede ser normal en esquemas ya migrados):', e.message);
        }
    }

    // ================================
    // 🔹 Helpers de acceso (promesas)
    // ================================
    query(sql, params = []) {
        return new Promise((resolve, reject) => {
            this.db.all(sql, params, (err, rows) => {
                if (err) reject(err);
                else resolve(rows || []);
            });
        });
    }

    getOne(sql, params = []) {
        return new Promise((resolve, reject) => {
            this.db.get(sql, params, (err, row) => {
                if (err) reject(err);
                else resolve(row || null);
            });
        });
    }

    run(sql, params = []) {
        return new Promise((resolve, reject) => {
            this.db.run(sql, params, function (err) {
                if (err) reject(err);
                else resolve({ changes: this.changes, lastID: this.lastID });
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

    // Verifica duplicados antes de registrar un usuario
    verificarDuplicadosUsuario({ id_usuario, legajo, uid_tarjeta }) {
        return new Promise((resolve, reject) => {
            const checks = [];
            const params = [];

            if (id_usuario) {
                checks.push('id_usuario = ?');
                params.push(id_usuario);
            }
            if (legajo) {
                checks.push('legajo = ?');
                params.push(legajo);
            }
            if (uid_tarjeta) {
                checks.push('uid_tarjeta = ?');
                params.push(uid_tarjeta);
            }

            if (checks.length === 0) {
                resolve({ existsIdUsuario: false, existsLegajo: false, existsUidTarjeta: false });
                return;
            }

            const sql = `SELECT id_usuario, legajo, uid_tarjeta FROM usuario WHERE ${checks.join(' OR ')}`;
            this.db.all(sql, params, (err, rows) => {
                if (err) return reject(err);

                let existsIdUsuario = false;
                let existsLegajo = false;
                let existsUidTarjeta = false;

                for (const row of rows) {
                    if (id_usuario && row.id_usuario === id_usuario) existsIdUsuario = true;
                    if (legajo && row.legajo === legajo) existsLegajo = true;
                    if (uid_tarjeta && row.uid_tarjeta === uid_tarjeta) existsUidTarjeta = true;
                }

                resolve({ existsIdUsuario, existsLegajo, existsUidTarjeta });
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

    obtenerUsuarioPorDNI(id_usuario) {
        return new Promise((resolve, reject) => {
            this.db.get('SELECT * FROM usuario WHERE id_usuario = ?', [id_usuario], (err, row) => {
                if (err) reject(err);
                else if (row) {
                    row.carreras = row.carreras ? JSON.parse(row.carreras) : [];
                    row.materias = row.materias ? JSON.parse(row.materias) : [];
                    resolve(row);
                } else resolve(null);
            });
        });
    }

    // Login simple por id_usuario y contrasena
    recuperarLogin(id_usuario, contrasena) {
        return new Promise((resolve, reject) => {
            const sql = `
                SELECT id_usuario, nombre_completo, tipo_usuario
                FROM usuario
                WHERE id_usuario = ? AND contrasena = ?
            `;
            this.db.get(sql, [id_usuario, contrasena], (err, row) => {
                if (err) return reject(err);
                resolve(row || null);
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

    async recuperarLogin(id_usuario, contrasena) {
        const sql = `
            SELECT id_usuario, nombre_completo, tipo_usuario
            FROM usuario
            WHERE id_usuario = ? AND contrasena = ?
        `;
        const rows = await this.query(sql, [id_usuario, contrasena]);
        return rows.length > 0 ? rows[0] : null;
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

    // Marca como "perdido" los turnos pendientes de fechas pasadas (si existe la columna estado)
    actualizarTurnosPendientes() {
        return new Promise((resolve) => {
            const sql = `
                UPDATE turno
                SET estado = 'perdido'
                WHERE estado = 'pendiente' AND date(fecha) < date('now')
            `;
            this.db.run(sql, [], function (err) {
                if (err) {
                    // Si la tabla no tiene la columna estado, devolvemos 0 actualizados sin fallar
                    return resolve({ updated: 0 });
                }
                resolve({ updated: this.changes });
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
    // 📥 ENTRADAS / NFC
    // ================================
    registrarLecturaNFC(uid_tarjeta) {
        return new Promise((resolve, reject) => {
            if (!uid_tarjeta) return reject(new Error('Falta UID de la tarjeta'));

            // Buscar usuario asociado al UID
            const sqlUsuario = 'SELECT id_usuario FROM usuario WHERE uid_tarjeta = ?';
            this.db.get(sqlUsuario, [uid_tarjeta], (err, userRow) => {
                if (err) return reject(err);
                if (!userRow) return reject(new Error('UID no asociado a usuario'));

                const now = new Date();
                const fecha = now.toISOString().slice(0, 10);
                const hora = now.toISOString().slice(11, 19);

                const sqlEntrada = `
                    INSERT INTO entrada (fecha, hora, tipo_uso, observacion, id_usuario)
                    VALUES (?, ?, ?, ?, ?)
                `;
                this.db.run(sqlEntrada, [fecha, hora, 'sala', null, userRow.id_usuario], function (insertErr) {
                    if (insertErr) return reject(insertErr);
                    resolve({ id_entrada: this.lastID, fecha, hora, id_usuario: userRow.id_usuario });
                });
            });
        });
    }

    getUltimoUID() {
        return new Promise((resolve, reject) => {
            const sql = 'SELECT * FROM entrada ORDER BY id_entrada DESC LIMIT 1';
            this.db.get(sql, [], (err, row) => {
                if (err) return reject(err);
                resolve(row || null);
            });
        });
    }

    // ================================
    // 📚 Libros mínimos (para duplicados y alta)
    // ================================
    registrarLibro(data) {
        return new Promise((resolve, reject) => {
            const {
                id_libro,
                titulo, sub_titulo, signatura, autor, segundo_autor, tercer_autor,
                isbn, serie, editorial, edicion, lugar, anio, cant_paginas, tamano,
                idioma, origen, ubicacion, nivel, dias_de_prestamo, palabra_clave,
                observaciones, uid_tarjeta
            } = data;

            if (!id_libro || !titulo) {
                return reject(new Error('Faltan campos obligatorios para libro'));
            }

            const sql = `
                INSERT INTO libro (
                    id_libro, titulo, sub_titulo, signatura, autor, segundo_autor, tercer_autor,
                    isbn, serie, editorial, edicion, lugar, anio, cant_paginas, tamano,
                    idioma, origen, ubicacion, nivel, dias_de_prestamo, palabra_clave,
                    observaciones, uid_tarjeta
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            `;

            this.db.run(sql, [
                id_libro, titulo, sub_titulo || null, signatura || null, autor || null, segundo_autor || null, tercer_autor || null,
                isbn || null, serie || null, editorial || null, edicion || null, lugar || null, anio || null, cant_paginas || null, tamano || null,
                idioma || null, origen || null, ubicacion || null, nivel || null, dias_de_prestamo || 7, palabra_clave || null,
                observaciones || null, uid_tarjeta || null
            ], function (err) {
                if (err) reject(err);
                else resolve({ id_libro });
            });
        });
    }

    obtenerLibros() {
        return new Promise((resolve, reject) => {
            this.db.all(`SELECT * FROM libro ORDER BY titulo`, [], (err, rows) => {
                if (err) reject(err);
                else resolve(rows || []);
            });
        });
    }

    // ================================
    // 🛎️ Entradas (NFC)
    // ================================
    async registrarLecturaNFC(uid_tarjeta) {
        if (!uid_tarjeta) throw new Error('Falta UID');

        const fecha = new Date().toISOString().split('T')[0];
        const hora = new Date().toTimeString().split(' ')[0];

        // asociar por prioridad: usuario > libro > computadora
        const usuario = await this.getOne(`SELECT * FROM usuario WHERE uid_tarjeta = ?`, [uid_tarjeta]);
        const libro = await this.getOne(`SELECT * FROM libro WHERE uid_tarjeta = ?`, [uid_tarjeta]);
        const computadora = await this.getOne(`SELECT * FROM computadora WHERE uid_tarjeta = ?`, [uid_tarjeta]);

        let id_usuario = null;
        let id_libro = null;
        let id_computadora = null;
        let tipo_uso = null;
        let accion = null;

        if (usuario) {
            id_usuario = usuario.id_usuario;
            tipo_uso = 'sala';
            const ultima = await this.getOne(
                `SELECT accion FROM entrada WHERE id_usuario = ? ORDER BY id_entrada DESC LIMIT 1`,
                [id_usuario]
            );
            accion = ultima && ultima.accion === 'entrada' ? 'salida' : 'entrada';
        } else if (libro) {
            id_libro = libro.id_libro;
            tipo_uso = 'libro';
            const ultima = await this.getOne(
                `SELECT accion FROM entrada WHERE id_libro = ? ORDER BY id_entrada DESC LIMIT 1`,
                [id_libro]
            );
            accion = ultima && ultima.accion === 'entrada' ? 'salida' : 'entrada';
        } else if (computadora) {
            id_computadora = computadora.id_computadora;
            tipo_uso = 'computadora';
            const ultima = await this.getOne(
                `SELECT accion FROM entrada WHERE id_computadora = ? ORDER BY id_entrada DESC LIMIT 1`,
                [id_computadora]
            );
            accion = ultima && ultima.accion === 'entrada' ? 'salida' : 'entrada';
        } else {
            // no asociado, solo registrar lectura sin vinculación
            tipo_uso = 'desconocido';
            accion = 'lectura';
        }

        const insert = await this.run(
            `INSERT INTO entrada (accion, fecha, hora, tipo_uso, observacion, id_usuario, id_libro, id_computadora, uid_tarjeta)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [accion, fecha, hora, tipo_uso, null, id_usuario, id_libro, id_computadora, uid_tarjeta]
        );

        return {
            id_entrada: insert.lastID,
            accion,
            tipo_uso,
            id_usuario,
            id_libro,
            id_computadora,
            fecha,
            hora,
            uid_tarjeta
        };
    }

    async getUltimoUID() {
        const row = await this.getOne(`SELECT * FROM entrada ORDER BY id_entrada DESC LIMIT 1`);
        return row;
    }

    async actualizarTurnosPendientes() {
        // marca como 'perdido' los turnos anteriores al día actual que aún están 'pendiente'
        await this.run(`UPDATE turno SET estado = 'pendido' WHERE estado IS NULL`);
        const result = await this.run(
            `UPDATE turno SET estado = 'perdido' WHERE COALESCE(estado, 'pendiente') = 'pendiente' AND date(fecha) < date('now')`
        );
        return { updated: result.changes };
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
