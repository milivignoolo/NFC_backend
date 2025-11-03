const nodemailer = require("nodemailer");
const NFCDatabase = require("../database");
const db = new NFCDatabase();

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: "daipalacios2005@gmail.com", 
    pass: "minp eurs zwlk uwyg",
  },
});

async function enviarCorreo(destinatario, asunto, mensaje) {
  try {
    await transporter.sendMail({
      from: '"Biblioteca NFC" <daipalacios2005@gmail.com>',
      to: destinatario,
      subject: asunto,
      text: mensaje,
    });
    console.log(`Correo enviado a ${destinatario}`);
  } catch (err) {
    console.error("Error enviando correo:", err.message);
  }
}

async function verificarPrestamosAVencer() {
  try {
    const prestamos = await db.obtenerPrestamosLibros();

    for (const p of prestamos) {
      if (p.dias_restantes === 3 || p.dias_restantes === 1) {
        // Verificar si ya se envió la notificación
        const notificado = await db.verificarNotificacion(p.id_prestamo, p.dias_restantes);
        if (notificado) continue;

        const mensaje = `Hola ${p.usuario},
            Este es un recordatorio de la Biblioteca NFC.
            El libro "${p.titulo}" debe ser devuelto en ${p.dias_restantes} día${p.dias_restantes === 1 ? "" : "s"}.
            Por favor, asegurate de devolverlo a tiempo para evitar sanciones.
            Gracias, Biblioteca NFC
        `;

        await enviarCorreo(
          p.email,
          `Recordatorio: devolución de libro "${p.titulo}"`,
          mensaje
        );

        // Registrar notificación enviada
        await db.registrarNotificacion(p.id_prestamo, p.dias_restantes);
      }
    }
  } catch (err) {
    console.error("Error verificando préstamos:", err);
  }
}

module.exports = { verificarPrestamosAVencer };
