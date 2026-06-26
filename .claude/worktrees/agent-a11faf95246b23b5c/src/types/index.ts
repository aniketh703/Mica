export interface MicaEvent {
  id: number;
  title: string;
  date: string;
  daysLeft: number;
  color: string;
  type?: string;
  repeats?: string;
  reminder?: string;
  note?: string;
  dayOfYear?: number;
}

export type TabName = 'home' | 'events' | 'settings';

export type RootStackParamList = {
  Main: undefined;
  EventDetail: { event: MicaEvent };
  AddEvent: undefined;
  Invite: undefined;
};
