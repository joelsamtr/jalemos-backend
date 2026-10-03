import prisma from "../config/prisma.js";

// POST /api/eventos  (solo admin)
export async function crearEvento(req, res) {
  try {
    const { titulo, descripcion, fecha, lugar, precio } = req.body;

    if (!titulo || !descripcion || !fecha || !lugar || !precio) {
      return res.status(400).json({ error: "Faltan campos obligatorios" });
    }

    const archivos = req.files || [];

    const evento = await prisma.evento.create({
      data: {
        titulo,
        descripcion,
        fecha: new Date(fecha),
        lugar,
        precio,
        fotos: {
          create: archivos.map((archivo) => ({
            url: `/uploads/${archivo.filename}`,
          })),
        },
      },
      include: { fotos: true },
    });

    res.status(201).json(evento);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "No se pudo crear el evento" });
  }
}

// GET /api/eventos  (público)
export async function listarEventos(req, res) {
  try {
    const eventos = await prisma.evento.findMany({
      where: { activo: true },
      include: { fotos: true },
      orderBy: { fecha: "asc" },
    });

    res.json(eventos);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "No se pudieron obtener los eventos" });
  }
}

// GET /api/eventos/:id  (público)
export async function obtenerEvento(req, res) {
  try {
    const { id } = req.params;

    const evento = await prisma.evento.findUnique({
      where: { id },
      include: { fotos: true },
    });

    if (!evento) {
      return res.status(404).json({ error: "Evento no encontrado" });
    }

    res.json(evento);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "No se pudo obtener el evento" });
  }
}
