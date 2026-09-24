import { useRef, useState } from 'react';
import { SIZE, areAdjacent } from './match3.js';

const figures = [
  { symbol: '♥', name: 'corazón rosa' }, { symbol: '◆', name: 'diamante celeste' },
  { symbol: '✿', name: 'flor violeta' }, { symbol: '★', name: 'estrella dorada' },
  { symbol: '●', name: 'perla verde' }, { symbol: '☾', name: 'luna lila' },
];

export default function MatchBoard({ board, disabled, matched, hints, onSwap }) {
  const [selected, setSelected] = useState(null);
  const [focused, setFocused] = useState(0);
  const cells = useRef([]);
  const gesture = useRef(null);
  const ignoreClickUntil = useRef(0);

  function choose(index) {
    if (disabled || performance.now() < ignoreClickUntil.current) return;
    if (selected === null) setSelected(index);
    else if (selected === index) setSelected(null);
    else if (areAdjacent(selected, index)) { onSwap(selected, index); setSelected(null); }
    else setSelected(index);
  }

  function keyboard(event, index) {
    const row = Math.floor(index / SIZE);
    const column = index % SIZE;
    const targets = { ArrowLeft: column > 0 ? index - 1 : index, ArrowRight: column < SIZE - 1 ? index + 1 : index,
      ArrowUp: row > 0 ? index - SIZE : index, ArrowDown: row < SIZE - 1 ? index + SIZE : index };
    if (event.key === 'Escape') { setSelected(null); return; }
    if (!(event.key in targets)) return;
    event.preventDefault();
    setFocused(targets[event.key]);
    cells.current[targets[event.key]]?.focus();
  }

  function pointerUp(event, index) {
    const start = gesture.current;
    gesture.current = null;
    if (!start || start.index !== index || disabled) return;
    const dx = event.clientX - start.x;
    const dy = event.clientY - start.y;
    if (Math.max(Math.abs(dx), Math.abs(dy)) < 18) return;
    const target = Math.abs(dx) > Math.abs(dy) ? index + Math.sign(dx) : index + SIZE * Math.sign(dy);
    ignoreClickUntil.current = performance.now() + 400;
    setSelected(null);
    if (areAdjacent(index, target)) onSwap(index, target);
  }

  return (
    <div className="match-board" role="group" aria-label="Tablero de combinaciones" aria-describedby="game-instructions" aria-busy={disabled}>
      {board.map((type, index) => (
        <button type="button" key={index} ref={(element) => { cells.current[index] = element; }}
          className={`gem gem-${type}`} data-matched={matched.includes(index)} data-hint={hints?.includes(index) || undefined}
          aria-label={`Fila ${Math.floor(index / SIZE) + 1}, columna ${index % SIZE + 1}: ${figures[type].name}`}
          aria-pressed={selected === index} aria-disabled={disabled} tabIndex={focused === index ? 0 : -1}
          onFocus={() => setFocused(index)} onClick={() => choose(index)} onKeyDown={(event) => keyboard(event, index)}
          onPointerDown={(event) => {
            if (disabled) return;
            gesture.current = { index, x: event.clientX, y: event.clientY };
            event.currentTarget.setPointerCapture(event.pointerId);
          }} onPointerUp={(event) => pointerUp(event, index)} onPointerCancel={() => { gesture.current = null; }}>
          <span aria-hidden="true">{figures[type].symbol}</span>
        </button>
      ))}
    </div>
  );
}
