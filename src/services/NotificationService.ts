// src/services/NotificationService.ts
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import { MicaEvent, ReminderOption } from '../types';

// Configure how notifications appear when app is in foreground
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: false,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

/** Request OS permission. Returns true if granted. */
export async function requestNotificationPermission(): Promise<boolean> {
  if (Platform.OS === 'android' && Platform.Version < 33) {
    // Android < 13: permission granted by default
    return true;
  }
  const { status } = await Notifications.requestPermissionsAsync();
  return status === 'granted';
}

/** Convert ReminderOption to offset in days (negative = before event) */
function reminderToDayOffset(reminder: ReminderOption): number | null {
  switch (reminder) {
    case 'On the day':     return 0;
    case '1 day before':   return -1;
    case '3 days before':  return -3;
    case '1 week before':  return -7;
    default:               return null;
  }
}

/** Schedule (or reschedule) notifications for one event. Returns notification IDs. */
export async function scheduleEventNotifications(event: MicaEvent): Promise<string[]> {
  // Cancel existing notifications for this event first
  await cancelEventNotifications(event.notificationIds);

  if (event.reminder === 'None') return [];

  const offset = reminderToDayOffset(event.reminder);
  if (offset === null) return [];

  // Parse target date from dateIso
  const [year, month, day] = event.dateIso.split('-').map(Number);
  const triggerDate = new Date(year, month - 1, day + offset);
  triggerDate.setHours(9, 0, 0, 0); // 9:00 AM local time

  // Don't schedule if trigger is in the past
  if (triggerDate <= new Date()) return [];

  const body =
    offset === 0
      ? `${event.title} is today!`
      : `${event.title} is coming up — ${Math.abs(offset)} day${Math.abs(offset) !== 1 ? 's' : ''} to go.`;

  const id = await Notifications.scheduleNotificationAsync({
    content: {
      title: 'Mica',
      body,
      data: { eventId: event.id },
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.DATE,
      date: triggerDate,
    },
  });

  return [id];
}

/** Cancel all notification IDs for an event */
export async function cancelEventNotifications(ids: string[]): Promise<void> {
  await Promise.all(ids.map(id => Notifications.cancelScheduledNotificationAsync(id)));
}

/** Cancel all scheduled notifications (used when toggling notifications off) */
export async function cancelAllNotifications(): Promise<void> {
  await Notifications.cancelAllScheduledNotificationsAsync();
}

/** Set up Android notification channel (call once on app start) */
export async function setupAndroidChannel(): Promise<void> {
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('mica-events', {
      name: 'Event Reminders',
      importance: Notifications.AndroidImportance.DEFAULT,
      sound: null,
    });
  }
}
