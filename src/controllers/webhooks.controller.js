import { Webhook } from "svix";
import prisma from "../config/prisma.js";
import { generarYEnviarTicket } from "./transacciones.controller.js";

// POST /api/webhooks/recurrente
//
// Este es el ÚNICO lugar donde un pago con tarjeta pasa de PENDIENTE
// a APROBADO. Nunca confiamos en que el navegador del comprador nos
// diga "ya pagué" (eso cualquiera lo podría falsificar) — confiamos
// solo en esta notificación servidor-a-servidor, y encima verificamos
// su firma para confirmar que de verdad viene de Recurrente.
export async function recibirWebhookRecurrente(req, res) {
  try {
    const secreto = process.env.RECURRENTE_WEBHOOK_SECRET;
    if (!secreto) {
      console.error("Falta RECURRENTE_WEBHOOK_SECRET en el .env");
      return res.status(500).send("Webhook no configurado");
    }

    const webhook = new Webhook(secreto);

    // Importante: se verifica contra el body CRUDO (sin parsear),
    // por eso esta ruta usa express.raw() en vez de express.json()
    // (ver server.js). Si la firma no coincide, esto lanza un error
    // y rechazamos la petición — así evitamos que cualquiera mande
    // un POST falso fingiendo ser Recurrente.
    const evento = webhook.verify(req.body, {
      "svix-id": req.headers["svix-id"],
      "svix-timestamp": req.headers["svix-timestamp"],
      "svix-signature": req.headers["svix-signature"],
    });

    const tipoEvento = evento.type || evento.event_type;
    const checkout = evento.data?.checkout || evento.checkout || evento.object?.checkout;
    const transaccionId = checkout?.metadata?.transaccionId;

    if (!transaccionId) {
      // Evento que no trae nuestra referencia (puede ser de otro
      // producto en tu cuenta de Recurrente) — lo ignoramos sin error.
      return res.status(200).send("ok");
    }

    if (tipoEvento === "payment_intent.succeeded" || tipoEvento === "checkout.completed") {
      const transaccion = await prisma.transaccion.findUnique({
        where: { id: transaccionId },
        include: { evento: true },
      });

      // Idempotencia: si ya estaba aprobada (Recurrente puede reenviar
      // el mismo webhook más de una vez), no generamos un segundo ticket.
      if (transaccion && transaccion.estado !== "APROBADO") {
        const actualizada = await prisma.transaccion.update({
          where: { id: transaccionId },
          data: { estado: "APROBADO" },
          include: { evento: true },
        });
        await generarYEnviarTicket(actualizada, actualizada.evento);
      }
    }

    if (tipoEvento === "checkout.failed" || tipoEvento === "checkout.cancel") {
      await prisma.transaccion.updateMany({
        where: { id: transaccionId, estado: "PENDIENTE" },
        data: { estado: "RECHAZADO" },
      });
    }

    res.status(200).send("ok");
  } catch (error) {
    // Si la firma no es válida u ocurre cualquier error, respondemos
    // con error para que, si fue un problema temporal, Recurrente
    // reintente — pero nunca aprobamos nada sin verificación exitosa.
    console.error("Webhook de Recurrente rechazado:", error.message);
    res.status(400).send("Firma inválida");
  }
}
