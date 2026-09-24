import { useEffect, useRef } from 'react';

const links = [
  { href: '#historia', label: 'Historia' },
  { href: '#recuerdos', label: 'Recuerdos' },
  { href: '#musica', label: 'Música' },
  { href: '#juegos', label: 'Juegos' },
  { href: '#coleccionables', label: 'Coleccionables' },
];

export default function Header({ theme, onToggleTheme }) {
  const headerRef = useRef(null);
  useEffect(() => {
    const updateHeight = () => document.documentElement.style.setProperty('--header-height', `${headerRef.current.getBoundingClientRect().height}px`);
    const observer = new ResizeObserver(updateHeight);
    observer.observe(headerRef.current);
    updateHeight();
    return () => observer.disconnect();
  }, []);
  return (
    <header ref={headerRef} className="site-header border-b border-line/60">
      <div className="header-inner mx-auto max-w-6xl px-6 sm:px-10">
        <a href="#inicio" className="header-brand font-serif font-bold text-accent">Paola Abigail García Rivera<span aria-hidden="true"> ♥</span></a>
        <nav aria-label="Navegación principal" className="header-nav text-sm">
          {links.map((link) => (
            <a key={link.href} href={link.href} className="py-2 hover:text-accent hover:underline underline-offset-4">
              {link.label}
            </a>
          ))}
        </nav>
        <button
          type="button"
          onClick={onToggleTheme}
          aria-label={theme === 'dark' ? 'Activar modo día' : 'Activar modo noche'}
          className="button-secondary header-theme"
        >
          <span aria-hidden="true">{theme === 'dark' ? '☀' : '☾'}</span> {theme === 'dark' ? 'Día' : 'Noche'}
        </button>
      </div>
    </header>
  );
}
