/* =========================================================
   PANEL DE ADMINISTRACIÓN (admin.html)
 
   1. Estado
   2. Conexión con Supabase (base de datos y fotos)
   3. Acceso (entrar y salir)
   4. Carga de datos
   5. Pantallas
   6. Acciones (guardar, editar y borrar)
   ========================================================= */
 
const { url, key } = CFG;
const $ = s => document.querySelector(s), app = $("#app");
 
 
/* ---------- 1. ESTADO ---------- */
 
let tok = sessionStorage.getItem("t") || ""; /* sesión del administrador */
let tab = "resumen", edit = null;            /* pestaña abierta y producto en edición */
let P = [], S = [], ST = {};                 /* productos, ventas y ajustes */
 
const FILTRO_VACIO = { q: "", gender: "", category: "", estado: "" };
let filtro = { ...FILTRO_VACIO };            /* filtros de la tabla de productos */
 
const SECCIONES = ["hombre", "mujer", "accesorios"];
const ESTADOS = ["pagado", "pendiente", "cancelado"];
const MAX_FOTOS = 8;
const POCO_STOCK = 3; /* a partir de esta cantidad (o menos) se avisa "poco stock" */
 
/* Imágenes del inicio que se pueden cambiar desde Ajustes: [clave, nombre] */
const HOME_IMGS = [
  ["hero", "Portada (arco grande de arriba)"],
  ["hombre", "Hombre"],
  ["mujer", "Mujer"],
  ["accesorios", "Accesorios"],
  ["esenciales", "Esenciales de mujer"],
  ["vendido", "Lo más vendido en hombre"]
];
 
/* Textos de la sección "Confianza" que trae la tienda por defecto */
const CONFIANZA_BASE = [
  { t: "Envío a todo el país", d: "Entrega en 4 a 8 días hábiles." },
  { t: "30 días para cambios", d: "Compra con tranquilidad." },
  { t: "Pago seguro", d: "Pide por WhatsApp y te enviamos el enlace de pago." }
];
 
 
/* ---------- 2. CONEXIÓN CON SUPABASE ---------- */
 
/* Llamada a la base de datos (REST de Supabase) */
async function q(path, method = "GET", body) {
  const r = await fetch(url + "/rest/v1/" + path, {
    method, body: body && JSON.stringify(body),
    headers: { apikey: key, Authorization: "Bearer " + (tok || key), "Content-Type": "application/json" }
  });
  if (r.status === 401) { salir(); throw new Error("Sesión vencida. Entra de nuevo."); }
  const t = await r.text(), d = t ? JSON.parse(t) : null;
  if (!r.ok) throw new Error(d?.message || "Error " + r.status);
  return d;
}
 
/* Sube una foto a Supabase Storage y devuelve su URL pública */
async function subir(file) {
  if (!file.type.startsWith("image/")) throw new Error("El archivo debe ser una imagen.");
  if (file.size > 5 * 1024 * 1024) throw new Error("La foto " + file.name + " pesa más de 5 MB.");
  const ext = (file.name.split(".").pop() || "jpg").toLowerCase();
  const name = Date.now() + "-" + Math.random().toString(36).slice(2, 8) + "." + ext;
  const r = await fetch(url + "/storage/v1/object/productos/" + name, {
    method: "POST",
    headers: { apikey: key, Authorization: "Bearer " + tok, "Content-Type": file.type },
    body: file
  });
  if (r.status === 401) { salir(); throw new Error("Sesión vencida. Entra de nuevo."); }
  if (!r.ok) throw new Error((await r.json().catch(() => ({}))).message || "No se pudo subir la foto");
  return url + "/storage/v1/object/public/productos/" + name;
}
 
/* Ejecuta una acción, recarga los datos y muestra el error si falla */
const run = async f => { try { await f(); await cargar(); } catch (e) { alert(e.message); } };
 
 
/* ---------- 3. ACCESO ---------- */
 
function salir() { sessionStorage.removeItem("t"); tok = ""; login(); }
 
