/* =========================================================
   Funciones compartidas por la tienda (index.js) y el panel (admin.js).
   Se carga antes que los dos, justo después de config.js.
   ========================================================= */

/* Evita que un texto escrito por el usuario rompa el HTML */
const esc = s => String(s ?? "").replace(/[&<>"']/g, c => "&#" + c.charCodeAt(0) + ";");

/* 120000 -> "$120.000" */
const money = n => "$" + Number(n || 0).toLocaleString("es-CO");

/* Fecha y hora cortas en español */
const fecha = d => new Date(d).toLocaleString("es-CO", { dateStyle: "short", timeStyle: "short" });

/* "S, M, L" -> ["S", "M", "L"] */
const lista = s => String(s || "").split(",").map(x => x.trim()).filter(Boolean);

/* Fotos de un producto. Si es uno viejo que solo tiene image_url, se usa esa. */
const fotos = p => p.images?.length ? p.images : p.image_url ? [p.image_url] : [];
