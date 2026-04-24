export function formatShortDate(date: string): string {
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(new Date(date));
}

export function formatDaysLabel(days: number): string {
  if (days === 0) {
    return 'Today';
  }

  if (days === 1) {
    return '1 day left';
  }

  if (days < 0) {
    return `${Math.abs(days)} days ago`;
  }

  return `${days} days left`;
}