function login() {
  $("#top").innerHTML = `<a class="ver" href="index.html">Ver tienda</a>`;
  app.innerHTML = `<form class="login" id="lf"><h2>Entrar al panel</h2>
    <input name="email" type="email" placeholder="Correo" required autocomplete="username">
    <input name="password" type="password" placeholder="Contraseña" required autocomplete="current-password">
    <button class="pri">Entrar</button>
    <a class="ver" href="index.html">← Volver a la tienda</a></form>`;
  $("#lf").onsubmit = async e => {
    e.preventDefault();
    const f = e.target;
    const r = await fetch(url + "/auth/v1/token?grant_type=password", {
      method: "POST", headers: { apikey: key, "Content-Type": "application/json" },
      body: JSON.stringify({ email: f.email.value, password: f.password.value })
    });
    const d = await r.json();
    if (!r.ok) return alert(d.error_description || d.msg || "No se pudo entrar");
    tok = d.access_token; sessionStorage.setItem("t", tok); cargar();
  };
}
 
 
/* ---------- 4. CARGA DE DATOS ---------- */
 
async function cargar() {
  try {
    [P, S, ST] = await Promise.all([q("products?order=id.desc"), q("sales?order=created_at.desc"), q("settings?id=eq.1").then(r => r[0])]);
  } catch (e) { alert(e.message); return; }
  pintar();
}
 
 
/* ---------- 5. PANTALLAS ---------- */
 
/* Estado de un producto: oculto (no se ve en la tienda), agotado (se ve, sin stock) o visible */
const estadoDe = x => !x.active ? "oculto" : x.stock <= 0 ? "agotado" : "visible";
 
/* Productos que cumplen los filtros y el buscador */
function filtrar() {
  const t = filtro.q.trim().toLowerCase();
  return P.filter(x =>
    (!t || x.name.toLowerCase().includes(t) || String(x.category || "").toLowerCase().includes(t)) &&
    (!filtro.gender || x.gender === filtro.gender) &&
    (!filtro.category || x.category === filtro.category) &&
    (!filtro.estado || estadoDe(x) === filtro.estado));
}
 
/* Tabla de productos (se redibuja sola al filtrar, sin tocar el formulario) */
function tablaProductos() {
  const lista = filtrar();
  if (!lista.length) return `<p class="nota">${P.length ? "Ningún producto coincide con los filtros." : "Aún no hay productos."}</p>`;
  return `<p class="nota">Mostrando ${lista.length} de ${P.length} productos</p>
    <div class="w"><table><tr><th></th><th>Producto</th><th>Sección</th><th>Categoría</th><th>Precio</th><th>Stock</th><th></th></tr>
    ${lista.map(x => {
      const foto = fotos(x)[0], estado = estadoDe(x);
      return `<tr>
        <td>${foto ? `<img class="mini" src="${esc(foto)}" alt="">` : `<div class="mini vacia"></div>`}</td>
        <td>${esc(x.name)}${estado === "visible" ? "" : ` <span class="tag">${estado}</span>`}</td>
        <td>${x.gender}</td><td>${esc(x.category)}</td><td>${money(x.price)}</td><td>${x.stock}</td>
        <td><button data-a="edit" data-id="${x.id}">Editar</button> <button class="del" data-a="delp" data-id="${x.id}">Borrar</button></td></tr>`;
    }).join("")}</table></div>`;
}
 
