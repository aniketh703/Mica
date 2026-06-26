// src/hooks/useSettings.ts
import { useState, useEffect, useCallback } from 'react';
import { useEventRepository } from './useEventRepository';
import { ThemeMode } from '../theme/ThemeContext';
import { InterestCategory } from '../types';
import { setHapticsEnabled } from '../utils/haptics';

export interface AppSettings {
  themeMode: ThemeMode;
  userName: string;
  interests: InterestCategory[];
  notificationsEnabled: boolean;
  hapticsEnabled: boolean;
  onboardingComplete: boolean;
}

const DEFAULTS: AppSettings = {
  themeMode: 'system',
  userName: '',
  interests: [],
  notificationsEnabled: true,
  hapticsEnabled: true,
  onboardingComplete: false,
};

export function useSettings() {
  const repo = useEventRepository();
  const [settings, setSettings] = useState<AppSettings>(DEFAULTS);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    try {
      const [theme, name, interests, notifs, haptics, onboarded] = await Promise.all([
        repo.getSetting('themeMode'),
        repo.getSetting('userName'),
        repo.getSetting('interests'),
        repo.getSetting('notificationsEnabled'),
        repo.getSetting('hapticsEnabled'),
        repo.getSetting('onboardingComplete'),
      ]);
      const hapticsEnabled = haptics !== null ? haptics === 'true' : DEFAULTS.hapticsEnabled;
      // Sync the module-level haptics flag immediately on load
      setHapticsEnabled(hapticsEnabled);
      setSettings({
        themeMode: (theme as ThemeMode) ?? DEFAULTS.themeMode,
        userName: name ?? DEFAULTS.userName,
        interests: interests ? (JSON.parse(interests) as InterestCategory[]) : DEFAULTS.interests,
        notificationsEnabled: notifs !== null ? notifs === 'true' : DEFAULTS.notificationsEnabled,
        hapticsEnabled,
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
    // Keep the haptics utility in sync whenever the setting changes
    if (key === 'hapticsEnabled') {
      setHapticsEnabled(value as boolean);
    }
    setSettings(prev => ({ ...prev, [key]: value }));
  }, [repo]);

  return { settings, loading, updateSetting, reload: load };
}
