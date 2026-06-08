const express = require("express");
const router = express.Router();
const { requireAdmin } = require("../middleware/auth");
const { readReportes, countReportes } = require("../utils/storage");
const { generateExcel } = require("../utils/excel");

// GET /api/admin/stats — estadísticas para el dashboard admin
router.get("/stats", requireAdmin, (req, res) => {
  try {
    const reportes = readReportes();
    const total = reportes.length;

    const porGestion = {};
    const porGravedad = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    const porAccion = { "Sí": 0, "No": 0, "En proceso": 0 };
    const ultimos7 = {};

    const hoy = new Date();
    reportes.forEach(r => {
      // Por gestión
      porGestion[r.gestion] = (porGestion[r.gestion] || 0) + 1;

      // Por gravedad
      const grav = parseInt(r.gravedad);
      if (grav >= 1 && grav <= 5) porGravedad[grav]++;

      // Por acción
      if (porAccion[r.accionInmediata] !== undefined) porAccion[r.accionInmediata]++;

      // Últimos 7 días
      if (r.fechaEvento) {
        const diff = Math.floor((hoy - new Date(r.fechaEvento)) / 86400000);
        if (diff >= 0 && diff < 7) {
          ultimos7[r.fechaEvento] = (ultimos7[r.fechaEvento] || 0) + 1;
        }
      }
    });

    res.json({ total, porGestion, porGravedad, porAccion, ultimos7, reportes: reportes.slice(-10).reverse() });
  } catch (err) {
    res.status(500).json({ error: "Error al obtener estadísticas." });
  }
});

// GET /api/admin/export — descarga el Excel con todos los reportes
router.get("/export", requireAdmin, (req, res) => {
  try {
    const reportes = readReportes();
    if (reportes.length === 0) {
      return res.status(404).json({ error: "No hay reportes registrados aún." });
    }

    const buffer = generateExcel(reportes);
    const fecha = new Date().toISOString().slice(0, 10);
    const filename = `Reportes_Riesgo_${fecha}.xlsx`;

    res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
    res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
    res.setHeader("Content-Length", buffer.length);
    res.send(buffer);
  } catch (err) {
    console.error("[export error]", err);
    res.status(500).json({ error: "No se pudo generar el archivo Excel." });
  }
});

module.exports = router;
