/**
 * admin.js — Lógica del panel de administración
 */
"use strict";

const TOKEN_KEY = "riesgo_admin_token";
const EMAIL_KEY = "riesgo_admin_email";

// ── State ────────────────────────────────────────────────────
let authToken   = sessionStorage.getItem(TOKEN_KEY) || null;
let adminEmail  = sessionStorage.getItem(EMAIL_KEY) || null;
let codeDigits  = ["", "", "", "", "", ""];

// ── On load ──────────────────────────────────────────────────
document.addEventListener("DOMContentLoaded", () => {
  if (authToken) {
    showDashboard();
  } else {
    showLoginStep(1);
  }
  setupCodeInputs();
});

// ── Auth flow ────────────────────────────────────────────────
function showLoginStep(step) {
  document.querySelectorAll(".step").forEach(el => el.classList.remove("active"));
  const el = document.getElementById(`step${step}`);
  if (el) el.classList.add("active");

  const loginPanel = document.getElementById("loginPanel");
  const dashPanel  = document.getElementById("dashPanel");
  if (loginPanel) loginPanel.style.display = "flex";
  if (dashPanel)  dashPanel.style.display  = "none";
}

async function requestCode() {
  const emailInput = /** @type {HTMLInputElement} */ (document.getElementById("adminEmail"));
  const email = emailInput?.value.trim();
  const errEl = document.getElementById("step1Error");

  if (!email || !email.includes("@")) {
    if (errEl) { errEl.textContent = "Ingresa un correo válido."; errEl.classList.add("visible"); }
    return;
  }
  errEl?.classList.remove("visible");

  const btn = /** @type {HTMLButtonElement} */ (document.getElementById("btnRequestCode"));
  btn.disabled = true;
  btn.innerHTML = `<span class="spinner"></span> Enviando…`;

  try {
    const res = await fetch("/api/auth/request", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
    });
    const data = await res.json();

    if (!res.ok) throw new Error(data.error || "Error al enviar el código.");

    adminEmail = email;
    sessionStorage.setItem(EMAIL_KEY, email);

    const targetEl = document.getElementById("codeTargetEmail");
    if (targetEl) targetEl.textContent = email;
    showLoginStep(2);

    // Auto-focus primer dígito
    setTimeout(() => document.querySelector(".code-digit")?.focus(), 100);

  } catch (err) {
    if (errEl) { errEl.textContent = err.message; errEl.classList.add("visible"); }
  } finally {
    btn.disabled = false;
    btn.innerHTML = "Continuar";
  }
}
window.requestCode = requestCode;

async function verifyCode() {
  const code = codeDigits.join("");
  const errEl = document.getElementById("step2Error");

  if (code.length < 6) {
    if (errEl) { errEl.textContent = "Ingresa el código completo de 6 dígitos."; errEl.classList.add("visible"); }
    return;
  }
  errEl?.classList.remove("visible");

  const btn = /** @type {HTMLButtonElement} */ (document.getElementById("btnVerifyCode"));
  btn.disabled = true;
  btn.innerHTML = `<span class="spinner"></span> Verificando…`;

  try {
    const res = await fetch("/api/auth/verify", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: adminEmail, code }),
    });
    const data = await res.json();

    if (!res.ok) throw new Error(data.error || "Código incorrecto.");

    authToken = data.token;
    sessionStorage.setItem(TOKEN_KEY, authToken);
    showDashboard();

  } catch (err) {
    if (errEl) { errEl.textContent = err.message; errEl.classList.add("visible"); }
    // Limpiar dígitos
    codeDigits = ["", "", "", "", "", ""];
    document.querySelectorAll(".code-digit").forEach(input => {
      /** @type {HTMLInputElement} */ (input).value = "";
    });
    document.querySelector(".code-digit")?.focus();
  } finally {
    btn.disabled = false;
    btn.innerHTML = "Acceder al panel";
  }
}
window.verifyCode = verifyCode;

