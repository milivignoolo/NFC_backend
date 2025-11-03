// database.js
const sqlite3 = require("sqlite3").verbose();
const path = require("path");
const fs = require("fs");

class NFCDatabase {
    constructor(dbPath = path.join(__dirname, "biblioteca_nfc.db")) {
        this.dbPath = dbPath;
        this.db = null;
        this.init();
    }

async init() {
    try {
        this.db = new sqlite3.Database(this.dbPath, (err) => {
            if (err) {
                console.error("Error al conectar con la base de datos:", err.message);
            } else {
                console.log("Conectado a la base de datos SQLite");
                this.createTables()
                    .then(() => {
                        console.log("Tablas creadas o verificadas correctamente");
                    })
                    .catch((err) => {
                        console.error("Error creando tablas:", err);
                    });
            }
        });
    } catch (error) {
        console.error("Error en init():", error);
    }
}


    createTables() {
        return new Promise((resolve, reject) => {
            const operadorSql = `
                CREATE TABLE IF NOT EXISTS operador (
                    id_operador INTEGER PRIMARY KEY,
                    nombre_completo TEXT NOT NULL,
                    email TEXT NOT NULL,
                    telefono TEXT NOT NULL,
                    domicilio TEXT NOT NULL,
                    codigo_postal TEXT NOT NULL,
                    ciudad TEXT NOT NULL,
                    provincia TEXT NOT NULL,
                    sexo TEXT NOT NULL CHECK(sexo IN ('Femenino', 'Masculino', 'No binario', 'N/A')),
                    fecha_alta DATETIME DEFAULT CURRENT_TIMESTAMP
                );
            `;

            const usuarioSql = `
                CREATE TABLE IF NOT EXISTS usuario (
                    id_usuario INTEGER PRIMARY KEY,
                    tipo_usuario TEXT NOT NULL CHECK(tipo_usuario IN (
                        'Aspirante', 'Cursante', 'No cursante', 
                        'Docente', 'No docente', 'Egresado', 'Externo'
                    )),
                    nombre_completo TEXT NOT NULL,
                    email TEXT NOT NULL,
                    telefono TEXT NOT NULL,
                    domicilio TEXT NOT NULL,
                    codigo_postal TEXT NOT NULL,
                    ciudad TEXT NOT NULL,
                    provincia TEXT NOT NULL,
                    sexo TEXT NOT NULL CHECK(sexo IN ('Femenino', 'Masculino', 'No binario')),
                    fecha_alta DATETIME DEFAULT CURRENT_TIMESTAMP,
                    operador INTEGER NOT NULL,
                    uid_tarjeta TEXT UNIQUE,
                    contrasena TEXT NOT NULL,
                    legajo INTEGER UNIQUE,
                    carreras TEXT,
                    materias TEXT,
                    FOREIGN KEY (operador) REFERENCES operador(id_operador)
                );
            `;

            const libroSql = `
                CREATE TABLE IF NOT EXISTS libro (
                    id_libro INTEGER PRIMARY KEY AUTOINCREMENT,
                    titulo TEXT NOT NULL,
                    sub_titulo TEXT,
                    asignatura TEXT NOT NULL,
                    autor TEXT NOT NULL,
                    segundo_autor TEXT,
                    tercer_autor TEXT,
                    isbn TEXT UNIQUE,
                    serie TEXT,
                    editorial TEXT,
                    edicion TEXT,
                    lugar TEXT,
                    anio INTEGER CHECK(anio > 0),
                    cant_paginas INTEGER,
                    tamano TEXT,
                    idioma TEXT,
                    origen TEXT,
                    fecha_de_ingreso DATETIME DEFAULT CURRENT_TIMESTAMP,
                    ubicacion TEXT,
                    nivel TEXT,
                    dias_de_prestamo INTEGER DEFAULT 7,
                    palabra_clave TEXT,
                    observaciones TEXT,
                    estado TEXT NOT NULL CHECK(estado IN ('en_prestamo', 'reservado', 'libre')),
                    uid_tarjeta TEXT UNIQUE
                );
            `;

            const prestamoLibroSql = `
                CREATE TABLE IF NOT EXISTS prestamo_libro (
                    id_prestamo INTEGER PRIMARY KEY AUTOINCREMENT,
                    fecha_inicial DATETIME NOT NULL,
                    fecha_final DATETIME NOT NULL,
                    operador INTEGER NOT NULL,
                    id_usuario INTEGER NOT NULL,
                    id_libro INTEGER NOT NULL,
                    estado TEXT NOT NULL CHECK(estado IN ('en_proceso', 'finalizado')),
                    FOREIGN KEY (operador) REFERENCES operador(id_operador),
                    FOREIGN KEY (id_usuario) REFERENCES usuario(id_usuario),
                    FOREIGN KEY (id_libro) REFERENCES libro(id_libro)
                );
            `;

            const entradaSql = `
                CREATE TABLE IF NOT EXISTS entrada (
                    id_entrada INTEGER PRIMARY KEY AUTOINCREMENT,
                    accion TEXT CHECK(accion IN ('entrada', 'salida')),
                    fecha DATETIME NOT NULL,
                    hora TEXT NOT NULL,
                    tipo_uso TEXT,
                    observacion TEXT,
                    id_usuario INTEGER,
                    id_libro INTEGER,
                    id_computadora INTEGER,
                    uid_tarjeta TEXT,
                    FOREIGN KEY (id_usuario) REFERENCES usuario(id_usuario),
                    FOREIGN KEY (id_libro) REFERENCES libro(id_libro),
                    FOREIGN KEY (id_computadora) REFERENCES computadora(id_computadora)
                );
            `;      

            const turnoSqlDrop = `DROP TABLE IF EXISTS turno;`;

    const turnoSql = `
        CREATE TABLE IF NOT EXISTS turno (
            id_turno INTEGER PRIMARY KEY AUTOINCREMENT,
            fecha DATETIME NOT NULL,
            hora TEXT NOT NULL,
            area TEXT,
            tematica TEXT,
            tipo_asistencia TEXT,
            observaciones TEXT,
            estado TEXT NOT NULL CHECK(estado IN ('pendiente', 'ingreso', 'finalizado', 'perdido')) DEFAULT 'pendiente',
            id_usuario INTEGER NOT NULL,
            FOREIGN KEY (id_usuario) REFERENCES usuario(id_usuario)
        );
    `;


            const computadoraSql = `
                CREATE TABLE IF NOT EXISTS computadora (
                    id_computadora INTEGER PRIMARY KEY AUTOINCREMENT,
                    marca TEXT NOT NULL,
                    modelo TEXT NOT NULL,
                    estado TEXT CHECK(estado IN ('disponible', 'en_uso', 'mantenimiento')) DEFAULT 'disponible',
                    sistema_operativo TEXT NOT NULL,
                    observacion TEXT,
                    uid_tarjeta TEXT UNIQUE
                );
            `;

            const prestamoComputadoraSql = `
                CREATE TABLE IF NOT EXISTS prestamo_computadora (
                    id_prestamo_compu INTEGER PRIMARY KEY AUTOINCREMENT,
                    id_usuario INTEGER NOT NULL,
                    fecha DATETIME NOT NULL,
                    hora_inicio TEXT NOT NULL,
                    hora_fin TEXT,
                    operador INTEGER NOT NULL,
                    id_computadora INTEGER NOT NULL,
                    estado TEXT NOT NULL CHECK(estado IN ('en_proceso', 'finalizado')),
                    FOREIGN KEY (operador) REFERENCES operador(id_operador),
                    FOREIGN KEY (id_usuario) REFERENCES usuario(id_usuario),
                    FOREIGN KEY (id_computadora) REFERENCES computadora(id_computadora)
                );
            `;

            this.db.serialize(() => {
                this.db.run(operadorSql);
                this.db.run(usuarioSql);
                this.db.run(libroSql);
                this.db.run(prestamoLibroSql);
                this.db.run(entradaSql);
                this.db.run(turnoSql);
                this.db.run(computadoraSql);
                this.db.run(prestamoComputadoraSql, (err) => {
                    if (err) reject(err);
                    else {
                        console.log("Tablas creadas con estructura nueva");
                        // Migrar columnas faltantes en la tabla turno
                        this.migrarTablaTurno()
                            .then(() => resolve())
                            .catch(reject);
                    }
                });
            });
        });
    }

