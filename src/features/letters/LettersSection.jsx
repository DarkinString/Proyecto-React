import { useState } from 'react';
import useStoredCollection from '../../hooks/useStoredCollection.js';
import { isLetter, LETTERS_KEY } from './letterModel.js';

const dateFormat = new Intl.DateTimeFormat('es-MX', { dateStyle: 'long' });

export default function LettersSection() {
  const { items: letters, updateItems, storageError } = useStoredCollection(LETTERS_KEY, isLetter);
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [notice, setNotice] = useState('');

  function saveLetter(event) {
    event.preventDefault();
    if (!title.trim() || !body.trim()) {
      setNotice('Dale un título a tu carta y escribe unas palabras antes de guardarla.');
      return;
    }
    const letter = { id: crypto.randomUUID(), title: title.trim(), body: body.trim(), createdAt: new Date().toISOString() };
    if (updateItems((current) => [letter, ...current])) {
      setTitle('');
      setBody('');
      setNotice('Tu carta quedó guardada aquí. ♡');
    }
  }

  return (
    <section aria-labelledby="cartas-titulo" className="surface-panel max-w-3xl rounded-3xl p-6 sm:p-9">
      <p className="text-sm tracking-widest text-accent">DE TI PARA MÍ ♡</p>
      <h2 id="cartas-titulo" className="mt-4 font-serif text-3xl text-ink">Tus palabras tienen un lugar aquí.</h2>
      <p className="mt-3 text-base leading-7 text-muted">Escríbeme lo que quieras. Una carta, un recuerdo, algo que te hizo sonreír.</p>
      <form onSubmit={saveLetter} className="mt-6 space-y-4">
        <label className="block text-base text-ink">
          Título de tu carta
          <input className="field mt-2" value={title} onChange={(event) => setTitle(event.target.value)} maxLength={80} required placeholder="Hoy quería contarte…" />
        </label>
        <label className="block text-base text-ink">
          Tu carta
          <textarea className="field mt-2 min-h-40 resize-y" value={body} onChange={(event) => setBody(event.target.value)} maxLength={4000} required placeholder="Este espacio es para tus palabras." />
        </label>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="text-sm text-muted">Se guardan en este navegador. {body.length}/4000</p>
          <button type="submit" className="button-primary">Guardar mi carta <span aria-hidden="true">♡</span></button>
        </div>
      </form>
      <p role="status" className="mt-3 text-sm text-accent">{notice}</p>
      {storageError && <p role="alert" className="mt-3 text-sm text-danger">{storageError}</p>}
      <div className="mt-8 border-t border-line/70 pt-6">
        <h3 className="font-serif text-2xl text-ink">Cartas que me has escrito</h3>
        {letters.length === 0 && <p className="mt-3 text-base text-muted">La primera carta todavía está por escribir.</p>}
        <div className="mt-4 space-y-3">
          {letters.map((letter) => (
            <details key={letter.id} className="letter-entry rounded-2xl border border-line/70 p-4">
              <summary className="cursor-pointer break-words text-base font-semibold text-accent">
                {letter.title}
                <time dateTime={letter.createdAt} className="mt-1 block text-sm font-normal text-muted">{dateFormat.format(new Date(letter.createdAt))}</time>
              </summary>
              <p className="mt-4 whitespace-pre-wrap break-words text-base leading-7 text-ink">{letter.body}</p>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
}
