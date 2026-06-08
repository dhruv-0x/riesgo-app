const XLSX = require("xlsx");

const COLUMNS = [
  { key: "fechaRegistro",   header: "Fecha de registro",          width: 22 },
  { key: "fechaEvento",     header: "Fecha del evento",           width: 16 },
  { key: "gestion",         header: "Gestión",                    width: 28 },
  { key: "proceso",         header: "Proceso / Área",             width: 30 },
  { key: "descripcion",     header: "Descripción del evento",     width: 55 },
  { key: "consecuencia",    header: "Consecuencia concreta",      width: 45 },
  { key: "gravedad",        header: "Nivel de gravedad",          width: 22 },
  { key: "accionInmediata", header: "Acción inmediata tomada",    width: 22 },
];

/**
 * Genera un buffer de Excel a partir del array de reportes.
 * @param {Array} reportes
 * @returns {Buffer}
 */
function generateExcel(reportes) {
  const wb = XLSX.utils.book_new();

  // ── Hoja principal ────────────────────────────────────────
  const headers = COLUMNS.map(c => c.header);
  const rows = reportes.map(r => COLUMNS.map(c => r[c.key] ?? ""));

  const wsData = [headers, ...rows];
  const ws = XLSX.utils.aoa_to_sheet(wsData);

  ws["!cols"] = COLUMNS.map(c => ({ wch: c.width }));

  // Estilo de cabecera (color institucional navy)
  const navyHex = "0F2340";
  for (let i = 0; i < COLUMNS.length; i++) {
    const cellAddr = XLSX.utils.encode_cell({ r: 0, c: i });
    if (!ws[cellAddr]) continue;
    ws[cellAddr].s = {
      font: { bold: true, color: { rgb: "FFFFFF" }, sz: 11 },
      fill: { patternType: "solid", fgColor: { rgb: navyHex } },
      alignment: { horizontal: "center", vertical: "center", wrapText: true },
      border: {
        bottom: { style: "thin", color: { rgb: "C8973A" } }
      }
    };
  }

  // Estilo de filas de datos
  for (let r = 1; r <= rows.length; r++) {
    for (let c = 0; c < COLUMNS.length; c++) {
      const cellAddr = XLSX.utils.encode_cell({ r, c });
      if (!ws[cellAddr]) continue;
      ws[cellAddr].s = {
        alignment: { wrapText: true, vertical: "top" },
        fill: r % 2 === 0
          ? { patternType: "solid", fgColor: { rgb: "F7F5F0" } }
          : { patternType: "solid", fgColor: { rgb: "FFFFFF" } }
      };
    }
  }

  ws["!freeze"] = { xSplit: 0, ySplit: 1 }; // Fijar fila de cabecera

  XLSX.utils.book_append_sheet(wb, ws, "Reportes de Riesgo");

  // ── Hoja de resumen ───────────────────────────────────────
  const gravedadCounts = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
  const gestionCounts = {};
  reportes.forEach(r => {
    const grav = parseInt(r.gravedad);
    if (grav >= 1 && grav <= 5) gravedadCounts[grav]++;
    gestionCounts[r.gestion] = (gestionCounts[r.gestion] || 0) + 1;
  });

  const labels = {
    1: "Insignificante", 2: "Menor", 3: "Moderado",
    4: "Mayor", 5: "Catastrófico"
  };

  const summaryData = [
    ["RESUMEN DE REPORTES DE RIESGO"],
    [],
    ["Total de eventos registrados", reportes.length],
    [],
    ["Por nivel de gravedad", "Cantidad"],
    ...Object.entries(gravedadCounts).map(([k, v]) => [`${k} - ${labels[k]}`, v]),
    [],
    ["Por gestión", "Cantidad"],
    ...Object.entries(gestionCounts).map(([k, v]) => [k, v]),
    [],
    [`Generado el: ${new Date().toLocaleString("es-CO")}`]
  ];

  const wsSummary = XLSX.utils.aoa_to_sheet(summaryData);
  wsSummary["!cols"] = [{ wch: 36 }, { wch: 14 }];
  wsSummary["A1"].s = {
    font: { bold: true, sz: 14, color: { rgb: "0F2340" } }
  };

  XLSX.utils.book_append_sheet(wb, wsSummary, "Resumen");

  return XLSX.write(wb, { type: "buffer", bookType: "xlsx", cellStyles: true });
}

module.exports = { generateExcel };
