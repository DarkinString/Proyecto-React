import { useRef, useState } from 'react';
import Section from '../../components/ui/Section.jsx';
import ImageLightbox from '../../components/ui/ImageLightbox.jsx';
import { GAME_LEVELS } from '../../data/gameLevels.js';
import { getLevelCollection } from '../games/gameProgress.js';
import './collectibles.css';

function formatTime(seconds) {
  const rounded = Math.floor(seconds);
  return `${Math.floor(rounded / 60)}:${String(rounded % 60).padStart(2, '0')}`;
}

export default function CollectiblesSection({ records, storageError }) {
  const track = useRef(null);
  const [activeIndex, setActiveIndex] = useState(0);
  const [openLevel, setOpenLevel] = useState(null);
  const unlockedCount = GAME_LEVELS.filter((level) => getLevelCollection(records, level.id).unlocked).length;
  // El visor depende de los registros actuales: si desaparece el premio, se cierra.
  const visibleLevel = openLevel && getLevelCollection(records, openLevel.id).unlocked ? openLevel : null;

  function updateActive() {
    const element = track.current;
    const center = element.getBoundingClientRect().left + element.clientWidth / 2;
    let nearest = 0;
    let shortestDistance = Infinity;
    Array.from(element.children).forEach((slide, index) => {
      const box = slide.getBoundingClientRect();
      const distance = Math.abs(box.left + box.width / 2 - center);
      if (distance < shortestDistance) { nearest = index; shortestDistance = distance; }
    });
    setActiveIndex(nearest);
  }

  function goTo(index) {
    const element = track.current;
    const next = Math.max(0, Math.min(index, GAME_LEVELS.length - 1));
    const slide = element.children[next];
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
      || document.querySelector('[data-motion="off"]');
    // scrollTo solo mueve este carrusel, sin cambiar el desplazamiento vertical.
    element.scrollTo({ left: slide.offsetLeft, behavior: reduced ? 'instant' : 'smooth' });
  }

  function navigateWithKeyboard(event) {
    if (event.target !== event.currentTarget || event.altKey || event.ctrlKey || event.metaKey) return;
    const destinations = { ArrowLeft: activeIndex - 1, ArrowRight: activeIndex + 1, Home: 0, End: GAME_LEVELS.length - 1 };
    if (!(event.key in destinations)) return;
    event.preventDefault();
    goTo(destinations[event.key]);
  }

  return (
    <Section id="coleccionables" number="05" title="Nuestro pequeño tesoro">
      <p>Cada nivel completado guarda una imagen aquí. Puedes volver a jugar para ganar más estrellas.</p>
      <p className="mt-3 text-sm">Por ahora encontrarás ilustraciones provisionales; después pondremos nuestras fotos.</p>
      <p className="mt-6 text-sm font-semibold text-accent" aria-live="polite">
        {unlockedCount} de {GAME_LEVELS.length} tesoros desbloqueados
      </p>
      {storageError && <p role="alert" className="mt-4 text-sm text-danger">{storageError}</p>}

      <div className="treasure-carousel" role="region" aria-roledescription="carrusel" aria-label="Nuestros tesoros coleccionables">
        <div className="treasure-carousel-toolbar">
          <div><p className="treasure-carousel-eyebrow">UN RECUERDO A LA VEZ</p><p id="treasure-carousel-help">Desliza para explorar. Abre las imágenes que ya ganaste.</p></div>
          <div className="treasure-carousel-arrows">
            <button type="button" className="button-secondary" aria-label="Tesoro anterior" aria-controls="treasure-carousel-track" disabled={activeIndex === 0} onClick={() => goTo(activeIndex - 1)}><span aria-hidden="true">←</span></button>
            <button type="button" className="button-secondary" aria-label="Tesoro siguiente" aria-controls="treasure-carousel-track" disabled={activeIndex === GAME_LEVELS.length - 1} onClick={() => goTo(activeIndex + 1)}><span aria-hidden="true">→</span></button>
          </div>
        </div>
        <div id="treasure-carousel-track" ref={track} className="treasure-carousel-track" tabIndex={0}
          aria-label="Imágenes coleccionables; usa las flechas izquierda y derecha para recorrerlas" aria-describedby="treasure-carousel-help"
          onScroll={updateActive} onKeyDown={navigateWithKeyboard}>
        {GAME_LEVELS.map((level, index) => {
          const collection = getLevelCollection(records, level.id);
          return (
            <article key={level.id} className="treasure-slide surface-panel" role="group" aria-roledescription="diapositiva" aria-label={`Tesoro ${index + 1} de ${GAME_LEVELS.length}: ${level.title}`}>
              {collection.unlocked ? (
                <button type="button" className="treasure-image-button" aria-label={`Ampliar ${level.title}`} aria-haspopup="dialog" onClick={() => setOpenLevel(level)}>
                  <img src={level.image} alt={level.alt} width="800" height="600" loading="lazy" />
                  <span className="treasure-image-hint"><span aria-hidden="true">⤢</span> Ver imagen completa</span>
                </button>
              ) : (
                <div className="flex aspect-[4/3] flex-col items-center justify-center gap-3 bg-gradient-to-br from-sky/15 via-lilac/20 to-violet/20" role="img" aria-label={`Tesoro del nivel ${index + 1} bloqueado`}>
                  <svg aria-hidden="true" viewBox="0 0 64 64" fill="none" className="h-16 w-16 text-violet/65">
                    <path d="M21 29v-9a11 11 0 0 1 22 0v9" stroke="currentColor" strokeWidth="4" strokeLinecap="round" />
                    <rect x="13" y="27" width="38" height="29" rx="9" fill="currentColor" />
                    <path d="M32 45c-2-2-7-5-7-8a4 4 0 0 1 7-2 4 4 0 0 1 7 2c0 3-5 6-7 8Z" fill="var(--color-paper)" />
                  </svg>
                  <span className="text-sm text-accent">Completa el nivel {index + 1}</span>
                </div>
              )}
              <div className="p-5">
                <p className="text-xs tracking-wider text-accent">TESORO {String(index + 1).padStart(2, '0')}</p>
                <h3 className="mt-2 font-serif text-xl leading-snug text-ink">{level.title}</h3>
                <p className="mt-2 text-sm leading-6">{level.description}</p>
                {collection.unlocked ? (
                  <>
                    <p className="mt-3 text-lg tracking-widest text-accent" aria-label={`Mejor calificación: ${collection.bestStars} de 3 estrellas`}>
                      <span aria-hidden="true">{'★'.repeat(collection.bestStars)}{'☆'.repeat(3 - collection.bestStars)}</span>
                    </p>
                    <p className="text-sm">Mejor tiempo: {formatTime(collection.bestTime)} · {collection.wins} {collection.wins === 1 ? 'victoria' : 'victorias'}</p>
                    {level.isPlaceholder && <p className="mt-2 text-xs text-accent">Ilustración provisional · foto pendiente</p>}
                  </>
                ) : <p className="mt-4 text-sm font-semibold text-accent">Aún por descubrir ♡</p>}
              </div>
            </article>
          );
        })}
        </div>
        <div className="treasure-carousel-pagination">
          <div className="treasure-carousel-dots" aria-label="Elegir un tesoro">
            {GAME_LEVELS.map((level, index) => (
              <button key={level.id} type="button" aria-label={`Ir al tesoro ${index + 1}: ${level.title}`} aria-current={activeIndex === index ? 'true' : undefined}
                aria-controls="treasure-carousel-track" onClick={() => goTo(index)}><span /></button>
            ))}
          </div>
          <p aria-live="polite" aria-atomic="true">Tesoro {activeIndex + 1} de {GAME_LEVELS.length}</p>
        </div>
      </div>
      {visibleLevel && <ImageLightbox src={visibleLevel.image} alt={visibleLevel.alt} title={visibleLevel.title}
        caption={visibleLevel.isPlaceholder ? 'Ilustración provisional · aquí pondremos una foto de nuestra historia.' : visibleLevel.description}
        onClose={() => setOpenLevel(null)} />}
    </Section>
  );
}
