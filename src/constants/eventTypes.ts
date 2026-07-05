import { Ionicons } from '@expo/vector-icons';
import { EventTypeOption } from '../types';

// Shared event-type list + icon mapping. Previously declared only inside
// AddEventScreen; pulled out so the Home quick-add sheet can use the same
// options without redeclaring them.
export const EVENT_TYPES: EventTypeOption[] = ['Birthday', 'Deadline', 'Vacation', 'Milestone', 'Other'];

type IoniconName = React.ComponentProps<typeof Ionicons>['name'];

export const EVENT_TYPE_ICONS: Record<EventTypeOption, IoniconName> = {
  Birthday: 'gift-outline',
  Deadline: 'timer-outline',
  Vacation: 'airplane-outline',
  Milestone: 'trophy-outline',
  Other:    'ellipsis-horizontal-circle-outline',
};
