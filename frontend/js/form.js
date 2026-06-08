/**
 * form.js — Lógica del formulario de reporte de eventos de riesgo
 * @typedef {{ fechaEvento: string, gestion: string, proceso: string,
 *   procesoOtro?: string, descripcion: string, consecuencia: string,
 *   gravedad: number, accionInmediata: string }} ReportePayload
 */

"use strict";

/** @type {number|null} */
let selectedSeverity = null;

/** @type {string|null} */
let selectedAccion = null;

// ── DOM refs ────────────────────────────────────────────────
const form          = document.getElementById("riskForm");
const alertSuccess  = document.getElementById("alertSuccess");
const alertError    = document.getElementById("alertError");
const submitBtn     = document.getElementById("submitBtn");
const procesoSelect = document.getElementById("proceso");
const otherWrap     = document.getElementById("otherWrap");

// ── Severity selection ──────────────────────────────────────
/**
 * @param {number} val
 */
function selectSeverity(val) {
  selectedSeverity = val;
  document.querySelectorAll(".severity-item").forEach(el => {
    const isSelected = parseInt(el.getAttribute("data-val") || "0") === val;
    el.classList.toggle("selected", isSelected);
    el.setAttribute("aria-checked", isSelected ? "true" : "false");
  });
  document.getElementById("field-gravedad")?.classList.remove("has-error");
}
window.selectSeverity = selectSeverity;

// ── Radio selection ─────────────────────────────────────────
/**
 * @param {string} value
 * @param {HTMLElement} el
 */
function selectAccion(value, el) {
  selectedAccion = value;
  document.querySelectorAll("#accionGroup .radio-item").forEach(item => {
    item.classList.remove("selected");
  });
  el.classList.add("selected");
  document.getElementById("field-accion")?.classList.remove("has-error");
}
window.selectAccion = selectAccion;

// ── "Otras" area show/hide ──────────────────────────────────
procesoSelect?.addEventListener("change", () => {
  const isOther = procesoSelect.value === "Otras";
  otherWrap?.classList.toggle("visible", isOther);
  const otherInput = document.getElementById("procesoOtro");
  if (otherInput) {
    otherInput.required = isOther;
  }
});

// ── Validation ──────────────────────────────────────────────
/**
 * Valida el formulario y retorna un array de errores (vacío = válido).
 * @returns {{ fieldId: string, message: string }[]}
 */
function validate() {
  const errors = [];
  const fields = [
    { id: "field-fecha",        check: () => !!getVal("fecha"),                       msg: "La fecha del evento es obligatoria." },
    { id: "field-gestion",      check: () => !!getVal("gestion"),                     msg: "Selecciona la gestión." },
    { id: "field-proceso",      check: () => !!getVal("proceso"),                     msg: "Selecciona el proceso o área." },
    { id: "field-proceso",      check: () => getVal("proceso") !== "Otras" || !!getVal("procesoOtro")?.trim(), msg: "Especifica el área en 'Otras'." },
    { id: "field-descripcion",  check: () => (getVal("descripcion") || "").trim().length >= 10, msg: "La descripción debe tener al menos 10 caracteres." },
    { id: "field-consecuencia", check: () => (getVal("consecuencia") || "").trim().length >= 5,  msg: "La consecuencia debe tener al menos 5 caracteres." },
    { id: "field-gravedad",     check: () => selectedSeverity !== null,               msg: "Selecciona el nivel de gravedad." },
    { id: "field-accion",       check: () => selectedAccion !== null,                 msg: "Selecciona si se tomó acción." },
  ];

  // Reset errors
  fields.forEach(f => document.getElementById(f.id)?.classList.remove("has-error"));

  fields.forEach(f => {
    if (!f.check()) {
      errors.push({ fieldId: f.id, message: f.msg });
      document.getElementById(f.id)?.classList.add("has-error");
    }
  });

  return errors;
}

/**
 * @param {string} id
 * @returns {string}
 */
function getVal(id) {
  const el = document.getElementById(id);
  return el ? el.value : "";
}

// ── Form submit ─────────────────────────────────────────────
form?.addEventListener("submit", async (e) => {
  e.preventDefault();
  hideAlerts();

  const errors = validate();
  if (errors.length > 0) {
    showError(errors.map(e => e.message).join(" · "));
    const firstErrorField = document.getElementById(errors[0].fieldId);
    firstErrorField?.scrollIntoView({ behavior: "smooth", block: "center" });
    return;
  }

  const payload = {
    fechaEvento:     getVal("fecha"),
    gestion:         getVal("gestion"),
    proceso:         getVal("proceso"),
    procesoOtro:     getVal("procesoOtro"),
    descripcion:     getVal("descripcion").trim(),
    consecuencia:    getVal("consecuencia").trim(),
    gravedad:        selectedSeverity,
    accionInmediata: selectedAccion,
  };

  setLoading(true);

  try {
    const res = await fetch("/api/reportes", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    const data = await res.json();

    if (!res.ok) {
      throw new Error(data.error || "Error al registrar el evento.");
    }

    showSuccess(`Evento registrado correctamente. Se ha enviado automáticamente al equipo responsable.`);
    resetForm();

    // Scroll to top
    window.scrollTo({ top: 0, behavior: "smooth" });

  } catch (err) {
    showError(err instanceof Error ? err.message : "Error de conexión. Intenta de nuevo.");
  } finally {
    setLoading(false);
  }
});

// ── Helpers ─────────────────────────────────────────────────
function hideAlerts() {
  alertSuccess?.classList.remove("visible");
  alertError?.classList.remove("visible");
}

function showSuccess(msg) {
  if (!alertSuccess) return;
  alertSuccess.innerHTML = `<strong>✓ ¡Listo!</strong> ${msg}`;
  alertSuccess.classList.add("visible");
}

function showError(msg) {
  if (!alertError) return;
  alertError.textContent = msg;
  alertError.classList.add("visible");
}

function setLoading(loading) {
  if (!submitBtn) return;
  submitBtn.disabled = loading;
  submitBtn.innerHTML = loading
    ? `<span class="spinner"></span> Registrando…`
    : "Registrar evento";
}

function resetForm() {
  form?.reset();
  selectedSeverity = null;
  selectedAccion   = null;
  document.querySelectorAll(".severity-item").forEach(el => el.classList.remove("selected"));
  document.querySelectorAll(".radio-item").forEach(el => el.classList.remove("selected"));
  document.querySelectorAll(".has-error").forEach(el => el.classList.remove("has-error"));
  otherWrap?.classList.remove("visible");
}

