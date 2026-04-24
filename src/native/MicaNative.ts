import {NativeModules} from 'react-native';
import {CountdownEvent} from '../types/event';

interface WidgetsModule {
  refreshWidgets: () => Promise<void>;
}

interface NotificationsModule {
  scheduleEventReminder: (event: CountdownEvent) => Promise<void>;
  cancelEventReminder: (eventId: string) => Promise<void>;
}

interface BillingModule {
  purchasePremium: () => Promise<boolean>;
  restorePurchases: () => Promise<boolean>;
}

type MicaNativeModules = {
  MicaWidgetsModule?: WidgetsModule;
  MicaNotificationsModule?: NotificationsModule;
  MicaBillingModule?: BillingModule;
};

const modules = NativeModules as MicaNativeModules;

export const MicaNative = {
  widgets: modules.MicaWidgetsModule,
  notifications: modules.MicaNotificationsModule,
  billing: modules.MicaBillingModule,
};
