/* =========================================================
   TIENDA PÚBLICA (index.html)
 
   1. Ajustes y datos de ejemplo
   2. Plantillas: funciones que devuelven HTML
   3. Eventos de cada pantalla
   4. Navegación (según la URL: #hombre, #producto-12...)
   5. Carga de datos desde Supabase
   ========================================================= */
 
const app = document.getElementById("app");
const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
const behavior = reduce ? "auto" : "smooth";
 
 
/* ---------- 1. AJUSTES Y DATOS DE EJEMPLO ---------- */
 
let WA = "https://wa.me/573000000000"; /* se actualiza desde el panel de administrador */
const wa = t => WA + "?text=" + encodeURIComponent("Hola, quiero pedir: " + t);
 
/* Imágenes del inicio (hero, hombre, mujer, accesorios, esenciales, vendido); se cargan desde el panel */
let HOME = {};
const bg = k => HOME[k] ? ` style="background:url('${esc(HOME[k])}') center/cover"` : "";
 
/* Productos de la base de datos con todos sus datos, por id (para la página de detalle) */
const PROD = {};
 
/* Datos de ejemplo: solo se ven si Supabase no responde.
   Cada prenda es [nombre, precio, etiqueta, foto, id]. */
const NUEVO = {
  hombre: [["Camiseta oversize negra","$120.000","Nuevo"],["Chaqueta bomber","$290.000","Nuevo"],["Jean recto","$210.000",""],["Gorra clásica","$85.000","Nuevo"]],
  mujer: [["Body negro","$110.000","Nuevo"],["Vestido satinado","$230.000","Nuevo"],["Short de lino","$130.000",""],["Polo blanco","$105.000",""]]
};
 
const DATA = {
  mujer: { titulo: "Ropa de mujer", intro: "Cortes limpios para el día a día, el gimnasio y la noche.", cats: [
    { n: "Casual", d: "Prendas cómodas para todos los días.", p: ["Jean tiro alto","Camiseta oversize","Chaqueta de mezclilla","Falda midi"] },
    { n: "Deportiva", d: "Telas que se mueven contigo.", p: ["Top deportivo","Leggings de compresión","Chaqueta cortavientos","Sudadera con capucha"] },
    { n: "Para salir", d: "Piezas con caída y brillo suave.", p: ["Vestido satinado","Blusa de seda","Pantalón de pierna ancha","Falda satinada"] },
    { n: "Básicos", d: "La base de cualquier clóset.", p: ["Camiseta blanca","Body de algodón","Cárdigan tejido","Pantalón negro recto"] } ] },
  hombre: { titulo: "Ropa de hombre", intro: "Prendas versátiles con ajuste cuidado, del barrio a la oficina.", cats: [
    { n: "Casual", d: "Prendas cómodas para todos los días.", p: ["Jean recto","Camiseta estampada","Camisa de lino","Chaqueta bomber"] },
    { n: "Deportiva", d: "Telas que se mueven contigo.", p: ["Camiseta técnica","Jogger","Pantaloneta deportiva","Chaqueta cortavientos"] },
    { n: "Elegante", d: "Para reuniones, eventos y cenas.", p: ["Camisa blanca","Pantalón sastre","Blazer negro","Polo de punto"] },
    { n: "Básicos", d: "La base de cualquier clóset.", p: ["Camiseta básica negra","Camiseta básica blanca","Sudadera lisa","Pantalón recto negro"] } ] },
  accesorios: { titulo: "Accesorios", intro: "Los detalles que terminan el look.", cats: [
    { n: "Gorras", d: "Gorras y sombreros para todos los días.", p: ["Gorra clásica","Gorra de visera plana","Sombrero de pescador","Gorra de lana"] },
    { n: "Bolsos", d: "Para llevar lo esencial.", p: ["Morral urbano","Canguro cruzado","Bolso de mano","Bolso de hombro"] },
    { n: "Gafas", d: "Monturas simples, lentes oscuros.", p: ["Gafas de sol negras","Gafas redondas","Gafas rectangulares","Gafas deportivas"] },
    { n: "Cinturones y billeteras", d: "Cuero y herrajes sobrios.", p: ["Cinturón negro","Cinturón trenzado","Billetera de cuero","Tarjetero"] } ] }
};
 
 
/* ---------- 2. PLANTILLAS ---------- */
 
