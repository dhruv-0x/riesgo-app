const nodemailer = require("nodemailer");

function createTransporter() {
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST || "smtp.gmail.com",
    port: parseInt(process.env.SMTP_PORT || "587"),
    secure: false,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });
}

const SEVERITY_LABELS = {
  "1": { label: "Insignificante", color: "#1a6b3c", bg: "#e8f5ee" },
  "2": { label: "Menor",          color: "#2980b9", bg: "#eaf4fb" },
  "3": { label: "Moderado",       color: "#c8973a", bg: "#fdf6e7" },
  "4": { label: "Mayor",          color: "#e67e22", bg: "#fef1e6" },
  "5": { label: "Catastrófico",   color: "#c0392b", bg: "#f9eded" },
};

/**
 * Envía el correo de notificación cuando se registra un nuevo evento.
 * @param {Object} reporte
 * @param {Buffer} excelBuffer
 */
async function sendReporteEmail(reporte, excelBuffer) {
  const transporter = createTransporter();
  const destEmail = process.env.DEST_EMAIL;
  const schoolName = process.env.SCHOOL_NAME || "Institución Educativa";

  const gravNum = reporte.gravedad?.toString().charAt(0) || "1";
  const gravInfo = SEVERITY_LABELS[gravNum] || SEVERITY_LABELS["1"];

  const html = `
<!DOCTYPE html>
<html lang="es">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f4f1eb;font-family:'Helvetica Neue',Arial,sans-serif;">
  <div style="max-width:620px;margin:32px auto;background:#ffffff;border-radius:12px;overflow:hidden;border:1px solid #ddd8cf;">

    <!-- Header -->
    <div style="background:#0f2340;padding:28px 32px 24px;">
      <p style="color:rgba(255,255,255,0.5);font-size:11px;letter-spacing:0.12em;text-transform:uppercase;margin:0 0 8px;">
        ${schoolName} · Gestión de Riesgos
      </p>
      <h1 style="color:#ffffff;font-size:22px;font-weight:400;margin:0;line-height:1.3;">
        Nuevo evento de riesgo registrado
      </h1>
    </div>

    <!-- Severity badge -->
    <div style="padding:20px 32px 0;">
      <span style="display:inline-block;background:${gravInfo.bg};color:${gravInfo.color};font-size:12px;font-weight:600;padding:6px 14px;border-radius:100px;border:1px solid ${gravInfo.color}30;">
        Nivel ${gravNum} — ${gravInfo.label}
      </span>
    </div>

    <!-- Data table -->
    <div style="padding:20px 32px 28px;">
      <table style="width:100%;border-collapse:collapse;">
        ${row("Fecha del evento", reporte.fechaEvento)}
        ${row("Fecha de registro", reporte.fechaRegistro)}
        ${row("Gestión", reporte.gestion)}
        ${row("Proceso / Área", reporte.proceso)}
        ${row("Descripción", reporte.descripcion, true)}
        ${row("Consecuencia concreta", reporte.consecuencia, true)}
        ${row("Gravedad", reporte.gravedad)}
        ${row("Acción inmediata", reporte.accionInmediata)}
      </table>
    </div>

    <!-- Footer -->
    <div style="background:#f7f5f0;border-top:1px solid #ddd8cf;padding:16px 32px;text-align:center;">
      <p style="font-size:11px;color:#9b9186;margin:0;line-height:1.6;">
        Este correo fue generado automáticamente por el sistema de gestión de riesgos.<br>
        El archivo Excel adjunto contiene este reporte junto con todos los anteriores.<br>
        No respondas a este mensaje.
      </p>
    </div>
  </div>
</body>
</html>
`;

  function row(label, value, wrap = false) {
    return `
      <tr>
        <td style="padding:10px 0;border-bottom:1px solid #f0ece4;font-size:12px;color:#6b6259;font-weight:500;width:36%;vertical-align:top;">${label}</td>
        <td style="padding:10px 0 10px 16px;border-bottom:1px solid #f0ece4;font-size:13px;color:#1a1a1a;${wrap ? "line-height:1.6;" : ""}">${value || "—"}</td>
      </tr>`;
  }

  const today = new Date().toISOString().slice(0, 10);

  await transporter.sendMail({
    from: `"${schoolName} — Riesgos" <${process.env.SMTP_USER}>`,
    to: destEmail,
    subject: `[Riesgo N${gravNum}] ${reporte.proceso} · ${reporte.fechaEvento}`,
    html,
    attachments: [
      {
        filename: `Reportes_Riesgo_${today}.xlsx`,
        content: excelBuffer,
        contentType: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      },
    ],
  });

  console.log(`[email] Reporte enviado a ${destEmail}`);
}

module.exports = { sendReporteEmail };
