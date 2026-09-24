import { useCallback } from 'react';
import useStoredCollection from './useStoredCollection.js';
import { addGameRecord, GAME_RECORDS_KEY, isGameRecord, isTimeRecord } from '../features/games/gameProgress.js';

export default function useGameProgress() {
  const { items: records, updateItems, storageError } = useStoredCollection(GAME_RECORDS_KEY, isGameRecord);

  const saveResult = useCallback((result) => {
    let isRecord = false;
    const saved = updateItems((current) => {
      isRecord = isTimeRecord(current, result);
      return addGameRecord(current, result);
    });
    return { saved, isRecord: saved && isRecord };
  }, [updateItems]);

  return { records, storageError, saveResult };
}
