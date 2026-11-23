// Общие мелочи сайта: тема, активный пункт меню, год в подвале.
(() => {
  const root = document.documentElement;
  try { const s = localStorage.getItem("easymix-theme"); if (s) root.dataset.theme = s; } catch (e) {}
  document.addEventListener("DOMContentLoaded", () => {
    const btn = document.querySelector("[data-theme-toggle]");
    if (btn) btn.addEventListener("click", () => {
      const now = root.dataset.theme || (matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light");
      root.dataset.theme = now === "dark" ? "light" : "dark";
      try { localStorage.setItem("easymix-theme", root.dataset.theme); } catch (e) {}
    });
    const here = location.pathname.split("/").pop() || "index.html";
    document.querySelectorAll(".menu a").forEach((a) => {
      const raw = a.getAttribute("href");
      if (raw.includes("#")) return;
      if (raw === here) a.setAttribute("aria-current", "page");
    });
    document.querySelectorAll("[data-year]").forEach((el) => (el.textContent = new Date().getFullYear()));
  });
})();

// Цвета для 3D: тёмная ли сейчас тема.
window.easymixDark = () => {
  const t = document.documentElement.dataset.theme;
  return t ? t === "dark" : matchMedia("(prefers-color-scheme: dark)").matches;
};
