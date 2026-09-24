import { useEffect, useRef } from 'react';
import './starfield.css';

// Posiciones fijas: las estrellas no saltan de lugar cuando React vuelve a dibujar.
const stars = [
  [7, 9], [24, 5], [42, 14], [61, 7], [79, 17], [94, 8],
  [15, 25], [34, 31], [53, 23], [71, 34], [88, 28],
  [5, 44], [25, 48], [44, 40], [63, 52], [83, 46], [96, 39],
  [12, 65], [32, 60], [52, 70], [73, 62], [91, 68],
  [4, 83], [23, 89], [43, 81], [64, 91], [81, 83], [96, 94],
  [18, 75], [38, 95], [57, 57], [75, 96],
].map(([x, y], index) => ({
  id: index,
  x,
  y,
  sparkle: index % 3 === 0,
  size: index % 3 === 0 ? 8 + index % 5 : 2.5 + index % 3,
  duration: 8 + index % 7,
  delay: -(index * 1.7),
  color: ['sky', 'violet', 'lilac'][index % 3],
}));

export default function InteractiveBackground({ animate }) {
  const backgroundRef = useRef(null);

  useEffect(() => {
    if (!animate) return;
    let frameId = 0;

    function followPointer(event) {
      if (event.pointerType !== 'mouse') return;
      cancelAnimationFrame(frameId);
      frameId = requestAnimationFrame(() => {
        backgroundRef.current?.style.setProperty('--pointer-x', `${event.clientX}px`);
        backgroundRef.current?.style.setProperty('--pointer-y', `${event.clientY}px`);
      });
    }

    window.addEventListener('pointermove', followPointer, { passive: true });
    return () => {
      window.removeEventListener('pointermove', followPointer);
      cancelAnimationFrame(frameId);
    };
  }, [animate]);

  return (
    <div ref={backgroundRef} className="interactive-background" aria-hidden="true">
      <div className="ambient-light ambient-light-sky" />
      <div className="ambient-light ambient-light-lilac" />
      <div className="pointer-glow" />
      <div className="background-starfield" data-animate={animate ? 'true' : 'false'} aria-hidden="true">
        {stars.map((star) => (
          <span key={star.id} className={`background-star ${star.sparkle ? 'background-star--sparkle' : 'background-star--dot'}`}
            style={{
              '--star-x': `${star.x}%`, '--star-y': `${star.y}%`,
              '--star-size': `${star.size}px`, '--star-color': `var(--color-${star.color})`,
              '--star-duration': `${star.duration}s`, '--star-delay': `${star.delay}s`,
            }} />
        ))}
      </div>
    </div>
  );
}