/* Tarjeta de producto. Las de la base de datos (con id) llevan a su página de detalle;
   las de ejemplo (sin id) piden directo por WhatsApp. */
const card = (n, i, price, badge, img, id) => {
  const foto = `<div class="ph g${i % 4}" ${img ? `style="background:url('${esc(img)}') center/cover"` : ""} role="img" aria-label="${esc(n)}">${badge ? `<span class="badge">${esc(badge)}</span>` : ""}</div>`;
  const info = `<h3>${esc(n)}</h3>${price ? `<p class="price">${price}</p>` : ""}`;
  return id
    ? `<article class="prod"><a class="pl" href="#producto-${id}">${foto}${info}</a><a class="buy" href="#producto-${id}">Ver detalle</a></article>`
    : `<article class="prod">${foto}${info}<a class="buy" href="${wa(n)}">Pedir por WhatsApp</a></article>`;
};
 
const vacio = `<p class="vacio">Pronto agregaremos prendas aquí.</p>`;
const prods = t => NUEVO[t].map((x, i) => card(x[0], i, x[1], x[2], x[3], x[4])).join("") || vacio;
 
function inicio() {
  return `
  <section class="hero"><div class="wrap">
    <div><h1>hilván</h1>
      <p>Nueva colección de ropa.</p>
      <a class="btn solid" href="#nuevo">Descubrir ahora</a></div>
    <div class="arch g2" aria-hidden="true"${bg("hero")}></div>
  </div></section>
 
  <section class="sec"><div class="wrap"><div class="tiles">
    <a class="tile" href="#hombre"><div class="arch g1" aria-hidden="true"${bg("hombre")}></div><h2>Hombre</h2><p>Explorar</p></a>
    <a class="tile" href="#accesorios"><div class="arch g3" aria-hidden="true"${bg("accesorios")}></div><h2>Accesorios</h2><p>Explorar</p></a>
    <a class="tile" href="#mujer"><div class="arch g0" aria-hidden="true"${bg("mujer")}></div><h2>Mujer</h2><p>Explorar</p></a>
  </div></div></section>
 
  <section class="sec" id="nuevo"><div class="wrap">
    <div class="sec-head"><h2>Prendas de edición limitada</h2>
      <div class="tabs" role="tablist">
        <button class="tab" role="tab" aria-selected="true" data-tab="hombre">Hombre</button>
        <button class="tab" role="tab" aria-selected="false" data-tab="mujer">Mujer</button>
      </div></div>
    <div class="prods" id="prods">${prods("hombre")}</div>
  </div></section>
 
  <section class="sec"><div class="wrap"><div class="edits">
    <a class="edit g2" href="#mujer"${bg("esenciales")}><h2>Esenciales de mujer</h2><span>Descubrir</span></a>
    <a class="edit g1" href="#hombre"${bg("vendido")}><h2>Lo más vendido en hombre</h2><span>Descubrir</span></a>
  </div></div></section>`;
}
 
function seccion(k) {
  const s = DATA[k];
  const chips = s.cats.map((c, i) => `<button class="chip" data-go="cat-${i}">${c.n}</button>`).join("");
  const cats = s.cats.map((c, i) => `
    <section class="cat" id="cat-${i}">
      <div class="cat-head"><h2>${c.n}</h2><p>${c.d}</p></div>
      <div class="prods">${c.p.map((x, j) => { x = [].concat(x); return card(x[0], i + j, x[1], x[2], x[3], x[4]); }).join("")}</div>
    </section>`).join("");
  return `<div class="wrap">
    <div class="page-head"><h1>${s.titulo}</h1><p>${s.intro}</p><div class="chips">${chips}</div></div>${cats || vacio}</div>`;
}
 
