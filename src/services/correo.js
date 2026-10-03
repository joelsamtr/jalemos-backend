import nodemailer from "nodemailer";

// Un solo transportador reutilizado en toda la app.
const transportador = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT || 587),
  secure: Number(process.env.SMTP_PORT) === 465,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

// Envía el ticket al correo del comprador. Se llama desde el controlador
// de transacciones cuando una compra queda APROBADO (tarjeta exitosa o
// depósito aprobado por el admin).
export async function enviarTicket({ correoDestino, evento, codigoTicket, cantidadTickets }) {
  const asunto = `Tu ticket para ${evento.titulo} — jalemos.com`;

  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 480px; margin: 0 auto;">
      <h2 style="margin-bottom: 4px;">${evento.titulo}</h2>
      <p style="color: #555; margin-top: 0;">${evento.lugar}</p>
      <p>Tickets: <strong>${cantidadTickets}</strong></p>
      <div style="background: #f4f4f4; padding: 16px; text-align: center; margin: 20px 0;">
        <p style="margin: 0; font-size: 12px; color: #777;">Código de tu ticket</p>
        <p style="margin: 4px 0 0; font-size: 20px; letter-spacing: 2px; font-weight: bold;">
          ${codigoTicket}
        </p>
      </div>
      <p style="font-size: 13px; color: #777;">
        Presenta este código (o este correo) en la entrada del evento.
      </p>
    </div>
  `;

  await transportador.sendMail({
    from: process.env.SMTP_FROM,
    to: correoDestino,
    subject: asunto,
    html,
  });
}
