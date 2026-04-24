import {useEffect, useMemo, useState} from 'react';
import {AppState, AppStateStatus} from 'react-native';
import {buildYearProgressModel} from './yearProgressService';
import {YearProgressViewModel} from '../../types/yearProgress';

function getStartOfLocalDay(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

function getNextLocalMidnight(now: Date): number {
  const next = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);

  return next.getTime() - now.getTime();
}

export function useYearProgress(nowOverride?: Date): YearProgressViewModel {
  const [now, setNow] = useState(() => new Date());
  const effectiveNow = nowOverride ?? now;
  const dayKey = `${effectiveNow.getFullYear()}-${effectiveNow.getMonth()}-${effectiveNow.getDate()}`;

  useEffect(() => {
    if (nowOverride) {
      return;
    }

    const handleAppStateChange = (status: AppStateStatus) => {
      if (status === 'active') {
        setNow(new Date());
      }
    };

    const appStateSubscription = AppState.addEventListener(
      'change',
      handleAppStateChange,
    );

    const timeoutId = setTimeout(() => {
      setNow(new Date());
    }, getNextLocalMidnight(new Date()) + 250);

    return () => {
      appStateSubscription.remove();
      clearTimeout(timeoutId);
    };
  }, [dayKey, nowOverride]);

  const localDate = useMemo(() => getStartOfLocalDay(effectiveNow), [effectiveNow]);

  return useMemo(() => buildYearProgressModel(localDate), [localDate]);
}
