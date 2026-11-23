// Площадка EasyMix в 3D: участок, два арочных цеха, АБК, дороги, забор
// и оборудование, где каждый из 14 узлов можно двигать и поворачивать отдельно.
// Метры. x — на восток от западной границы участка, z — на юг от северной, y — вверх.
(() => {
  const host = document.getElementById("plant3d");
  if (!host) return;
  if (!window.THREE || !THREE.OrbitControls || !window.EasyMixEquipment) {
    host.innerHTML = '<p class="no3d">3D-модель не загрузилась. Проверьте подключение к интернету и обновите страницу.</p>';
    return;
  }
  const T = THREE, EQ = window.EasyMixEquipment;
  const still = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const $ = (id) => document.getElementById(id);
  const fmt = (x, d = 1) => x.toLocaleString("ru-RU", { minimumFractionDigits: d, maximumFractionDigits: d });

  /* ---------- сцена ---------- */
  const renderer = new T.WebGLRenderer({ antialias: true, alpha: true });
  renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
  renderer.shadowMap.enabled = true; renderer.shadowMap.type = T.PCFSoftShadowMap;
  host.prepend(renderer.domElement);
  const scene = new T.Scene();
  const cam = new T.OrthographicCamera(-10, 10, 10, -10, 0.1, 1200);
  const V = (p, t, z) => ({ pos: new T.Vector3(...p), tgt: new T.Vector3(...t), zoom: z });
  const VIEWS = {
    home: V([150, 130, 210], [58, 0, 78], 1),
    b1: V([96, 48, 140], [53, 2, 100], 2.6),
    b2: V([110, 55, 92], [56, 3, 30], 1.9),
    abk: V([128, 34, 70], [86, 2, 24], 3.4),
  };
  cam.position.copy(VIEWS.b1.pos); cam.zoom = VIEWS.b1.zoom;
  const controls = new T.OrbitControls(cam, renderer.domElement);
  controls.target.copy(VIEWS.b1.tgt); controls.enableDamping = true; controls.dampingFactor = 0.08;
  controls.minPolarAngle = 0.15; controls.maxPolarAngle = 1.35; controls.minZoom = 0.6; controls.maxZoom = 12; controls.screenSpacePanning = true;
  scene.add(new T.HemisphereLight(0xffffff, 0x7a756c, 0.6));
  const sun = new T.DirectionalLight(0xffffff, 0.65); sun.position.set(170, 160, 170); sun.castShadow = true;
  sun.shadow.mapSize.set(2048, 2048); Object.assign(sun.shadow.camera, { left: -110, right: 110, top: 110, bottom: -110, near: 10, far: 500 }); sun.shadow.bias = -0.0004;
  scene.add(sun); sun.target.position.set(58, 0, 78); scene.add(sun.target);

  function palette() {
    return window.easymixDark && window.easymixDark()
      ? { ink: 0xa9aeb5, land: 0x1d1e1c, grass: 0x27331f, asph: 0x2c2d2f, soil: 0x3a3024, gravel: 0x4a463e, hangar: 0x55585d, tree: 0x3d5a32, trunk: 0x5a4a3a, fence: 0xb85450, panel: 0xd9dcdf, roof: 0x9aa1a8, glass: 0x2c4a5e, concrete: 0x6d6c68, accent: 0xff6a3d }
      : { ink: 0x3a3d42, land: 0xe9e9e3, grass: 0xc9d6b4, asph: 0xa3a4a5, soil: 0xd8c7a6, gravel: 0xd9d3c6, hangar: 0xf6f7f8, tree: 0x93b06f, trunk: 0x7a6650, fence: 0xd9534f, panel: 0xf7f8f9, roof: 0xc2c8ce, glass: 0x5f8fae, concrete: 0xbab8b2, accent: 0xd9411a };
  }
  let C = palette();
  const M = {}; for (const k of Object.keys(C)) if (k !== "ink" && k !== "accent") M[k] = new T.MeshLambertMaterial({ color: C[k] });
  M.glass.transparent = true; M.glass.opacity = 0.8;
  const inks = []; const ink = (a) => { const m = new T.LineBasicMaterial({ color: C.ink, transparent: true, opacity: a }); inks.push(m); return m; };
  const INK = ink(0.55), SOFT = ink(0.25);
  function box(w, h, d, m, x, y, z, { edges = true, soft = false, name = "", shadow = true } = {}) {
    const g = new T.BoxGeometry(w, h, d), o = new T.Mesh(g, m); o.position.set(x, y, z); o.castShadow = shadow; o.receiveShadow = true; o.userData.name = name;
    if (edges) o.add(new T.LineSegments(new T.EdgesGeometry(g), soft ? SOFT : INK)); scene.add(o); return o;
  }
  function flat(pts, m, y, name, h = 0.05, edges = false) {
    const s = new T.Shape(pts.map(([x, z]) => new T.Vector2(x, -z)));
    const g = new T.ExtrudeGeometry(s, { depth: h, bevelEnabled: false }); g.rotateX(-Math.PI / 2);
    const o = new T.Mesh(g, m); o.position.y = y; o.receiveShadow = true; o.userData.name = name;
    if (edges) o.add(new T.LineSegments(new T.EdgesGeometry(g), SOFT)); scene.add(o); return o;
  }
  const R = (x0, z0, x1, z1) => [[x0, z0], [x1, z0], [x1, z1], [x0, z1]];

  /* ---------- участок ---------- */
  flat(R(-40, -40, 160, 200), M.land, -0.2, "", 0.1);
  const PLOT = [[0, 0], [118, 0], [118, 115], [96.5, 115], [96.5, 155.5], [12.9, 155.5]];
  flat(PLOT, M.grass, -0.1, "Участок 1,77 га · Промзона 679/17", 0.1, true);
  [[[2.5, 0], [9, 0], [19.9, 131], [13.4, 131]], R(13, 130, 96.5, 150), R(90, 115, 96.5, 130), R(82.7, 88, 108, 115), R(92.7, 26, 100.7, 88), R(72.7, 26, 92.7, 38.8), R(19, 23, 32.7, 111)]
    .forEach((p) => flat(p, M.asph, 0, "Асфальт", 0.06));
  flat(R(32.7, 43, 92.7, 89), M.soil, 0, "Грунт между зданиями, пока без покрытия", 0.04);
  flat(R(11.7, 150.5, 91.7, 155), M.gravel, 0, "Открытый склад · 80 м", 0.08);
  flat(R(80.6, 18.2, 95.4, 26), M.gravel, 0, "Подсыпка под АБК", 0.2);
  for (let i = 0; i < PLOT.length; i++) {
    const [x0, z0] = PLOT[i], [x1, z1] = PLOT[(i + 1) % PLOT.length], L = Math.hypot(x1 - x0, z1 - z0), n = Math.round(L / 6);
    const g = new T.BufferGeometry().setFromPoints([new T.Vector3(x0, 1.8, z0), new T.Vector3(x1, 1.8, z1), new T.Vector3(x0, 0.9, z0), new T.Vector3(x1, 0.9, z1)]);
    const fl = new T.LineSegments(g, new T.LineBasicMaterial({ color: C.fence })); scene.add(fl);
    for (let j = 0; j <= n; j++) { const u = j / n; box(0.12, 1.8, 0.12, M.fence, x0 + (x1 - x0) * u, 0.9, z0 + (z1 - z0) * u, { edges: false, shadow: false, name: "Забор" }); }
  }
  box(3.4, 3, 3.4, M.panel, 2.9, 1.5, 2.9, { name: "КПП / въезд" });

  /* ---------- арочные цеха ---------- */
  const shellMat = new T.MeshLambertMaterial({ color: C.hangar, transparent: true, opacity: 0.2, depthWrite: false, side: T.DoubleSide });
  function hangar(x1, cz, span, H, name, len = 40) {
    const s = new T.Shape(); const r = span / 2; s.moveTo(-r, 0);
    for (let i = 0; i <= 40; i++) { const a = Math.PI * (1 - i / 40); s.lineTo(Math.cos(a) * r, Math.sin(a) * H); }
    const g = new T.ExtrudeGeometry(s, { depth: len, bevelEnabled: false, curveSegments: 40 });
    const o = new T.Mesh(g, shellMat); o.rotation.y = -Math.PI / 2; o.position.set(x1, 0, cz); o.userData.name = name; o.userData.shell = true;
    o.add(new T.LineSegments(new T.EdgesGeometry(g, 30), INK)); scene.add(o);
    for (let x = x1 - 6; x > x1 - len; x -= 6) {
      const pts = []; for (let i = 0; i <= 40; i++) { const a = Math.PI * (1 - i / 40); pts.push(new T.Vector3(x, Math.sin(a) * H + 0.02, cz + Math.cos(a) * r * 1.002)); }
      scene.add(new T.Line(new T.BufferGeometry().setFromPoints(pts), SOFT));
    }
    const gh = Math.min(4.5, H * 0.55);
    box(4.4, gh, 0.1, M.roof, x1 + 0.06, gh / 2, cz, { name: name + " · восточные ворота 4,4 × " + fmt(gh) + " м" }).rotation.y = Math.PI / 2;
    box(1, 2.1, 0.1, M.roof, x1 + 0.06, 1.05, cz + span / 2 - 2.2, { name: name + " · калитка" }).rotation.y = Math.PI / 2;
    box(4.4, gh, 0.1, M.roof, x1 - len - 0.06, gh / 2, cz, { name: name + " · западные ворота" }).rotation.y = Math.PI / 2;
    return o;
  }
  const shells = [hangar(72.7, 32.4, 16, 8, "Цех №2 · 16 × 40 м, H 8 м · 640 м²"), hangar(72.7, 100.5, 18, 10, "Цех №1 · 18 × 40 м, H 10 м · 720 м²")];
  const HALLS = [
    { name: "цех №1", x0: 32.9, x1: 72.5, z0: 91.7, z1: 109.3, cz: 100.5, half: 9, H: 10, west: 32.7, north: 91.5 },
    { name: "цех №2", x0: 32.9, x1: 72.5, z0: 24.6, z1: 40.2, cz: 32.4, half: 8, H: 8, west: 32.7, north: 24.4 },
  ];
  const hallAt = (z) => (Math.abs(z - HALLS[0].cz) < Math.abs(z - HALLS[1].cz) ? HALLS[0] : HALLS[1]);
  const archAt = (hall, z) => { const d = Math.abs(z - hall.cz) / hall.half; return d >= 1 ? 0 : hall.H * Math.sqrt(1 - d * d); };

  /* ---------- деревья и АБК ---------- */
  [[515, 175], [550, 197], [587, 175], [622, 203], [660, 175], [722, 186], [745, 170], [493, 205], [543, 300], [585, 300], [620, 300], [545, 400], [585, 398], [625, 400], [660, 395], [735, 325], [735, 370], [735, 410], [500, 500], [540, 505], [510, 523], [580, 525], [605, 497], [635, 525], [550, 530]]
    .map(([px, py]) => [(px - 410) / 3, (py - 150) / 2.95]).filter(([x, z]) => !(x > 30 && x < 96 && z > 42 && z < 90)).forEach(([x, z], i) => {
      const r = 2.2 + (i % 3) * 0.4;
      const t = new T.Mesh(new T.CylinderGeometry(0.18, 0.24, 3, 8), M.trunk); t.position.set(x, 1.5, z); t.castShadow = true; scene.add(t);
      const c = new T.Mesh(new T.IcosahedronGeometry(r, 1), M.tree); c.position.set(x, 3 + r * 0.8, z); c.castShadow = c.receiveShadow = true; c.userData.name = "Дерево";
      c.add(new T.LineSegments(new T.EdgesGeometry(c.geometry, 20), SOFT)); scene.add(c);
    });
  {
    const AN = "АБК · 12 × 5,5 м · 48 м²";
    box(12, 0.8, 2.5, M.roof, 88, 0.6, 23.75, { name: AN, soft: true }); box(6, 0.8, 3, M.roof, 85, 0.6, 21, { name: AN, soft: true });
    box(12, 2.9, 2.5, M.panel, 88, 2.45, 23.75, { name: AN }); box(6, 2.9, 3, M.panel, 85, 2.45, 21, { name: AN });
    box(12.4, 0.16, 2.95, M.roof, 88, 3.98, 23.8, { name: AN }); box(6.2, 0.16, 3.3, M.roof, 85, 3.98, 20.9, { name: AN });
    for (const x of [83.5, 85.8, 90.2, 92.5]) box(1.2, 1.2, 0.06, M.glass, x, 2.4, 25.03, { name: "Окно АБК", soft: true });
    box(1, 2.1, 0.06, M.roof, 88, 1.95, 25.03, { name: "Вход в АБК", soft: true });
    box(1.6, 0.9, 1.0, M.concrete, 88, 0.45, 25.5, { name: "Крыльцо", soft: true });
    box(2.2, 0.08, 1.2, M.roof, 88, 3.2, 25.6, { name: "Козырёк над входом", soft: true });
  }

  /* ---------- оборудование: 14 самостоятельных узлов ---------- */
  const E = EQ.build(T, { lineMat: SOFT });
  const COMPLEX = { dry: { title: "Сушильный комплекс", home: [43, 97, 0] }, mix: { title: "Смешивание и фасовка", home: [64, 106, Math.PI] } };
  const Y = new T.Vector3(0, 1, 0);
  const tmpB = new T.Box3();
  function partsBox(g) { // габарит без меток и без InstancedMesh (у него габарит считается неверно)
    g.updateMatrixWorld(true); const b = new T.Box3();
    g.traverse((o) => { if (o.isMesh && !o.isInstancedMesh && !o.userData.fp) { if (!o.geometry.boundingBox) o.geometry.computeBoundingBox(); tmpB.copy(o.geometry.boundingBox).applyMatrix4(o.matrixWorld); b.union(tmpB); } });
    return b;
  }
  const units = EQ.UNITS.map((meta) => {
    const g = E.U[meta.k];
    const b = partsBox(g), c = new T.Vector3((b.min.x + b.max.x) / 2, 0, (b.min.z + b.max.z) / 2);
    g.children.forEach((ch) => ch.position.sub(c));
    if (meta.k === "skip") E.off.copy(c);
    const fpMat = new T.MeshBasicMaterial({ color: C.accent, transparent: true, opacity: 0.15, depthWrite: false });
    const fp = new T.Mesh(new T.BoxGeometry(b.max.x - b.min.x + 0.4, 0.04, b.max.z - b.min.z + 0.4), fpMat);
    fp.position.y = 0.06; fp.userData.fp = true; fp.add(new T.LineSegments(new T.EdgesGeometry(fp.geometry), INK)); g.add(fp);
    const [px, pz, r] = COMPLEX[meta.c].home, wc = c.clone().applyAxisAngle(Y, r).add(new T.Vector3(px, 0, pz));
    const u = { ...meta, g, off: c, fp, fpMat, h: b.max.y, home: [+wc.x.toFixed(2), +wc.z.toFixed(2), r], parts: [] };
    g.traverse((o) => { o.userData.unit = u; if (o.isMesh && !o.isInstancedMesh && !o.userData.fp) { o.userData.name = `${meta.n}. ${meta.name} · ${meta.sub}`; u.parts.push(o); } });
    scene.add(g); return u;
  });
  const byK = Object.fromEntries(units.map((u) => [u.k, u]));

  // трассы между узлами: шнек песка — настоящий, остальные появляются, когда узлы разнесли
  const conns = EQ.CONNS.map((cn) => {
    const mat = new T.MeshLambertMaterial({ color: cn.screw ? 0x8b969d : 0xf0b44c });
    const m = new T.Mesh(new T.CylinderGeometry(cn.screw ? 0.15 : 0.07, cn.screw ? 0.15 : 0.07, 1, 14), mat); m.castShadow = true;
    if (cn.screw) m.add(new T.LineSegments(new T.EdgesGeometry(m.geometry, 30), SOFT));
    scene.add(m); return { ...cn, m, mat, A: byK[cn.a], B: byK[cn.b], L: 0, ang: 0, home: 0 };
  });
  const pA = new T.Vector3(), pB = new T.Vector3();
  function placeConn(cn) {
    pA.set(...cn.pa).sub(cn.A.off); cn.A.g.localToWorld(pA);
    pB.set(...cn.pb).sub(cn.B.off); cn.B.g.localToWorld(pB);
    const v = pB.clone().sub(pA), L = v.length(); cn.L = L; cn.ang = Math.atan2(v.y, Math.hypot(v.x, v.z)) * 180 / Math.PI;
    cn.m.position.copy(pA).addScaledVector(v, 0.5); cn.m.scale.set(1, Math.max(L, 0.01), 1);
    if (L > 1e-4) cn.m.quaternion.setFromUnitVectors(Y, v.normalize());
    cn.gap = Math.max(0, L - cn.home);
    cn.m.visible = cn.screw || cn.gap > 0.3;
    cn.bad = cn.screw ? L > 12 || Math.abs(cn.ang) > 45 : cn.gap > 0.5;
    cn.mat.color.setHex(cn.screw ? (cn.bad ? 0xd9534f : 0x8b969d) : cn.gas ? 0xd9534f : 0xf0b44c);
    cn.m.userData.name = cn.screw ? `9. Шнек сухого песка · ≈ ${fmt(L)} м · ${Math.round(cn.ang)}°` : `${cn.name}: разрыв ${fmt(cn.gap)} м — нужен ${cn.gas ? "газоход" : "транспорт"}`;
  }

  /* ---------- расстановка ---------- */
  const apply = (u, [x, z, r]) => { u.g.position.set(x, 0, z); u.g.rotation.y = r; u.g.updateMatrixWorld(true); };
  units.forEach((u) => apply(u, u.home));
  conns.forEach((cn) => { placeConn(cn); cn.home = cn.L; });
  const fpBox = (u) => { u.g.updateMatrixWorld(true); return new T.Box3().setFromObject(u.fp); };
  const homeOverlap = new Set(); // пары, которые и в исходной расстановке стоят вплотную — их не считаем столкновением
  const overlaps = (a, b, s = 0) => a.min.x + s < b.max.x && a.max.x - s > b.min.x && a.min.z + s < b.max.z && a.max.z - s > b.min.z;
  { const bx = units.map(fpBox); units.forEach((a, i) => units.forEach((b, j) => { if (j > i && overlaps(bx[i], bx[j], 0.25)) homeOverlap.add(a.k + b.k); })); }

  let layout = null;
  try {
    const m = location.hash.match(/layout=([^&]+)/);
    if (m) layout = JSON.parse(decodeURIComponent(escape(atob(decodeURIComponent(m[1])))));
  } catch (e) { layout = null; }
  if (!layout) try { layout = JSON.parse(localStorage.getItem("easymix-layout-v2") || "null"); } catch (e) {}
  if (layout) units.forEach((u) => { const v = layout[u.k]; if (Array.isArray(v) && v.length === 3 && v.every(Number.isFinite)) apply(u, v); });

  function clampSet(set) {
    const b = new T.Box3(); set.forEach((u) => b.union(fpBox(u)));
    const hall = hallAt((b.min.z + b.max.z) / 2); let dx = 0, dz = 0;
    if (b.max.x - b.min.x > hall.x1 - hall.x0) dx = (hall.x0 + hall.x1) / 2 - (b.min.x + b.max.x) / 2; else if (b.min.x < hall.x0) dx = hall.x0 - b.min.x; else if (b.max.x > hall.x1) dx = hall.x1 - b.max.x;
    if (b.max.z - b.min.z > hall.z1 - hall.z0) dz = hall.cz - (b.min.z + b.max.z) / 2; else if (b.min.z < hall.z0) dz = hall.z0 - b.min.z; else if (b.max.z > hall.z1) dz = hall.z1 - b.max.z;
    if (dx || dz) set.forEach((u) => { u.g.position.x += dx; u.g.position.z += dz; u.g.updateMatrixWorld(true); });
  }
  units.forEach((u) => clampSet([u]));
  function save() {
    const o = {}; units.forEach((u) => (o[u.k] = [+u.g.position.x.toFixed(2), +u.g.position.z.toFixed(2), +u.g.rotation.y.toFixed(4)]));
    try { localStorage.setItem("easymix-layout-v2", JSON.stringify(o)); } catch (e) {}
    if (location.hash.includes("layout=")) history.replaceState(null, "", location.pathname);
    return o;
  }

  /* ---------- выбор и проверка ---------- */
  let sel = byK.drum, mode = "unit";
  const movingSet = () => (mode === "unit" ? [sel] : units.filter((u) => u.c === sel.c));
  const isMoved = (u) => Math.hypot(u.g.position.x - u.home[0], u.g.position.z - u.home[2 - 1]) > 0.05 || Math.abs(((u.g.rotation.y - u.home[2]) % (2 * Math.PI) + 2 * Math.PI) % (2 * Math.PI)) > 0.01;
  const deg = (r) => Math.round(((r * 180) / Math.PI % 360 + 360) % 360);
  const status = $("lay-status"), connBody = $("conn-body"), unitList = $("unit-list");

  // список узлов
  if (unitList) {
    unitList.innerHTML = ["dry", "mix"].map((c) => `<div class="grp">${COMPLEX[c].title}</div>` + units.filter((u) => u.c === c)
      .map((u) => `<button type="button" data-unit="${u.k}" aria-pressed="false"><i>${u.n}</i><span>${u.name}</span><em data-moved="${u.k}"></em></button>`).join("")).join("");
    unitList.addEventListener("click", (e) => { const b = e.target.closest("[data-unit]"); if (b) { sel = byK[b.dataset.unit]; check(); } });
  }
  const selTag = document.createElement("div"); selTag.className = "tag"; host.appendChild(selTag);

  function check() {
    units.forEach((u) => u.g.updateMatrixWorld(true));
    conns.forEach(placeConn);
    const msgs = [], boxes = units.map(fpBox);
    units.forEach((u) => { u.archHit = false; u.hit = false; });
    // арка: каждая деталь проверяется по высоте арки над её краем
    const tb = new T.Box3();
    for (const u of units) {
      const hall = hallAt(u.g.position.z);
      for (const p of u.parts) { tb.copy(p.geometry.boundingBox).applyMatrix4(p.matrixWorld); const zz = Math.abs(tb.min.z - hall.cz) > Math.abs(tb.max.z - hall.cz) ? tb.min.z : tb.max.z; if (tb.max.y > archAt(hall, zz) - 0.3) { u.archHit = true; break; } }
      if (u.archHit) msgs.push(`«${u.name}» упирается в арку — ближе к середине цеха`);
    }
    // столкновения
    units.forEach((a, i) => units.forEach((b, j) => { if (j > i && !homeOverlap.has(a.k + b.k) && overlaps(boxes[i], boxes[j], 0.25)) { a.hit = b.hit = true; msgs.push(`«${a.name}» наезжает на «${b.name}»`); } }));
    const moving = new Set(movingSet());
    units.forEach((u) => {
      const bad = u.archHit || u.hit;
      u.fpMat.color.setHex(bad ? 0xd9534f : C.accent); u.fpMat.opacity = moving.has(u) ? 0.45 : bad ? 0.35 : 0.1;
      const em = unitList && unitList.querySelector(`[data-moved="${u.k}"]`);
      if (em) { em.textContent = bad ? "⚠" : isMoved(u) ? "сдвинут" : ""; em.className = isMoved(u) || bad ? "moved" : ""; }
    });
    unitList && unitList.querySelectorAll("[data-unit]").forEach((b) => b.setAttribute("aria-pressed", String(moving.has(byK[b.dataset.unit]))));
    const scr = conns.find((c) => c.screw);
    if (scr.L > 12) msgs.push(`шнек сухого песка длиннее 12 м (${fmt(scr.L)} м)`);
    if (Math.abs(scr.ang) > 45) msgs.push(`шнек круче 45° (${Math.round(scr.ang)}°)`);
    const gaps = conns.filter((c) => !c.screw && c.bad);
    if (gaps.length) msgs.push(`разрывов по потоку: ${gaps.length} — см. таблицу трасс`);
    const b = fpBox(sel), hall = hallAt(sel.g.position.z);
    const who = mode === "unit" ? `<b>${sel.n}. ${sel.name}</b>` : `<b>${COMPLEX[sel.c].title}</b> (узел ${sel.n} — ${sel.name.toLowerCase()})`;
    if (status) status.innerHTML = `${who} · ${hall.name}: от западного торца ${fmt(b.min.x - hall.west)} м, от северной стены ${fmt(b.min.z - hall.north)} м, поворот ${deg(sel.g.rotation.y)}°<br>Шнек сухого песка ≈ ${fmt(scr.L)} м под ${Math.round(scr.ang)}°` +
      (msgs.length ? `<br><span class="bad">⚠ ${msgs.slice(0, 4).join("; ")}${msgs.length > 4 ? ` и ещё ${msgs.length - 4}` : ""}</span>` : ' · <span class="ok">всё помещается</span>');
    if (connBody) connBody.innerHTML = conns.map((c) => {
      const val = c.screw ? `${fmt(c.L)} м · ${Math.round(c.ang)}°` : c.gap > 0.05 ? `+${fmt(c.gap)} м` : "вплотную";
      const fl = c.screw ? (c.bad ? '<span class="flag f-r">проверить</span>' : '<span class="flag f-ok">норма</span>') : c.bad ? `<span class="flag f-r">нужен ${c.gas ? "газоход" : "транспорт"}</span>` : c.gap > 0.05 ? '<span class="flag f-w">зазор</span>' : '<span class="flag f-ok">норма</span>';
      return `<tr><td>${c.name}</td><td class="r">${val}</td><td>${fl}</td></tr>`;
    }).join("");
    selTag.innerHTML = `<i>${sel.n}</i>${sel.name}<small>${mode === "unit" ? "тяните, чтобы передвинуть" : COMPLEX[sel.c].title + " целиком"}</small>`;
    document.querySelectorAll("[data-mode]").forEach((x) => x.setAttribute("aria-pressed", String(x.dataset.mode === mode)));
  }

  function moveSet(dx, dz) { const set = movingSet(); set.forEach((u) => { u.g.position.x += dx; u.g.position.z += dz; }); clampSet(set); check(); save(); }
  function rotateSet() {
    const set = movingSet(), piv = new T.Vector3();
    set.forEach((u) => piv.add(u.g.position)); piv.divideScalar(set.length); piv.y = 0;
    set.forEach((u) => { const p = u.g.position.clone().sub(piv).applyAxisAngle(Y, Math.PI / 2).add(piv); u.g.position.set(Math.round(p.x * 100) / 100, 0, Math.round(p.z * 100) / 100); u.g.rotation.y = (u.g.rotation.y + Math.PI / 2) % (2 * Math.PI); });
    clampSet(set); check(); save();
  }
  check();

  /* ---------- перетаскивание мышью / пальцем ---------- */
  const plane = new T.Plane(new T.Vector3(0, 1, 0), 0), ray = new T.Raycaster(), ptr = new T.Vector2(), hitP = new T.Vector3();
  const setPtr = (e) => { const r = renderer.domElement.getBoundingClientRect(); ptr.set(((e.clientX - r.left) / r.width) * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1); ray.setFromCamera(ptr, cam); };
  const ground = (e) => { setPtr(e); return ray.ray.intersectPlane(plane, hitP) ? hitP.clone() : null; };
  const pickUnit = (e) => { setPtr(e); const h = ray.intersectObjects(units.map((u) => u.g), true).find((x) => x.object.isMesh && x.object.userData.unit && !x.object.userData.fp); return h && h.object.userData.unit; };
  let drag = null;
  renderer.domElement.addEventListener("pointerdown", (e) => {
    if (e.button !== 0) return;
    const u = pickUnit(e); if (!u) return;
    sel = u; const p = ground(e); if (!p) return;
    drag = { p0: p, set: movingSet().map((x) => [x, x.g.position.clone()]), moved: false };
    controls.enabled = false; renderer.domElement.setPointerCapture(e.pointerId); host.classList.add("dragging"); check();
  }, true);
  renderer.domElement.addEventListener("pointermove", (e) => {
    if (!drag) return; const p = ground(e); if (!p) return;
    const dx = Math.round((p.x - drag.p0.x) * 10) / 10, dz = Math.round((p.z - drag.p0.z) * 10) / 10;
    drag.set.forEach(([u, g0]) => u.g.position.set(g0.x + dx, 0, g0.z + dz)); drag.moved = true;
    clampSet(drag.set.map((x) => x[0])); check();
  });
  const endDrag = () => { if (!drag) return; const m = drag.moved; drag = null; controls.enabled = true; host.classList.remove("dragging"); if (m) save(); };
  renderer.domElement.addEventListener("pointerup", endDrag); renderer.domElement.addEventListener("pointercancel", endDrag);
  renderer.domElement.addEventListener("dblclick", (e) => { const u = pickUnit(e); if (u) { sel = u; rotateSet(); } });

  /* ---------- кнопки и клавиатура ---------- */
  const STEP = 0.5;
  document.querySelectorAll("[data-mode]").forEach((b) => b.addEventListener("click", () => { mode = b.dataset.mode; check(); }));
  document.querySelectorAll("[data-nudge]").forEach((b) => b.addEventListener("click", () => { const [dx, dz] = b.dataset.nudge.split(",").map(Number); moveSet(dx * STEP, dz * STEP); }));
  $("lay-rot")?.addEventListener("click", rotateSet);
  $("lay-unit-reset")?.addEventListener("click", () => { const set = movingSet(); set.forEach((u) => apply(u, u.home)); check(); save(); });
  $("lay-reset")?.addEventListener("click", () => { if (!confirm("Вернуть всё оборудование в исходную расстановку?")) return; units.forEach((u) => apply(u, u.home)); check(); save(); });
  $("lay-share")?.addEventListener("click", async (ev) => {
    const o = save(), code = encodeURIComponent(btoa(unescape(encodeURIComponent(JSON.stringify(o)))));
    const url = location.origin + location.pathname + "#layout=" + code, b = ev.currentTarget, t0 = b.textContent;
    try { await navigator.clipboard.writeText(url); b.textContent = "Ссылка скопирована"; } catch (e) { prompt("Скопируйте ссылку на расстановку:", url); }
    setTimeout(() => (b.textContent = t0), 2000);
  });
  host.addEventListener("keydown", (e) => {
    const k = { ArrowLeft: [-1, 0], ArrowRight: [1, 0], ArrowUp: [0, -1], ArrowDown: [0, 1] }[e.key];
    if (k) { e.preventDefault(); moveSet(k[0] * (e.shiftKey ? 2 : STEP), k[1] * (e.shiftKey ? 2 : STEP)); }
    else if (e.key === "r" || e.key === "R" || e.key === "к" || e.key === "К") { e.preventDefault(); rotateSet(); }
  });
  let shell = 0; const shellBtn = $("lay-shell");
  shellBtn?.addEventListener("click", () => {
    shell = (shell + 1) % 3; shells.forEach((s) => (s.visible = shell !== 1));
    shellMat.opacity = shell === 2 ? 1 : 0.2; shellMat.depthWrite = shell === 2; shells.forEach((s) => (s.castShadow = shell === 2));
    shellBtn.textContent = ["Арки: прозрачные", "Арки: скрыты", "Арки: целиком"][shell];
  });

  /* ---------- виды, подписи, подсказка ---------- */
  let fly = null;
  const go = (v) => { fly = { t: 0, p0: cam.position.clone(), t0: controls.target.clone(), z0: cam.zoom, v }; };
  document.querySelectorAll("[data-plant-view]").forEach((b) => b.addEventListener("click", () => {
    document.querySelectorAll("[data-plant-view]").forEach((x) => x.setAttribute("aria-pressed", String(x === b))); go(VIEWS[b.dataset.plantView]);
  }));
  const labels = [["Цех №1", "18 × 40 м · H 10 м", [32.7, 10.8, 100.5]], ["Цех №2", "16 × 40 м · H 8 м", [52.7, 9.5, 32.4]], ["АБК", "12 × 5,5 м", [88, 5.2, 22.5]], ["КПП", "въезд", [2.9, 4.2, 2.9]]]
    .map(([t, s, p]) => { const el = document.createElement("div"); el.className = "tag plain"; el.innerHTML = `<b>${t}</b><small>${s}</small>`; host.appendChild(el); return { el, p: new T.Vector3(...p) }; });
  const tmpV = new T.Vector3();
  const place = (el, v) => { const w = host.clientWidth, h = host.clientHeight; v.project(cam); const hidden = v.z > 1 || Math.abs(v.x) > 1.1 || Math.abs(v.y) > 1.1; el.style.display = hidden ? "none" : ""; el.style.transform = `translate(${((v.x + 1) / 2) * w}px, ${((1 - v.y) / 2) * h}px) translate(-50%, -100%)`; };
  function placeLabels() {
    labels.forEach((l) => place(l.el, tmpV.copy(l.p)));
    tmpV.set(0, sel.h + 0.6, 0); sel.g.localToWorld(tmpV); place(selTag, tmpV);
  }
  const tip = $("plant-tip");
  renderer.domElement.addEventListener("pointermove", (e) => {
    if (drag || !tip) { if (tip) tip.hidden = true; return; }
    setPtr(e);
    const hit = ray.intersectObjects(scene.children, true).find((h) => h.object.isMesh && h.object.visible && h.object.userData.name && !(h.object.userData.shell && shellMat.opacity < 1));
    if (!hit) { tip.hidden = true; renderer.domElement.style.cursor = ""; return; }
    const u = hit.object.userData.unit;
    tip.textContent = hit.object.userData.name + (u ? " — тяните, чтобы передвинуть; двойной клик — повернуть" : "");
    renderer.domElement.style.cursor = u ? "grab" : "";
    const r = renderer.domElement.getBoundingClientRect(); let x = e.clientX - r.left + 14, y = e.clientY - r.top + 14;
    if (x > r.width - 290) x -= 300; tip.style.left = x + "px"; tip.style.top = y + "px"; tip.hidden = false;
  });
  renderer.domElement.addEventListener("pointerleave", () => tip && (tip.hidden = true));

  function resize() {
    const w = host.clientWidth, h = host.clientHeight; renderer.setSize(w, h, false);
    const a = w / h, span = w < 600 ? 95 : 70; cam.left = -span * a; cam.right = span * a; cam.top = span; cam.bottom = -span; cam.updateProjectionMatrix();
  }
  new ResizeObserver(resize).observe(host); resize();
  let visible = true; new IntersectionObserver((en) => (visible = en[en.length - 1].isIntersecting), { rootMargin: "200px" }).observe(host);
  function retheme() {
    C = palette(); for (const k in M) if (C[k] !== undefined) M[k].color.setHex(C[k]);
    inks.forEach((m) => m.color.setHex(C.ink)); shellMat.color.setHex(C.hangar); check();
  }
  new MutationObserver(retheme).observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });
  matchMedia("(prefers-color-scheme: dark)").addEventListener("change", retheme);

  let last = 0, clock = 0;
  function tick(now) {
    const dt = last ? Math.min(0.05, (now - last) / 1000) : 0; last = now;
    if (visible) {
      if (fly) { fly.t = Math.min(1, fly.t + dt / 1.2); const u = fly.t * fly.t * (3 - 2 * fly.t); cam.position.lerpVectors(fly.p0, fly.v.pos, u); controls.target.lerpVectors(fly.t0, fly.v.tgt, u); cam.zoom = fly.z0 + (fly.v.zoom - fly.z0) * u; cam.updateProjectionMatrix(); if (fly.t >= 1) fly = null; }
      if (!still) clock += dt; E.tick(clock);
      controls.update(); renderer.render(scene, cam); placeLabels();
    }
    requestAnimationFrame(tick);
  }
  requestAnimationFrame(tick);
})();