const vistas = {
  resumen() {
    const pagado = S.filter(s => s.status === "pagado"), suma = a => a.reduce((t, s) => t + Number(s.total), 0);
    const n = new Date(), hoy = new Date(n.getFullYear(), n.getMonth(), n.getDate()), mes = new Date(n.getFullYear(), n.getMonth(), 1);
    const desde = d => suma(pagado.filter(s => new Date(s.created_at) >= d));
    const poco = P.filter(p => p.active && p.stock <= POCO_STOCK).sort((a, b) => a.stock - b.stock);
    const avisoStock = n => n <= 0 ? "Agotado" : n === 1 ? "Queda 1" : "Quedan " + n;
    return `<div class="kpis">
      <div class="kpi"><span>Ingresos de hoy</span><b>${money(desde(hoy))}</b></div>
      <div class="kpi"><span>Ingresos del mes</span><b>${money(desde(mes))}</b></div>
      <div class="kpi"><span>Ingresos totales</span><b>${money(suma(pagado))}</b></div>
      <div class="kpi"><span>Por cobrar</span><b>${money(suma(S.filter(s => s.status === "pendiente")))}</b></div>
      <div class="kpi"><span>Ventas pagadas</span><b>${pagado.length}</b></div></div>
      <h2>Poco stock</h2>
      ${poco.length ? `<p class="nota">${poco.length} ${poco.length === 1 ? "producto con" : "productos con"} ${POCO_STOCK} unidades o menos</p>
      <div class="stock-list">${poco.map(p => {
        const foto = fotos(p)[0];
        return `<div class="stock-row">
          ${foto ? `<img class="mini" src="${esc(foto)}" alt="">` : `<div class="mini vacia"></div>`}
          <div class="stock-info"><b>${esc(p.name)}</b><span>${p.gender} · ${esc(p.category)}</span></div>
          <span class="tag ${p.stock <= 0 ? "rojo" : ""}">${avisoStock(p.stock)}</span>
          <button data-a="reponer" data-id="${p.id}">Reponer</button></div>`;
      }).join("")}</div>`
      : `<div class="stock-ok">✓ Todo en orden: ningún producto con ${POCO_STOCK} unidades o menos.</div>`}`;
  },
 
  productos() {
    const p = edit ? P.find(x => x.id === edit) || {} : {};
    const imgs = fotos(p);
    const categorias = [...new Set(P.map(x => x.category).filter(Boolean))].sort();
    if (filtro.category && !categorias.includes(filtro.category)) filtro.category = ""; /* la categoría ya no existe */
    return `<h2>${edit ? "Editar producto" : "Nuevo producto"}</h2>
    <form class="f" id="pf">
      <label>Nombre<input name="name" required value="${esc(p.name)}"></label>
      <label>Sección<select name="gender">${SECCIONES.map(x => `<option ${p.gender === x ? "selected" : ""}>${x}</option>`).join("")}</select></label>
      <label>Categoría<input name="category" required placeholder="Casual, Deportiva…" value="${esc(p.category)}"></label>
      <label>Precio<input name="price" type="number" min="0" required value="${p.price ?? ""}"></label>
      <label>Stock<input name="stock" type="number" min="0" required value="${p.stock ?? 0}"></label>
      <label>Etiqueta<input name="badge" placeholder="Nuevo" value="${esc(p.badge)}"></label>
      <label>Tallas (separadas por coma)<input name="sizes" placeholder="S, M, L, XL" value="${esc(p.sizes)}"></label>
      <label>Colores (separados por coma)<input name="colors" placeholder="Negro, Blanco" value="${esc(p.colors)}"></label>
      <label class="wide">Descripción<textarea name="description" rows="3" placeholder="Material, ajuste, cuidados…">${esc(p.description)}</textarea></label>
      <label>Fotos (puedes elegir varias; la primera es la portada)<input name="photos" type="file" accept="image/*" multiple></label>
      ${imgs.length ? `<div class="thumbs">${imgs.map(u => `<label class="th"><img src="${esc(u)}" alt=""><span class="rm"><input type="checkbox" name="rm" value="${esc(u)}"> Quitar</span></label>`).join("")}</div>` : ""}
      <label class="c"><input name="featured" type="checkbox" ${p.featured ? "checked" : ""}>Destacado en el inicio</label>
      <label class="c"><input name="active" type="checkbox" ${(p.active ?? true) ? "checked" : ""}>Visible en la tienda</label>
      <button class="pri">Guardar</button>${edit ? `<button type="button" data-a="cancel">Cancelar</button>` : ""}
    </form>
    <h2>Productos</h2>
    <div class="filtros">
      <input type="search" data-f="q" placeholder="Buscar por nombre o categoría…" value="${esc(filtro.q)}">
      <select data-f="gender"><option value="">Todas las secciones</option>${SECCIONES.map(x => `<option ${filtro.gender === x ? "selected" : ""}>${x}</option>`).join("")}</select>
      <select data-f="category"><option value="">Todas las categorías</option>${categorias.map(x => `<option ${filtro.category === x ? "selected" : ""}>${esc(x)}</option>`).join("")}</select>
      <select data-f="estado"><option value="">Todos los estados</option>${[["visible", "Visibles"], ["oculto", "Ocultos"], ["agotado", "Agotados"]].map(([v, t]) => `<option value="${v}" ${filtro.estado === v ? "selected" : ""}>${t}</option>`).join("")}</select>
      <button type="button" data-a="limpiar">Limpiar</button>
    </div>
    <div id="tabla">${tablaProductos()}</div>`;
  },
 
  ventas() {
    return `<h2>Registrar venta</h2>
    <form class="f" id="sf">
      <label>Producto<select name="pid">${P.map(x => `<option value="${x.id}">${esc(x.name)} (${money(x.price)})</option>`).join("")}</select></label>
      <label>Cantidad<input name="qty" type="number" min="1" value="1" required></label>
      <label>Total (vacío = precio × cantidad)<input name="total" type="number" min="0"></label>
      <label>Estado<select name="status">${ESTADOS.map(x => `<option>${x}</option>`).join("")}</select></label>
      <label>Cliente<input name="customer"></label>
      <button class="pri">Registrar</button></form>
    <div class="w"><table><tr><th>Fecha</th><th>Producto</th><th>Cant.</th><th>Total</th><th>Estado</th><th>Cliente</th><th></th></tr>
    ${S.map(x => `<tr><td>${fecha(x.created_at)}</td><td>${esc(x.product_name)}</td><td>${x.qty}</td><td>${money(x.total)}</td>
      <td><select data-a="st" data-id="${x.id}">${ESTADOS.map(o => `<option ${o === x.status ? "selected" : ""}>${o}</option>`).join("")}</select></td>
      <td>${esc(x.customer)}</td><td><button class="del" data-a="dels" data-id="${x.id}">Borrar</button></td></tr>`).join("")}</table></div>`;
  },
 
  ajustes() {
    const conf = [0, 1, 2].map(i => ST.trust?.[i] || CONFIANZA_BASE[i]);
    return `<h2>Ajustes de la tienda</h2><form class="f" id="gf">
      <label>Nombre de la marca<input name="brand" required value="${esc(ST.brand)}"></label>
      <label>Aviso de arriba (barra dorada: envío, cambios…)<input name="promo" value="${esc(ST.promo)}"></label>
      <label>WhatsApp (57 + número)<input name="whatsapp" required value="${esc(ST.whatsapp)}"></label>
      <h3 class="sub">Sección "Confianza" (debajo de los productos)</h3>
      ${conf.map((c, i) => `<label>Título ${i + 1}<input name="tt${i}" value="${esc(c.t)}"></label>
      <label>Texto ${i + 1}<input name="td${i}" value="${esc(c.d)}"></label>`).join("")}
      <h3 class="sub">Imágenes del inicio</h3>
      ${HOME_IMGS.map(([k, n]) => {
        const u = ST.home_images?.[k];
        return `<div class="th">${u ? `<img src="${esc(u)}" alt="">` : ""}
        <label>${n}<input name="img_${k}" type="file" accept="image/*"></label>
        ${u ? `<label class="rm"><input type="checkbox" name="rm_${k}">Quitar imagen</label>` : ""}</div>`;
      }).join("")}
      <button class="pri">Guardar</button></form>`;
  }
};
 
