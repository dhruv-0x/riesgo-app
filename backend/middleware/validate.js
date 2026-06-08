const GESTIONES = [
  "Administrativa y Financiera",
  "Experiencia de la Comunidad",
  "Formación Integral",
  "Talento Humano",
];

const PROCESOS = [
  "Admisiones", "Atracción y selección", "Compras", "Comunicaciones",
  "Entornos protectores", "Egresados", "Académico",
  "Infraestructura física", "Infraestructura tecnológica",
  "Mercadeo", "Pastoral", "Psicología", "Psicopedagogía",
  "Formación y capacitación", "Otras",
];

const ACCIONES = ["Sí", "No", "En proceso"];

/**
 * Valida el body de un reporte entrante.
 * Añade req.reporteValido con los datos limpios si todo está bien.
 */
function validateReporte(req, res, next) {
  const {
    fechaEvento, gestion, proceso, procesoOtro,
    descripcion, consecuencia, gravedad, accionInmediata
  } = req.body;

  const errors = [];

  if (!fechaEvento || !/^\d{4}-\d{2}-\d{2}$/.test(fechaEvento)) {
    errors.push("Fecha del evento inválida.");
  }

  if (!GESTIONES.includes(gestion)) {
    errors.push("Gestión inválida.");
  }

  if (!PROCESOS.includes(proceso)) {
    errors.push("Proceso inválido.");
  }

  const procesoFinal = proceso === "Otras"
    ? (procesoOtro?.trim() ? `Otras: ${procesoOtro.trim()}` : null)
    : proceso;

  if (proceso === "Otras" && !procesoFinal) {
    errors.push("Debes especificar el área en 'Otras'.");
  }

  if (!descripcion || descripcion.trim().length < 10) {
    errors.push("La descripción debe tener al menos 10 caracteres.");
  }

  if (!consecuencia || consecuencia.trim().length < 5) {
    errors.push("La consecuencia debe tener al menos 5 caracteres.");
  }

  const gravNum = parseInt(gravedad);
  if (isNaN(gravNum) || gravNum < 1 || gravNum > 5) {
    errors.push("Nivel de gravedad inválido (debe ser 1-5).");
  }

  if (!ACCIONES.includes(accionInmediata)) {
    errors.push("Acción inmediata inválida.");
  }

  if (errors.length > 0) {
    return res.status(400).json({ error: errors.join(" ") });
  }

  const GRAV_LABELS = {
    1: "Insignificante", 2: "Menor", 3: "Moderado",
    4: "Mayor", 5: "Catastrófico"
  };

  req.reporteValido = {
    fechaRegistro: new Date().toLocaleString("es-CO", { timeZone: "America/Bogota" }),
    fechaEvento,
    gestion,
    proceso: procesoFinal,
    descripcion: descripcion.trim(),
    consecuencia: consecuencia.trim(),
    gravedad: gravNum,
    gravedadLabel: GRAV_LABELS[gravNum],
    accionInmediata,
  };

  next();
}

module.exports = { validateReporte };
