// Оборудование завода EasyMix: 14 узлов, каждый — отдельная THREE.Group.
// Геометрия задана в координатах своего комплекса (метры):
//   dry — линия сушки, ось барабана вдоль x, y — вверх;
//   mix — смесительный узел JS500, смеситель в начале координат.
// Шнек сухого песка (узел 9) строится страницей: он тянется между бункером хранения и дозатором.
window.EasyMixEquipment = (() => {
  const UNITS = [
    { k: "rhop",   n: 1,  c: "dry", name: "Приёмный бункер",        sub: "2,6 × 2,4 м, решётка" },
    { k: "conv",   n: 2,  c: "dry", name: "Наклонный конвейер",     sub: "8,9 м, подъём до 5,25 м" },
    { k: "burner", n: 3,  c: "dry", name: "Газовая горелка",        sub: "топка Ø1,5 м" },
    { k: "drum",   n: 4,  c: "dry", name: "Сушильный барабан",      sub: "Ø1,1 × 11,8 м" },
    { k: "filter", n: 5,  c: "dry", name: "Рукавный фильтр",        sub: "52 рукава, «дятел»" },
    { k: "screen", n: 6,  c: "dry", name: "Вибросито",              sub: "2,72 × 1,2 м, до 0,7 мм" },
    { k: "elev",   n: 7,  c: "dry", name: "Ковшовый элеватор",      sub: "6,0 м" },
    { k: "hopper", n: 8,  c: "dry", name: "Бункер хранения песка",  sub: "1,6 × 1,6 × 4,7 м, ≈ 8,6 т" },
    { k: "dose",   n: 10, c: "mix", name: "Бункер песка и шнек",    sub: "на дозировочной раме 6,8 м" },
    { k: "bins",   n: 11, c: "mix", name: "Бункеры гипса и муки",   sub: "2 шт, питатели" },
    { k: "skip",   n: 12, c: "mix", name: "Скиповый подъёмник",     sub: "ковш ≈ 0,8 м³" },
    { k: "mixer",  n: 13, c: "mix", name: "Смеситель JS500",        sub: "двухвальный, без воды" },
    { k: "hop",    n: 14, c: "mix", name: "Нижний бункер",          sub: "под смесителем" },
    { k: "pack",   n: 15, c: "mix", name: "Две фасовки",            sub: "клапанные мешки" },
  ];
  const LINK = { n: 9, name: "Шнек сухого песка", sub: "бункер хранения → дозатор JS500" };

  // Точки передачи материала между узлами (координаты комплекса каждого узла).
  const CONNS = [
    { a: "rhop",   b: "conv",   pa: [-7.2, 0.6, 0],   pb: [-7.3, 0.75, 0],  name: "Бункер → конвейер" },
    { a: "conv",   b: "drum",   pa: [0.15, 5.05, 0],  pb: [0.1, 4.95, 0],   name: "Конвейер → барабан" },
    { a: "burner", b: "drum",   pa: [-1.3, 2.75, 0],  pb: [-1.3, 2.75, 0],  name: "Горелка → барабан", gas: true },
    { a: "drum",   b: "filter", pa: [12.15, 3.6, 0],  pb: [12.15, 3.6, 0],  name: "Газоход к фильтру", gas: true },
    { a: "drum",   b: "screen", pa: [12.3, 1.35, 0],  pb: [12.55, 1.4, 0],  name: "Барабан → сито" },
    { a: "screen", b: "elev",   pa: [14.9, 1.05, 0],  pb: [15.75, 0.5, 0],  name: "Сито → элеватор" },
    { a: "elev",   b: "hopper", pa: [18.4, 4.85, 0],  pb: [19.0, 4.75, 0],  name: "Элеватор → бункер" },
    { a: "hopper", b: "dose",   pa: [19.55, 1.05, 0], pb: [-0.2, 4.4, 4.9], name: "Шнек сухого песка", screw: true },
    { a: "dose",   b: "skip",   pa: [0, 1.0, 4.8],    pb: [0, 0.6, 4.7],    name: "Песок → скип" },
    { a: "bins",   b: "skip",   pa: [0, 0.75, 4.8],   pb: [0, 0.6, 4.7],    name: "Гипс и мука → скип" },
    { a: "skip",   b: "mixer",  pa: [0, 4.85, 1.2],   pb: [0, 3.3, 0.6],    name: "Скип → смеситель" },
    { a: "mixer",  b: "hop",    pa: [0, 1.1, 0],      pb: [0, 1.05, -0.1],  name: "Смеситель → нижний бункер" },
    { a: "hop",    b: "pack",   pa: [0, 0.3, -0.9],   pb: [0, 0.9, -1.3],   name: "Бункер → фасовки" },
  ];

  function build(T, opt = {}) {
    const lineMat = opt.lineMat;
    const M = opt.mat || ((c, o) => new T.MeshStandardMaterial(Object.assign({ color: c, metalness: 0.35, roughness: 0.6 }, o || {})));
    const steel = M(0x8b969d), dark = M(0x4b5459), ins = M(0xc9c1b2), acc = M(0xe2481c, { metalness: 0.1 }), yel = M(0xd9a520, { metalness: 0.2 }),
      glass = M(0x9fb3bd, { transparent: true, opacity: 0.25, depthWrite: false }), bagM = M(0xe9e2d2, { roughness: 0.9 }), pitM = M(0x5a5145, { roughness: 1 });
    const PI = Math.PI, cyl = (r, h, s) => new T.CylinderGeometry(r, r, h, s || 28), box = (a, b, c) => new T.BoxGeometry(a, b, c);
    const U = {}; UNITS.forEach((u) => (U[u.k] = new T.Group()));
    const edge = (m, g) => { if (lineMat) m.add(new T.LineSegments(new T.EdgesGeometry(g, 25), lineMat)); };
    function add(g, geo, mat, x, y, z, rx, ry, rz) {
      const m = new T.Mesh(geo, mat); m.position.set(x, y, z); m.rotation.set(rx || 0, ry || 0, rz || 0);
      m.castShadow = m.receiveShadow = true; g.add(m); edge(m, geo); return m;
    }
    function beam(g, a, b, t, mat, w) {
      const A = new T.Vector3(...a), B = new T.Vector3(...b), d = B.clone().sub(A), m = new T.Mesh(box(d.length(), t, w || t), mat || dark);
      m.position.copy(A.clone().add(B).multiplyScalar(0.5)); m.quaternion.setFromUnitVectors(new T.Vector3(1, 0, 0), d.normalize());
      m.castShadow = true; g.add(m); edge(m, m.geometry); return m;
    }

    /* 1 приёмный бункер */
    { const g = U.rhop, x = -7.2;
      [[1.3, 1.2], [1.3, -1.2], [-1.3, 1.2], [-1.3, -1.2]].forEach(([a, b]) => beam(g, [x + a, 0, b], [x + a, 2.4, b], 0.14));
      beam(g, [x - 1.75, 2.4, 1.2], [x + 1.75, 2.4, 1.2], 0.14); beam(g, [x - 1.75, 2.4, -1.2], [x + 1.75, 2.4, -1.2], 0.14); beam(g, [x - 1.3, 1.3, 1.2], [x + 1.3, 1.3, 1.2], 0.1);
      beam(g, [x - 1.3, 0.2, 1.2], [x + 1.3, 2.3, 1.2], 0.08); beam(g, [x + 1.3, 0.2, 1.2], [x - 1.3, 2.3, 1.2], 0.08);
      add(g, box(2.6, 0.4, 2.4), ins, x, 2.2, 0); const fr = add(g, new T.CylinderGeometry(1.838, 0.247, 1.3, 4, 1), ins, x, 1.35, 0, 0, PI / 4); fr.scale.set(1, 1, 2.4 / 2.6);
      add(g, box(0.35, 0.25, 0.35), dark, x, 0.6, 0);
      for (let i = -1; i <= 1; i += 0.25) beam(g, [x + i * 1.25, 2.45, -1.15], [x + i * 1.25, 2.45, 1.15], 0.04, acc); }
    /* 2 конвейер */
    { const g = U.conv, A = [-7.5, 0.5, 0], B = [0, 5.25, 0];
      beam(g, A, B, 0.22, steel, 0.7); add(g, cyl(0.2, 0.75, 20), dark, A[0], A[1], 0, PI / 2); add(g, cyl(0.2, 0.75, 20), dark, B[0], B[1], 0, PI / 2);
      add(g, box(0.7, 0.45, 0.8), steel, 0.15, 5.25, 0); add(g, cyl(0.16, 0.35, 16), acc, B[0], B[1], 0.55, PI / 2);
      [[-4.8, 2.2], [-2.2, 3.85]].forEach(([x, h]) => { [0.32, -0.32].forEach((z) => beam(g, [x, 0, z], [x, h, z], 0.09)); }); }
    /* 3 горелка */
    { const g = U.burner, y = 2.75;
      add(g, cyl(0.3, 1.1, 24), dark, -1.85, y, 0, 0, 0, PI / 2); add(g, cyl(0.4, 0.18, 24), acc, -2.45, y, 0, 0, 0, PI / 2);
      add(g, cyl(0.3, 0.4, 24), acc, -2.1, y, -0.75, PI / 2); add(g, box(0.4, 0.4, 0.3), dark, -2.1, y, -0.45);
      beam(g, [-2.6, y - 0.25, -0.2], [-2.6, y - 0.25, -1.6], 0.08, acc); beam(g, [-2.6, y - 0.25, -1.6], [-2.6, 0, -1.6], 0.08, acc);
      [-0.5, -0.9, -1.25].forEach((z) => add(g, box(0.18, 0.22, 0.16), dark, -2.6, y - 0.25, z));
      [0.4, -0.4].forEach((z) => beam(g, [-1.85, 0, z], [-1.85, 2.45, z], 0.08)); }
    /* 4 барабан на опорах, выгрузка на сито */
    { const g = U.drum, y = 2.75, fy = 1.7;
      add(g, cyl(0.55, 11.8, 40), steel, 5.9, y, 0, 0, 0, PI / 2);
      [1.8, 9.6].forEach((x) => { add(g, cyl(0.68, 0.28, 40), dark, x, y, 0, 0, 0, PI / 2); [-0.5, 0.5].forEach((z) => add(g, cyl(0.2, 0.3, 18), acc, x, fy + 0.25, z, 0, 0, PI / 2)); });
      add(g, cyl(0.76, 0.14, 48), acc, 8.8, y, 0, 0, 0, PI / 2); add(g, box(0.7, 0.5, 0.5), acc, 8.8, fy + 0.15, 0.9);
      add(g, cyl(0.75, 1.3, 40), ins, -0.65, y, 0, 0, 0, PI / 2);
      add(g, box(0.6, 1.6, 0.6), steel, 0.1, 4.3, 0, 0, 0, -0.15);
      add(g, box(0.7, 1.9, 1.4), dark, 12.15, 2.65, 0); add(g, box(0.45, 0.35, 0.6), steel, 12.3, 1.55, 0, 0, 0, -0.4);
      beam(g, [-1.4, fy, 0.75], [12.5, fy, 0.75], 0.16); beam(g, [-1.4, fy, -0.75], [12.5, fy, -0.75], 0.16);
      for (let x = -1.2; x <= 12.4; x += 2.7) { beam(g, [x, fy, 0.75], [x, fy, -0.75], 0.12); [0.75, -0.75].forEach((z) => beam(g, [x, 0, z], [x, fy, z], 0.12)); } }
    /* 5 рукавный фильтр */
    { const g = U.filter, x = 12.15, z = -2.8;
      add(g, cyl(0.22, 0.5, 20), steel, x, 3.85, 0); add(g, cyl(0.22, 2.0, 20), steel, x, 4.1, -1.0, PI / 2);
      add(g, cyl(0.75, 2.4, 40), glass, x, 2.9, z); add(g, new T.ConeGeometry(0.75, 0.7, 40), steel, x, 1.35, z, PI); add(g, cyl(0.78, 0.35, 40), steel, x, 4.28, z);
      const bags = new T.InstancedMesh(cyl(0.065, 2.0, 10), bagM, 52), d = new T.Object3D(); let i = 0;
      [[0.12, 4], [0.28, 10], [0.44, 16], [0.62, 22]].forEach(([r, c]) => { for (let j = 0; j < c; j++) { const a = (j / c) * PI * 2; d.position.set(x + r * Math.cos(a), 2.95, z + r * Math.sin(a)); d.updateMatrix(); bags.setMatrixAt(i++, d.matrix); } });
      g.add(bags);
      [[0.6, 0.6], [0.6, -0.6], [-0.6, 0.6], [-0.6, -0.6]].forEach(([a, b]) => beam(g, [x + a, 0, z + b], [x + a, 2.2, z + b], 0.1));
      add(g, box(0.3, 0.3, 0.3), acc, x + 0.55, 1.45, z - 0.45);
      add(g, cyl(0.38, 0.35, 28), acc, x, 4.7, z); add(g, cyl(0.14, 1.6, 18), steel, x, 5.65, z); }
    /* 6 вибросито */
    { const g = U.screen;
      add(g, box(2.72, 0.3, 1.2), steel, 13.6, 1.25, 0, 0, 0, -0.12);
      add(g, cyl(0.18, 0.4, 18), acc, 13.6, 0.85, 0.75, PI / 2);
      [[12.4, 0.5], [12.4, -0.5], [14.8, 0.5], [14.8, -0.5]].forEach(([a, b]) => beam(g, [a, 0, b], [a, 1.1 - (a - 13.6) * 0.12, b], 0.09));
      [13.1, 14.2].forEach((x) => add(g, new T.ConeGeometry(0.35, 0.5, 4), dark, x, 0.7, 0, PI, PI / 4)); }
    /* 7 элеватор */
    { const g = U.elev, x = 16.0;
      add(g, box(0.8, 6, 0.37), steel, x, 3, 0); add(g, box(1.0, 0.55, 0.55), dark, x, 6.2, 0); add(g, cyl(0.18, 0.45, 18), acc, x, 6.2, 0.5, PI / 2);
      [1.5, 3.5].forEach((y) => add(g, box(0.9, 0.06, 0.45), dark, x, y, 0));
      beam(g, [x + 0.5, 6.0, 0], [18.4, 4.85, 0], 0.26, steel); }
    /* 8 бункер хранения */
    { const g = U.hopper, x = 19.0;
      add(g, box(1.6, 2.0, 1.6), ins, x, 3.7, 0); add(g, new T.ConeGeometry(1.13, 1.1, 4, 1), ins, x, 2.15, 0, PI, PI / 4);
      [[0.8, 0.8], [0.8, -0.8], [-0.8, 0.8], [-0.8, -0.8]].forEach(([a, b]) => beam(g, [x + a, 0, b], [x + a, 4.7, b], 0.12, dark));
      beam(g, [x + 0.3, 1.25, 0], [x + 0.55, 1.05, 0], 0.18, steel); }

    /* 13 смеситель JS500 на раме 5,5 × 2,5, площадка 1,3 м, верх 4,8 м; приямок под ним */
    { const g = U.mixer, P = 1.3;
      add(g, box(4.6, 0.02, 3.2), pitM, 0, 0.005, -0.2);
      [-2.75, -1.0, 1.0, 2.75].forEach((x) => [1.25, -1.25].forEach((z) => beam(g, [x, 0, z], [x, P, z], 0.16)));
      beam(g, [-2.9, P, 1.25], [2.9, P, 1.25], 0.18, yel); beam(g, [-2.9, P, -1.25], [2.9, P, -1.25], 0.18, yel); [-2.75, -1, 1, 2.75].forEach((x) => beam(g, [x, P, 1.25], [x, P, -1.25], 0.14, yel));
      [[-1.9, 1.0], [-1.9, -1.0], [1.9, 1.0], [1.9, -1.0]].forEach(([x, z]) => beam(g, [x, P, z], [x, 4.8, z], 0.16));
      [1.0, -1.0].forEach((z) => { beam(g, [-1.9, P + 0.2, z], [-2.9, P, z], 0.1); beam(g, [1.9, P + 0.2, z], [2.9, P, z], 0.1); beam(g, [-1.9, 3.4, z], [1.9, 3.4, z], 0.12); beam(g, [-1.9, 4.8, z], [1.9, 4.8, z], 0.12); });
      [-1.9, 1.9].forEach((x) => { beam(g, [x, P, 1], [x, 3.4, -1], 0.08); beam(g, [x, P, -1], [x, 3.4, 1], 0.08); });
      add(g, box(2.6, 0.8, 1.5), steel, 0, 2.2, 0); [0.36, -0.36].forEach((z) => add(g, cyl(0.42, 2.6, 30), steel, 0, 1.85, z, 0, 0, PI / 2));
      [-1.55, 1.55].forEach((x) => { add(g, box(0.45, 0.5, 0.6), acc, x, 2.15, 0.5); add(g, cyl(0.18, 0.5, 18), dark, x, 2.15, -0.2, PI / 2); });
      add(g, box(0.9, 0.35, 0.8), dark, 0, 1.25, 0);
      add(g, new T.CylinderGeometry(0.75, 0.3, 0.7, 4), steel, 0, 2.95, 0.6, 0, PI / 4);
      [-0.8, 0.8].forEach((x) => { add(g, box(0.85, 0.6, 0.8), ins, x, 4.45, -0.2); add(g, new T.CylinderGeometry(0.55, 0.12, 0.5, 4), ins, x, 3.9, -0.2, 0, PI / 4); }); }
    /* 12 скип: рельсы от пола (z 4,7) к верху (z 1,15, y 4,9) */
    const RA = new T.Vector3(0, 0.15, 4.7), RB = new T.Vector3(0, 4.9, 1.15); let bucket;
    { const g = U.skip; [0.55, -0.55].forEach((x) => beam(g, [x, RA.y, RA.z], [x, RB.y, RB.z], 0.14, yel));
      for (let t = 0.2; t < 1; t += 0.25) { const p = RA.clone().lerp(RB, t); beam(g, [-0.55, p.y, p.z], [0.55, p.y, p.z], 0.08); }
      beam(g, [0.55, 0, 2.6], [0.55, 2.9, 2.6], 0.12); beam(g, [-0.55, 0, 2.6], [-0.55, 2.9, 2.6], 0.12);
      bucket = new T.Group(); g.add(bucket); add(bucket, box(0.95, 0.55, 0.9), acc, 0, 0, 0); add(bucket, box(0.95, 0.1, 0.5), acc, 0, 0.3, 0.42, -0.5); }
    /* 10 дозировочная рама 6,8 × 1,6 × 2,9 над низом скипа */
    const DZ = 4.9;
    { const g = U.dose;
      [-3.4, -1.1, 1.1, 3.4].forEach((x) => [0.8, -0.8].forEach((z) => beam(g, [x, 0, DZ + z], [x, 2.9, DZ + z], 0.14)));
      [0.8, -0.8].forEach((z) => { beam(g, [-3.4, 2.9, DZ + z], [3.4, 2.9, DZ + z], 0.14, yel); beam(g, [-3.4, 0.12, DZ + z], [3.4, 0.12, DZ + z], 0.2); beam(g, [-3.4, 1.5, DZ + z], [-1.1, 2.9, DZ + z], 0.08); beam(g, [3.4, 1.5, DZ + z], [1.1, 2.9, DZ + z], 0.08); });
      [-3.4, -1.1, 1.1, 3.4].forEach((x) => beam(g, [x, 2.9, DZ + 0.8], [x, 2.9, DZ - 0.8], 0.12, yel));
      add(g, box(1.3, 0.9, 1.3), ins, 0, 3.55, DZ); add(g, new T.CylinderGeometry(0.92, 0.2, 0.6, 4), ins, 0, 2.95, DZ, 0, PI / 4);
      add(g, cyl(0.13, 1.4, 18), steel, 0.3, 2.55, DZ, 0, 0, PI / 2); add(g, box(0.4, 0.35, 0.35), acc, 1.2, 2.55, DZ); add(g, cyl(0.16, 0.3, 16), dark, 1.55, 2.55, DZ, 0, 0, PI / 2);
      beam(g, [-0.3, 2.5, DZ], [0, 1.0, DZ - 0.1], 0.2, steel); }
    /* 11 бункеры гипса и муки */
    { const g = U.bins; [[-1.7, 0xe9e4da], [1.7, 0xd8cdb6]].forEach(([x, c]) => { const m = M(c); add(g, cyl(0.5, 1.1, 30), m, x, 2.25, DZ); add(g, new T.ConeGeometry(0.5, 0.45, 30), m, x, 1.47, DZ, PI);
      add(g, cyl(0.2, 0.32, 16), dark, x, 1.1, DZ); for (let i = 0; i < 3; i++) add(g, cyl(0.22, 0.03, 16), acc, x, 1.0 + i * 0.1, DZ); beam(g, [x, 0.95, DZ], [x * 0.2, 0.75, DZ - 0.1], 0.14, steel); }); }
    /* 14 нижний бункер */
    { const g = U.hop; add(g, new T.CylinderGeometry(0.85, 0.2, 0.7, 4), ins, 0, 0.7, -0.1, 0, PI / 4); [-0.45, 0.45].forEach((x) => beam(g, [x * 0.4, 0.35, -0.1], [x * 2.2, 0.25, -1.0], 0.14, steel)); }
    /* 15 две фасовки */
    { const g = U.pack; [-1, 1].forEach((s) => { const x = s * 1.0; add(g, box(0.6, 0.9, 0.6), steel, x, 0.6, -1.3); add(g, cyl(0.18, 0.3, 16), acc, x + s * 0.32, 0.85, -1.3, 0, 0, PI / 2); add(g, cyl(0.05, 0.45, 10), dark, x, 0.75, -1.75, PI / 2); add(g, box(0.5, 0.16, 0.35), bagM, x, 0.62, -2.05); beam(g, [x, 0.05, -1.0], [x, 0.05, -1.6], 0.1); });
      beam(g, [-1.6, 0.02, -2.6], [1.6, 0.02, -2.6], 0.06, dark, 0.7); }

    // Ковш скипа ездит по рельсам: цикл 8 с. off — сдвиг, если узел скипа перецентрован.
    const dir = RB.clone().sub(RA), off = new T.Vector3();
    function tick(clock) {
      const p8 = (clock % 8) / 8, u = p8 < 0.45 ? 0 : p8 < 0.65 ? (p8 - 0.45) / 0.2 : p8 < 0.75 ? 1 : p8 < 0.95 ? 1 - (p8 - 0.75) / 0.2 : 0;
      bucket.position.copy(RA).addScaledVector(dir, Math.min(0.97, u)).add(new T.Vector3(0, 0.3, 0)).sub(off);
      bucket.rotation.x = p8 > 0.65 && p8 < 0.75 ? -0.9 * Math.sin(((p8 - 0.65) / 0.1) * PI) : 0;
      return p8;
    }
    return { U, bucket, RA, RB, off, tick, steel, dark, acc };
  }

  return { UNITS, LINK, CONNS, build };
})();
