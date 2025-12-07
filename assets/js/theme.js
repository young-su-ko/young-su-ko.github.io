document.addEventListener('DOMContentLoaded', () => {
  const themeToggle = document.getElementById('theme-toggle');
  const lightIcon = document.getElementById('theme-toggle-light-icon');
  const darkIcon = document.getElementById('theme-toggle-dark-icon');

  const setTheme = (theme) => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('theme', theme);
    
    if (theme === 'dark') {
      lightIcon.classList.remove('show');
      darkIcon.classList.add('show');
      // Switch highlight.js theme
      document.getElementById('highlight-theme-light').disabled = true;
      document.getElementById('highlight-theme-dark').disabled = false;
    } else {
      lightIcon.classList.add('show');
      darkIcon.classList.remove('show');
      // Switch highlight.js theme
      document.getElementById('highlight-theme-light').disabled = false;
      document.getElementById('highlight-theme-dark').disabled = true;
    }
    
    // Re-highlight code blocks with new theme
    if (window.hljs) {
      document.querySelectorAll('pre code').forEach((block) => {
        hljs.highlightElement(block);
      });
    }
    
    // Re-render KaTeX with new theme colors
    if (window.renderMathInElement) {
      renderMathInElement(document.body, {
        delimiters: [
          {left: '$$', right: '$$', display: true},
          {left: '$', right: '$', display: false}
        ],
        throwOnError: false
      });
    }
  };

  const currentTheme = document.documentElement.getAttribute('data-theme');
  if (currentTheme === 'dark') {
    lightIcon.classList.remove('show');
    darkIcon.classList.add('show');
    document.getElementById('highlight-theme-light').disabled = true;
    document.getElementById('highlight-theme-dark').disabled = false;
  } else {
    lightIcon.classList.add('show');
    darkIcon.classList.remove('show');
    document.getElementById('highlight-theme-light').disabled = false;
    document.getElementById('highlight-theme-dark').disabled = true;
  }

  themeToggle.addEventListener('click', () => {
    const currentTheme = document.documentElement.getAttribute('data-theme');
    setTheme(currentTheme === 'dark' ? 'light' : 'dark');
  });

  window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
    if (!localStorage.getItem('theme')) {
      setTheme(e.matches ? 'dark' : 'light');
    }
  });
});