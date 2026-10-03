// Verifica que las variables de entorno críticas existan y sean
// razonablemente seguras ANTES de levantar el servidor. Si falta algo,
// preferimos que la app truene al iniciar y no que corra insegura.

export function validarEntorno() {
  const requeridas = ["DATABASE_URL", "JWT_SECRET"];
  const faltantes = requeridas.filter((clave) => !process.env[clave]);

  if (faltantes.length > 0) {
    throw new Error(
      `Faltan variables de entorno obligatorias: ${faltantes.join(", ")}. Revisa tu archivo .env`
    );
  }

  if (process.env.JWT_SECRET.length < 32) {
    throw new Error(
      "JWT_SECRET es demasiado corto (mínimo 32 caracteres). Genera uno nuevo con: openssl rand -hex 32"
    );
  }

  if (
    process.env.NODE_ENV === "production" &&
    process.env.JWT_SECRET.includes("cambia_esto")
  ) {
    throw new Error(
      "Estás usando el JWT_SECRET de ejemplo en producción. Genera uno nuevo y único."
    );
  }
}
