// src/context/PremiumContext.tsx
import React, { createContext, useContext, useCallback, useState, useEffect } from 'react';
import { useEventRepository } from '../hooks/useEventRepository';

export const FREE_EVENT_LIMIT = 12;

interface PremiumContextValue {
  isPremium: boolean;
  eventCount: number;
  canAddEvent: boolean;
  refreshCount: () => Promise<void>;
}

const PremiumContext = createContext<PremiumContextValue>({
  isPremium: false,
  eventCount: 0,
  canAddEvent: true,
  refreshCount: async () => {},
});

export function PremiumProvider({ children }: { children: React.ReactNode }) {
  const repo = useEventRepository();
  const [isPremium] = useState(false); // Phase 2: wire to ConfigCat + billing
  const [eventCount, setEventCount] = useState(0);

  const refreshCount = useCallback(async () => {
    const count = await repo.getCount();
    setEventCount(count);
  }, [repo]);

  useEffect(() => { refreshCount(); }, [refreshCount]);

  const canAddEvent = isPremium || eventCount < FREE_EVENT_LIMIT;

  return (
    <PremiumContext.Provider value={{ isPremium, eventCount, canAddEvent, refreshCount }}>
      {children}
    </PremiumContext.Provider>
  );
}

export function usePremium() {
  return useContext(PremiumContext);
}