function resendCode() {
  codeDigits = ["", "", "", "", "", ""];
  document.querySelectorAll(".code-digit").forEach(input => {
    /** @type {HTMLInputElement} */ (input).value = "";
  });
  showLoginStep(1);
}
window.resendCode = resendCode;

function logout() {
  authToken  = null;
  adminEmail = null;
  sessionStorage.removeItem(TOKEN_KEY);
  sessionStorage.removeItem(EMAIL_KEY);
  showLoginStep(1);
}
window.logout = logout;

// ── Code input setup ─────────────────────────────────────────
function setupCodeInputs() {
  const digits = document.querySelectorAll(".code-digit");
  digits.forEach((input, i) => {
    input.addEventListener("input", (e) => {
      const val = /** @type {HTMLInputElement} */ (e.target).value.replace(/\D/g, "").slice(-1);
      /** @type {HTMLInputElement} */ (e.target).value = val;
      codeDigits[i] = val;
      if (val && i < digits.length - 1) {
        /** @type {HTMLElement} */ (digits[i + 1]).focus();
      }
    });
    input.addEventListener("keydown", (e) => {
      if (e.key === "Backspace" && !/** @type {HTMLInputElement} */(e.target).value && i > 0) {
        codeDigits[i - 1] = "";
        /** @type {HTMLInputElement} */ (digits[i - 1]).value = "";
        /** @type {HTMLElement} */ (digits[i - 1]).focus();
      }
      if (e.key === "Enter") verifyCode();
    });
    input.addEventListener("paste", (e) => {
      e.preventDefault();
      const pasted = e.clipboardData?.getData("text").replace(/\D/g, "").slice(0, 6) || "";
      pasted.split("").forEach((ch, j) => {
        if (j < digits.length) {
          /** @type {HTMLInputElement} */ (digits[j]).value = ch;
          codeDigits[j] = ch;
        }
      });
      if (pasted.length >= 6) verifyCode();
    });
  });
}

// ── Dashboard ────────────────────────────────────────────────
async function showDashboard() {
  const loginPanel = document.getElementById("loginPanel");
  const dashPanel  = document.getElementById("dashPanel");
  if (loginPanel) loginPanel.style.display = "none";
  if (dashPanel)  dashPanel.style.display  = "block";

  const emailEl = document.getElementById("dashEmail");
  if (emailEl) emailEl.textContent = adminEmail || "";

  await loadStats();
}

async function loadStats() {
  const loadingEl = document.getElementById("statsLoading");
  const contentEl = document.getElementById("statsContent");
  if (loadingEl) loadingEl.style.display = "block";
  if (contentEl) contentEl.style.display = "none";

  try {
    const res = await fetch("/api/admin/stats", {
      headers: { Authorization: `Bearer ${authToken}` },
    });

    if (res.status === 401 || res.status === 403) {
      logout();
      return;
    }

    const data = await res.json();
    renderStats(data);
    if (loadingEl) loadingEl.style.display = "none";
    if (contentEl) contentEl.style.display = "block";

  } catch (err) {
    if (loadingEl) loadingEl.textContent = "Error al cargar estadísticas.";
    console.error(err);
  }
}

/**
 * @param {{ total: number, porGestion: Object, porGravedad: Object, porAccion: Object, reportes: any[] }} data
 */
