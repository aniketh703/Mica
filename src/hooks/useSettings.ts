// src/hooks/useSettings.ts
import { useState, useEffect, useCallback } from 'react';
import { useEventRepository } from './useEventRepository';
import { ThemeMode } from '../theme/ThemeContext';
import { InterestCategory } from '../types';

export interface AppSettings {
  themeMode: ThemeMode;
  userName: string;
  interests: InterestCategory[];
  notificationsEnabled: boolean;
  onboardingComplete: boolean;
}

const DEFAULTS: AppSettings = {
  themeMode: 'system',
  userName: '',
  interests: [],
  notificationsEnabled: true,
  onboardingComplete: false,
};

export function useSettings() {
  const repo = useEventRepository();
  const [settings, setSettings] = useState<AppSettings>(DEFAULTS);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    try {
      const [theme, name, interests, notifs, onboarded] = await Promise.all([
        repo.getSetting('themeMode'),
        repo.getSetting('userName'),
        repo.getSetting('interests'),
        repo.getSetting('notificationsEnabled'),
        repo.getSetting('onboardingComplete'),
      ]);
      setSettings({
        themeMode: (theme as ThemeMode) ?? DEFAULTS.themeMode,
        userName: name ?? DEFAULTS.userName,
        interests: interests ? (JSON.parse(interests) as InterestCategory[]) : DEFAULTS.interests,
        notificationsEnabled: notifs !== null ? notifs === 'true' : DEFAULTS.notificationsEnabled,
        onboardingComplete: onboarded === 'true',
      });
    } finally {
      setLoading(false);
    }
  }, [repo]);

  useEffect(() => { load(); }, [load]);

  const updateSetting = useCallback(async <K extends keyof AppSettings>(
    key: K,
    value: AppSettings[K]
  ) => {
    const stored = typeof value === 'object' ? JSON.stringify(value) : String(value);
    await repo.setSetting(key, stored);
    setSettings(prev => ({ ...prev, [key]: value }));
  }, [repo]);

  return { settings, loading, updateSetting, reload: load };
}
