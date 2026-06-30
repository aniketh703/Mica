// src/hooks/useEvents.ts
import { useState, useEffect, useCallback, useRef } from 'react';
import { MicaEvent } from '../types';
import { useEventRepository } from './useEventRepository';
import { effectiveDaysUntil } from '../utils/yearProgress';
import { usePremium } from '../context/PremiumContext';

interface UseEventsResult {
  events: MicaEvent[];
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
  createEvent: (data: Omit<MicaEvent, 'id' | 'notificationIds' | 'appwriteId' | 'createdAt' | 'updatedAt'>) => Promise<MicaEvent>;
  updateEvent: (id: string, patch: Partial<MicaEvent>) => Promise<MicaEvent>;
  deleteEvent: (id: string) => Promise<void>;
}

export function useEvents(): UseEventsResult {
  const repo = useEventRepository();
  const { refreshCount } = usePremium();
  const [events, setEvents] = useState<MicaEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const hasLoaded = useRef(false);

  const refresh = useCallback(async () => {
    const isInitial = !hasLoaded.current;
    try {
      if (isInitial) setLoading(true);
      setError(null);
      const all = await repo.getAll();
      // Sort by next occurrence so repeating events always float to the correct
      // position rather than sorting by their (possibly years-old) stored date.
      // Future/today events come first (ascending), past one-time events last
      // (most-recent first so they appear just below the upcoming section).
      const sorted = [...all].sort((a, b) => {
        const da = effectiveDaysUntil(a);
        const db = effectiveDaysUntil(b);
        if (da >= 0 && db >= 0) return da - db;   // both upcoming: closer first
        if (da < 0  && db < 0)  return db - da;   // both past: most recent first
        return da >= 0 ? -1 : 1;                  // upcoming before past
      });
      setEvents(sorted);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load events');
    } finally {
      if (isInitial) setLoading(false);
      hasLoaded.current = true;
    }
  }, [repo]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const createEvent = useCallback(async (
    data: Omit<MicaEvent, 'id' | 'notificationIds' | 'appwriteId' | 'createdAt' | 'updatedAt'>
  ): Promise<MicaEvent> => {
    const payload: Omit<MicaEvent, 'id' | 'appwriteId' | 'createdAt' | 'updatedAt'> = { ...data, notificationIds: [] };
    const ev = await repo.create(payload);
    await Promise.all([refresh(), refreshCount()]);
    return ev;
  }, [repo, refresh, refreshCount]);

  const updateEvent = useCallback(async (id: string, patch: Partial<MicaEvent>): Promise<MicaEvent> => {
    const ev = await repo.update(id, patch);
    await refresh();
    return ev;
  }, [repo, refresh]);

  const deleteEvent = useCallback(async (id: string): Promise<void> => {
    await repo.delete(id);
    await Promise.all([refresh(), refreshCount()]);
  }, [repo, refresh, refreshCount]);

  return { events, loading, error, refresh, createEvent, updateEvent, deleteEvent };
}
