import multer from "multer";
import path from "path";
import fs from "fs";
import { fileTypeFromFile } from "file-type";

// Guardamos primero en un directorio temporal. El archivo solo se
// mueve a /uploads (la carpeta pública) después de confirmar que su
// contenido real es una imagen — nunca confiamos en la extensión ni
// en el mimetype que reporta el navegador, ambos se pueden falsificar.
const TEMP_DIR = "uploads/tmp";
const DESTINO_FINAL = "uploads";

if (!fs.existsSync(TEMP_DIR)) fs.mkdirSync(TEMP_DIR, { recursive: true });

const TIPOS_PERMITIDOS = new Set(["jpg", "jpeg", "png", "webp"]);

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, TEMP_DIR),
  filename: (req, file, cb) => {
    const nombreUnico = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    cb(null, nombreUnico); // sin extensión todavía: se agrega tras verificar el contenido real
  },
});

function filtroImagenes(req, file, cb) {
  // Primer filtro rápido y barato (no es la protección real, solo evita
  // procesar de más). La verificación de verdad ocurre en verificarArchivos.
  if (file.mimetype.startsWith("image/")) {
    cb(null, true);
  } else {
    cb(new Error("Solo se permiten archivos de imagen"));
  }
}

export const upload = multer({
  storage,
  fileFilter: filtroImagenes,
  limits: { fileSize: 5 * 1024 * 1024, files: 6 }, // 5 MB por archivo, máx. 6 archivos
});

// Middleware a usar DESPUÉS de upload.array/single: revisa los bytes
// reales de cada archivo subido y solo entonces lo mueve a /uploads
// con una extensión confiable. Si algo no es una imagen de verdad,
// se borra y la petición se rechaza.
export async function verificarArchivos(req, res, next) {
  try {
    const archivos = req.files || (req.file ? [req.file] : []);

    for (const archivo of archivos) {
      const tipoReal = await fileTypeFromFile(archivo.path);

      if (!tipoReal || !TIPOS_PERMITIDOS.has(tipoReal.ext)) {
        fs.unlinkSync(archivo.path); // eliminamos el archivo sospechoso
        return res.status(400).json({
          error: `El archivo "${archivo.originalname}" no es una imagen válida`,
        });
      }

      const nombreFinal = `${path.basename(archivo.path)}.${tipoReal.ext}`;
      fs.renameSync(archivo.path, path.join(DESTINO_FINAL, nombreFinal));
      archivo.filename = nombreFinal; // el controlador usa este nombre para armar la URL
    }

    next();
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "No se pudieron procesar los archivos" });
  }
}
