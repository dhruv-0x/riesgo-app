const express = require("express");
const router = express.Router();
const jwt = require("jsonwebtoken");
const nodemailer = require("nodemailer");

// Tokens temporales en memoria (válidos 15 minutos)
const pendingTokens = new Map();

function getAdminEmails() {
  return (process.env.ADMIN_EMAILS || "")
    .split(",")
    .map(e => e.trim().toLowerCase())
    .filter(Boolean);
}

function createTransporter() {
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST || "smtp.gmail.com",
    port: parseInt(process.env.SMTP_PORT || "587"),
    secure: false,
    auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
  });
}

// POST /api/auth/request — el admin solicita un código de acceso
router.post("/request", async (req, res) => {
  const { email } = req.body;
  if (!email) return res.status(400).json({ error: "Correo requerido." });

  const admins = getAdminEmails();
  const emailLower = email.toLowerCase().trim();

  // Siempre responder igual para no filtrar correos válidos
  if (!admins.includes(emailLower)) {
    return res.json({ ok: true, message: "Si tu correo está habilitado, recibirás el código." });
  }

  // Generar código de 6 dígitos
  const code = Math.floor(100000 + Math.random() * 900000).toString();
  const expiresAt = Date.now() + 15 * 60 * 1000; // 15 min
  pendingTokens.set(emailLower, { code, expiresAt, attempts: 0 });

  const schoolName = process.env.SCHOOL_NAME || "Institución Educativa";

  try {
    const transporter = createTransporter();
    await transporter.sendMail({
      from: `"${schoolName} — Riesgos" <${process.env.SMTP_USER}>`,
      to: email,
      subject: `Tu código de acceso al panel de riesgos — ${code}`,
      html: `
<!DOCTYPE html>
<html lang="es">
<body style="margin:0;padding:0;background:#f4f1eb;font-family:'Helvetica Neue',Arial,sans-serif;">
  <div style="max-width:480px;margin:32px auto;background:#fff;border-radius:12px;overflow:hidden;border:1px solid #ddd8cf;">
    <div style="background:#0f2340;padding:24px 32px;">
      <h2 style="color:#fff;margin:0;font-size:18px;font-weight:400;">${schoolName}</h2>
      <p style="color:rgba(255,255,255,0.5);margin:4px 0 0;font-size:12px;text-transform:uppercase;letter-spacing:0.1em;">Panel de Gestión de Riesgos</p>
    </div>
    <div style="padding:32px;">
      <p style="color:#1a1a1a;font-size:14px;margin:0 0 20px;">Ingresa el siguiente código para acceder al panel. Es válido por <strong>15 minutos</strong>.</p>
      <div style="text-align:center;background:#f7f5f0;border-radius:10px;padding:24px;margin:0 0 20px;">
        <span style="font-size:42px;font-weight:700;letter-spacing:0.15em;color:#0f2340;">${code}</span>
      </div>
      <p style="color:#9b9186;font-size:12px;margin:0;line-height:1.6;">Si no solicitaste este código, ignora este mensaje. Nadie más puede ver tus datos sin este código.</p>
    </div>
  </div>
</body>
</html>`,
    });
  } catch (err) {
    console.error("[auth email error]", err.message);
    return res.status(500).json({ error: "No se pudo enviar el código. Verifica la configuración SMTP." });
  }

  res.json({ ok: true, message: "Si tu correo está habilitado, recibirás el código." });
});

// POST /api/auth/verify — verifica código y entrega JWT
router.post("/verify", (req, res) => {
  const { email, code } = req.body;
  if (!email || !code) return res.status(400).json({ error: "Correo y código son requeridos." });

  const emailLower = email.toLowerCase().trim();
  const entry = pendingTokens.get(emailLower);

  if (!entry) {
    return res.status(401).json({ error: "Código no encontrado o ya utilizado." });
  }

  if (Date.now() > entry.expiresAt) {
    pendingTokens.delete(emailLower);
    return res.status(401).json({ error: "El código expiró. Solicita uno nuevo." });
  }

  entry.attempts++;
  if (entry.attempts > 5) {
    pendingTokens.delete(emailLower);
    return res.status(429).json({ error: "Demasiados intentos. Solicita un nuevo código." });
  }

  if (entry.code !== code.toString().trim()) {
    return res.status(401).json({ error: `Código incorrecto. Intento ${entry.attempts}/5.` });
  }

  // Código correcto — generar JWT (8 horas de validez)
  pendingTokens.delete(emailLower);
  const token = jwt.sign(
    { email: emailLower, role: "admin" },
    process.env.JWT_SECRET || "secret",
    { expiresIn: "8h" }
  );

  res.json({ ok: true, token, email: emailLower });
});

module.exports = router;
