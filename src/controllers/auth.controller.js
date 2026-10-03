import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import prisma from "../config/prisma.js";

// POST /api/auth/login
export async function login(req, res) {
  try {
    const { correo, password } = req.body;

    if (!correo || !password) {
      return res.status(400).json({ error: "Correo y contraseña son obligatorios" });
    }

    const usuario = await prisma.usuario.findUnique({ where: { correo } });

    // Importante: usamos el MISMO mensaje de error tanto si el correo no
    // existe como si la contraseña es incorrecta. Así no le confirmamos
    // a un atacante qué correos sí están registrados en el sistema.
    if (!usuario) {
      return res.status(401).json({ error: "Credenciales inválidas" });
    }

    const passwordValido = await bcrypt.compare(password, usuario.password);

    if (!passwordValido) {
      return res.status(401).json({ error: "Credenciales inválidas" });
    }

    const token = jwt.sign(
      { id: usuario.id, rol: usuario.rol },
      process.env.JWT_SECRET,
      { expiresIn: "8h" }
    );

    // Nunca devolver el hash de la contraseña en la respuesta.
    res.json({
      token,
      usuario: { id: usuario.id, nombre: usuario.nombre, rol: usuario.rol },
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "No se pudo iniciar sesión" });
  }
}

// Utilidad para crear el usuario admin inicial (se usa una sola vez,
// ver instrucciones en el README) — nunca se expone como endpoint público.
export async function crearHashPassword(passwordPlano) {
  const salt = await bcrypt.genSalt(12);
  return bcrypt.hash(passwordPlano, salt);
}
