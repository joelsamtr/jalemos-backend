import { Router } from "express";
import rateLimit from "express-rate-limit";
import { upload, verificarArchivos } from "../middlewares/upload.js";
import { requiereAutenticacion, requiereRol } from "../middlewares/auth.js";
import { validar, esquemaCrearTransaccion } from "../utils/validadores.js";
import {
  crearTransaccion,
  listarTransacciones,
  aprobarTransaccion,
  rechazarTransaccion,
} from "../controllers/transacciones.controller.js";

const router = Router();

// Límite razonable para evitar que un script cree cientos de
// transacciones falsas por segundo (ej. para saturar el panel admin).
const limitadorCompras = rateLimit({
  windowMs: 10 * 60 * 1000,
  max: 20,
  message: { error: "Demasiados intentos de compra. Espera unos minutos." },
});

// Público: lo usa el checkout. El comprobante (si es depósito) se sube
// como un solo archivo en el campo "comprobante".
router.post(
  "/",
  limitadorCompras,
  upload.single("comprobante"),
  verificarArchivos,
  validar(esquemaCrearTransaccion),
  crearTransaccion
);

// Solo admin:
router.get("/", requiereAutenticacion, requiereRol("ADMIN"), listarTransacciones);
router.patch("/:id/aprobar", requiereAutenticacion, requiereRol("ADMIN"), aprobarTransaccion);
router.patch("/:id/rechazar", requiereAutenticacion, requiereRol("ADMIN"), rechazarTransaccion);

export default router;
