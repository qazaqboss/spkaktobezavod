// АБК изнутри: обзор со срезом стен и прогулка от первого лица.
// Метры, начало — северо-западный угол АБК; x — на восток, z — на юг, y — вверх.
// Каркас 3 × 6: x 0–6, z 0–3. Каркас 2,5 × 12: x 0–12, z 3–5,5. Вход с юга (с асфальта).
(() => {
  const host = document.getElementById("abk3d");
  if (!host) return;
  if (!window.THREE || !THREE.OrbitControls) { host.innerHTML = '<p class="no3d">3D-модель не загрузилась. Проверьте подключение к интернету и обновите страницу.</p>'; return; }
  const T = THREE, $ = (id) => document.getElementById(id);
  const renderer = new T.WebGLRenderer({ antialias: true, alpha: true });
  renderer.setPixelRatio(Math.min(devicePixelRatio, 2)); renderer.shadowMap.enabled = true; renderer.shadowMap.type = T.PCFSoftShadowMap;
  host.prepend(renderer.domElement);
  const scene = new T.Scene();

  /* ---------- камеры ---------- */
  const ocam = new T.OrthographicCamera(-10, 10, 10, -10, 0.1, 300);
  const VIEWS = {
    all: { pos: [20, 20, 22], tgt: [6, 1, 2.5], zoom: 1 },
    acc: { pos: [22, 14, 16], tgt: [9.2, 1, 4], zoom: 1.9 },
    sales: { pos: [14, 14, 18], tgt: [2.3, 1, 2.4], zoom: 1.6 },
    hall: { pos: [14, 9, 18], tgt: [5.4, 1.2, 3.4], zoom: 2.4 },
  };
  ocam.position.set(...VIEWS.all.pos);
  const controls = new T.OrbitControls(ocam, renderer.domElement);
  controls.target.set(...VIEWS.all.tgt); controls.enableDamping = true; controls.dampingFactor = 0.08;
  controls.minPolarAngle = 0.15; controls.maxPolarAngle = 1.3; controls.minZoom = 0.6; controls.maxZoom = 6; controls.screenSpacePanning = true;
  const pcam = new T.PerspectiveCamera(72, 1, 0.05, 200);

  scene.add(new T.HemisphereLight(0xffffff, 0x8a857c, 0.62));
  const sun = new T.DirectionalLight(0xffffff, 0.45); sun.position.set(14, 22, 18); sun.castShadow = true; sun.shadow.mapSize.set(2048, 2048);
  Object.assign(sun.shadow.camera, { left: -14, right: 14, top: 14, bottom: -14, near: 1, far: 80 }); sun.shadow.bias = -0.0005; scene.add(sun); sun.target.position.set(6, 0, 2.5); scene.add(sun.target);
  const lamp = new T.PointLight(0xfff4e0, 0, 16, 1.6); lamp.position.set(6, 3.6, 3); scene.add(lamp);

  const PAL = () => window.easymixDark && window.easymixDark()
    ? { ink: 0xa9aeb5, ground: 0x24291f, gravel: 0x4a463e, asph: 0x2c2d2f, wall: 0xcfd2d5, wallCut: 0x8e949a, wood: 0x8a6a4a, tile: 0x6c6f72, desk: 0xd8d5cf, deskLeg: 0x3a3d42, chair: 0x2f3237, screen: 0x15181c, cab: 0xbfbab0, safe: 0x50555b, sofa: 0x48607a, green: 0x2f7d4c, warm: 0xc4955c, plant: 0x3f7a3a, pot: 0x8a7a6a, steel: 0x9aa0a6, glass: 0x2c4a5e, door: 0x6b5440, bag1: 0x2d8a4e, bag2: 0xd9a227, bag3: 0x9aa0a6, rug: 0x3c4a5a, ceil: 0xd8dadc, concrete: 0x6d6c68 }
    : { ink: 0x3a3d42, ground: 0xc9d6b4, gravel: 0xd9d3c6, asph: 0xa3a4a5, wall: 0xfafafa, wallCut: 0x6b7077, wood: 0xd9b88f, tile: 0xcfd2d4, desk: 0xf4f1ea, deskLeg: 0x3a3d42, chair: 0x3b3f45, screen: 0x1b1e22, cab: 0xe8e2d6, safe: 0x6b7178, sofa: 0x6e8bab, green: 0x2d8a4e, warm: 0xe3b47a, plant: 0x5a9a4a, pot: 0xb7a48e, steel: 0xb8bec4, glass: 0x8fb5cc, door: 0xa7835c, bag1: 0x2d8a4e, bag2: 0xd9a227, bag3: 0xb8bec4, rug: 0x9db0c2, ceil: 0xf4f4f2, concrete: 0xbab8b2 };
  let C = PAL();
  const M = {}; for (const k in C) if (k !== "ink") M[k] = new T.MeshLambertMaterial({ color: C[k] });
  M.glass.transparent = true; M.glass.opacity = 0.45; M.ceil.side = T.DoubleSide;
  const inks = []; const ink = (a) => { const m = new T.LineBasicMaterial({ color: C.ink, transparent: true, opacity: a }); inks.push(m); return m; };
  const INK = ink(0.6), SOFT = ink(0.25);
  const Y = 0.96; // верх чистого пола
  const blockers = []; // препятствия для прогулки: [x0, z0, x1, z1]
  const block = (x, z, w, d) => blockers.push([x - w / 2, z - d / 2, x + w / 2, z + d / 2]);
  function box(w, h, d, m, x, y, z, name = "", { edges = true, soft = true, shadow = true, parent = scene } = {}) {
    const g = new T.BoxGeometry(w, h, d), o = new T.Mesh(g, m); o.position.set(x, y, z); o.castShadow = shadow; o.receiveShadow = true; o.userData.name = name;
    if (edges) o.add(new T.LineSegments(new T.EdgesGeometry(g), soft ? SOFT : INK)); parent.add(o); return o;
  }
  const cyl = (r, h, m, x, y, z, name = "", seg = 20) => { const g = new T.CylinderGeometry(r, r, h, seg), o = new T.Mesh(g, m); o.position.set(x, y, z); o.castShadow = o.receiveShadow = true; o.userData.name = name; o.add(new T.LineSegments(new T.EdgesGeometry(g, 30), SOFT)); scene.add(o); return o; };

  /* ---------- основание и улица ---------- */
  box(40, 0.2, 30, M.ground, 6, -0.1, 4, "", { edges: false, shadow: false });
  box(40, 0.06, 9, M.asph, 6, 0.03, 12.2, "Асфальт", { edges: false, shadow: false });
  box(14.8, 0.2, 8.6, M.gravel, 6, 0.1, 2.9, "Подсыпка ПГС", { edges: false, shadow: false });
  box(12.2, 0.7, 2.7, M.wallCut, 6, 0.58, 4.25, "Цоколь · профлист"); box(6.2, 0.7, 3.1, M.wallCut, 3, 0.58, 1.5, "Цоколь · профлист");
  box(1.6, 0.94, 1.05, M.concrete, 6, 0.47, 6.1, "Крыльцо"); box(1.6, 0.55, 0.5, M.concrete, 6, 0.275, 6.85, "Ступень крыльца");
  const floor = (x0, z0, x1, z1, m, name) => box(x1 - x0, 0.04, z1 - z0, m, (x0 + x1) / 2, Y - 0.02, (z0 + z1) / 2, name, { edges: false, shadow: false });
  floor(0, 0, 4.5, 3, M.wood, "Отдел продаж · ламинат"); floor(0, 3, 4.5, 5.5, M.wood, "Отдел продаж · ламинат");
  floor(7.9, 3, 12, 4.5, M.wood, "Бухгалтерия · ламинат"); floor(6.5, 4.5, 12, 5.5, M.wood, "Бухгалтерия · ламинат");
  floor(6.5, 3, 7.9, 4.5, M.tile, "Санузел · керамогранит");
  floor(4.5, 3, 6.5, 5.5, M.tile, "Холл · керамогранит"); floor(4.5, 0, 6, 3, M.tile, "Кухня и котёл · керамогранит");
  const planks = []; for (let x = 0.25; x < 12; x += 0.25) { if (x > 4.5 && x < 6.5) continue; planks.push(new T.Vector3(x, Y + 0.002, x < 6 ? 0 : x < 7.9 ? 4.5 : 3), new T.Vector3(x, Y + 0.002, 5.5)); }
  scene.add(new T.LineSegments(new T.BufferGeometry().setFromPoints(planks), SOFT));

  /* ---------- стены со срезом ---------- */
  const walls = [], upper = [], walkOnly = [];
  let cutH = 1.35;
  const H = 2.86;
  function wall(x0, z0, x1, z1, th, ops, name) {
    const L = Math.hypot(x1 - x0, z1 - z0), dx = (x1 - x0) / L, dz = (z1 - z0) / L;
    const add = (a, b, y0, y1) => {
      if (b - a < 0.02 || y1 - y0 < 0.02) return;
      const mid = (a + b) / 2, len = b - a, cx = x0 + dx * mid, cz = z0 + dz * mid, w = dx ? len : th, d = dx ? th : len;
      const m = new T.Mesh(new T.BoxGeometry(w, 1, d), M.wall);
      m.position.set(cx, 0, cz); m.castShadow = m.receiveShadow = true; m.userData = { name, y0, y1 };
      m.add(new T.LineSegments(new T.EdgesGeometry(m.geometry), INK)); scene.add(m); walls.push(m);
      if (y0 < 1.2) block(cx, cz, w, d);
    };
    let s = 0;
    for (const o of ops.sort((p, q) => p.a - q.a)) { add(s, o.a, 0, H); add(o.a, o.b, 0, o.y0); add(o.a, o.b, o.y1, H); s = o.b; }
    add(s, L, 0, H);
  }
  function applyCut() {
    for (const m of walls) {
      const top = Math.min(m.userData.y1, cutH), bot = m.userData.y0;
      if (top <= bot + 0.01) { m.visible = false; continue; }
      m.visible = true; m.scale.y = top - bot; m.position.y = Y + bot + (top - bot) / 2;
    }
    for (const o of upper) o.visible = cutH > 2;
  }
  const win = (a, b) => ({ a, b, y0: 0.9, y1: 2.1 }), dr = (a, b) => ({ a, b, y0: 0, y1: 2.1 });
  const OUT = "Наружная стена · сэндвич-панель 100 мм";
  wall(0, -0.05, 6, -0.05, 0.1, [], OUT);
  wall(6.05, 0, 6.05, 3, 0.1, [], OUT);
  wall(6, 2.95, 12, 2.95, 0.1, [], OUT);
  wall(12.05, 3, 12.05, 5.5, 0.1, [], OUT);
  wall(0, 5.55, 12, 5.55, 0.1, [win(1.0, 2.2), win(3.3, 4.5), dr(5.5, 6.5), win(7.5, 8.7), win(9.8, 11.0)], OUT);
  wall(-0.05, 0, -0.05, 5.5, 0.1, [win(0.9, 2.1)], OUT);
  wall(4.5, 0, 4.5, 5.5, 0.08, [dr(3.4, 4.3)], "Перегородка 80 мм · каркас + ГКЛ с утеплителем");
  // перегородка холла: проём z 3,2–4,0 — в санузел, z 4,6–5,4 — в бухгалтерию (смещения считаются от начала стены)
  wall(6.5, 3, 6.5, 5.5, 0.08, [dr(0.2, 1.0), dr(1.6, 2.4)], "Перегородка 80 мм · двери в санузел и бухгалтерию");
  wall(7.9, 3, 7.9, 4.5, 0.1, [], "Перегородка санузла 100 мм · влагостойкий ГКЛ, звукоизоляция");
  wall(6.5, 4.5, 7.9, 4.5, 0.1, [], "Перегородка санузла 100 мм · влагостойкий ГКЛ, звукоизоляция");
  wall(4.5, 3, 6, 3, 0.08, [dr(0.15, 0.95)], "Перегородка кухни · дверной проём");
  for (const [x0, x1] of [[1.0, 2.2], [3.3, 4.5], [7.5, 8.7], [9.8, 11.0]]) upper.push(box(x1 - x0, 1.2, 0.04, M.glass, (x0 + x1) / 2, Y + 1.5, 5.55, "Окно ПВХ 1,2 × 1,2 м", { shadow: false }));
  upper.push(box(0.04, 1.2, 1.2, M.glass, -0.05, Y + 1.5, 1.5, "Окно ПВХ 1,2 × 1,2 м", { shadow: false }));
  const leaf = (x, z, w, rot, name) => { const g = new T.Group(); g.position.set(x, Y, z); g.rotation.y = rot; scene.add(g); box(w, 2.05, 0.04, M.door, w / 2, 1.03, 0, name, { parent: g }); box(0.04, 0.04, 0.12, M.steel, w - 0.1, 1.0, 0.04, name, { parent: g, edges: false }); return g; };
  leaf(5.5, 5.55, 1.0, -1.15, "Входная дверь");
  leaf(6.5, 5.4, 0.8, 0.93, "Дверь в бухгалтерию"); // открыта внутрь кабинета
  leaf(6.5, 3.2, 0.7, Math.PI, "Дверь в санузел 0,7 м · открывается наружу, с защёлкой"); // по нормам — наружу; распахнута к перегородке кухни
  leaf(4.5, 4.3, 0.9, 2.21, "Дверь в отдел продаж"); // открыта внутрь кабинета
  upper.push(box(0.02, 0.18, 0.4, M.warm, 6.45, Y + 2.35, 5.0, "Табличка «Бухгалтерия»"));
  upper.push(box(0.02, 0.2, 0.2, M.steel, 6.45, Y + 2.35, 3.6, "Табличка «WC»"));
  upper.push(box(0.02, 0.18, 0.4, M.green, 4.55, Y + 2.35, 3.85, "Табличка «Отдел продаж»"));
  // потолок и светильники — только в прогулке, чтобы сверху было видно комнаты
  walkOnly.push(box(12.2, 0.12, 2.6, M.ceil, 6, Y + H + 0.06, 4.25, "Потолок", { edges: false, shadow: false }));
  walkOnly.push(box(6.2, 0.12, 3.1, M.ceil, 3, Y + H + 0.06, 1.45, "Потолок", { edges: false, shadow: false }));
  const lampM = new T.MeshBasicMaterial({ color: 0xffffff });
  for (const [x, z] of [[1.2, 1.4], [3.3, 1.4], [1.2, 4.3], [3.3, 4.3], [5.5, 4.3], [5.25, 1.5], [9.2, 4.0], [10.8, 4.6], [7.2, 3.75]]) walkOnly.push(box(0.6, 0.02, 0.6, lampM, x, Y + H - 0.01, z, "Светильник 600 × 600", { edges: false, shadow: false }));

  /* ---------- мебель ---------- */
  const desk = (x, z, w, d, rot = 0, name = "Рабочий стол 1,4 × 0,7 м") => {
    const g = new T.Group(); g.position.set(x, Y, z); g.rotation.y = rot; scene.add(g);
    box(w, 0.04, d, M.desk, 0, 0.73, 0, name, { parent: g });
    for (const sx of [-1, 1]) box(0.05, 0.71, d - 0.08, M.deskLeg, sx * (w / 2 - 0.05), 0.355, 0, name, { parent: g, edges: false });
    box(w - 0.2, 0.3, 0.02, M.deskLeg, 0, 0.55, -d / 2 + 0.06, name, { parent: g, edges: false });
    box(0.55, 0.34, 0.03, M.screen, 0, 1.0, -d / 2 + 0.18, "Монитор", { parent: g });
    box(0.06, 0.2, 0.06, M.deskLeg, 0, 0.83, -d / 2 + 0.2, "", { parent: g, edges: false });
    box(0.42, 0.02, 0.14, M.steel, 0, 0.76, -0.02, "Клавиатура", { parent: g, edges: false });
    block(x, z, w, d); return g;
  };
  const chair = (x, z, rot = 0, name = "Офисное кресло") => {
    const g = new T.Group(); g.position.set(x, Y, z); g.rotation.y = rot; scene.add(g);
    box(0.48, 0.08, 0.46, M.chair, 0, 0.46, 0, name, { parent: g }); box(0.46, 0.5, 0.06, M.chair, 0, 0.78, 0.22, name, { parent: g });
    box(0.06, 0.38, 0.06, M.deskLeg, 0, 0.23, 0, "", { parent: g, edges: false }); box(0.5, 0.03, 0.5, M.deskLeg, 0, 0.03, 0, "", { parent: g, edges: false });
    block(x, z, 0.42, 0.42); return g;
  };
  const plant = (x, z, h = 1.1) => { cyl(0.16, 0.32, M.pot, x, Y + 0.16, z, "Растение в кашпо"); const c = new T.Mesh(new T.IcosahedronGeometry(0.32, 1), M.plant); c.position.set(x, Y + 0.32 + h * 0.45, z); c.scale.set(1, h, 1); c.castShadow = true; c.userData.name = "Растение в кашпо"; scene.add(c); block(x, z, 0.36, 0.36); };

  // санузел (x 6,5–7,9, z 3–4,5): вход из холла, клиентам не нужно проходить через кабинеты
  box(0.36, 0.38, 0.2, M.wall, 7.2, Y + 0.6, 3.12, "Инсталляция / бачок унитаза"); cyl(0.19, 0.4, M.wall, 7.2, Y + 0.2, 3.5, "Унитаз", 28).scale.z = 1.35; cyl(0.205, 0.04, M.wall, 7.2, Y + 0.42, 3.5, "Унитаз · сиденье", 28).scale.z = 1.35; block(7.2, 3.4, 0.4, 0.75);
  box(0.45, 0.14, 0.55, M.wall, 7.62, Y + 0.82, 4.05, "Раковина 55 см"); cyl(0.04, 0.68, M.steel, 7.72, Y + 0.41, 4.05, "Сифон", 8); block(7.62, 4.05, 0.45, 0.55);
  box(0.02, 0.7, 0.5, M.glass, 7.84, Y + 1.45, 4.05, "Зеркало"); box(0.05, 0.12, 0.22, M.steel, 7.82, Y + 1.0, 3.62, "Дозатор мыла и полотенце");
  cyl(0.17, 0.5, M.wall, 7.72, Y + 2.0, 3.35, "Водонагреватель 10–15 л", 18); box(0.25, 0.02, 0.25, M.steel, 6.85, Y + H - 0.01, 4.2, "Вытяжной вентилятор, включается со светом");
  box(0.3, 0.06, 0.12, M.steel, 6.6, Y + 0.8, 3.1, "Держатель бумаги");
  // бухгалтерия (x 7,9–12 у северной стены и x 6,5–12 вдоль окон): вход у крыльца, столы сдвинуты восточнее санузла
  desk(8.75, 3.42, 1.4, 0.7, 0, "Стол бухгалтера 1,4 × 0,7 м"); chair(8.75, 4.15, 0, "Кресло бухгалтера");
  desk(10.3, 3.42, 1.4, 0.7, 0, "Стол бухгалтера 1,4 × 0,7 м"); chair(10.3, 4.15, 0, "Кресло бухгалтера");
  box(0.45, 2.0, 1.2, M.cab, 11.75, Y + 1.0, 3.7, "Шкаф для документов и архива 1,2 × 0,45 × 2,0 м"); block(11.75, 3.7, 0.45, 1.2);
  for (let i = 1; i < 4; i++) box(0.46, 0.01, 1.18, M.deskLeg, 11.75, Y + i * 0.5, 3.7, "", { edges: false, shadow: false });
  box(0.5, 0.6, 0.5, M.safe, 11.7, Y + 0.3, 5.1, "Сейф для денег и печатей"); block(11.7, 5.1, 0.5, 0.5);
  box(0.5, 0.45, 0.5, M.cab, 11.7, Y + 0.225, 4.55, "Тумба под МФУ"); box(0.42, 0.35, 0.45, M.steel, 11.7, Y + 0.62, 4.55, "МФУ: принтер, сканер, копир"); block(11.7, 4.55, 0.5, 0.5);
  upper.push(box(3.0, 0.9, 0.03, M.warm, 9.55, Y + 1.75, 3.03, "Акцентная стена бухгалтерии", { edges: false }));
  plant(11.1, 5.15, 0.9);
  // отдел продаж (каркас 3 × 6 и западная часть длинного каркаса)
  [0.85, 2.25, 3.65].forEach((x) => { desk(x, 0.45, 1.2, 0.7, 0, "Стол менеджера по продажам 1,2 × 0,7 м"); chair(x, 1.2, 0, "Кресло менеджера"); });
  upper.push(box(3.6, 0.9, 0.03, M.green, 2.25, Y + 1.75, 0.03, "Акцентная стена: логотип EasyMix и карта клиентов", { edges: false }));
  box(0.4, 1.8, 1.4, M.cab, 4.25, Y + 0.9, 2.0, "Стеллаж с образцами продукции EasyMix"); block(4.25, 2.0, 0.4, 1.4);
  [Y + 0.25, Y + 0.85, Y + 1.45].forEach((y, r) => [1.55, 2.0, 2.45].forEach((z, c) => box(0.26, 0.34, 0.3, [M.bag1, M.bag2, M.bag3][(r + c) % 3], 4.2, y + 0.17, z, "Образцы мешков EasyMix")));
  cyl(0.45, 0.03, M.desk, 2.4, Y + 0.74, 4.3, "Стол для переговоров с клиентами Ø 0,9 м", 32); cyl(0.04, 0.72, M.deskLeg, 2.4, Y + 0.37, 4.3, "", 8); block(2.4, 4.3, 0.9, 0.9);
  [[1.75, 4.3, Math.PI / 2], [3.05, 4.3, -Math.PI / 2], [2.4, 3.65, Math.PI]].forEach(([x, z, r]) => chair(x, z, r, "Стул для клиента"));
  box(0.75, 0.42, 1.5, M.sofa, 0.42, Y + 0.21, 4.2, "Диван для клиентов"); box(0.18, 0.4, 1.5, M.sofa, 0.12, Y + 0.6, 4.2, "Диван для клиентов"); block(0.42, 4.2, 0.75, 1.5);
  box(1.6, 0.01, 1.3, M.rug, 2.4, Y + 0.01, 4.3, "Ковёр", { edges: false, shadow: false });
  plant(4.1, 5.15, 1.2); plant(0.3, 2.75, 1.0);
  // холл (x 4,5–6,5, z 3–5,5). Банкетка и вешалка сдвинуты от дверных проёмов, чтобы через них можно было пройти.
  box(0.4, 0.45, 1.0, M.wood, 4.75, Y + 0.225, 4.9, "Банкетка в холле"); block(4.75, 4.9, 0.4, 1.0);
  cyl(0.03, 1.75, M.deskLeg, 6.3, Y + 0.875, 4.3, "Вешалка для одежды", 8); cyl(0.2, 0.03, M.deskLeg, 6.3, Y + 0.02, 4.3, "", 16); block(6.3, 4.3, 0.3, 0.3);
  box(1.0, 0.01, 0.7, M.rug, 6.0, Y + 0.01, 5.05, "Грязезащитный коврик у входа", { edges: false, shadow: false });
  // кухня и котёл (x 4,5–6, z 0–3)
  box(0.6, 0.9, 1.6, M.cab, 5.68, Y + 0.45, 1.6, "Кухонная столешница с мойкой"); box(0.4, 0.04, 0.45, M.steel, 5.68, Y + 0.92, 1.25, "Мойка"); block(5.68, 1.6, 0.6, 1.6);
  box(0.6, 1.8, 0.6, M.steel, 4.85, Y + 0.9, 0.38, "Холодильник"); block(4.85, 0.38, 0.6, 0.6);
  box(0.45, 0.75, 0.32, M.wall, 5.45, Y + 1.5, 0.2, "Котёл настенный 12–14 кВт · отдельная вытяжка");
  box(0.3, 0.2, 0.3, M.steel, 5.68, Y + 1.02, 2.1, "Чайник, микроволновка");
  for (const [x, z, a] of [[1.6, 5.35, "x"], [3.9, 5.35, "x"], [8.1, 5.35, "x"], [10.4, 5.35, "x"], [0.15, 1.5, "z"], [5.2, 2.85, "x"]]) box(a === "x" ? 0.9 : 0.08, 0.45, a === "x" ? 0.08 : 0.9, M.wall, x, Y + 0.45, z, "Радиатор ≈ 0,9 кВт");

  /* ---------- подписи комнат ---------- */
  const ROOMS = [
    { t: "Отдел продаж", s: "≈ 25 м² · 3 места + переговорная зона", p: [2.25, Y + 0.05, 2.3], r: [[0, 0, 4.5, 5.5]] },
    { t: "Бухгалтерия", s: "≈ 11,5 м² · 2 места, сейф, архив", p: [9.6, Y + 0.05, 4.95], r: [[7.9, 3, 12, 4.5], [6.5, 4.5, 12, 5.5]] },
    { t: "Санузел", s: "≈ 2 м² · унитаз, раковина", p: [7.2, Y + 0.05, 3.95], r: [[6.5, 3, 7.9, 4.5]] },
    { t: "Холл", s: "5 м²", p: [5.5, Y + 0.05, 4.4], r: [[4.5, 3, 6.5, 5.5]] },
    { t: "Кухня · котёл", s: "4,5 м²", p: [5.25, Y + 0.05, 1.3], r: [[4.5, 0, 6, 3]] },
  ];
  const labels = ROOMS.map((rm) => { const el = document.createElement("div"); el.className = "tag"; el.innerHTML = `<b>${rm.t}</b><small>${rm.s}</small>`; host.appendChild(el); return { el, p: new T.Vector3(...rm.p) }; });
  const tmp = new T.Vector3();
  function placeLabels(show) {
    const w = host.clientWidth, h = host.clientHeight;
    for (const l of labels) { l.el.style.display = show ? "" : "none"; if (!show) continue; tmp.copy(l.p).project(ocam); l.el.style.transform = `translate(${((tmp.x + 1) / 2) * w}px, ${((1 - tmp.y) / 2) * h}px) translate(-50%, -50%)`; }
  }
  const roomAt = (x, z) => { for (const rm of ROOMS) for (const [a, b, c, d] of rm.r) if (x >= a && x <= c && z >= b && z <= d) return rm.t; return null; };

  /* ---------- обзор ---------- */
  let fly = null;
  const go = (v) => { fly = { t: 0, p0: ocam.position.clone(), t0: controls.target.clone(), z0: ocam.zoom, p1: new T.Vector3(...v.pos), t1: new T.Vector3(...v.tgt), z1: v.zoom }; };
  document.querySelectorAll("[data-abk-view]").forEach((b) => b.addEventListener("click", () => {
    if (mode !== "orbit") setMode("orbit");
    document.querySelectorAll("[data-abk-view]").forEach((x) => x.setAttribute("aria-pressed", String(x === b))); go(VIEWS[b.dataset.abkView]);
  }));
  const cut = $("abk-cut"), cutOut = $("abk-cut-out");
  const fmt = (x) => x.toLocaleString("ru-RU", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  cut?.addEventListener("input", () => { cutH = +cut.value; cutOut.textContent = cutH >= H ? "стены целиком" : `стены срезаны на ${fmt(cutH)} м`; if (mode === "orbit") applyCut(); });

  /* ---------- прогулка от первого лица ---------- */
  const R = 0.2, EYE = 1.6, me = { x: 6.0, z: 9.2, yaw: 0, pitch: -0.05, eye: 0.2 + EYE };
  const SPOTS = { door: [6.0, 9.2, 0], hall: [5.95, 5.25, -0.45], acc: [7.0, 5.0, 1.3], wc: [5.85, 3.6, 1.57], sales: [3.6, 4.6, -1.3], kitchen: [5.0, 2.6, 0] };
  function groundAt(x, z) {
    const inA = x >= 0 && x <= 12 && z >= 3 && z <= 5.6, inB = x >= 0 && x <= 6 && z >= 0 && z <= 3;
    if (inA || inB) return Y;
    if (x >= 5.2 && x <= 6.8 && z > 5.6 && z <= 6.62) return 0.94;
    if (x >= 5.2 && x <= 6.8 && z > 6.62 && z <= 7.1) return 0.55;
    if (x >= -1.4 && x <= 13.4 && z >= -1.4 && z <= 7.2) return 0.2;
    return 0.06;
  }
  const hits = (x, z) => blockers.some(([a, b, c, d]) => x + R > a && x - R < c && z + R > b && z - R < d);
  function tryMove(dx, dz) {
    const nx = Math.min(18, Math.max(-6, me.x + dx)); if (!hits(nx, me.z)) me.x = nx;
    const nz = Math.min(15, Math.max(-6, me.z + dz)); if (!hits(me.x, nz)) me.z = nz;
  }
  const keys = new Set(), pad = new Set();
  let mode = "orbit";
  const hud = $("abk-hud"), where = $("abk-where"), look = $("abk-look"), walkUi = $("abk-walk-ui"), cutUi = $("abk-cut-ui");
  function setMode(m) {
    mode = m;
    const walk = m === "walk";
    controls.enabled = !walk;
    walls.forEach((w) => (w.visible = true));
    if (walk) { const keep = cutH; cutH = H + 0.01; applyCut(); cutH = keep; } else applyCut();
    walkOnly.forEach((o) => (o.visible = walk));
    lamp.intensity = walk ? 0.55 : 0;
    scene.background = walk ? new T.Color(window.easymixDark && window.easymixDark() ? 0x1d2530 : 0xcfe0ec) : null;
    if (hud) hud.hidden = !walk; if (walkUi) walkUi.hidden = !walk; if (cutUi) cutUi.hidden = walk;
    document.querySelectorAll("[data-abk-mode]").forEach((b) => b.setAttribute("aria-pressed", String(b.dataset.abkMode === m)));
    host.classList.toggle("walking", walk);
    if (walk) host.focus({ preventScroll: true });
    tip.hidden = true;
  }
  document.querySelectorAll("[data-abk-mode]").forEach((b) => b.addEventListener("click", () => setMode(b.dataset.abkMode)));
  document.querySelectorAll("[data-spot]").forEach((b) => b.addEventListener("click", () => {
    const s = SPOTS[b.dataset.spot]; me.x = s[0]; me.z = s[1]; me.yaw = s[2]; me.pitch = -0.05; me.eye = groundAt(me.x, me.z) + EYE; if (mode !== "walk") setMode("walk");
  }));
  // взгляд: тянуть мышью или пальцем
  let lookDrag = null;
  renderer.domElement.addEventListener("pointerdown", (e) => { if (mode !== "walk") return; lookDrag = [e.clientX, e.clientY]; renderer.domElement.setPointerCapture(e.pointerId); });
  renderer.domElement.addEventListener("pointermove", (e) => {
    if (mode !== "walk" || !lookDrag) return;
    me.yaw += (e.clientX - lookDrag[0]) * 0.005; me.pitch = Math.max(-1.2, Math.min(1.2, me.pitch + (e.clientY - lookDrag[1]) * 0.005)); lookDrag = [e.clientX, e.clientY];
  });
  const endLook = () => (lookDrag = null);
  renderer.domElement.addEventListener("pointerup", endLook); renderer.domElement.addEventListener("pointercancel", endLook);
  // клавиатура (по физическим клавишам — работает и в русской раскладке)
  const MOVE_KEYS = ["KeyW", "KeyA", "KeyS", "KeyD", "ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight", "KeyQ", "KeyE", "ShiftLeft", "ShiftRight"];
  addEventListener("keydown", (e) => {
    if (mode !== "walk" || !MOVE_KEYS.includes(e.code)) return;
    const r = host.getBoundingClientRect(); if (r.bottom < 0 || r.top > innerHeight) return;
    if (e.target.closest && e.target.closest("input,select,textarea")) return;
    e.preventDefault(); keys.add(e.code);
  });
  addEventListener("keyup", (e) => keys.delete(e.code));
  addEventListener("blur", () => { keys.clear(); pad.clear(); });
  // экранные кнопки: удерживать
  document.querySelectorAll("[data-pad]").forEach((b) => {
    const on = (e) => { e.preventDefault(); pad.add(b.dataset.pad); b.setPointerCapture?.(e.pointerId); }, off = () => pad.delete(b.dataset.pad);
    b.addEventListener("pointerdown", on); b.addEventListener("pointerup", off); b.addEventListener("pointercancel", off); b.addEventListener("pointerleave", off);
  });
  function walkStep(dt) {
    const k = (c) => keys.has(c);
    const run = k("ShiftLeft") || k("ShiftRight") ? 2.2 : 1;
    const fwd = (k("KeyW") || k("ArrowUp") || pad.has("f") ? 1 : 0) - (k("KeyS") || k("ArrowDown") || pad.has("b") ? 1 : 0);
    const side = (k("KeyD") || k("KeyE") || pad.has("sr") ? 1 : 0) - (k("KeyA") || k("KeyQ") || pad.has("sl") ? 1 : 0);
    const turn = (k("ArrowRight") || pad.has("r") ? 1 : 0) - (k("ArrowLeft") || pad.has("l") ? 1 : 0);
    me.yaw += turn * dt * 1.8;
    const sp = 1.6 * run * dt, s = Math.sin(me.yaw), c = Math.cos(me.yaw);
    if (fwd || side) {
      const dx = (s * fwd + c * side) * sp, dz = (-c * fwd + s * side) * sp, n = Math.max(1, Math.ceil(Math.hypot(dx, dz) / 0.05));
      for (let i = 0; i < n; i++) tryMove(dx / n, dz / n);
    }
    me.eye += (groundAt(me.x, me.z) + EYE - me.eye) * Math.min(1, dt * 10);
    pcam.position.set(me.x, me.eye, me.z);
    pcam.rotation.set(0, 0, 0); pcam.rotateY(-me.yaw); pcam.rotateX(-me.pitch);
  }

  /* ---------- подсказки ---------- */
  const tip = $("abk-tip"), ray = new T.Raycaster(), mouse = new T.Vector2();
  const named = (h) => h.object.isMesh && h.object.visible && h.object.userData.name && h.object.userData.name !== "Потолок";
  renderer.domElement.addEventListener("pointermove", (e) => {
    if (mode !== "orbit" || !tip) return;
    const r = renderer.domElement.getBoundingClientRect(); mouse.set(((e.clientX - r.left) / r.width) * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1);
    ray.setFromCamera(mouse, ocam); const hit = ray.intersectObjects(scene.children, true).find(named);
    if (!hit) { tip.hidden = true; return; }
    tip.textContent = hit.object.userData.name; tip.hidden = false;
    let x = e.clientX - r.left + 14, y = e.clientY - r.top + 14; if (x > r.width - 280) x -= 290; tip.style.left = x + "px"; tip.style.top = y + "px";
  });
  renderer.domElement.addEventListener("pointerleave", () => tip && (tip.hidden = true));
  let lookT = 0; const center = new T.Vector2(0, 0);
  function updateHud(dt) {
    lookT += dt; if (lookT < 0.15) return; lookT = 0;
    const rm = roomAt(me.x, me.z);
    if (where) where.textContent = rm || (me.z > 5.6 && me.z < 7.2 && me.x > 5.1 && me.x < 6.9 ? "Крыльцо, у входной двери" : "Улица, у АБК");
    ray.setFromCamera(center, pcam); ray.far = 4;
    const hit = ray.intersectObjects(scene.children, true).find(named); ray.far = Infinity;
    if (look) look.textContent = hit ? hit.object.userData.name : "";
  }

  /* ---------- размер, тема, цикл ---------- */
  function resize() {
    const w = host.clientWidth, h = host.clientHeight; renderer.setSize(w, h, false);
    const a = w / h, span = w < 600 ? 9.5 : 7.5; ocam.left = -span * a; ocam.right = span * a; ocam.top = span; ocam.bottom = -span; ocam.updateProjectionMatrix();
    pcam.aspect = a; pcam.updateProjectionMatrix();
  }
  new ResizeObserver(resize).observe(host); resize();
  let visible = true; new IntersectionObserver((en) => (visible = en[en.length - 1].isIntersecting), { rootMargin: "200px" }).observe(host);
  function retheme() { C = PAL(); for (const k in M) if (C[k] !== undefined) M[k].color.setHex(C[k]); inks.forEach((m) => m.color.setHex(C.ink)); if (mode === "walk") scene.background = new T.Color(window.easymixDark() ? 0x1d2530 : 0xcfe0ec); }
  new MutationObserver(retheme).observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });
  matchMedia("(prefers-color-scheme: dark)").addEventListener("change", retheme);

  setMode(location.hash === "#walk" ? "walk" : "orbit");
  let last = 0;
  function tick(now) {
    const dt = last ? Math.min(mode === "walk" ? 0.12 : 0.05, (now - last) / 1000) : 0; last = now;
    if (visible) {
      if (mode === "walk") { walkStep(dt); updateHud(dt); renderer.render(scene, pcam); placeLabels(false); }
      else {
        if (fly) { fly.t = Math.min(1, fly.t + dt / 1.1); const u = fly.t * fly.t * (3 - 2 * fly.t); ocam.position.lerpVectors(fly.p0, fly.p1, u); controls.target.lerpVectors(fly.t0, fly.t1, u); ocam.zoom = fly.z0 + (fly.z1 - fly.z0) * u; ocam.updateProjectionMatrix(); if (fly.t >= 1) fly = null; }
        controls.update(); renderer.render(scene, ocam); placeLabels(true);
      }
    }
    requestAnimationFrame(tick);
  }
  requestAnimationFrame(tick);
})();
