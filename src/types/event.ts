export type EventCategory =
  | 'birthday'
  | 'anniversary'
  | 'vacation'
  | 'deadline'
  | 'custom';

export interface CountdownEvent {
  id: string;
  title: string;
  date: string;
  category: EventCategory;
  color: string;
  reminderDaysBefore: number[];
  notes?: string;
}

export interface ThemePreferences {
  mode: 'system' | 'light' | 'dark';
  preset: 'mica' | 'sand' | 'forest' | 'midnight';
  gridAccent: string;
  todayHighlight: 'ring' | 'glow';
}
