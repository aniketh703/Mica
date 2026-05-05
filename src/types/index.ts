// src/types/index.ts

export interface MicaEvent {
  id: string;           // uuid (was number)
  title: string;
  dateIso: string;      // "YYYY-MM-DD" (was formatted "May 3")
  color: string;
  type: string;         // 'Birthday' | 'Deadline' | 'Vacation' | 'Milestone' | 'Other'
  repeats: string;      // 'None' | 'Yearly' | 'Monthly'
  reminder: string;     // 'None' | '1 day before' | '3 days before' | '1 week before' | 'On the day'
  note: string;
  dayOfYear: number;    // derived from dateIso on write
  notificationIds: string[];  // expo-notifications identifiers
  appwriteId: string | null;  // null until Phase 2 sync
  createdAt: string;
  updatedAt: string;
}

export type TabName = 'home' | 'events' | 'settings';

export type RootStackParamList = {
  Main: undefined;
  EventDetail: { eventId: string };   // changed from { event: MicaEvent }
  AddEvent: { eventId?: string };     // eventId present = edit mode
  Invite: undefined;
};

export type EventTypeOption = 'Birthday' | 'Deadline' | 'Vacation' | 'Milestone' | 'Other';
export type RepeatOption = 'None' | 'Yearly' | 'Monthly';
export type ReminderOption = 'None' | '1 day before' | '3 days before' | '1 week before' | 'On the day';

export interface CellData {
  doy: number;
  state: 'past' | 'today' | 'future' | 'event';
  eventColor?: string;
}

export interface LifeCellData {
  doy: number;
  week: number;
  dow: number;
  state: 'past' | 'today' | 'countdown' | 'event' | 'future';
}
