const fs = require("fs");
const path = require("path");

const DATA_DIR = path.join(__dirname, "../../data");
const DATA_FILE = path.join(DATA_DIR, "reportes.json");

/** Garantiza que el directorio y archivo de datos existan */
function ensureDataFile() {
  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
  if (!fs.existsSync(DATA_FILE)) fs.writeFileSync(DATA_FILE, JSON.stringify([], null, 2), "utf8");
}

/** Lee todos los reportes */
function readReportes() {
  ensureDataFile();
  const raw = fs.readFileSync(DATA_FILE, "utf8");
  return JSON.parse(raw);
}

/** Agrega un reporte y lo persiste */
function appendReporte(reporte) {
  const reportes = readReportes();
  reportes.push(reporte);
  fs.writeFileSync(DATA_FILE, JSON.stringify(reportes, null, 2), "utf8");
  return reporte;
}

/** Devuelve el número total de reportes */
function countReportes() {
  return readReportes().length;
}

module.exports = { readReportes, appendReporte, countReportes };
