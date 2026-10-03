import prisma from "../config/prisma.js";
import crypto from "crypto";
import { enviarTicket } from "../services/correo.js";
import { cobrarConToken } from "../services/pasarelaPago.js";

// POST /api/transacciones  (público — lo llama el checkout)
//
// IMPORTANTE SOBRE SEGURIDAD DE PAGOS:
// Este endpoint NUNCA recibe el número de tarjeta, CVV ni vencimiento.
// Para pago con tarjeta, el frontend usa el SDK de la pasarela de pago
// (ej. Recurrente/Stripe Elements) directamente en el navegador, y de
// ahí obtiene un "token" de un solo uso. Ese token es lo único que
// llega aquí — el número real de la tarjeta viaja solo entre el
// navegador del comprador y la pasarela de pago, nunca por nuestro
// servidor. Esto es lo que te mantiene fuera del alcance de PCI-DSS.
export async function crearTransaccion(req, res) {
  try {
    const { eventoId, correoComprador, cantidadTickets, metodoPago } = req.body;

    const evento = await prisma.evento.findUnique({ where: { id: eventoId } });
    if (!evento || !evento.activo) {
      return res.status(404).json({ error: "Evento no disponible" });
    }

    // El monto SIEMPRE se calcula en el servidor a partir del precio
    // real del evento — nunca se confía en un total que mande el
    // cliente, porque alguien podría manipularlo antes de enviarlo.
    const montoTotal = Number(evento.precio) * cantidadTickets;

    if (metodoPago === "TARJETA") {
      const { tokenPago } = req.body;
      if (!tokenPago) {
        return res.status(400).json({ error: "Falta el token de pago" });
      }

      // El cobro real ocurre aquí, server-to-server, usando el token
      // (nunca el número de tarjeta). Si la pasarela rechaza el pago,
      // no se crea ninguna transacción ni ticket.
      const resultado = await cobrarConToken({ tokenPago, montoTotal, correoComprador });
      if (!resultado.exitoso) {
        return res.status(402).json({ error: resultado.error || "Pago rechazado" });
      }

      const transaccion = await prisma.transaccion.create({
        data: {
          eventoId,
          correoComprador,
          cantidadTickets,
          montoTotal,
          metodoPago: "TARJETA",
          estado: "APROBADO",
          referenciaPagoApi: resultado.referencia,
        },
      });

      const codigo = crypto.randomBytes(8).toString("hex").toUpperCase();
      await prisma.ticket.create({ data: { codigo, transaccionId: transaccion.id } });

      await enviarTicket({
        correoDestino: correoComprador,
        evento,
        codigoTicket: codigo,
        cantidadTickets,
      });

      return res.status(201).json(transaccion);
    }

    // Depósito: la transacción queda PENDIENTE hasta que el admin la revise.
    if (!req.file) {
      return res.status(400).json({ error: "Debes subir la foto del comprobante" });
    }

    const transaccion = await prisma.transaccion.create({
      data: {
        eventoId,
        correoComprador,
        cantidadTickets,
        montoTotal,
        metodoPago: "DEPOSITO",
        estado: "PENDIENTE",
        comprobanteUrl: `/uploads/${req.file.filename}`,
      },
    });

    res.status(201).json(transaccion);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "No se pudo procesar la transacción" });
  }
}

// GET /api/transacciones  (solo admin)
export async function listarTransacciones(req, res) {
  try {
    const transacciones = await prisma.transaccion.findMany({
      include: { evento: true },
      orderBy: { creadoEn: "desc" },
    });
    res.json(transacciones);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "No se pudieron obtener las transacciones" });
  }
}

// PATCH /api/transacciones/:id/aprobar  (solo admin)
export async function aprobarTransaccion(req, res) {
  try {
    const { id } = req.params;

    const transaccion = await prisma.transaccion.update({
      where: { id },
      data: { estado: "APROBADO" },
      include: { evento: true },
    });

    // Generamos un código de ticket único y no adivinable.
    const codigo = crypto.randomBytes(8).toString("hex").toUpperCase();
    await prisma.ticket.create({
      data: { codigo, transaccionId: transaccion.id },
    });

    await enviarTicket({
      correoDestino: transaccion.correoComprador,
      evento: transaccion.evento,
      codigoTicket: codigo,
      cantidadTickets: transaccion.cantidadTickets,
    });

    res.json({ mensaje: "Transacción aprobada, ticket generado y enviado", codigo });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "No se pudo aprobar la transacción" });
  }
}

// PATCH /api/transacciones/:id/rechazar  (solo admin)
export async function rechazarTransaccion(req, res) {
  try {
    const { id } = req.params;
    const transaccion = await prisma.transaccion.update({
      where: { id },
      data: { estado: "RECHAZADO" },
    });
    res.json(transaccion);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "No se pudo rechazar la transacción" });
  }
}
