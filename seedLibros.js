// seedLibros.js
const sqlite3 = require("sqlite3").verbose();
const path = require("path");

const dbPath = path.join(__dirname, "biblioteca_nfc.db");
const db = new sqlite3.Database(dbPath);

const libros = [
  {
    titulo: "Introducción a la Programación",
    sub_titulo: "Conceptos básicos y fundamentos",
    asignatura: "Programación I",
    autor: "Luis García",
    segundo_autor: null,
    tercer_autor: null,
    isbn: "978-1234567890",
    serie: null,
    editorial: "Editorial Técnica",
    edicion: "3ra",
    lugar: "Buenos Aires",
    anio: 2023,
    cant_paginas: 350,
    tamano: "A4",
    idioma: "Español",
    origen: "Donación",
    ubicacion: "Estante A1",
    nivel: "Universitario",
    dias_de_prestamo: 7,
    palabra_clave: "programación, algoritmos, código",
    observaciones: null,
    estado: "libre",
    uid_tarjeta: null
  },
  {
    titulo: "Base de Datos Modernas",
    sub_titulo: "Diseño y gestión de sistemas de información",
    asignatura: "Base de Datos",
    autor: "María Fernández",
    segundo_autor: "Juan Pérez",
    tercer_autor: null,
    isbn: "978-0987654321",
    serie: null,
    editorial: "Ediciones Informáticas",
    edicion: "2da",
    lugar: "Córdoba",
    anio: 2024,
    cant_paginas: 420,
    tamano: "A4",
    idioma: "Español",
    origen: "Compra",
    ubicacion: "Estante B2",
    nivel: "Universitario",
    dias_de_prestamo: 14,
    palabra_clave: "SQL, bases de datos, relacionales",
    observaciones: null,
    estado: "libre",
    uid_tarjeta: null
  },
  {
    titulo: "Estructuras de Datos y Algoritmos",
    sub_titulo: null,
    asignatura: "Algoritmos y Estructuras de Datos",
    autor: "Carlos Rodríguez",
    segundo_autor: null,
    tercer_autor: null,
    isbn: "978-1122334455",
    serie: "Serie Informática",
    editorial: "Libros Técnicos SA",
    edicion: "1ra",
    lugar: "Rosario",
    anio: 2022,
    cant_paginas: 580,
    tamano: "A4",
    idioma: "Español",
    origen: "Donación",
    ubicacion: "Estante C3",
    nivel: "Universitario",
    dias_de_prestamo: 7,
    palabra_clave: "algoritmos, estructuras, complejidad",
    observaciones: "Incluye ejercicios resueltos",
    estado: "libre",
    uid_tarjeta: null
  },
  {
    titulo: "Sistemas Operativos",
    sub_titulo: "Teoría y práctica",
    asignatura: "Sistemas Operativos",
    autor: "Ana Martínez",
    segundo_autor: "Pedro López",
    tercer_autor: "Laura Sánchez",
    isbn: "978-5544332211",
    serie: null,
    editorial: "Editorial Universitaria",
    edicion: "4ta",
    lugar: "Mendoza",
    anio: 2023,
    cant_paginas: 650,
    tamano: "A4",
    idioma: "Español",
    origen: "Compra",
    ubicacion: "Estante D4",
    nivel: "Universitario",
    dias_de_prestamo: 7,
    palabra_clave: "sistemas operativos, Linux, Windows",
    observaciones: null,
    estado: "libre",
    uid_tarjeta: null
  },
  {
    titulo: "Redes de Computadoras",
    sub_titulo: "Fundamentos y protocolos",
    asignatura: "Redes",
    autor: "Roberto Silva",
    segundo_autor: null,
    tercer_autor: null,
    isbn: "978-9988776655",
    serie: null,
    editorial: "Tecnología Editorial",
    edicion: "2da",
    lugar: "Buenos Aires",
    anio: 2024,
    cant_paginas: 480,
    tamano: "A4",
    idioma: "Español",
    origen: "Compra",
    ubicacion: "Estante E5",
    nivel: "Universitario",
    dias_de_prestamo: 7,
    palabra_clave: "redes, TCP/IP, protocolos",
    observaciones: null,
    estado: "libre",
    uid_tarjeta: null
  }
];

// Verificar si ya hay libros en la base de datos
db.get("SELECT COUNT(*) as count FROM libro", [], (err, row) => {
  if (err) {
    console.error("Error verificando libros:", err.message);
    db.close();
    return;
  }

  const cantidadLibros = row ? row.count : 0;

  if (cantidadLibros > 0) {
    console.log(`✅ Ya hay ${cantidadLibros} libro(s) cargado(s) en la base de datos. No se cargarán libros nuevos.`);
    db.close();
    return;
  }

  // Si no hay libros, cargar los libros de ejemplo
  console.log("📚 No hay libros cargados. Cargando libros de ejemplo...");

  db.serialize(() => {
    libros.forEach(libro => {
      db.run(
        `INSERT OR IGNORE INTO libro (
          titulo, sub_titulo, asignatura, autor, segundo_autor, tercer_autor,
          isbn, serie, editorial, edicion, lugar, anio, cant_paginas, tamano,
          idioma, origen, ubicacion, nivel, dias_de_prestamo, palabra_clave,
          observaciones, estado, uid_tarjeta
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          libro.titulo,
          libro.sub_titulo,
          libro.asignatura,
          libro.autor,
          libro.segundo_autor,
          libro.tercer_autor,
          libro.isbn,
          libro.serie,
          libro.editorial,
          libro.edicion,
          libro.lugar,
          libro.anio,
          libro.cant_paginas,
          libro.tamano,
          libro.idioma,
          libro.origen,
          libro.ubicacion,
          libro.nivel,
          libro.dias_de_prestamo,
          libro.palabra_clave,
          libro.observaciones,
          libro.estado,
          libro.uid_tarjeta
        ],
        (err) => {
          if (err) {
            console.error(`Error insertando libro "${libro.titulo}":`, err.message);
          } else {
            console.log(`📖 Libro "${libro.titulo}" insertado correctamente.`);
          }
        }
      );
    });
  });

  // Esperar un poco antes de cerrar para que se completen todas las inserciones
  setTimeout(() => {
    console.log(`✅ Se cargaron ${libros.length} libros de ejemplo.`);
    db.close();
  }, 500);
});

