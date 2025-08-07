const sqlite3 = require('sqlite3').verbose();
const path = require('path');

class NFCDatabase {
    constructor(dbPath = 'nfc_data.db') {
        this.dbPath = dbPath;
        this.db = null;
        this.init();
    }

    init() {
        return new Promise((resolve, reject) => {
            this.db = new sqlite3.Database(this.dbPath, (err) => {
                if (err) {
                    console.error('Error al conectar con la base de datos:', err.message);
                    reject(err);
                } else {
                    console.log('Conectado a la base de datos SQLite');
                    this.createTables().then(resolve).catch(reject);
                }
            });
        });
    }

    createTables() {
        return new Promise((resolve, reject) => {
            // Tabla de estudiantes
            const studentsSql = `
                CREATE TABLE IF NOT EXISTS students (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    uid TEXT NOT NULL UNIQUE,
                    dni TEXT NOT NULL UNIQUE,
                    nombre TEXT NOT NULL,
                    apellido TEXT NOT NULL,
                    categoria TEXT NOT NULL CHECK(categoria IN ('Aspirante', 'Cursante', 'No cursante', 'Docente', 'No docente', 'Egresado', 'Externo')),
                    carrera TEXT,
                    email TEXT,
                    telefono TEXT,
                    localidad TEXT,
                    provincia TEXT,
                    fecha_registro DATETIME DEFAULT CURRENT_TIMESTAMP,
                    activo BOOLEAN DEFAULT 1
                )
            `;

            // Mantener la tabla original para compatibilidad
            const cardsSql = `
                CREATE TABLE IF NOT EXISTS nfc_cards (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    uid TEXT NOT NULL UNIQUE,
                    first_seen DATETIME DEFAULT CURRENT_TIMESTAMP,
                    last_seen DATETIME DEFAULT CURRENT_TIMESTAMP,
                    read_count INTEGER DEFAULT 1
                )
            `;

            // Nueva tabla para registros individuales con columnas específicas para día y hora
            const entriesSql = `
                CREATE TABLE IF NOT EXISTS nfc_entries (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    uid TEXT NOT NULL,
                    dia TEXT NOT NULL,
                    hora TEXT NOT NULL,
                    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
                )
            `;

            // Crear tabla de estudiantes primero
            this.db.run(studentsSql, (err) => {
                if (err) {
                    console.error('Error al crear la tabla students:', err.message);
                    reject(err);
                    return;
                }

                // Crear tabla de tarjetas
                this.db.run(cardsSql, (err) => {
                    if (err) {
                        console.error('Error al crear la tabla nfc_cards:', err.message);
                        reject(err);
                        return;
                    }
                    
                    // Crear tabla de entradas
                    this.db.run(entriesSql, (err) => {
                        if (err) {
                            console.error('Error al crear la tabla nfc_entries:', err.message);
                            reject(err);
                        } else {
                            console.log('Tablas creadas o ya existen');
                            resolve();
                        }
                    });
                });
            });
        });
    }

    // ===== MÉTODOS PARA ESTUDIANTES =====

    // Registrar un nuevo estudiante
    registerStudent(studentData) {
        return new Promise((resolve, reject) => {
            const { uid, dni, nombre, apellido, categoria, carrera, email, telefono, localidad, provincia } = studentData;
            
            // Validar campos requeridos
            if (!uid || !dni || !nombre || !apellido || !categoria) {
                reject(new Error('UID, DNI, nombre, apellido y categoría son campos requeridos'));
                return;
            }

            // Validar categoría
            const categoriasValidas = ['Aspirante', 'Cursante', 'No cursante', 'Docente', 'No docente', 'Egresado', 'Externo'];
            if (!categoriasValidas.includes(categoria)) {
                reject(new Error('Categoría no válida'));
                return;
            }

            const sql = `
                INSERT INTO students (uid, dni, nombre, apellido, categoria, carrera, email, telefono, localidad, provincia)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            `;

            this.db.run(sql, [uid, dni, nombre, apellido, categoria, carrera, email, telefono, localidad, provincia], function(err) {
                if (err) {
                    if (err.code === 'SQLITE_CONSTRAINT_UNIQUE') {
                        reject(new Error('Ya existe un usuario con ese UID o DNI'));
                    } else {
                        reject(err);
                    }
                } else {
                    console.log(`Usuario registrado: ${nombre} ${apellido} - Categoría: ${categoria}`);
                    resolve({
                        id: this.lastID,
                        uid,
                        dni,
                        nombre,
                        apellido,
                        categoria,
                        carrera,
                        email,
                        telefono,
                        localidad,
                        provincia
                    });
                }
            });
        });
    }

