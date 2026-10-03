import { PrismaClient } from "@prisma/client";

// Una sola instancia de Prisma reutilizada en toda la app,
// para no abrir una conexión nueva en cada request.
const prisma = new PrismaClient();

export default prisma;