function pintar() {
  $("#top").innerHTML = `<a class="ver" href="index.html" target="_blank" rel="noopener">Ver tienda ↗</a><button id="out">Salir</button>`;
  $("#out").onclick = salir;
  app.innerHTML = `<nav>${Object.keys(vistas).map(t => `<button class="${t === tab ? "on" : ""}" data-t="${t}">${t[0].toUpperCase() + t.slice(1)}</button>`).join("")}</nav><div>${vistas[tab]()}</div>`;
  app.querySelectorAll("[data-t]").forEach(b => b.onclick = () => { tab = b.dataset.t; edit = null; pintar(); });
}
 
 
/* ---------- 6. ACCIONES ---------- */
 
/* Formularios: cada uno recibe sus datos (d) y el FormData (fd) */
async function guardarProducto(d, fd) {
  const old = edit ? P.find(x => x.id === edit) : null;
  const quitar = fd.getAll("rm");
  const nuevas = fd.getAll("photos").filter(x => x.size);
  const images = (old ? fotos(old) : []).filter(u => !quitar.includes(u));
  if (images.length + nuevas.length > MAX_FOTOS) throw new Error("Máximo " + MAX_FOTOS + " fotos por producto.");
  for (const file of nuevas) images.push(await subir(file));
 
  const b = {
    name: d.name, gender: d.gender, category: d.category, price: +d.price, stock: +d.stock, badge: d.badge || null,
    sizes: d.sizes.trim() || null, colors: d.colors.trim() || null, description: d.description.trim() || null,
    images, image_url: images[0] || null, featured: !!d.featured, active: !!d.active
  };
  await (edit ? q("products?id=eq." + edit, "PATCH", b) : q("products", "POST", b));
  edit = null;
}
 
