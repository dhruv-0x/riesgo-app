const jwt = require("jsonwebtoken");

/**
 * Middleware que valida el token JWT en el header Authorization.
 * Solo permite pasar a correos en ADMIN_EMAILS.
 */
function requireAdmin(req, res, next) {
  const authHeader = req.headers["authorization"];
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ error: "No autorizado." });
  }

  const token = authHeader.slice(7);
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || "secret");
    const adminEmails = (process.env.ADMIN_EMAILS || "")
      .split(",")
      .map(e => e.trim().toLowerCase());

    if (!adminEmails.includes(decoded.email?.toLowerCase())) {
      return res.status(403).json({ error: "Acceso denegado." });
    }

    req.admin = decoded;
    next();
  } catch (err) {
    return res.status(401).json({ error: "Token inválido o expirado." });
  }
}

module.exports = { requireAdmin };
