// No sobrescribimos datos ilegibles: así una lectura fallida no borra cartas existentes.
export function readCollection(storage, key, validateItem) {
  const raw = storage.getItem(key);
  if (raw === null) return [];
  const items = JSON.parse(raw);
  if (!Array.isArray(items) || !items.every(validateItem)) {
    throw new Error('Los datos guardados no tienen el formato esperado. No se han modificado.');
  }
  return items;
}

export function updateCollection(storage, key, validateItem, updater) {
  const current = readCollection(storage, key, validateItem);
  const next = updater(current);
  if (!Array.isArray(next) || !next.every(validateItem)) throw new Error('No se pudo validar el contenido.');
  storage.setItem(key, JSON.stringify(next));
  return next;
}
