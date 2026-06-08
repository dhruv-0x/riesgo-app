const express = require("express");
const router = express.Router();
const { validateReporte } = require("../middleware/validate");
const { appendReporte, countReportes } = require("../utils/storage");
const { generateExcel } = require("../utils/excel");
const { sendReporteEmail } = require("../utils/mailer");

// POST /api/reportes — recibe un nuevo reporte del formulario
router.post("/", validateReporte, async (req, res) => {
  try {
    const reporte = appendReporte(req.reporteValido);

    // Generar Excel con TODOS los reportes y enviar por correo
    const { readReportes } = require("../utils/storage");
    const todosLosReportes = readReportes();
    const excelBuffer = generateExcel(todosLosReportes);

    // Envío de correo en background (no bloquea la respuesta al usuario)
    sendReporteEmail(reporte, excelBuffer).catch(err => {
      console.error("[email error]", err.message);
    });

    res.status(201).json({
      ok: true,
      message: "Evento registrado correctamente.",
      total: todosLosReportes.length,
    });
  } catch (err) {
    console.error("[reporte error]", err);
    res.status(500).json({ error: "No se pudo registrar el evento." });
  }
});

// GET /api/reportes/count — total de reportes (público, solo el número)
router.get("/count", (req, res) => {
  try {
    res.json({ total: countReportes() });
  } catch {
    res.json({ total: 0 });
  }
});

module.exports = router;