    migrarTablaTurno() {
        return new Promise((resolve, reject) => {
            // Columnas a agregar si no existen
            const columnas = [
                { nombre: 'area', tipo: 'TEXT' },
                { nombre: 'tematica', tipo: 'TEXT' },
                { nombre: 'tipo_asistencia', tipo: 'TEXT' },
                { nombre: 'observaciones', tipo: 'TEXT' }
            ];

            // Verificar si la tabla existe y obtener sus columnas
            this.db.all("PRAGMA table_info(turno)", [], (err, columns) => {
                if (err) {
                    console.error("Error obteniendo información de la tabla turno:", err);
                    return reject(err);
                }

                const columnasExistentes = columns.map(c => c.name.toLowerCase());
                const columnasAAgregar = columnas.filter(
                    col => !columnasExistentes.includes(col.nombre.toLowerCase())
                );

                if (columnasAAgregar.length === 0) {
                    console.log("✅ Tabla turno ya tiene todas las columnas necesarias");
                    return resolve();
                }

                // Agregar columnas faltantes de forma secuencial
                const agregarColumnas = async () => {
                    for (const col of columnasAAgregar) {
                        await new Promise((res, rej) => {
                            const sql = `ALTER TABLE turno ADD COLUMN ${col.nombre} ${col.tipo}`;
                            this.db.run(sql, (err) => {
                                if (err) {
                                    // Si la columna ya existe (por error previo), continuar
                                    if (err.message.includes('duplicate column') || err.message.includes('duplicate column name')) {
                                        console.log(`⚠️ Columna ${col.nombre} ya existe, omitiendo...`);
                                        res();
                                    } else {
                                        console.error(`Error agregando columna ${col.nombre}:`, err);
                                        rej(err);
                                    }
                                } else {
                                    console.log(`✅ Columna ${col.nombre} agregada a la tabla turno`);
                                    res();
                                }
                            });
                        });
                    }
                    resolve();
                };

                agregarColumnas().catch(reject);
            });
        });
    }

