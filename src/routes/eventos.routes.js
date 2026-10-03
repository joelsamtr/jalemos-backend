import { Router } from "express";
import { upload, verificarArchivos } from "../middlewares/upload.js";
import { requiereAutenticacion, requiereRol } from "../middlewares/auth.js";
import { validar, esquemaCrearEvento } from "../utils/validadores.js";
import {
  crearEvento,
  listarEventos,
  obtenerEvento,
} from "../controllers/eventos.controller.js";

const router = Router();

// Crear evento: SOLO un admin autenticado puede hacerlo.
// Orden importa: primero subimos y verificamos los archivos,
// luego validamos el resto de los campos del formulario.
router.post(
  "/",
  requiereAutenticacion,
  requiereRol("ADMIN"),
  upload.array("fotos", 6),
  verificarArchivos,
  validar(esquemaCrearEvento),
  crearEvento
);

router.get("/", listarEventos);
router.get("/:id", obtenerEvento);

export default router;
