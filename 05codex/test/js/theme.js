(() => {
    // Keep the storage key used by the existing lotto theme.
    const themeKey = "lotto-645-theme";
    const root = document.documentElement;
    let toggle;

    function applyTheme(theme) {
        root.dataset.theme = theme;
        toggle?.setAttribute("aria-pressed", String(theme === "dark"));
    }

    function readTheme() {
        try {
            applyTheme(localStorage.getItem(themeKey) === "dark" ? "dark" : "light");
        } catch {
            // Retain the current appearance if storage is unavailable.
        }
    }

    readTheme();

    document.addEventListener("DOMContentLoaded", () => {
        toggle = document.querySelector("[data-theme-toggle]");
        if (!toggle) return;
        toggle.setAttribute("aria-pressed", String(root.dataset.theme === "dark"));
        toggle.addEventListener("click", () => {
            if (toggle.disabled) return;
            const theme = root.dataset.theme === "dark" ? "light" : "dark";
            applyTheme(theme);
            try {
                localStorage.setItem(themeKey, theme);
            } catch {
                // The current page can still change appearance.
            }
        });
    });

    window.addEventListener("pageshow", (event) => {
        if (event.persisted) readTheme();
    });
    window.addEventListener("storage", (event) => {
        if (event.key === themeKey || event.key === null) readTheme();
    });
})();
