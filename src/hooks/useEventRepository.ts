// src/hooks/useEventRepository.ts
import { useSQLiteContext } from 'expo-sqlite';
import { useMemo } from 'react';
import { EventRepository } from '../db/EventRepository';

export function useEventRepository(): EventRepository {
  const db = useSQLiteContext();
  return useMemo(() => new EventRepository(db), [db]);
}
