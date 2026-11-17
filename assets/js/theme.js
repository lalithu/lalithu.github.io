(() => {
  const key = 'portfolio-theme';
  const system = window.matchMedia('(prefers-color-scheme: dark)');
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  const choices = ['system', 'light', 'dark'];
  let preference = 'light';

  try {
    const saved = localStorage.getItem(key);
    if (choices.includes(saved)) preference = saved;
  } catch {
    // The page still works when storage is unavailable.
  }

  const root = document.documentElement;

  function resolvedTheme() {
    return preference === 'system' ? (system.matches ? 'dark' : 'light') : preference;
  }

  function applyTheme() {
    root.dataset.theme = resolvedTheme();
  }

  function switchTheme() {
    if (root.dataset.theme === resolvedTheme()) return;

    if (document.startViewTransition && !reducedMotion.matches) {
      document.startViewTransition(applyTheme);
    } else {
      applyTheme();
    }
  }

  applyTheme();
  system.addEventListener('change', switchTheme);

  document.addEventListener('DOMContentLoaded', () => {
    const options = document.querySelector('.theme-options');
    if (!options) return;

    options.querySelector(`input[value="${preference}"]`).checked = true;
    if (!document.startViewTransition) root.classList.add('theme-transition-fallback');
    options.hidden = false;
    options.addEventListener('change', (event) => {
      preference = event.target.value;
      switchTheme();
      try {
        localStorage.setItem(key, preference);
      } catch {
        // Keep the current selection for this page.
      }
    });
  });
})();