function detalle(p) {
  if (!p) return `<div class="wrap detalle"><p class="vacio">No encontramos esta prenda. <a href="#inicio">Volver al inicio</a></p></div>`;
 
  const miniaturas = p.imgs.length > 1
    ? `<div class="thumbs">${p.imgs.map((u, i) => `<button type="button" class="thumb" data-img="${esc(u)}" aria-label="Foto ${i + 1}" aria-pressed="${i === 0}" style="background:url('${esc(u)}') center/cover"></button>`).join("")}</div>`
    : "";
 
  const grupo = (titulo, valores, k) => valores.length
    ? `<div class="opts"><h4>${titulo}</h4><div class="optlist">${valores.map(v => `<button type="button" class="chip opt" data-k="${k}" data-v="${esc(v)}" aria-pressed="false">${esc(v)}</button>`).join("")}</div></div>`
    : "";
 
  return `<div class="wrap detalle">
    <a class="back" href="#${p.gender}">← ${esc(DATA[p.gender]?.titulo || "Volver")}</a>
    <div class="det">
      <div class="gal">
        <div class="gran ph g${p.id % 4}" id="gran" ${p.imgs[0] ? `style="background:url('${esc(p.imgs[0])}') center/cover"` : ""} role="img" aria-label="${esc(p.name)}">${p.badge ? `<span class="badge">${esc(p.badge)}</span>` : ""}</div>
        ${miniaturas}
      </div>
      <div class="info">
        <h1>${esc(p.name)}</h1>
        <p class="price">${money(p.price)}</p>
        ${p.desc ? `<p class="desc">${esc(p.desc)}</p>` : ""}
        ${grupo("Talla", p.sizes, "t")}${grupo("Color", p.colors, "c")}
        <a class="btn solid" id="pedir">Pedir por WhatsApp</a>
      </div>
    </div></div>`;
}
 
 
/* ---------- 3. EVENTOS ---------- */
 
/* Chips que bajan a una categoría y pestañas Hombre / Mujer del inicio */
function conectarBotones() {
  app.querySelectorAll("[data-go]").forEach(b => b.addEventListener("click", () => {
    document.getElementById(b.dataset.go).scrollIntoView({ behavior });
  }));
  app.querySelectorAll("[data-tab]").forEach(b => b.addEventListener("click", () => {
    app.querySelectorAll("[data-tab]").forEach(x => x.setAttribute("aria-selected", x === b));
    document.getElementById("prods").innerHTML = prods(b.dataset.tab);
  }));
}
 
/* Galería, selección de talla / color y botón de WhatsApp */
function conectarDetalle(p) {
  const sel = { t: "", c: "" }, btn = document.getElementById("pedir");
 
  const actualizar = () => {
    const falta = [];
    if (p.sizes.length && !sel.t) falta.push("talla");
    if (p.colors.length && !sel.c) falta.push("color");
    if (p.stock <= 0 || falta.length) {
      btn.textContent = p.stock <= 0 ? "Agotado" : "Elige " + falta.join(" y ");
      btn.setAttribute("aria-disabled", "true");
      btn.removeAttribute("href");
      return;
    }
    btn.removeAttribute("aria-disabled");
    btn.textContent = "Pedir por WhatsApp";
    btn.href = wa([p.name, sel.t && "talla " + sel.t, sel.c && "color " + sel.c].filter(Boolean).join(", "));
  };
 
  app.querySelectorAll(".opt").forEach(b => b.addEventListener("click", () => {
    const k = b.dataset.k;
    sel[k] = sel[k] === b.dataset.v ? "" : b.dataset.v; /* volver a tocar desmarca */
    app.querySelectorAll(`.opt[data-k="${k}"]`).forEach(x => x.setAttribute("aria-pressed", x === b && sel[k] !== ""));
    actualizar();
  }));
 
  app.querySelectorAll(".thumb").forEach(b => b.addEventListener("click", () => {
    document.getElementById("gran").style.background = `url('${b.dataset.img}') center/cover`;
    app.querySelectorAll(".thumb").forEach(x => x.setAttribute("aria-pressed", x === b));
  }));
 
  actualizar();
}
 
 
/* ---------- 4. NAVEGACIÓN ---------- */
 
