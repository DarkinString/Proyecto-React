import { useCallback, useEffect, useState } from 'react';
import { readCollection, updateCollection } from '../utils/localCollections.js';

export default function useStoredCollection(key, validateItem) {
  const [items, setItems] = useState([]);
  const [storageError, setStorageError] = useState('');

  useEffect(() => {
    function refresh(event) {
      if (event && event.key !== key && event.key !== null) return;
      try {
        setItems(readCollection(localStorage, key, validateItem));
        setStorageError('');
      } catch {
        setStorageError('No se pudieron leer los datos de este navegador. No se han sobrescrito.');
      }
    }
    refresh();
    window.addEventListener('storage', refresh);
    return () => window.removeEventListener('storage', refresh);
  }, [key, validateItem]);

  const updateItems = useCallback((updater) => {
    try {
      const next = updateCollection(localStorage, key, validateItem, updater);
      setItems(next);
      setStorageError('');
      return true;
    } catch {
      setStorageError('No se pudo guardar en este navegador. Conserva el contenido e inténtalo de nuevo; los datos anteriores no se han borrado.');
      return false;
    }
  }, [key, validateItem]);

  return { items, updateItems, storageError };
}
