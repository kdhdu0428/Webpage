"use strict";

(() => {
  const root = document.documentElement;
  const key = "ex01-unit-converter-theme";
  const legacyKey = location.pathname.endsWith("/weight.html")
    ? "ex02-weight-converter-theme"
    : "ex01-length-converter-theme";
  const isLocalFile = location.protocol === "file:";

  function readTheme() {
    if (isLocalFile && (location.hash === "#theme=dark" || location.hash === "#theme=light")) {
      return location.hash.slice("#theme=".length);
    }
    try {
      const saved = localStorage.getItem(key);
      if (saved !== null) return saved;
      const legacy = localStorage.getItem(legacyKey);
      if (legacy !== null) localStorage.setItem(key, legacy);
      return legacy;
    } catch {
      return null;
    }
  }

  root.dataset.theme = readTheme() === "dark" ? "dark" : "light";

  document.addEventListener("DOMContentLoaded", () => {
    const toggle = document.querySelector("#theme");
    const links = document.querySelectorAll(".site-nav a, .converter-card");

    function applyTheme(theme) {
      root.dataset.theme = theme;
      toggle.setAttribute("aria-pressed", String(theme === "dark"));

      // 로컬 파일은 페이지마다 저장소가 분리될 수 있어 링크에도 테마를 전달합니다.
      if (isLocalFile) {
        links.forEach((link) => {
          const filename = link.getAttribute("href").split("#")[0];
          link.setAttribute("href", `${filename}#theme=${theme}`);
        });
      }
    }

    applyTheme(root.dataset.theme);
    toggle.addEventListener("click", () => {
      const theme = root.dataset.theme === "dark" ? "light" : "dark";
      applyTheme(theme);
      try {
        localStorage.setItem(key, theme);
      } catch {
        // 로컬 링크를 통해 이동할 때도 선택한 테마를 전달합니다.
      }
      if (isLocalFile) {
        try {
          history.replaceState(null, "", `#theme=${theme}`);
        } catch {
          location.hash = `theme=${theme}`;
        }
      }
    });

    window.addEventListener("pageshow", (event) => {
      if (event.persisted) applyTheme(readTheme() === "dark" ? "dark" : "light");
    });
  });
})();
