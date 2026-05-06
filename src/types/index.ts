// src/types/index.ts

export interface MicaEvent {
  id: string;           // uuid
  title: string;
  dateIso: string;      // "YYYY-MM-DD"
  color: string;
  type: EventTypeOption;
  repeats: RepeatOption;
  reminder: ReminderOption;
  note: string;
  dayOfYear: number;    // derived from dateIso on write
  notificationIds: string[];
  appwriteId: string | null;
  createdAt: string;
  updatedAt: string;
}

export type TabName = 'home' | 'events' | 'settings';

export type RootStackParamList = {
  // Onboarding stack (shown only on first launch)
  Splash: undefined;
  Pitch: undefined;
  AuthChoice: undefined;
  Onboarding: { step?: number };
  // Main app
  Main: undefined;
  EventDetail: { eventId: string };
  AddEvent: { eventId?: string };
  Invite: undefined;
};

export type EventTypeOption = 'Birthday' | 'Deadline' | 'Vacation' | 'Milestone' | 'Other';
export type RepeatOption = 'None' | 'Yearly' | 'Monthly';
export type ReminderOption = 'None' | '1 day before' | '3 days before' | '1 week before' | 'On the day';

// Discriminated union: eventColor is guaranteed when state === 'event'
export type CellData =
  | { doy: number; state: 'past' | 'today' | 'future' }
  | { doy: number; state: 'event'; eventColor: string };

export interface LifeCellData {
  doy: number;
  week: number;
  dow: number;
  state: 'past' | 'today' | 'countdown' | 'event' | 'future';
}

export type InterestCategory =
  | 'Birthdays'
  | 'Anniversaries'
  | 'Deadlines'
  | 'Travel'
  | 'Goals'
  | 'Holidays'
  | 'Habits'
  | 'Memorials';
