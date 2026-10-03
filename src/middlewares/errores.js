// Manejador de errores centralizado. Va al final de todas las rutas.
// Nunca se envía el stack trace ni el mensaje interno al cliente en
// producción — eso podría revelar rutas de archivos, librerías usadas,
// o detalles que ayuden a un atacante.
export function manejadorErrores(err, req, res, next) {
  console.error(err);

  if (err.message === "Solo se permiten archivos de imagen") {
    return res.status(400).json({ error: err.message });
  }

  if (err.code === "LIMIT_FILE_SIZE") {
    return res.status(400).json({ error: "El archivo supera el tamaño máximo permitido (5 MB)" });
  }

  const esProduccion = process.env.NODE_ENV === "production";

  res.status(err.status || 500).json({
    error: esProduccion ? "Ocurrió un error inesperado" : err.message,
  });
}

// Para rutas que no existen.
export function rutaNoEncontrada(req, res) {
  res.status(404).json({ error: "Ruta no encontrada" });
}
