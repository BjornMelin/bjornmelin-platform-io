/**
 * Injects a theme initialization script that prevents flash of unstyled theme on page load.
 * Runs before React hydration to detect stored preference, apply the correct theme class,
 * and handle theme changes via data-theme-set attributes.
 * @returns {JSX.Element} A script element containing the theme initialization logic.
 */
export function ThemeScript() {
  const themeScript = `
    (function() {
      function getStoredTheme() {
        try {
          return localStorage.getItem('theme');
        } catch (e) {
          return null;
        }
      }

      function getTheme() {
        var stored = getStoredTheme();
        if (stored === 'dark') return 'dark';
        if (stored === 'light') return 'light';
        return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
      }

      function applyTheme(theme) {
        document.documentElement.classList.toggle('dark', theme === 'dark');
      }

      function persistTheme(theme) {
        try {
          if (!theme || theme === 'system') {
            localStorage.setItem('theme', 'system');
          } else {
            localStorage.setItem('theme', theme);
          }
        } catch (e) {
          ${process.env.NODE_ENV === "development" ? 'if (typeof console !== "undefined" && console.warn) console.warn("Failed to persist theme:", e);' : ""}
        }
      }

      applyTheme(getTheme());

      // Only react to OS theme changes if user hasn't set an explicit preference
      window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', function(e) {
        var stored = getStoredTheme();
        if (stored === 'system' || !stored) {
          applyTheme(e.matches ? 'dark' : 'light');
        }
      });

      document.addEventListener('click', function(event) {
        var target = event.target;
        if (!target || !target.closest) return;
        var trigger = target.closest('[data-theme-set]');
        if (!trigger) return;
        var nextTheme = trigger.getAttribute('data-theme-set');
        if (!nextTheme) return;
        persistTheme(nextTheme);
        applyTheme(nextTheme === 'system' ? getTheme() : nextTheme);
      });
    })();
  `;

  // biome-ignore lint/security/noDangerouslySetInnerHtml: Static script for theme initialization, not user content
  return <script dangerouslySetInnerHTML={{ __html: themeScript }} suppressHydrationWarning />;
}
