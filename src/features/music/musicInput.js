import { parseYouTubeUrl } from '../../services/youtube.js';

// Diferenciamos el texto de búsqueda de un enlace sin hacer peticiones de red.
export function classifyMusicInput(value) {
  const text = value.trim();
  if (!text) return { kind: 'empty', value: '' };
  const bareYouTubeUrl = /^(?:(?:(?:www|m|music)\.)?youtube\.com|youtu\.be)\//i.test(text);
  const isUrl = bareYouTubeUrl || /^[a-z][a-z\d+.-]*:\/\//i.test(text) || /^(?:https?|ftp|file|javascript|data):/i.test(text) || text.startsWith('//')
    || /^[^\s/]+\.[a-z]{2,}\//i.test(text);
  if (!isUrl) return { kind: 'query', value: text };
  const url = bareYouTubeUrl ? `https://${text}` : text;
  try { return { ...parseYouTubeUrl(url), value: url }; }
  catch (error) { return { kind: 'invalid', value: text, error: error.message }; }
}

export function youtubeSearchUrl(query) {
  const term = query.trim();
  if (term.length < 2) throw new Error('Escribe al menos dos letras para buscar.');
  if (term.length > 120) throw new Error('Usa un nombre de canción o artista de hasta 120 caracteres.');
  const url = new URL('https://www.youtube.com/results');
  url.searchParams.set('search_query', term);
  return url.href;
}
