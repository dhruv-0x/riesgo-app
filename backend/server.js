require("dotenv").config();
const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const path = require("path");
const rateLimit = require("express-rate-limit");

const reportesRouter = require("./routes/reportes");
const authRouter = require("./routes/auth");
const adminRouter = require("./routes/admin");

const app = express();
const PORT = process.env.PORT || 3000;

// ── Seguridad ────────────────────────────────────────────────
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'", "fonts.googleapis.com"],
      scriptSrcAttr: ["'unsafe-inline'"],
      styleSrc: ["'self'", "'unsafe-inline'", "fonts.googleapis.com"],
      fontSrc: ["'self'", "fonts.gstatic.com"],
      imgSrc: ["'self'", "data:"],
    }
  }
}));

app.use(cors({
  origin: process.env.ALLOWED_ORIGIN || "*",
  methods: ["GET", "POST"],
  allowedHeaders: ["Content-Type", "Authorization"]
}));

app.use(express.json({ limit: "10kb" }));
app.use(express.urlencoded({ extended: true, limit: "10kb" }));

// ── Rate limiting ────────────────────────────────────────────
const formLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 10,
  message: { error: "Demasiados envíos. Intenta de nuevo en 15 minutos." }
});

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  message: { error: "Demasiados intentos. Intenta de nuevo en 15 minutos." }
});

// ── Archivos estáticos (frontend) ────────────────────────────
app.use(express.static(path.join(__dirname, "../frontend")));

// ── Rutas API ────────────────────────────────────────────────
app.use("/api/reportes", formLimiter, reportesRouter);
app.use("/api/auth", authLimiter, authRouter);
app.use("/api/admin", adminRouter);

// ── Descarga de Excel (testing) ──────────────────────────────
app.get("/download-excel", (req, res) => {
  try {
    const { readReportes } = require("./utils/storage");
    const { generateExcel } = require("./utils/excel");
    
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
    console.error("[excel error]", err);
    res.status(500).json({ error: "No se pudo generar el archivo Excel." });
  }
});

// ── Página admin ─────────────────────────────────────────────
app.get("/admin", (req, res) => {
  res.sendFile(path.join(__dirname, "../frontend/pages/admin.html"));
});

// ── SPA fallback ─────────────────────────────────────────────
app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "../frontend/index.html"));
});

// ── Error handler ────────────────────────────────────────────
app.use((err, req, res, next) => {
  console.error("[ERROR]", err.message);
  res.status(500).json({ error: "Error interno del servidor." });
});

app.listen(PORT, () => {
  console.log(`\n✅ Servidor corriendo en http://localhost:${PORT}`);
  console.log(`📋 Formulario: http://localhost:${PORT}`);
  console.log(`🔒 Panel admin: http://localhost:${PORT}/admin\n`);
});
