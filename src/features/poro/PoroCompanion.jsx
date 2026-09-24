import { useCallback, useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import poroImage from '../../assets/images/poro/poro.png';
import cookieImage from '../../assets/images/poro/porogalleta.png';
import { feedingMessages, poroMessages } from '../../data/poroMessages.js';
import useFloatingDrag from '../../hooks/useFloatingDrag.js';

export default function PoroCompanion({ gameMessage, gameDock }) {
  const [activeSection, setActiveSection] = useState('inicio');
  const [snacks, setSnacks] = useState(0);
  const [isEating, setIsEating] = useState(false);
  const [compact, setCompact] = useState(false);
  const feedingTimeout = useRef(null);
  const cookieRef = useRef(null);
  const poroButton = useRef(null);
  const restoreFocus = useRef(false);
  const drag = useFloatingDrag({ holdDelay: 2000 });
  const attachButton = useCallback((element) => {
    if (!element) {
      if (poroButton.current === document.activeElement) restoreFocus.current = true;
    } else if (restoreFocus.current) {
      element.focus({ preventScroll: true });
      restoreFocus.current = false;
    }
    poroButton.current = element;
  }, []);

  function resetPosition() {
    poroButton.current?.focus({ preventScroll: true });
    drag.reset();
  }

  useEffect(() => {
    const media = window.matchMedia('(max-width: 1023px)');
    const update = () => setCompact(media.matches);
    update();
    media.addEventListener('change', update);
    return () => media.removeEventListener('change', update);
  }, []);

  useEffect(() => {
    const sections = document.querySelectorAll('[data-poro-section]');
    let frame;
    function updateSection() {
      frame = undefined;
      const line = window.innerHeight * 0.3;
      let nearest = 'inicio';
      let distance = Infinity;
      sections.forEach((section) => {
        const bounds = section.getBoundingClientRect();
        const gap = Math.max(bounds.top - line, line - bounds.bottom, 0);
        if (gap < distance) { nearest = section.id; distance = gap; }
      });
      setActiveSection(nearest);
    }
    // Una sola lectura por fotograma, también cuando el juego cambia de altura.
    function scheduleUpdate() { if (frame === undefined) frame = requestAnimationFrame(updateSection); }
    const observer = new ResizeObserver(scheduleUpdate);
    sections.forEach((section) => observer.observe(section));
    updateSection();
    window.addEventListener('scroll', scheduleUpdate, { passive: true });
    window.addEventListener('resize', scheduleUpdate);
    return () => {
      observer.disconnect();
      cancelAnimationFrame(frame);
      window.removeEventListener('scroll', scheduleUpdate);
      window.removeEventListener('resize', scheduleUpdate);
    };
  }, []);

  useEffect(() => {
    return () => window.clearTimeout(feedingTimeout.current);
  }, []);

  function feedPoro() {
    if (drag.suppressClick()) return;
    setSnacks((previous) => previous + 1);
    setIsEating(true);
    window.clearTimeout(feedingTimeout.current);
    feedingTimeout.current = window.setTimeout(() => setIsEating(false), 2400);
  }

  function moveCookie(event) {
    if (drag.dragging) { event.currentTarget.dataset.pointer = 'none'; return; }
    event.currentTarget.dataset.pointer = event.pointerType;
    if (event.pointerType !== 'mouse' || !cookieRef.current) return;
    cookieRef.current.style.left = `${event.clientX}px`;
    cookieRef.current.style.top = `${event.clientY}px`;
  }

  function hideCookie(event) {
    event.currentTarget.dataset.pointer = 'none';
  }

  const message = isEating
    ? feedingMessages[(snacks - 1) % feedingMessages.length]
    : activeSection === 'juegos' && gameMessage ? gameMessage : poroMessages[activeSection] ?? poroMessages.inicio;

  const docked = compact && activeSection === 'juegos' && gameDock && !drag.hasPosition;
  const companion = (
    <aside ref={drag.ref} style={drag.style} className="poro-companion" data-holding={drag.holding} data-dragging={drag.dragging} data-positioned={drag.hasPosition} data-docked={Boolean(docked)} aria-label="Tu compañero poro">
      <div className="poro-bubble">
        <p className="mb-1 text-sm font-semibold text-accent">Un porito para los dos</p>
        <p className="poro-message" role="status">{message}</p>
      </div>
      <div className="poro-actions">
        <button
          ref={attachButton}
          type="button"
          {...drag.handleProps}
          onClick={feedPoro}
          onPointerEnter={moveCookie}
          onPointerMove={moveCookie}
          onPointerLeave={hideCookie}
          onPointerCancel={hideCookie}
          className="poro-button"
          data-eating={isEating}
          aria-label="Alimentar al poro con una porogalleta"
          aria-describedby="poro-instructions"
        >
          <img className="poro-image" src={poroImage} alt="" width="144" height="144" draggable="false" />
          <img ref={cookieRef} className="cookie-cursor" src={cookieImage} alt="" width="40" height="40" draggable="false" aria-hidden="true" />
          {isEating && <span key={snacks} className="poro-heart" aria-hidden="true">♥</span>}
        </button>
        <p id="poro-instructions" className="text-center text-sm text-accent">{drag.dragging ? '¡Vamos de paseo! Suelta para dejarme aquí.' : drag.holding ? 'Sigue presionando… ¡ya casi!' : 'Toca para alimentar. Mantén 2 segundos y arrástrame.'}</p>
        <p className="text-center text-sm text-muted">Galletitas: {snacks}</p>
        {drag.hasPosition && <button type="button" className="poro-reset" onClick={resetPosition}>Volver a mi lugar</button>}
      </div>
      <p role="status" className="sr-only">{snacks > 0 ? `El poro recibió ${snacks} ${snacks === 1 ? 'porogalleta' : 'porogalletas'}.` : ''}</p>
      <p className="sr-only">También puedes moverme con las flechas del teclado y restablecer mi posición con Escape.</p>
    </aside>
  );
  // Mantener el mismo portal al levantarlo evita perder la captura del puntero.
  // Solo CSS cambia de su espacio junto al tablero a una posición fija.
  return gameDock ? createPortal(companion, gameDock) : companion;
}
