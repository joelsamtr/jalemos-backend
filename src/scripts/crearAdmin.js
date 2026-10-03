// Script de un solo uso para crear el primer usuario administrador.
// Se corre desde la terminal, nunca se expone como endpoint HTTP,
// porque crear administradores nunca debe ser accesible por la red.
//
// Uso:
//   node src/scripts/crearAdmin.js correo@ejemplo.com "unaContraseñaSegura123"

import dotenv from "dotenv";
import prisma from "../config/prisma.js";
import { crearHashPassword } from "../controllers/auth.controller.js";

dotenv.config();

async function main() {
  const [, , correo, password] = process.argv;

  if (!correo || !password) {
    console.error('Uso: node src/scripts/crearAdmin.js correo@ejemplo.com "contraseña"');
    process.exit(1);
  }

  if (password.length < 8) {
    console.error("La contraseña debe tener al menos 8 caracteres.");
    process.exit(1);
  }

  const passwordHasheado = await crearHashPassword(password);

  const admin = await prisma.usuario.upsert({
    where: { correo },
    update: { password: passwordHasheado, rol: "ADMIN" },
    create: {
      nombre: "Administrador",
      correo,
      password: passwordHasheado,
      rol: "ADMIN",
    },
  });

  console.log(`Usuario administrador listo: ${admin.correo}`);
  process.exit(0);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
