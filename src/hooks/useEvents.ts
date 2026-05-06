// src/hooks/useEvents.ts
import { useState, useEffect, useCallback } from 'react';
import { MicaEvent } from '../types';
import { useEventRepository } from './useEventRepository';

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
  const [events, setEvents] = useState<MicaEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const all = await repo.getAll();
      setEvents(all);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load events');
    } finally {
      setLoading(false);
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
    await refresh();
    return ev;
  }, [repo, refresh]);

  const updateEvent = useCallback(async (id: string, patch: Partial<MicaEvent>): Promise<MicaEvent> => {
    const ev = await repo.update(id, patch);
    await refresh();
    return ev;
  }, [repo, refresh]);

  const deleteEvent = useCallback(async (id: string): Promise<void> => {
    await repo.delete(id);
    await refresh();
  }, [repo, refresh]);

  return { events, loading, error, refresh, createEvent, updateEvent, deleteEvent };
}