    // Obtener todos los estudiantes
    getAllStudents() {
        return new Promise((resolve, reject) => {
            const sql = 'SELECT * FROM students ORDER BY apellido, nombre';
            
            this.db.all(sql, [], (err, rows) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(rows);
                }
            });
        });
    }

    // Obtener estudiante por UID
    getStudentByUID(uid) {
        return new Promise((resolve, reject) => {
            const sql = 'SELECT * FROM students WHERE uid = ?';
            
            this.db.get(sql, [uid], (err, row) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(row);
                }
            });
        });
    }

    // Obtener estudiante por DNI
    getStudentByDni(dni) {
        return new Promise((resolve, reject) => {
            const sql = 'SELECT * FROM students WHERE dni = ?';
            
            this.db.get(sql, [dni], (err, row) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(row);
                }
            });
        });
    }

    // Actualizar datos de estudiante
    updateStudent(uid, studentData) {
        return new Promise((resolve, reject) => {
            const { dni, nombre, apellido, categoria, carrera, email, telefono, localidad, provincia, activo } = studentData;
            
            const sql = `
                UPDATE students 
                SET dni = ?, nombre = ?, apellido = ?, categoria = ?, carrera = ?, 
                    email = ?, telefono = ?, localidad = ?, provincia = ?, activo = ?
                WHERE uid = ?
            `;

            this.db.run(sql, [dni, nombre, apellido, categoria, carrera, email, telefono, localidad, provincia, activo, uid], function(err) {
                if (err) {
                    reject(err);
                } else {
                    console.log(`Estudiante actualizado: ${nombre} ${apellido} - UID: ${uid}`);
                    resolve({ changes: this.changes });
                }
            });
        });
    }

    // Eliminar estudiante
    deleteStudent(uid) {
        return new Promise((resolve, reject) => {
            const sql = 'DELETE FROM students WHERE uid = ?';
            
            this.db.run(sql, [uid], function(err) {
                if (err) {
                    reject(err);
                } else {
                    console.log(`Estudiante eliminado - UID: ${uid}`);
                    resolve({ deletedRows: this.changes });
                }
            });
        });
    }

    // ===== MÉTODOS PARA ENTRADAS =====

    // Método para insertar una nueva entrada independiente
    insertEntry(uid) {
        return new Promise((resolve, reject) => {
            // Obtener fecha y hora local formateada
            const now = new Date();
            
            // Formatear día como DD/MM/YYYY
            const dia = `${now.getDate().toString().padStart(2, '0')}/${(now.getMonth() + 1).toString().padStart(2, '0')}/${now.getFullYear()}`;
            
            // Formatear hora como HH:MM:SS
            const hora = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}:${now.getSeconds().toString().padStart(2, '0')}`;
            
            // Formato completo para timestamp
            const localDateTime = now.toISOString().replace('T', ' ').substring(0, 19);
            
            // Insertar nueva entrada con día y hora separados
            const insertSql = 'INSERT INTO nfc_entries (uid, dia, hora, timestamp) VALUES (?, ?, ?, ?)';
            
            this.db.run(insertSql, [uid, dia, hora, localDateTime], function(err) {
                if (err) {
                    reject(err);
                    return;
                }
                
                // También actualizar la tabla nfc_cards para mantener compatibilidad
                const selectSql = 'SELECT id, read_count FROM nfc_cards WHERE uid = ?';
                
                this.db.get(selectSql, [uid], (err, row) => {
                    if (err) {
                        console.error('Error al verificar tarjeta existente:', err.message);
                    }

                    if (row) {
                        // UID existe, actualizar
                        const updateSql = `
                            UPDATE nfc_cards 
                            SET last_seen = ?, read_count = read_count + 1 
                            WHERE uid = ?
                        `;
                        
                        this.db.run(updateSql, [localDateTime, uid], function(err) {
                            if (err) {
                                console.error('Error al actualizar tarjeta:', err.message);
                            }
                        });
                    } else {
                        // UID nuevo, insertar
                        const insertCardSql = 'INSERT INTO nfc_cards (uid, first_seen, last_seen) VALUES (?, ?, ?)';
                        
                        this.db.run(insertCardSql, [uid, localDateTime, localDateTime], function(err) {
                            if (err) {
                                console.error('Error al insertar nueva tarjeta:', err.message);
                            }
                        });
                    }
                });
                
                console.log(`Nueva entrada para UID ${uid} registrada - Día: ${dia}, Hora: ${hora}`);
                resolve({
                    action: 'entry_recorded',
                    uid: uid,
                    id: this.lastID,
                    dia: dia,
                    hora: hora,
                    timestamp: localDateTime
                });
            }.bind(this));
        });
    }

    // Obtener todas las entradas con información del estudiante
    getAllEntriesWithStudents() {
        return new Promise((resolve, reject) => {
            const sql = `
                SELECT 
                    e.*,
                    s.nombre,
                    s.apellido,
                    s.dni,
                    s.categoria,
                    s.carrera
                FROM nfc_entries e
                LEFT JOIN students s ON e.uid = s.uid
                ORDER BY e.timestamp DESC
            `;
            
            this.db.all(sql, [], (err, rows) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(rows);
                }
            });
        });
    }

    // Obtener todas las entradas individuales
    getAllEntries() {
        return new Promise((resolve, reject) => {
            const sql = 'SELECT * FROM nfc_entries ORDER BY timestamp DESC';
            
            this.db.all(sql, [], (err, rows) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(rows);
                }
            });
        });
    }

    // Obtener entradas por UID
    getEntriesByUID(uid) {
        return new Promise((resolve, reject) => {
            const sql = 'SELECT * FROM nfc_entries WHERE uid = ? ORDER BY timestamp DESC';
            
            this.db.all(sql, [uid], (err, rows) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(rows);
                }
            });
        });
    }

    // ===== MÉTODOS ORIGINALES MANTENIDOS =====

    getAllCards() {
        return new Promise((resolve, reject) => {
            const sql = 'SELECT * FROM nfc_cards ORDER BY last_seen DESC';
            
            this.db.all(sql, [], (err, rows) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(rows);
                }
            });
        });
    }

    getCardByUID(uid) {
        return new Promise((resolve, reject) => {
            const sql = 'SELECT * FROM nfc_cards WHERE uid = ?';
            
            this.db.get(sql, [uid], (err, row) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(row);
                }
            });
        });
    }

    deleteCard(uid) {
        return new Promise((resolve, reject) => {
            // Eliminar de todas las tablas
            const deleteCardSql = 'DELETE FROM nfc_cards WHERE uid = ?';
            const deleteEntriesSql = 'DELETE FROM nfc_entries WHERE uid = ?';
            const deleteStudentSql = 'DELETE FROM students WHERE uid = ?';
            
            this.db.run(deleteCardSql, [uid], (err) => {
                if (err) {
                    reject(err);
                    return;
                }
                
                this.db.run(deleteEntriesSql, [uid], (err) => {
                    if (err) {
                        reject(err);
                        return;
                    }
                    
                    this.db.run(deleteStudentSql, [uid], function(err) {
                        if (err) {
                            reject(err);
                        } else {
                            console.log(`UID ${uid} eliminado completamente de la base de datos`);
                            resolve({ deletedRows: this.changes });
                        }
                    });
                });
            });
        });
    }

    clearAllCards() {
        return new Promise((resolve, reject) => {
            // Limpiar todas las tablas
            const clearCardsSql = 'DELETE FROM nfc_cards';
            const clearEntriesSql = 'DELETE FROM nfc_entries';
            const clearStudentsSql = 'DELETE FROM students';
            
            this.db.run(clearCardsSql, [], (err) => {
                if (err) {
                    reject(err);
                    return;
                }
                
                this.db.run(clearEntriesSql, [], (err) => {
                    if (err) {
                        reject(err);
                        return;
                    }
                    
                    this.db.run(clearStudentsSql, [], function(err) {
                        if (err) {
                            reject(err);
                        } else {
                            console.log('🧹 Todas las tarjetas, entradas y estudiantes eliminados de la base de datos');
                            resolve({ deletedRows: this.changes });
                        }
                    });
                });
            });
        });
    }

    getStats() {
        return new Promise((resolve, reject) => {
            const sql = `
                SELECT 
                    (SELECT COUNT(*) FROM nfc_cards) as total_cards,
                    (SELECT COUNT(*) FROM nfc_entries) as total_entries,
                    (SELECT COUNT(*) FROM students) as total_students,
                    (SELECT MAX(timestamp) FROM nfc_entries) as last_activity
                FROM nfc_cards LIMIT 1
            `;
            
            this.db.get(sql, [], (err, row) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(row || { total_cards: 0, total_entries: 0, total_students: 0, last_activity: null });
                }
            });
        });
    }

    close() {
        return new Promise((resolve, reject) => {
            if (this.db) {
                this.db.close((err) => {
                    if (err) {
                        reject(err);
                    } else {
                        console.log('Conexión a la base de datos cerrada');
                        resolve();
                    }
                });
            } else {
                resolve();
            }
        });
    }
}

module.exports = NFCDatabase;