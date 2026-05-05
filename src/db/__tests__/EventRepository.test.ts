// src/db/__tests__/EventRepository.test.ts
import { EventRepository } from '../EventRepository';
import { migrateDatabase } from '../database';

// Mock expo-sqlite
jest.mock('expo-sqlite');

// Mock dateIsoToDayOfYear since Task 5 hasn't been implemented yet
jest.mock('../../utils/yearProgress', () => ({
  dateIsoToDayOfYear: (_iso: string) => 123,
  getYearProgress: jest.fn(),
  getRemainingCopy: jest.fn(),
  formatDays: jest.fn(),
}));

// Helper: create an in-memory repo for each test
async function makeRepo(): Promise<EventRepository> {
  const { openDatabaseAsync } = jest.requireMock('expo-sqlite') as {
    openDatabaseAsync: (name: string) => Promise<import('expo-sqlite').SQLiteDatabase>;
  };
  const db = await openDatabaseAsync(':memory:');
  await migrateDatabase(db);
  return new EventRepository(db);
}

const SAMPLE = {
  title: 'Mum birthday',
  dateIso: '2026-05-03',
  color: '#C86B5A',
  type: 'Birthday' as const,
  repeats: 'Yearly' as const,
  reminder: '1 day before' as const,
  note: 'Get flowers',
  dayOfYear: 123,
  notificationIds: [] as string[],
};

describe('EventRepository', () => {
  it('creates and retrieves an event', async () => {
    const repo = await makeRepo();
    const created = await repo.create(SAMPLE);
    expect(created.id).toHaveLength(36); // uuid v4
    expect(created.title).toBe('Mum birthday');
    expect(created.dateIso).toBe('2026-05-03');
    expect(created.type).toBe('Birthday');
    expect(created.appwriteId).toBeNull();

    const fetched = await repo.getById(created.id);
    expect(fetched?.title).toBe('Mum birthday');
  });

  it('getAll returns only non-deleted events sorted by date', async () => {
    const repo = await makeRepo();
    await repo.create({ ...SAMPLE, title: 'Later', dateIso: '2026-12-25' });
    await repo.create({ ...SAMPLE, title: 'Sooner', dateIso: '2026-06-01' });
    const ev = await repo.create(SAMPLE);
    await repo.delete(ev.id);

    const all = await repo.getAll();
    expect(all).toHaveLength(2);
    expect(all[0].title).toBe('Sooner'); // sorted ascending
    expect(all[1].title).toBe('Later');
  });

  it('getById returns null for deleted event', async () => {
    const repo = await makeRepo();
    const ev = await repo.create(SAMPLE);
    await repo.delete(ev.id);
    expect(await repo.getById(ev.id)).toBeNull();
  });

  it('update changes specified fields only', async () => {
    const repo = await makeRepo();
    const ev = await repo.create(SAMPLE);
    const updated = await repo.update(ev.id, { title: 'Dad birthday', note: 'Cake' });
    expect(updated.title).toBe('Dad birthday');
    expect(updated.note).toBe('Cake');
    expect(updated.dateIso).toBe('2026-05-03'); // unchanged
    expect(updated.color).toBe('#C86B5A'); // unchanged
  });

  it('update throws if event not found', async () => {
    const repo = await makeRepo();
    await expect(repo.update('nonexistent', { title: 'x' })).rejects.toThrow('not found');
  });

  it('getCount excludes deleted events', async () => {
    const repo = await makeRepo();
    await repo.create(SAMPLE);
    const ev2 = await repo.create({ ...SAMPLE, title: 'Other' });
    await repo.delete(ev2.id);
    expect(await repo.getCount()).toBe(1);
  });

  it('settings round-trip', async () => {
    const repo = await makeRepo();
    await repo.setSetting('theme', 'dark');
    expect(await repo.getSetting('theme')).toBe('dark');
    expect(await repo.getSetting('missing_key')).toBeNull();
  });

  it('setSetting overwrites existing value', async () => {
    const repo = await makeRepo();
    await repo.setSetting('theme', 'light');
    await repo.setSetting('theme', 'dark');
    expect(await repo.getSetting('theme')).toBe('dark');
  });
});