function renderStats(data) {
  // Total
  const totalEl = document.getElementById("statTotal");
  if (totalEl) totalEl.textContent = data.total;

  // Críticos (gravedad 4-5)
  const critics = (data.porGravedad["4"] || 0) + (data.porGravedad["5"] || 0);
  const critEl = document.getElementById("statCriticos");
  if (critEl) critEl.textContent = critics;

  // Gestión con más eventos
  const maxGestion = Object.entries(data.porGestion || {}).sort((a, b) => b[1] - a[1])[0];
  const topGestionEl = document.getElementById("statTopGestion");
  if (topGestionEl) topGestionEl.textContent = maxGestion ? maxGestion[0] : "—";

  // Sin acción
  const sinAccion = data.porAccion?.["No"] || 0;
  const sinAccionEl = document.getElementById("statSinAccion");
  if (sinAccionEl) sinAccionEl.textContent = sinAccion;

  // Bars - gravedad
  const gravContainer = document.getElementById("gravBars");
  if (gravContainer) {
    const labels = { 1: "Insignificante", 2: "Menor", 3: "Moderado", 4: "Mayor", 5: "Catastrófico" };
    const colors = { 1: "#1a6b3c", 2: "#2980b9", 3: "#c8973a", 4: "#e67e22", 5: "#c0392b" };
    const max = Math.max(...Object.values(data.porGravedad || {}).map(Number), 1);
    gravContainer.innerHTML = Object.entries(data.porGravedad || {}).map(([k, v]) => `
      <div class="bar-row">
        <div class="bar-label">
          <span>${k} — ${labels[k]}</span>
          <strong>${v}</strong>
        </div>
        <div class="bar-track">
          <div class="bar-fill" style="width:${Math.round(Number(v)/max*100)}%;background:${colors[k]}"></div>
        </div>
      </div>
    `).join("");
  }

  // Bars - gestión
  const gestContainer = document.getElementById("gestBars");
  if (gestContainer) {
    const max = Math.max(...Object.values(data.porGestion || {}).map(Number), 1);
    gestContainer.innerHTML = Object.entries(data.porGestion || {}).map(([k, v]) => `
      <div class="bar-row">
        <div class="bar-label">
          <span>${k}</span>
          <strong>${v}</strong>
        </div>
        <div class="bar-track">
          <div class="bar-fill" style="width:${Math.round(Number(v)/max*100)}%"></div>
        </div>
      </div>
    `).join("");
  }

  // Recent list
  const recentEl = document.getElementById("recentList");
  if (recentEl) {
    const gravClass = { "1": "g1", "2": "g2", "3": "g3", "4": "g4", "5": "g5" };
    recentEl.innerHTML = data.reportes?.length
      ? data.reportes.slice(0, 8).map(r => {
          const gNum = r.gravedad?.charAt(0) || "1";
          return `
            <li class="recent-item">
              <div class="recent-item-top">
                <span class="recent-item-proc">${r.proceso || "—"}</span>
                <span class="grav-badge ${gravClass[gNum] || "g1"}">N${gNum}</span>
              </div>
              <div class="recent-item-date">${r.fechaEvento} · ${r.gestion}</div>
              <div class="recent-item-desc">${(r.descripcion || "").slice(0, 90)}${r.descripcion?.length > 90 ? "…" : ""}</div>
            </li>
          `;
        }).join("")
      : `<li class="recent-item" style="color:var(--text-hint);">No hay reportes aún.</li>`;
  }
}

async function exportExcel() {
  const btn = /** @type {HTMLButtonElement} */ (document.getElementById("btnExport"));
  btn.disabled = true;
  btn.textContent = "⏳ Generando archivo…";

  try {
    const res = await fetch("/api/admin/export", {
      headers: { Authorization: `Bearer ${authToken}` },
    });

    if (res.status === 401 || res.status === 403) { logout(); return; }
    if (!res.ok) { const d = await res.json(); throw new Error(d.error); }

    const blob = await res.blob();
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement("a");
    a.href     = url;
    a.download = `Reportes_Riesgo_${new Date().toISOString().slice(0,10)}.xlsx`;
    a.click();
    URL.revokeObjectURL(url);

  } catch (err) {
    alert("Error al exportar: " + (err instanceof Error ? err.message : "Error desconocido"));
  } finally {
    btn.disabled = false;
    btn.innerHTML = "⬇ Descargar Excel completo";
  }
}
window.exportExcel = exportExcel;
