import {create} from 'zustand';
import {CountdownEvent, ThemePreferences} from '../types/event';

interface PremiumState {
  isPremium: boolean;
}

interface MicaState {
  events: CountdownEvent[];
  premium: PremiumState;
  theme: ThemePreferences;
  addEvent: (event: CountdownEvent) => void;
  removeEvent: (eventId: string) => void;
  setPremium: (value: boolean) => void;
  updateTheme: (theme: Partial<ThemePreferences>) => void;
}

const defaultTheme: ThemePreferences = {
  mode: 'system',
  preset: 'mica',
  gridAccent: '#D6B98C',
  todayHighlight: 'ring',
};

const seedEvents: CountdownEvent[] = [
  {
    id: '1',
    title: 'Birthday',
    date: '2026-05-14',
    category: 'birthday',
    color: '#C86B5A',
    reminderDaysBefore: [7, 1],
  },
  {
    id: '2',
    title: 'Vacation',
    date: '2026-06-20',
    category: 'vacation',
    color: '#547A76',
    reminderDaysBefore: [14, 3],
  },
];

export const useMicaStore = create<MicaState>(set => ({
  events: seedEvents,
  premium: {
    isPremium: false,
  },
  theme: defaultTheme,
  addEvent: event =>
    set(state => ({
      events: [...state.events, event],
    })),
  removeEvent: eventId =>
    set(state => ({
      events: state.events.filter(event => event.id !== eventId),
    })),
  setPremium: value =>
    set(state => ({
      premium: {
        ...state.premium,
        isPremium: value,
      },
    })),
  updateTheme: theme =>
    set(state => ({
      theme: {
        ...state.theme,
        ...theme,
      },
    })),
}));
