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
    } else {
      lightIcon.classList.add('show');
      darkIcon.classList.remove('show');
    }
  };

  const currentTheme = document.documentElement.getAttribute('data-theme');
  if (currentTheme === 'dark') {
    lightIcon.classList.remove('show');
    darkIcon.classList.add('show');
  } else {
    lightIcon.classList.add('show');
    darkIcon.classList.remove('show');
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