/* Lee la URL y dice qué pantalla toca: "inicio", una sección o "producto" */
function ruta() {
  const k = location.hash.slice(1);
  if (k.startsWith("producto-")) {
    const id = k.slice(9);
    return { k, page: "producto", p: PROD[id] };
  }
  return { k, page: DATA[k] ? k : "inicio" };
}
 
function render() {
  const { k, page, p } = ruta();
 
  app.innerHTML = page === "inicio" ? inicio() : page === "producto" ? detalle(p) : seccion(page);
 
  document.title = (page === "inicio" ? "hilván — Ropa juvenil"
    : page === "producto" ? (p?.name || "Producto") + " — hilván"
    : DATA[page].titulo + " — hilván");
 
  /* resalta el enlace del menú de la pantalla actual */
  const actual = k === "nuevo" ? "nuevo" : page === "producto" ? (p?.gender || "") : page;
  document.querySelectorAll("nav a").forEach(a => {
    if (a.dataset.v === actual) a.setAttribute("aria-current", "page"); else a.removeAttribute("aria-current");
  });
 
  conectarBotones();
  if (p) conectarDetalle(p);
  if (k === "nuevo") document.getElementById("nuevo").scrollIntoView({ behavior }); else window.scrollTo(0, 0);
}
 
 
/* ---------- 5. DATOS DESDE SUPABASE ---------- */
 
/* Producto de la base de datos -> datos que usa la página de detalle */
const prodDe = r => ({
  id: r.id, name: r.name, price: r.price, gender: r.gender, stock: r.stock,
  badge: r.stock <= 0 ? "Agotado" : r.badge || "",
  desc: r.description || "", sizes: lista(r.sizes), colors: lista(r.colors), imgs: fotos(r)
});
 
/* Producto de la base de datos -> prenda de las tarjetas: [nombre, precio, etiqueta, foto, id] */
const row = r => [r.name, r.price ? money(r.price) : "", r.stock <= 0 ? "Agotado" : r.badge || "", fotos(r)[0] || "", r.id];
 
function aplicarAjustes(st) {
  document.querySelector(".promo").textContent = st.promo;
  HOME = st.home_images || {};
  document.querySelectorAll(".brand").forEach(b => b.textContent = st.brand);
  WA = "https://wa.me/" + st.whatsapp;
  document.querySelectorAll('a[href^="https://wa.me"]').forEach(a => a.href = WA);
  /* Sección "Confianza": si no hay textos guardados, queda la que trae index.html */
  if (Array.isArray(st.trust) && st.trust.length) {
    document.querySelector(".trust .wrap").innerHTML = st.trust.map(c => `<div><h3>${esc(c.t)}</h3><p>${esc(c.d)}</p></div>`).join("");
  }
}
 
function aplicarProductos(rows) {
  rows.forEach(r => PROD[r.id] = prodDe(r));
  NUEVO.hombre = rows.filter(r => r.featured && r.gender === "hombre").map(row);
  NUEVO.mujer = rows.filter(r => r.featured && r.gender === "mujer").map(row);
  for (const g in DATA) {
    const mine = rows.filter(r => r.gender === g);
    DATA[g].cats = [...new Set(mine.map(r => r.category))].map(n => ({ n, d: "", p: mine.filter(r => r.category === n).map(row) }));
  }
}
 
/* Si Supabase falla o no está configurado, se quedan los datos de ejemplo. */
async function cargar() {
  try {
    if (!CFG.url.includes("TU-PROYECTO")) {
      const get = p => fetch(CFG.url + "/rest/v1/" + p, { headers: { apikey: CFG.key } }).then(r => r.json());
      const [rows, st] = await Promise.all([get("products?active=eq.true&order=id.desc"), get("settings?id=eq.1")]);
      if (st[0]) aplicarAjustes(st[0]);
      if (Array.isArray(rows)) aplicarProductos(rows);
    }
  } catch (e) { /* se queda con los datos de ejemplo */ }
  render();
}
 
addEventListener("hashchange", render);
cargar();
 