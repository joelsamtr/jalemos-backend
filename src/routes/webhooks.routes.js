import { Router } from "express";
import { recibirWebhookRecurrente } from "../controllers/webhooks.controller.js";

const router = Router();

// Nota: el body crudo (sin parsear a JSON) se configura en server.js
// para esta ruta específica, porque la verificación de firma lo exige.
router.post("/recurrente", recibirWebhookRecurrente);

export default router;
