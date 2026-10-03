import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import rateLimit from "express-rate-limit";
import dotenv from "dotenv";
import fs from "fs";

import { validarEntorno } from "./config/validarEntorno.js";
import eventosRoutes from "./routes/eventos.routes.js";
import authRoutes from "./routes/auth.routes.js";
import transaccionesRoutes from "./routes/transacciones.routes.js";
import { manejadorErrores, rutaNoEncontrada } from "./middlewares/errores.js";

dotenv.config();
validarEntorno(); // la app no arranca si faltan secretos o son inseguros

if (!fs.existsSync("uploads")) fs.mkdirSync("uploads");

const app = express();

// Cabeceras de seguridad HTTP (protege contra XSS, sniffing, clickjacking, etc.)
app.use(helmet());

// CORS restringido: solo el dominio del frontend puede llamar a esta API.
// En desarrollo, agrega tu URL de Vite (ej. http://localhost:5173).
const origenesPermitidos = (process.env.ORIGENES_PERMITIDOS || "http://localhost:5173").split(",");
app.use(
  cors({
    origin: origenesPermitidos,
    credentials: true,
  })
);

// Registro de peticiones (útil para auditoría; no registra cuerpos con datos sensibles).
app.use(morgan(process.env.NODE_ENV === "production" ? "combined" : "dev"));

app.use(express.json({ limit: "1mb" })); // limita el tamaño del body para evitar abuso

// Límite general de peticiones por IP (protección base contra abuso/DoS simple).
app.use(
  rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 300,
    standardHeaders: true,
    legacyHeaders: false,
  })
);

app.use("/uploads", express.static("uploads"));

app.use("/api/auth", authRoutes);
app.use("/api/eventos", eventosRoutes);
app.use("/api/transacciones", transaccionesRoutes);

app.get("/", (req, res) => {
  res.json({ mensaje: "API de jalemos.com funcionando correctamente" });
});

app.use(rutaNoEncontrada);
app.use(manejadorErrores);

const PORT = process.env.PORT || 4000;

app.listen(PORT, () => {
  console.log(`Servidor corriendo en http://localhost:${PORT}`);
});
