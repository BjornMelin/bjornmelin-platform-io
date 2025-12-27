"use client";

/**
 * @fileoverview Inline script to prevent theme flash on static export.
 * This script runs before React hydration to apply the correct theme class.
 *
 * Note: dangerouslySetInnerHTML is safe here because the script content is a
 * static string defined in source code, not user-provided content.
 */

export function ThemeScript() {
  const themeScript = `
    (function() {
      function getTheme() {
        try {
          var stored = localStorage.getItem('theme');
          if (stored === 'dark') return 'dark';
          if (stored === 'light') return 'light';
          return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
        } catch (e) {
          return 'light';
        }
      }

      function applyTheme(theme) {
        document.documentElement.classList.toggle('dark', theme === 'dark');
      }

      applyTheme(getTheme());

      window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', function(e) {
        try {
          var stored = localStorage.getItem('theme');
          if (stored === 'system' || !stored) {
            applyTheme(e.matches ? 'dark' : 'light');
          }
        } catch (err) {}
      });
    })();
  `;

  // biome-ignore lint/security/noDangerouslySetInnerHtml: Static script for theme initialization, not user content
  return <script dangerouslySetInnerHTML={{ __html: themeScript }} suppressHydrationWarning />;
}
