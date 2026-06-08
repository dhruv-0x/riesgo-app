const express = require("express");
const router = express.Router();
const { validateReporte } = require("../middleware/validate");
const { appendReporte, countReportes, readReportes } = require("../utils/storage");
const { updateCentralExcelFile } = require("../utils/excel");
const { sendReporteEmail } = require("../utils/mailer");

// POST /api/reportes — recibe un nuevo reporte del formulario
router.post("/", validateReporte, async (req, res) => {
  try {
    const reporte = appendReporte(req.reporteValido);

    // Actualizar el archivo Excel centralizado con todos los reportes
    const todosLosReportes = readReportes();
    updateCentralExcelFile(todosLosReportes);

    // Leer el Excel actualizado para enviarlo por correo
    const fs = require("fs");
    const { EXCEL_FILE } = require("../utils/excel");
    const excelBuffer = fs.existsSync(EXCEL_FILE) ? fs.readFileSync(EXCEL_FILE) : null;

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
