// seedLibros.js
const sqlite3 = require("sqlite3").verbose();
const path = require("path");

const dbPath = path.join(__dirname, "biblioteca_nfc.db");
const db = new sqlite3.Database(dbPath);

const libros = [
  {
    titulo: "Introducción a la Programación",
    sub_titulo: "Conceptos básicos y fundamentos",
    portada: "https://imgv2-1-f.scribdassets.com/img/document/436366160/original/87972d55d7/1?v=1",
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
    portada: null,
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
    portada: null,
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
    portada: null,
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
    portada: null,
    asignatura: "Comunicación de Datos",
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
    palabra_clave: "redes, TCP/IP, protocolos, comunicación",
    observaciones: null,
    estado: "libre",
    uid_tarjeta: null
  },
  {
    titulo: "Matemática Financiera",
    sub_titulo: "Aplicaciones y ejercicios resueltos",
    portada: "https://images.cdn1.buscalibre.com/fit-in/360x360/41/5e/415e22779f50bdde0fd5127f612a6c48.jpg",
    asignatura: "Matemática Financiera",
    autor: "Jorge L. Pérez",
    segundo_autor: null,
    tercer_autor: null,
    isbn: "978-9876543210",
    serie: null,
    editorial: "Editorial Económica",
    edicion: "5ta",
    lugar: "Buenos Aires",
    anio: 2021,
    cant_paginas: 390,
    tamano: "A4",
    idioma: "Español",
    origen: "Compra",
    ubicacion: "Estante F1",
    nivel: "Universitario",
    dias_de_prestamo: 10,
    palabra_clave: "interés, descuento, anualidades, capitalización",
    observaciones: "Incluye guía de ejercicios prácticos",
    estado: "libre",
    uid_tarjeta: null
  },
  {
    titulo: "Probabilidad y Estadística",
    sub_titulo: "Fundamentos teóricos y aplicaciones",
    portada: null,
    asignatura: "Probabilidad y Estadística",
    autor: "Marina Gómez",
    segundo_autor: "Eduardo Rivas",
    tercer_autor: null,
    isbn: "978-8765432109",
    serie: null,
    editorial: "Ciencia & Datos",
    edicion: "3ra",
    lugar: "Córdoba",
    anio: 2022,
    cant_paginas: 520,
    tamano: "A4",
    idioma: "Español",
    origen: "Donación",
    ubicacion: "Estante G2",
    nivel: "Universitario",
    dias_de_prestamo: 14,
    palabra_clave: "probabilidad, estadística, distribuciones, inferencia",
    observaciones: null,
    estado: "libre",
    uid_tarjeta: null
  },
  {
    titulo: "Economía",
    sub_titulo: "Moneda, inflación y política económica",
    portada: null,
    asignatura: "Economía",
    autor: "Ricardo López",
    segundo_autor: null,
    tercer_autor: null,
    isbn: "978-9123456789",
    serie: null,
    editorial: "Editorial Universitaria",
    edicion: "2da",
    lugar: "Santa Fe",
    anio: 2023,
    cant_paginas: 430,
    tamano: "A4",
    idioma: "Español",
    origen: "Compra",
    ubicacion: "Estante H3",
    nivel: "Universitario",
    dias_de_prestamo: 7,
    palabra_clave: "moneda, inflación, macroeconomía, UTN",
    observaciones: null,
    estado: "libre",
    uid_tarjeta: null
  },
  {
    titulo: "Ingeniería de Software",
    sub_titulo: "Procesos, metodologías y herramientas",
    portada: null,
    asignatura: "Ingeniería de Software",
    autor: "Gabriela Castro",
    segundo_autor: "Nicolás Herrera",
    tercer_autor: null,
    isbn: "978-3344556677",
    serie: "Serie Sistemas",
    editorial: "SoftPress",
    edicion: "3ra",
    lugar: "Buenos Aires",
    anio: 2024,
    cant_paginas: 610,
    tamano: "A4",
    idioma: "Español",
    origen: "Compra",
    ubicacion: "Estante I2",
    nivel: "Universitario",
    dias_de_prestamo: 10,
    palabra_clave: "ingeniería, software, UML, metodologías ágiles",
    observaciones: null,
    estado: "libre",
    uid_tarjeta: null
  },
  {
    titulo: "Gestión de Proyectos Informáticos",
    sub_titulo: "Planificación, control y gestión de riesgos",
    portada: null,
    asignatura: "Gestión de Proyectos",
    autor: "Fernando Ruiz",
    segundo_autor: null,
    tercer_autor: null,
    isbn: "978-2233445566",
    serie: null,
    editorial: "TechBooks",
    edicion: "1ra",
    lugar: "Buenos Aires",
    anio: 2023,
    cant_paginas: 455,
    tamano: "A4",
    idioma: "Español",
    origen: "Donación",
    ubicacion: "Estante J1",
    nivel: "Universitario",
    dias_de_prestamo: 14,
    palabra_clave: "gestión, proyectos, PMBOK, cronograma, riesgos",
    observaciones: "Contiene casos prácticos",
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
    console.log(`Ya hay ${cantidadLibros} libro(s) cargado(s) en la base de datos. No se cargarán libros nuevos.`);
    db.close();
    return;
  }

  console.log("No hay libros cargados. Cargando libros de ejemplo...");

  db.serialize(() => {
    libros.forEach(libro => {
      db.run(
        `INSERT OR IGNORE INTO libro (
          titulo, sub_titulo, portada, asignatura, autor, segundo_autor, tercer_autor,
          isbn, serie, editorial, edicion, lugar, anio, cant_paginas, tamano,
          idioma, origen, ubicacion, nivel, dias_de_prestamo, palabra_clave,
          observaciones, estado, uid_tarjeta
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          libro.titulo,
          libro.sub_titulo,
          libro.portada,
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
            console.log(`Libro "${libro.titulo}" insertado correctamente.`);
          }
        }
      );
    });
  });

  setTimeout(() => {
    console.log(`Se cargaron ${libros.length} libros de ejemplo.`);
    db.close();
  }, 500);
});