    registrarUsuario(data) {
        return new Promise((resolve, reject) => {
            const {
                id_usuario, tipo_usuario, nombre_completo, email, telefono,
                domicilio, codigo_postal, ciudad, provincia, sexo,
                operador, uid_tarjeta, contrasena, legajo, carreras, materias
            } = data;

            if (!id_usuario || !tipo_usuario || !nombre_completo) {
                reject(new Error("Faltan campos obligatorios"));
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
                domicilio, codigo_postal, ciudad, provincia, sexo,
                operador, uid_tarjeta || null, contrasena || null, legajo || null,
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

    actualizarUsuario(id_usuario, data) {
        return new Promise((resolve, reject) => {
          const fields = Object.keys(data).map(k => `${k} = ?`).join(', ');
          const values = Object.values(data);
          values.push(id_usuario);
      
          const sql = `UPDATE usuario SET ${fields} WHERE id_usuario = ?`;
          this.db.run(sql, values, function(err) {
            if (err) reject(err);
            else resolve({ updatedRows: this.changes });
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
            this.db.get(`SELECT id_usuario FROM usuario WHERE uid_tarjeta = ?`, [uid_tarjeta], (err, row) => {
                if (err) reject(err);
                else {
                    if (row) {
                        row.carreras = row.carreras ? JSON.parse(row.carreras) : [];
                        row.materias = row.materias ? JSON.parse(row.materias) : [];
                    }
                    resolve(row || null);
                }
            });
        });
    }

    obtenerUsuarioPorUID(uid_tarjeta) {
        return new Promise((resolve, reject) => {
            const sql = `
                SELECT id_usuario, tipo_usuario, nombre_completo, email, telefono, legajo, carreras, materias
                FROM usuario
                WHERE uid_tarjeta = ?
            `;
            this.db.get(sql, [uid_tarjeta], (err, row) => {
                if (err) reject(err);
                else {
                    if (row) {
                        row.carreras = row.carreras ? JSON.parse(row.carreras) : [];
                        row.materias = row.materias ? JSON.parse(row.materias) : [];
                    }
                    resolve(row || null);
                }
            });
        });
    }
    

    recuperarLogin(id_usuario, contrasena) {
        return new Promise((resolve, reject) => {
            const sql = `
                SELECT id_usuario, nombre_completo, tipo_usuario, contrasena
                FROM usuario
                WHERE id_usuario = ? AND contrasena = ?
            `;
            this.db.get(sql, [id_usuario, contrasena], (err, row) => {
                if (err) reject(err);
                else resolve(row || null);
            });
        });
    }
    

    eliminarUsuario(id_usuario) {
        return new Promise((resolve, reject) => {
            this.db.run(`DELETE FROM usuario WHERE id_usuario = ?`, [id_usuario], function (err) {
                if (err) reject(err);
                else resolve({ deleted: this.changes });
            });
        });
    }

    obtenerUsuariosActivos() {
        return new Promise((resolve, reject) => {
            const sql = `
                SELECT u.*
                FROM usuario u
                JOIN (
                    SELECT id_usuario, MAX(id_entrada) AS ultima_entrada
                    FROM entrada
                    GROUP BY id_usuario
                ) emax ON u.id_usuario = emax.id_usuario
                JOIN entrada e ON e.id_entrada = emax.ultima_entrada
                WHERE e.accion = 'entrada'
                ORDER BY u.nombre_completo
            `;
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
    

    registrarTurno({ fecha, hora, id_usuario, area, tematica, tipo_asistencia, observaciones }) {
        return new Promise((resolve, reject) => {
            const sql = `
                INSERT INTO turno (fecha, hora, area, tematica, tipo_asistencia, observaciones, id_usuario)
                VALUES (?, ?, ?, ?, ?, ?, ?)
            `;
            this.db.run(sql, [
                fecha, 
                hora, 
                area || null,
                tematica || null,
                tipo_asistencia || null,
                observaciones || null,
                id_usuario
            ], function (err) {
                if (err) reject(err);
                else resolve({ 
                    id_turno: this.lastID,
                    fecha,
                    hora,
                    area,
                    tematica,
                    tipo_asistencia,
                    observaciones,
                    estado: 'pendiente', // Estado inicial por defecto
                    id_usuario
                });
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

    // Actualiza turnos automáticamente: ingreso -> finalizado y pendientes antiguos -> perdido
actualizarTurnosAutomaticamente() {
    return new Promise(async (resolve, reject) => {
        try {
            const ahora = new Date();

            // --- Turnos con estado 'ingreso' hace más de 2 horas → 'finalizado'
            const turnosIngreso = await this.obtenerTurnos();
            for (const turno of turnosIngreso) {
                if (turno.estado === 'ingreso') {
                    const fechaHoraTurno = new Date(`${turno.fecha}T${turno.hora}`);
                    if (ahora - fechaHoraTurno >= 2 * 60 * 60 * 1000) {
                        await this.actualizarEstadoTurno(turno.id_turno, 'finalizado');
                        console.log(`Turno ${turno.id_turno} finalizado automáticamente`);
                    }
                }
            }

            // --- Turnos pendientes de días anteriores → 'perdido'
            const turnosPendientes = await this.obtenerTurnos();
        for (const turno of turnosPendientes) {
        const fechaTurno = new Date(turno.fecha);
        const hoy = new Date();
        hoy.setHours(0, 0, 0, 0); // Normaliza la hora a las 00:00

        // Si la fecha del turno ya pasó
        if (fechaTurno < hoy) {
            if (turno.estado === 'pendiente') {
            await this.actualizarEstadoTurno(turno.id_turno, 'perdido');
            console.log(`Turno ${turno.id_turno} (pendiente) marcado como perdido`);
            } else if (turno.estado === 'ingreso') {
            await this.actualizarEstadoTurno(turno.id_turno, 'finalizado');
            console.log(`Turno ${turno.id_turno} (ingreso) marcado como finalizado`);
            }
        }
        }
            resolve(true);
        } catch (err) {
            reject(err);
        }
    });
}


    actualizarTurnosPendientes() {
        return new Promise((resolve, reject) => {
            const sql = `
                UPDATE turno
                SET estado = 'perdido'
                WHERE estado = 'pendiente' AND fecha < DATE('now')
            `;
            this.db.run(sql, [], function (err) {
                if (err) reject(err);
                else resolve({ updated: this.changes });
            });
        });
    }

    actualizarEstadoTurno(id_turno, estado) {
        return new Promise((resolve, reject) => {
            const sql = `
                UPDATE turno
                SET estado = ?
                WHERE id_turno = ?
            `;
            this.db.run(sql, [estado, id_turno], function (err) {
                if (err) reject(err);
                else resolve({ updated: this.changes });
            });
        });
    }

    eliminarTurnosPorFecha(fecha) {
        return new Promise((resolve, reject) => {
            const sql = `DELETE FROM turno WHERE fecha = ?`;
            this.db.run(sql, [fecha], function (err) {
                if (err) reject(err);
                else resolve({ deleted: this.changes });
            });
        });
    }

    obtenerTurnosPorFecha(fecha) {
        return new Promise((resolve, reject) => {
            const sql = `
                SELECT t.*, u.nombre_completo
                FROM turno t
                LEFT JOIN usuario u ON t.id_usuario = u.id_usuario
                WHERE t.fecha = ?
                ORDER BY t.hora ASC
            `;
            this.db.all(sql, [fecha], (err, rows) => {
                if (err) reject(err);
                else resolve(rows);
            });
        });
    }

    registrarComputadora({ marca, modelo, estado, sistema_operativo, observacion, uid_tarjeta }) {
        return new Promise((resolve, reject) => {
            const sql = `
                INSERT INTO computadora (marca, modelo, estado, sistema_operativo, observacion, uid_tarjeta)
                VALUES (?, ?, ?, ?, ?, ?)
            `;
            this.db.run(sql, [marca, modelo, estado, sistema_operativo, observacion, uid_tarjeta || null], function (err) {
                if (err) reject(err);
                else resolve({ id_computadora: this.lastID });
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

    obtenerComputadoraPorUID(uid_tarjeta) {
        return new Promise((resolve, reject) => {
            const sql = `
                SELECT id_computadora, marca, modelo, estado, sistema_operativo
                FROM computadora
                WHERE uid_tarjeta = ?
            `;
            this.db.get(sql, [uid_tarjeta], (err, row) => {
                if (err) reject(err);
                else resolve(row || null);
            });
        });
    }
    

    registrarPrestamoComputadora({ id_usuario, fecha, hora_inicio, operador, id_computadora }) {
        return new Promise((resolve, reject) => {
          const db = this.db;
      
          // Verificar que la computadora no esté en uso
          db.get(
            `SELECT estado FROM computadora WHERE id_computadora = ?`,
            [id_computadora],
            (err, row) => {
              if (err) return reject(err);
              if (!row) return reject(new Error("La computadora no existe."));
              if (row.estado === "en_uso") return reject(new Error("La computadora ya está en uso."));
      
              // Registrar el préstamo
              const sqlInsert = `
                INSERT INTO prestamo_computadora 
                (id_usuario, fecha, hora_inicio, operador, id_computadora, estado)
                VALUES (?, ?, ?, ?, ?, 'en_proceso')
              `;
              db.run(sqlInsert, [id_usuario, fecha, hora_inicio, operador, id_computadora], function(err2) {
                if (err2) return reject(err2);
      
                const id_prestamo_compu = this.lastID;
      
                // Actualizar el estado de la computadora a "en_uso"
                db.run(
                  `UPDATE computadora SET estado = 'en_uso' WHERE id_computadora = ?`,
                  [id_computadora],
                  function(err3) {
                    if (err3) return reject(err3);
                    resolve({ id_prestamo_compu });
                  }
                );
              });
            }
          );
        });
      }
      
    
    
    finalizarPrestamoComputadora(id_prestamo_compu, hora_fin) {
        return new Promise((resolve, reject) => {
            const db = this.db;
            db.serialize(() => {
                // 1️⃣ Marcar el préstamo como finalizado
                db.run(
                    `
                    UPDATE prestamo_computadora
                    SET hora_fin = ?, estado = 'finalizado'
                    WHERE id_prestamo_compu = ?
                    `,
                    [hora_fin, id_prestamo_compu],
                    function (err) {
                        if (err) return reject(err);
    
                        // 2️⃣ Liberar la computadora asociada
                        db.run(
                            `
                            UPDATE computadora
                            SET estado = 'disponible'
                            WHERE id_computadora = (
                                SELECT id_computadora 
                                FROM prestamo_computadora 
                                WHERE id_prestamo_compu = ?
                            )
                            `,
                            [id_prestamo_compu],
                            function (err2) {
                                if (err2) return reject(err2);
                                resolve({ updated: this.changes });
                            }
                        );
                    }
                );
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

    // ------------------ COMPUTADORAS ------------------
    eliminarComputadora(id_computadora) {
        return new Promise((resolve, reject) => {
            this.db.run(`DELETE FROM computadora WHERE id_computadora = ?`, [id_computadora], function (err) {
                if (err) reject(err);
                else resolve({ deleted: this.changes });
            });
        });
    }

    // ------------------ PRÉSTAMOS COMPUTADORA ------------------
    eliminarPrestamoComputadora(id_prestamo_compu) {
        return new Promise((resolve, reject) => {
            this.db.run(`DELETE FROM prestamo_computadora WHERE id_prestamo_compu = ?`, [id_prestamo_compu], function (err) {
                if (err) reject(err);
                else resolve({ deleted: this.changes });
            });
        });
    }

    actualizarEstadoPrestamoComputadora(id_prestamo_compu, nuevoEstado, hora_fin = null) {
        return new Promise((resolve, reject) => {
            const parts = [];
            const params = [];
            parts.push(`estado = ?`);
            params.push(nuevoEstado);
            if (hora_fin !== null) {
                parts.push(`hora_fin = ?`);
                params.push(hora_fin);
            }
            params.push(id_prestamo_compu);

            const sql = `UPDATE prestamo_computadora SET ${parts.join(', ')} WHERE id_prestamo_compu = ?`;
            this.db.run(sql, params, function (err) {
                if (err) reject(err);
                else resolve({ updated: this.changes });
            });
        });
    }


    registrarOperador(data) {
        return new Promise((resolve, reject) => {
            const {
                id_operador, nombre_completo, email, telefono,
                domicilio, codigo_postal, ciudad, provincia, sexo
            } = data;

            const sql = `
                INSERT INTO operador (id_operador, nombre_completo, email, telefono,
                    domicilio, codigo_postal, ciudad, provincia, sexo)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
            `;
            this.db.run(sql, [id_operador, nombre_completo, email, telefono, domicilio,
                codigo_postal, ciudad, provincia, sexo], function (err) {
                if (err) reject(err);
                else resolve({ id_operador });
            });
        });
    }

    obtenerOperadores() {
        return new Promise((resolve, reject) => {
            this.db.all(`SELECT * FROM operador ORDER BY nombre_completo`, [], (err, rows) => {
                if (err) reject(err);
                else resolve(rows);
            });
        });
    }

    eliminarOperador(id_operador) {
        return new Promise((resolve, reject) => {
            this.db.run(`DELETE FROM operador WHERE id_operador = ?`, [id_operador], function (err) {
                if (err) reject(err);
                else resolve({ deleted: this.changes });
            });
        });
    }

    registrarPrestamoLibro({ id_libro, fecha_inicial, dias_prestamo, operador, id_usuario }) {
        return new Promise((resolve, reject) => {
            if (!id_libro || !fecha_inicial || !dias_prestamo || !operador || !id_usuario) {
                reject(new Error("Faltan campos obligatorios para registrar préstamo"));
                return;
            }
    
            const db = this.db;
    
            // 1️⃣ Verificar si el libro está disponible
            const sqlVerificarLibro = `SELECT estado FROM libro WHERE id_libro = ?`;
    
            db.get(sqlVerificarLibro, [id_libro], (err, row) => {
                if (err) return reject(err);
                if (!row) return reject(new Error("El libro no existe en la base de datos"));
    
                if (row.estado === "en_prestamo") {
                    return reject(new Error("El libro ya está prestado y no puede ser prestado nuevamente."));
                }
    
                // 2️⃣ Calcular fecha final (SQLite usa formato YYYY-MM-DD)
                const fechaFinalSQL = `DATE('${fecha_inicial}', '+${dias_prestamo} day')`;
    
                // 3️⃣ Registrar el préstamo
                const sqlPrestamo = `
                    INSERT INTO prestamo_libro (fecha_inicial, fecha_final, operador, id_usuario, id_libro, estado)
                    VALUES (?, ${fechaFinalSQL}, ?, ?, ?, 'en_proceso')
                `;
    
                db.run(sqlPrestamo, [fecha_inicial, operador, id_usuario, id_libro], function (err2) {
                    if (err2) return reject(err2);
    
                    const idPrestamo = this.lastID;
    
                    // 4️⃣ Actualizar estado del libro a "en_prestamo"
                    const sqlUpdateLibro = `UPDATE libro SET estado = 'en_prestamo' WHERE id_libro = ?`;
    
                    db.run(sqlUpdateLibro, [id_libro], function (err3) {
                        if (err3) reject(err3);
                        else resolve({ id_prestamo: idPrestamo });
                    });
                });
            });
        });
    }
        
    obtenerPrestamosLibros() {
        return new Promise((resolve, reject) => {
            const sql = `
                SELECT 
                    p.id_prestamo,
                    l.titulo,
                    u.nombre_completo AS usuario,
                    u.tipo_usuario,
                    p.fecha_inicial,
                    p.fecha_final,
                    ROUND(julianday(p.fecha_final) - julianday('now')) AS dias_restantes
                FROM prestamo_libro p
                JOIN libro l ON p.id_libro = l.id_libro
                JOIN usuario u ON p.id_usuario = u.id_usuario
                WHERE p.estado = 'en_proceso'
                ORDER BY dias_restantes ASC
            `;
    
            this.db.all(sql, [], (err, rows) => {
                if (err) reject(err);
                else resolve(rows);
            });
        });
    }

    buscarLibros(query) {
        return new Promise((resolve, reject) => {
            if (!query || query.trim() === "") {
                resolve([]);
                return;
            }
    
            const sql = `
                SELECT id_libro, titulo, sub_titulo, asignatura, autor, estado, uid_tarjeta
                FROM libro
                WHERE titulo LIKE ? 
                   OR sub_titulo LIKE ?
                   OR asignatura LIKE ?
                   OR autor LIKE ?
                   OR segundo_autor LIKE?
                   OR tercer_autor LIKE?
                   OR isbn LIKE?
                   OR id_libro LIKE ?
                   OR uid_tarjeta LIKE ?
            `;
    
            const params = Array(4).fill(`%${query}%`);
    
            this.db.all(sql, params, (err, rows) => {
                if (err) reject(err);
                else resolve(rows);
            });
        });
    }

    obtenerLibroPorUID(uid_tarjeta) {
        return new Promise((resolve, reject) => {
            const sql = `
                SELECT id_libro, titulo, sub_titulo, autor, segundo_autor, tercer_autor, isbn, edicion, anio, estado
                FROM libro
                WHERE uid_tarjeta = ?
            `;
            this.db.get(sql, [uid_tarjeta], (err, row) => {
                if (err) reject(err);
                else resolve(row || null);
            });
        });
    }
    

    finalizarPrestamoLibro(id_prestamo) {
        return new Promise((resolve, reject) => {
            const db = this.db; // 🔹 Guardamos la referencia
    
            // Primero obtener el id_libro asociado al préstamo
            const sqlSelect = `SELECT id_libro FROM prestamo_libro WHERE id_prestamo = ?`;
    
            db.get(sqlSelect, [id_prestamo], (err, row) => {
                if (err) return reject(err);
                if (!row) return reject(new Error("No se encontró el préstamo"));
    
                const id_libro = row.id_libro;
    
                // Actualizar el estado del préstamo
                const sqlUpdatePrestamo = `
                    UPDATE prestamo_libro
                    SET estado = 'finalizado'
                    WHERE id_prestamo = ?
                `;
    
                db.run(sqlUpdatePrestamo, [id_prestamo], (err2) => {
                    if (err2) return reject(err2);
    
                    // Luego actualizar el libro a 'libre'
                    const sqlUpdateLibro = `UPDATE libro SET estado = 'libre' WHERE id_libro = ?`;
    
                    db.run(sqlUpdateLibro, [id_libro], function (err3) {
                        if (err3) reject(err3);
                        else resolve({ updated: this.changes });
                    });
                });
            });
        });
    }
    
    
    
    registrarLibro(data) {
        return new Promise((resolve, reject) => {
            const {
                titulo, sub_titulo, asignatura, autor, segundo_autor, tercer_autor,
                isbn, serie, editorial, edicion, lugar, anio, cant_paginas, tamano,
                idioma, origen, ubicacion, nivel, dias_de_prestamo, palabra_clave,
                observaciones, estado, uid_tarjeta
            } = data;

            if (!titulo || !asignatura || !autor) {
                return reject(new Error("Faltan campos obligatorios para registrar libro"));
            }

            const sql = `
                INSERT INTO libro (
                    titulo, sub_titulo, asignatura, autor, segundo_autor, tercer_autor,
                    isbn, serie, editorial, edicion, lugar, anio, cant_paginas, tamano,
                    idioma, origen, ubicacion, nivel, dias_de_prestamo, palabra_clave,
                    observaciones, estado, uid_tarjeta
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            `;

            this.db.run(sql, [
                titulo, sub_titulo || null, asignatura, autor, segundo_autor || null, tercer_autor || null,
                isbn || null, serie || null, editorial || null, edicion || null, lugar || null,
                anio || null, cant_paginas || null, tamano || null, idioma || null, origen || null,
                ubicacion || null, nivel || null, dias_de_prestamo || 7, palabra_clave || null,
                observaciones || null, estado || 'libre' || null, uid_tarjeta || null
            ], function (err) {
                if (err) reject(err);
                else resolve({ id_libro: this.lastID });
            });
        });
    }

    obtenerLibros() {
        return new Promise((resolve, reject) => {
            const sql = `SELECT * FROM libro ORDER BY titulo`;
            this.db.all(sql, [], (err, rows) => {
                if (err) reject(err);
                else resolve(rows);
            });
        });
    }

    eliminarLibro(id_libro) {
        return new Promise((resolve, reject) => {
            this.db.run(`DELETE FROM libro WHERE id_libro = ?`, [id_libro], function (err) {
                if (err) reject(err);
                else resolve({ deleted: this.changes });
            });
        });
    }

    registrarLecturaNFC(uid_tarjeta) {
        return new Promise(async (resolve, reject) => {
            if (!uid_tarjeta) return reject(new Error('Falta UID'));
    
            const fecha = new Date().toISOString().split('T')[0];
            const hora = new Date().toISOString().split('T')[1].split('.')[0];
    
            try {
                // Buscar asociaciones
                const usuario = await this.obtenerUsuarioPorUID(uid_tarjeta);
                const libro = await this.obtenerLibroPorUID(uid_tarjeta);
                const computadora = await this.obtenerComputadoraPorUID(uid_tarjeta);
    
                let accion = null;
                let tipo_uso = null;
                let id_usuario = null;
                let id_libro = null;
                let id_computadora = null;
    
                // Determinar acción y tipo_uso
                if (usuario) {
                    id_usuario = usuario.id_usuario;
    
                    // Buscar última entrada del usuario
                    const ultima = await new Promise((res, rej) => {
                        this.db.get(
                            `SELECT accion FROM entrada WHERE id_usuario = ? ORDER BY id_entrada DESC LIMIT 1`,
                            [id_usuario],
                            (err, row) => { if(err) rej(err); else res(row ? row.accion : null); }
                        );
                    });
    
                    accion = (ultima === 'entrada') ? 'salida' : 'entrada';
                    tipo_uso = 'sala';
    
                } else if (libro) {
                    id_libro = libro.id_libro;
    
                    const ultima = await new Promise((res, rej) => {
                        this.db.get(
                            `SELECT accion FROM entrada WHERE id_libro = ? ORDER BY id_entrada DESC LIMIT 1`,
                            [id_libro],
                            (err, row) => { if(err) rej(err); else res(row ? row.accion : null); }
                        );
                    });
    
                    tipo_uso = 'libro';
    
                } else if (computadora) {
                    id_computadora = computadora.id_computadora;
    
                    const ultima = await new Promise((res, rej) => {
                        this.db.get(
                            `SELECT accion FROM entrada WHERE id_computadora = ? ORDER BY id_entrada DESC LIMIT 1`,
                            [id_computadora],
                            (err, row) => { if(err) rej(err); else res(row ? row.accion : null); }
                        );
                    });
                    tipo_uso = 'computadora';
                }
    
                // Insertar registro
                const sql = `
                    INSERT INTO entrada (accion, fecha, hora, tipo_uso, observacion, id_usuario, id_libro, id_computadora, uid_tarjeta)
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
                `;
    
                this.db.run(sql, [
                    accion, fecha, hora, tipo_uso, null, id_usuario, id_libro, id_computadora, uid_tarjeta
                ], function(err) {
                    if(err) return reject(err);
    
                    resolve({
                        id_entrada: this.lastID,
                        accion,
                        tipo_uso,
                        id_usuario,
                        id_libro,
                        id_computadora,
                        fecha,
                        hora,
                        uid_tarjeta
                    });
                });
    
            } catch (error) {
                reject(error);
            }
        });
    }

    // Obtener el último UID de la tabla 'entrad'
getUltimoUID = () => {
    return new Promise((resolve, reject) => {
      this.db.get(
        "SELECT uid_tarjeta FROM entrada ORDER BY id_entrada DESC LIMIT 1",
        (err, row) => {
          if (err) return reject(err);
          resolve(row || null);
        }
      );
    });
  };
  
    close() {
        return new Promise((resolve, reject) => {
            if (this.db) {
                this.db.close((err) => {
                    if (err) reject(err);
                    else {
                        console.log("Conexión cerrada");
                        resolve();
                    }
                });
            } else resolve();
        });
    }
}

module.exports = NFCDatabase;
