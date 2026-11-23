// Линия целиком: сушка → шнек → JS500 → фасовка. Режим «разнести узлы», поток материала, калькулятор.
(() => {
  const EQ = window.EasyMixEquipment;
  const OX = 27.5, OZ = -4.9;
  const ALL = EQ.UNITS.slice(0, 8).map((u) => [u.name, u.sub]).concat([[EQ.LINK.name, EQ.LINK.sub]], EQ.UNITS.slice(8).map((u) => [u.name, u.sub]));
  const gEl = document.getElementById("groups");
  if (gEl) gEl.innerHTML = [["Сушка песка", ALL.slice(0, 8), 1], ["Связь, смешивание и фасовка", ALL.slice(8), 9]]
    .map((g) => `<div><h3>${g[0]}</h3><ol start="${g[2]}">${g[1].map((n) => `<li>${n[0]} <span>— ${n[1]}</span></li>`).join("")}</ol></div>`).join("");

  const stage = document.getElementById("stage");
  if (stage) {
    const svg = document.getElementById("lines"), tagsEl = document.getElementById("tags");
    const RM = matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (typeof THREE === "undefined") stage.insertAdjacentHTML("afterbegin", '<p class="no3d">3D-модель не загрузилась. Расчёты ниже работают.</p>');
    else {
      const T = THREE;
      const renderer = new T.WebGLRenderer({ antialias: true, alpha: true }); renderer.setPixelRatio(Math.min(devicePixelRatio, 2)); stage.prepend(renderer.domElement);
      const scene = new T.Scene(), cam = new T.PerspectiveCamera(35, 1, 0.1, 400);
      scene.add(new T.HemisphereLight(0xfff6e6, 0x6b5a40, 0.85)); const sun = new T.DirectionalLight(0xffffff, 0.8); sun.position.set(8, 20, 14); scene.add(sun);
      const grid = new T.GridHelper(90, 90, 0x9c8f78, 0xbfb39c); grid.position.set(12, 0, 0); grid.material.transparent = true; grid.material.opacity = 0.45; scene.add(grid);
      const lineMat = new T.LineBasicMaterial({ color: 0x1c1914, transparent: true, opacity: 0.55 });
      const M = (c, o) => new T.MeshStandardMaterial(Object.assign({ color: c, metalness: 0.35, roughness: 0.6 }, o || {}));
      const E = EQ.build(T, { lineMat, mat: M });
      const exo = { rhop: [-3, 0, 3], conv: [-1.5, 1.2, 3.5], burner: [-2.5, 0, -3], drum: [0, 0, 1.8], filter: [0.5, 1.6, -3], screen: [0.5, 0, 3.5], elev: [2, 0, -3], hopper: [3, 0, 3], link: [3.5, 1.5, 2], dose: [0, 0.8, 3], bins: [0, 2.2, 4.5], skip: [0, 0, 1.6], mixer: [0, 1.6, 0], hop: [0, -0.4, -1.6], pack: [0, -0.6, -2.8] };
      const J = new T.Group(); J.position.set(OX, 0, OZ); scene.add(J);
      const G = Object.assign({}, E.U, { link: new T.Group() });
      EQ.UNITS.forEach((u) => (u.c === "mix" ? J : scene).add(G[u.k])); scene.add(G.link);
      // шнек сухого песка: бункер хранения → бункер песка на дозировочной раме
      const LA = [19.55, 1.05, 0], LB = [OX - 0.2, 4.4, 0];
      {
        const g = G.link, cyl = (r, h, s) => new T.CylinderGeometry(r, r, h, s || 28);
        const beam = (a, b, t, mat) => { const A = new T.Vector3(...a), B = new T.Vector3(...b), d = B.clone().sub(A), m = new T.Mesh(new T.BoxGeometry(d.length(), t, t), mat || E.dark); m.position.copy(A.clone().add(B).multiplyScalar(0.5)); m.quaternion.setFromUnitVectors(new T.Vector3(1, 0, 0), d.normalize()); g.add(m); m.add(new T.LineSegments(new T.EdgesGeometry(m.geometry), lineMat)); };
        beam(LA, LB, 0.3, E.steel);
        const m1 = new T.Mesh(new T.BoxGeometry(0.5, 0.35, 0.4), E.acc); m1.position.set(LB[0] + 0.1, LB[1] + 0.3, 0.45); g.add(m1);
        const m2 = new T.Mesh(cyl(0.16, 0.3, 16), E.dark); m2.position.set(LB[0] + 0.45, LB[1] + 0.3, 0.45); m2.rotation.z = Math.PI / 2; g.add(m2);
        [[22.5, 2.4], [25.0, 3.5]].forEach(([x, h]) => { beam([x, 0, 0.25], [x, h, 0.25], 0.09); beam([x, 0, -0.25], [x, h, -0.25], 0.09); });
        beam([LB[0], LB[1], 0], [OX, 4.0, 0], 0.2, E.steel);
      }

      function path(pts) { const v = pts.map((p) => new T.Vector3(...p)); const L = [0]; for (let i = 1; i < v.length; i++) L.push(L[i - 1] + v[i].distanceTo(v[i - 1])); return { v, L, T: L[L.length - 1] }; }
      function at(p, t, o) { const d = t * p.T; let i = 1; while (i < p.L.length - 1 && p.L[i] < d) i++; const f = (d - p.L[i - 1]) / (p.L[i] - p.L[i - 1] || 1); return o.copy(p.v[i - 1]).lerp(p.v[i], f); }
      const T3 = (a) => a.map((p) => [p[0] + OX, p[1], p[2] + OZ]);
      const SK = [E.RA.x, E.RA.y + 0.35, E.RA.z];
      const flows = [
        { p: path([[-7.2, 2.5, 0], [-7.2, 0.85, 0], [-7.3, 0.75, 0], [-0.1, 5.45, 0], [0.1, 5.1, 0], [0.1, 4.4, 0], [0.4, 2.5, 0], [11.8, 2.35, 0], [12.2, 1.9, 0], [12.4, 1.5, 0], [14.9, 1.15, 0], [15.4, 0.35, 0], [16.0, 0.35, 0], [16.0, 6.1, 0], [18.4, 5.05, 0], [19.0, 4.6, 0], [19.0, 3.0, 0]]), c: 0xd8a64a, n: 150, s: 0.022, a: 1 },
        { p: path([[11.6, 2.9, 0], [12.15, 3.6, 0], [12.15, 4.1, 0], [12.15, 4.1, -2.0], [12.15, 3.2, -2.8], [12.15, 4.3, -2.8], [12.15, 6.4, -2.8]]), c: 0xb9b2a6, n: 50, s: 0.05, a: 1 },
        { p: path([[19, 1.7, 0], [19.4, 1.1, 0], LB, [OX, 4.6, 0], [OX, 3.4, 0]]), c: 0xd8a64a, n: 50, s: 0.06, a: 1 },
        { p: path(T3([[0, 3.4, 4.9], [0, 2.6, 4.9], [-0.3, 2.55, 4.9], [0, 1.0, 4.8], SK])), c: 0xd8a64a, n: 40, s: 0.18, a: 0 },
        { p: path(T3([[-1.7, 2.5, 4.9], [-1.7, 0.95, 4.9], [-0.3, 0.75, 4.8], SK])), c: 0xf2efe8, n: 30, s: 0.18, a: 0 },
        { p: path(T3([[1.7, 2.5, 4.9], [1.7, 0.95, 4.9], [0.2, 0.75, 4.8], SK])), c: 0xb9a888, n: 30, s: 0.18, a: 0 },
        { p: path(T3([[0, 1.2, 0], [0, 0.75, -0.1], [-0.9, 0.3, -1.0], [-1, 0.7, -1.6], [-1, 0.62, -2.05]])), c: 0xc4b79c, n: 25, s: 0.18, a: 1 },
        { p: path(T3([[0, 1.2, 0], [0, 0.75, -0.1], [0.9, 0.3, -1.0], [1, 0.7, -1.6], [1, 0.62, -2.05]])), c: 0xc4b79c, n: 25, s: 0.18, a: 1 },
      ];
      const fx = flows.map((f) => { const m = new T.InstancedMesh(new T.SphereGeometry(f.n > 100 ? 0.07 : 0.05, 6, 5), M(f.c, { roughness: 1 }), f.n); scene.add(m); return { ...f, m, t: Array.from({ length: f.n }, (_, i) => i / f.n) }; });

      const VIEWS = {
        all: { t: [12, 1.5, -1], R: 58, th: 0.45, ph: 1.12, tags: [[[5.9, 3.6, 0], "drum", "Линия сушки песка", "узлы 1–8", 90], [[23.5, 2.9, 0], "link", "Шнек сухого песка", "узел 9", 60], [[OX, 5, OZ], "mixer", "Смесительный узел JS500", "узлы 10–15", 90]] },
        dry: { t: [6, 2.4, -0.8], R: 38, th: 0.55, ph: 1.12, tags: [[[-7.2, 2.6, 0], "rhop", 1, 60], [[-3.8, 3.2, 0], "conv", 2, 150], [[-2.4, 2.3, -0.6], "burner", 3, 40], [[5.9, 3.5, 0], "drum", 4, 60], [[12.15, 4.6, -2.8], "filter", 5, 150], [[13.6, 1.5, 0], "screen", 6, 110], [[16, 6.6, 0], "elev", 7, 50], [[19, 4.9, 0], "hopper", 8, 90]] },
        mix: { t: [OX - 1, 1.8, -1.6], R: 26, th: 0.95, ph: 1.15, tags: [[[23.5, 2.9, 0], "link", 9, 80], [[OX, 4.0, 0], "dose", 10, -150], [[OX - 1.7, 2.8, 0], "bins", 11, 150], [[OX, 3.0, 2.7 + OZ], "skip", 12, 40], [[OX, 4.9, -0.2 + OZ], "mixer", 13, 110], [[OX, 0.9, -0.1 + OZ], "hop", 14, -110], [[OX + 1, 1.1, -1.3 + OZ], "pack", 15, 60]] },
      };
      let view = "all", tagList = [];
      const tgt = new T.Vector3(); let th = 0, ph = 1.1, R = 40, drag = null;
      function setView(v) {
        view = v; const Vw = VIEWS[v]; tgt.set(...Vw.t); R = stage.clientWidth < 600 ? Vw.R * 1.4 : Vw.R; th = Vw.th; ph = Vw.ph;
        tagList = Vw.tags.map((t) => (typeof t[2] === "number" ? { p: t[0], k: t[1], n: t[2], name: ALL[t[2] - 1][0], sub: ALL[t[2] - 1][1], lift: t[3] } : { p: t[0], k: t[1], n: "", name: t[2], sub: t[3], lift: t[4] }));
        tagsEl.innerHTML = tagList.map((t, i) => `<div class="tag" id="tg${i}">${t.n ? `<i>${t.n}</i>` : ""}${t.name}<small>${t.sub}</small></div>`).join("");
        tagList.forEach((t, i) => (t.el = document.getElementById("tg" + i)));
        document.querySelectorAll("[data-v]").forEach((b) => b.setAttribute("aria-pressed", String(b.dataset.v === v)));
      }
      document.querySelectorAll("[data-v]").forEach((b) => (b.onclick = () => setView(b.dataset.v)));
      stage.addEventListener("pointerdown", (e) => { if (e.target.closest("button")) return; drag = [e.clientX, e.clientY]; stage.setPointerCapture(e.pointerId); stage.style.cursor = "grabbing"; });
      stage.addEventListener("pointermove", (e) => { if (!drag) return; th -= (e.clientX - drag[0]) * 0.006; ph = Math.min(1.5, Math.max(0.25, ph - (e.clientY - drag[1]) * 0.006)); drag = [e.clientX, e.clientY]; });
      stage.addEventListener("pointerup", () => { drag = null; stage.style.cursor = "grab"; });
      stage.addEventListener("wheel", (e) => { e.preventDefault(); R = Math.min(110, Math.max(8, R * (1 + e.deltaY * 0.001))); }, { passive: false });
      stage.style.cursor = "grab";
      let exploded = false, flow = true, ex = 0, clock = 0;
      const bExp = document.getElementById("bExp"), bFlow = document.getElementById("bFlow");
      bExp.onclick = () => { exploded = !exploded; bExp.setAttribute("aria-pressed", String(exploded)); bExp.textContent = exploded ? "Собрать" : "Разнести узлы"; };
      bFlow.onclick = () => { flow = !flow; bFlow.setAttribute("aria-pressed", String(flow)); };
      document.getElementById("bReset").onclick = () => setView(view);
      function themeLines() { const li = window.easymixDark(); lineMat.color.set(li ? 0xefe7d8 : 0x1c1914); grid.material.opacity = li ? 0.25 : 0.45; }
      themeLines(); new MutationObserver(themeLines).observe(document.documentElement, { attributes: true }); matchMedia("(prefers-color-scheme: dark)").addEventListener("change", themeLines);
      function size() { const w = stage.clientWidth, h = stage.clientHeight; renderer.setSize(w, h, false); cam.aspect = w / h; cam.updateProjectionMatrix(); svg.setAttribute("viewBox", `0 0 ${w} ${h}`); }
      new ResizeObserver(size).observe(stage); size(); setView("all");
      let visible = true; new IntersectionObserver((en) => (visible = en[en.length - 1].isIntersecting), { rootMargin: "200px" }).observe(stage);
      const v = new T.Vector3(), o = new T.Object3D(); let last = performance.now();
      function frame(now) {
        const dt = Math.min(0.05, (now - last) / 1000); last = now;
        if (visible) {
          if (!drag && !RM) th += dt * 0.02;
          ex += ((exploded ? 1 : 0) - ex) * (RM ? 1 : Math.min(1, dt * 4));
          for (const k in G) { const e = exo[k]; G[k].position.set(e[0] * ex, e[1] * ex, e[2] * ex); }
          if (flow && !RM) clock += dt;
          const p8 = E.tick(clock);
          cam.position.set(tgt.x + R * Math.sin(ph) * Math.sin(th), tgt.y + R * Math.cos(ph), tgt.z + R * Math.sin(ph) * Math.cos(th)); cam.lookAt(tgt);
          const show = flow && ex < 0.05;
          fx.forEach((f) => { const on = show && (f.a || p8 < 0.45); f.m.visible = on; if (!on) return; for (let i = 0; i < f.n; i++) { f.t[i] = (f.t[i] + dt * (RM ? 0 : f.s)) % 1; at(f.p, f.t[i], o.position); o.position.z += Math.sin(i * 7.3) * 0.06; o.updateMatrix(); f.m.setMatrixAt(i, o.matrix); } f.m.instanceMatrix.needsUpdate = true; });
          renderer.render(scene, cam);
          const W = stage.clientWidth, H = stage.clientHeight; let sl = "";
          tagList.forEach((t) => {
            const e = exo[t.k]; v.set(t.p[0] + e[0] * ex, t.p[1] + e[1] * ex, t.p[2] + e[2] * ex).project(cam); const x = ((v.x + 1) / 2) * W, y = ((1 - v.y) / 2) * H;
            if (v.z > 1 || x < -50 || x > W + 50) { t.el.style.display = "none"; return; }
            t.el.style.display = ""; const tx = Math.min(W - 90, Math.max(90, x)), ly = Math.min(H - 70, Math.max(96, y - t.lift * (W < 600 ? 0.6 : 1)));
            t.el.style.transform = `translate(${tx}px, ${ly}px) translate(-50%, -100%)`;
            sl += `<line x1="${x}" y1="${y}" x2="${tx}" y2="${ly}" stroke="currentColor" stroke-width="1"/><circle cx="${x}" cy="${y}" r="3.5" fill="#e2481c"/>`;
          });
          svg.innerHTML = sl;
        }
        requestAnimationFrame(frame);
      }
      svg.style.color = "var(--ink)"; requestAnimationFrame(frame);
    }
  }

  /* ---------- калькулятор ---------- */
  const ids = ["T", "sh", "ps", "pg", "pf", "w1", "w2", "t1", "t2", "t0", "nb", "bd", "bl", "mode", "cbw", "bv", "rho", "tm", "td", "qs", "qg", "qf", "tk", "bag", "pk"];
  if (!document.getElementById("T")) return;
  const f = (x, d = 0) => x.toLocaleString("ru-RU", { maximumFractionDigits: d, minimumFractionDigits: d });
  const col = (p) => (p <= 0.85 ? "#5fc58a" : p <= 1 ? "#f0b44c" : "#ff6a3d");
  try { const s = JSON.parse(localStorage.getItem("easymix-calc") || "{}"); ids.forEach((k) => { if (s[k] != null) document.getElementById(k).value = s[k]; }); } catch (e) {}
  function calc() {
    const g = {}; ids.forEach((k) => (g[k] = +document.getElementById(k).value || 0));
    try { localStorage.setItem("easymix-calc", JSON.stringify(g)); } catch (e) {}
    const tot = g.ps + g.pg + g.pf || 1, sh = g.ps / tot, se = document.getElementById("sum");
    se.textContent = "Сумма " + f(tot) + " %" + (Math.abs(tot - 100) > 0.5 ? " — пересчитано к 100 %" : ""); se.className = "sum" + (Math.abs(tot - 100) > 0.5 ? " bad" : "");
    // сушка при потребности в песке
    const Gs = Math.max(0.1, g.T * sh), Gk = Gs * 1000, dx = g.w1 / (100 - g.w1) - g.w2 / (100 - g.w2), W = Gk * dx, Vd = (Math.PI / 4) * 1.21 * 11.8, Wmax = 60 * Vd;
    const Qu = W * (2500 + 1.9 * g.t2 - 4.19 * g.t0) + Gk * 0.84 * (g.t2 - 20 - g.t0), Q = Qu / 0.8, MW = Q / 3.6e6, gas = Q / 33500;
    const k = 273 / (273 + g.t2), mg = (Qu / 0.9 / (1.05 * Math.max(50, g.t1 - g.t2))) * 1.25, Vg = mg / (1.293 * k) + W / (0.804 * k), A = g.nb * Math.PI * (g.bd / 1000) * g.bl, acr = Vg / A / 60;
    const Gwt = (Gk + W) / 1000, cv = 3600 * 0.16 * Math.pow(0.9 * (g.cbw / 1000) - 0.05, 2) * 1 * 1.6 * 0.7;
    const sand = [["Сушильный барабан", Wmax / Math.max(dx, 1e-4) / 1000], ["Рукавный фильтр", (Gs * g.mode) / Math.max(acr, 1e-6)], ["Вибросито", 9.79], ["Ковшовый элеватор", 24.3], ["Конвейер влажного песка", (cv * Gs) / Gwt], ["Шнек к дозатору", 15]];
    // JS500
    const mB = g.bv * g.rho, ms = mB * sh, mgp = (mB * g.pg) / tot, mf = (mB * g.pf) / tot;
    const fill = Math.max(ms / (g.qs * 1000 || 1), mgp / (g.qg * 1000 || 1), mf / (g.qf * 1000 || 1)) * 3600, tS = fill + g.tk, tM = 15 + g.tm + g.td;
    const mix = [["Смеситель JS500", ((3600 / tM) * mB) / 1000], ["Скип с дозировкой", ((3600 / tS) * mB) / 1000], ["Две фасовки", (2 * g.pk * g.bag) / 1000]];
    const rows = sand.map((r) => [r[0], r[1] / Math.max(sh, 0.01), "песок до " + f(r[1], 1) + " т/ч"]).concat(mix.map((r) => [r[0], r[1], ""]));
    const cap = Math.min(...rows.map((r) => r[1])), worst = rows.find((r) => r[1] === cap);
    document.getElementById("bn").textContent = f(cap, 1) + " т/ч";
    document.getElementById("bnl").innerHTML = `максимум готовой смеси. Узкое место — <b style="color:#efe7d8">${worst[0].toLowerCase()}</b>. Цель ${f(g.T, 1)} т/ч ${g.T <= cap ? '<span style="color:#5fc58a">достижима</span>' : '<span style="color:#ff6a3d">не достигается</span>'}.`;
    document.getElementById("bars").innerHTML = rows.map((r, i) => (i === 0 ? '<div class="mute" style="font-size:13px">Участок сушки — пересчёт через долю песка ' + f(sh * 100) + " %</div>" : i === sand.length ? '<div class="mute" style="font-size:13px;margin-top:6px">Участок смешивания</div>' : "") +
      `<div class="bar"><div class="t"><span>${r[0]}<small>${r[2]}</small></span><span>${f((g.T / r[1]) * 100)} % · до ${f(r[1], 1)} т/ч</span></div><div class="tr"><b style="width:${Math.min(100, (g.T / r[1]) * 66.6)}%;background:${col(g.T / r[1])}"></b><span class="lim"></span></div></div>`).join("");
    document.getElementById("kpis").innerHTML = [[f(Gs, 1) + " т/ч", "сухого песка нужно"], [f(gas) + " м³/ч", "газа на сушку"], [f(Math.min(g.T, cap) * g.sh, 1) + " т", "смеси за смену"], [f((Math.min(g.T, cap) * 1000) / (g.bag || 25) * g.sh), "мешков за смену"], [f(8.6 / Gs, 1) + " ч", "запас песка в бункере"], [f(MW, 2) + " МВт", "мощность горелки"]]
      .map((x) => `<div><b>${x[0]}</b><span>${x[1]}</span></div>`).join("");
  }
  ids.forEach((k) => document.getElementById(k).addEventListener("input", calc)); calc();
})();
