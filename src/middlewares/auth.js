import jwt from "jsonwebtoken";

// Verifica que la petición traiga un token válido.
export function requiereAutenticacion(req, res, next) {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ error: "No se proporcionó un token de acceso" });
  }

  const token = authHeader.split(" ")[1];

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    req.usuario = payload; // { id, rol }
    next();
  } catch (error) {
    return res.status(401).json({ error: "Token inválido o expirado" });
  }
}

// Verifica que el usuario autenticado tenga uno de los roles permitidos.
// Uso: requiereRol("ADMIN")
export function requiereRol(...rolesPermitidos) {
  return (req, res, next) => {
    if (!req.usuario || !rolesPermitidos.includes(req.usuario.rol)) {
      return res.status(403).json({ error: "No tienes permiso para realizar esta acción" });
    }
    next();
  };
}
