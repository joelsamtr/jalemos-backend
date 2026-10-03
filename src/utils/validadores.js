import { z } from "zod";

// Cualquier dato que entra por la red se valida contra un esquema
// ANTES de tocar la base de datos. Esto evita tipos inesperados,
// campos de más (mass assignment) y valores fuera de rango.

export const esquemaCrearEvento = z.object({
  titulo: z.string().trim().min(3).max(120),
  descripcion: z.string().trim().min(10).max(2000),
  fecha: z.coerce.date(),
  lugar: z.string().trim().min(3).max(150),
  precio: z.coerce.number().positive().max(100000),
});

export const esquemaLogin = z.object({
  correo: z.string().trim().email(),
  password: z.string().min(8).max(200),
});

export const esquemaCrearTransaccion = z.object({
  eventoId: z.string().uuid(),
  correoComprador: z.string().trim().email(),
  cantidadTickets: z.coerce.number().int().positive().max(20),
  metodoPago: z.enum(["TARJETA", "DEPOSITO"]),
});

// Middleware genérico: valida req.body contra el esquema recibido.
export function validar(esquema) {
  return (req, res, next) => {
    const resultado = esquema.safeParse(req.body);

    if (!resultado.success) {
      return res.status(400).json({
        error: "Datos inválidos",
        detalles: resultado.error.flatten().fieldErrors,
      });
    }

    req.body = resultado.data; // reemplazamos con los datos ya validados/limpios
    next();
  };
}
