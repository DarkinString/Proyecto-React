import { entryKey, youtubeUrl } from '../../services/youtube.js';

export default function TrackList({ tracks, savedIds, currentKey, onPlay, onAdd, onRemove }) {
  return <ul className="mt-4 space-y-3">
    {tracks.map((track) => <li key={entryKey(track)} className="track-row rounded-2xl border border-line/70 p-4">
      <div className="min-w-0 flex-1">
        <p className="break-words text-base font-semibold text-ink">{track.title}</p>
        <p className="break-words text-sm text-muted">{track.artist} · {track.kind === 'playlist' ? 'Playlist' : 'Video'}</p>
        {currentKey === entryKey(track) && <p className="text-sm text-accent">En el reproductor</p>}
        <a className="text-sm text-accent underline underline-offset-4" href={youtubeUrl(track)} target="_blank" rel="noopener">Ver en YouTube ↗</a>
      </div>
      <div className="flex flex-wrap gap-2">
        <button className="button-secondary" type="button" onClick={() => onPlay(track)} aria-label={`Reproducir ${track.title}`}>Escuchar</button>
        {onAdd && <button className="button-secondary" type="button" disabled={savedIds.has(entryKey(track))} onClick={() => onAdd(track)} aria-label={`Agregar ${track.title} a tu lista`}>{savedIds.has(entryKey(track)) ? 'Agregado' : 'Agregar'}</button>}
        {onRemove && <button className="button-secondary" type="button" onClick={() => onRemove(entryKey(track))} aria-label={`Quitar ${track.title} de tu lista`}>Quitar</button>}
      </div>
    </li>)}
  </ul>;
}
