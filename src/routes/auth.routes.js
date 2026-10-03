import { Router } from "express";
import rateLimit from "express-rate-limit";
import { login } from "../controllers/auth.controller.js";

const router = Router();

// Límite estricto en login: máximo 8 intentos cada 15 minutos por IP.
// Esto frena ataques de fuerza bruta contra contraseñas.
const limitadorLogin = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 8,
  message: { error: "Demasiados intentos. Intenta de nuevo en unos minutos." },
  standardHeaders: true,
  legacyHeaders: false,
});

router.post("/login", limitadorLogin, login);

export default router;