async function registrarVenta(d) {
  const p = P.find(x => x.id == d.pid), qty = +d.qty;
  if (!p) throw new Error("Primero crea un producto.");
  await q("sales", "POST", { product_id: p.id, product_name: p.name, qty, total: d.total === "" ? p.price * qty : +d.total, status: d.status, customer: d.customer || null });
  if (d.status !== "cancelado") await q("products?id=eq." + p.id, "PATCH", { stock: Math.max(0, p.stock - qty) });
}
 
async function guardarAjustes(d, fd) {
  const home_images = { ...(ST.home_images || {}) };
  for (const [k] of HOME_IMGS) {
    const f = fd.get("img_" + k);
    if (f && f.size) home_images[k] = await subir(f);
    else if (fd.get("rm_" + k)) delete home_images[k];
  }
  const trust = [0, 1, 2].map(i => ({ t: d["tt" + i].trim(), d: d["td" + i].trim() })).filter(c => c.t || c.d);
  return q("settings?id=eq.1", "PATCH", { brand: d.brand, promo: d.promo, whatsapp: d.whatsapp.replace(/\D/g, ""), trust: trust.length ? trust : null, home_images });
}
 
const formularios = { pf: guardarProducto, sf: registrarVenta, gf: guardarAjustes };
 
app.addEventListener("submit", e => {
  e.preventDefault();
  const guardar = formularios[e.target.id];
  if (!guardar) return;
  const fd = new FormData(e.target);
  run(() => guardar(Object.fromEntries(fd), fd));
});
 
/* Botones con data-a="..." */
const acciones = {
  edit: id => { edit = +id; pintar(); scrollTo(0, 0); },
  reponer: id => { tab = "productos"; edit = +id; pintar(); scrollTo(0, 0); }, /* desde el Resumen abre el producto para cambiar su stock */
  cancel: () => { edit = null; pintar(); },
  limpiar: () => {
    filtro = { ...FILTRO_VACIO };
    app.querySelectorAll("[data-f]").forEach(c => c.value = "");
    $("#tabla").innerHTML = tablaProductos();
  },
  delp: id => confirm("¿Borrar este producto?") && run(() => q("products?id=eq." + id, "DELETE")),
  dels: id => confirm("¿Borrar esta venta? Los ingresos bajarán.") && run(() => q("sales?id=eq." + id, "DELETE"))
};
 
app.addEventListener("click", e => {
  const b = e.target.closest("[data-a]");
  if (!b || b.tagName === "SELECT") return;
  acciones[b.dataset.a]?.(b.dataset.id);
});
 
/* Buscador y filtros: solo se redibuja la tabla, así no se pierde lo escrito en el formulario */
app.addEventListener("input", e => {
  const f = e.target.dataset.f;
  if (!f) return;
  filtro[f] = e.target.value;
  $("#tabla").innerHTML = tablaProductos();
});
 
/* Cambiar el estado de una venta desde la tabla */
app.addEventListener("change", e => {
  const s = e.target;
  if (s.dataset.a === "st") run(() => q("sales?id=eq." + s.dataset.id, "PATCH", { status: s.value }));
});
 
tok ? cargar() : login();
 