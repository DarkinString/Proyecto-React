import { useEffect, useState } from 'react';

function initialTheme() {
  try {
    const saved = localStorage.getItem('mirukaleta.theme');
    if (saved === 'light' || saved === 'dark') return saved;
  } catch {  }
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

export default function useTheme() {
  const [theme, setTheme] = useState(initialTheme);

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    document.documentElement.style.colorScheme = theme;
    try { localStorage.setItem('mirukaleta.theme', theme); } catch {  }
  }, [theme]);

  function toggleTheme() {
    setTheme((current) => current === 'light' ? 'dark' : 'light');
  }

  return { theme, toggleTheme };
}
