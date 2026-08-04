import { beforeEach, describe, expect, it, vi } from 'vitest';

import { createStubPluginContext } from '@opoha/plugin-sdk';

import { MIGRATIONS_TABLE_NAME, PLUGIN_ID, entities, migrations } from './database.js';
import sample, {
  PLUGIN_SAMPLE_EVENT,
  createSampleNote,
  deleteSampleNote,
  getSampleNote,
  listSampleNotes,
  pruneArchivedSampleNotes,
  removeSampleNotesForProduct,
  resetSampleNotesForTests,
  updateSampleNote,
} from './index.js';
import { SampleNotesInit1722801000000 } from './migrations/1722801000000-SampleNotesInit.js';

/** RFC-4122 variant nibble required by Zod 4 uuid(). */
const PRODUCT_A = '33333333-3333-4333-a333-333333333333';
const PRODUCT_B = '44444444-4444-4444-b444-444444444444';

function emptyBootCtx() {
  const providers: Array<{ token: string }> = [];
  const graphql: Array<{ name: string; kind: string }> = [];
  const admin: unknown[] = [];
  const listeners: Array<{ eventName: string }> = [];
  const jobs: Array<{ code: string }> = [];
  const actions: Array<{ name: string }> = [];
  return {
    providers,
    graphql,
    admin,
    listeners,
    jobs,
    actions,
    ctx: createStubPluginContext('sample', {
      registerGraphQL(input: { name: string; kind: string }) {
        graphql.push({ name: input.name, kind: input.kind });
      },
      registerProvider(input: { token: string }) {
        providers.push({ token: input.token });
      },
      registerListener(eventName: string) {
        listeners.push({ eventName });
      },
      registerAdmin(contribution: unknown) {
        admin.push(contribution);
      },
      registerScheduledJob(input: { code: string }) {
        jobs.push({ code: input.code });
      },
      registerRuleAction(input: { name: string }) {
        actions.push({ name: input.name });
      },
    }),
  };
}

describe('@opoha/plugin-sample', () => {
  beforeEach(() => {
    resetSampleNotesForTests();
  });

  it('exports definePlugin definition with sample id', () => {
    expect(sample.id).toBe('sample');
    expect(typeof sample.boot).toBe('function');
    expect(PLUGIN_SAMPLE_EVENT).toBe('PluginSampleEvent');
  });

  it('registers smoke fixtures plus store-notes surfaces', () => {
    const boot = emptyBootCtx();
    sample.boot?.(boot.ctx);

    expect(boot.graphql.map((g) => g.name)).toEqual(
      expect.arrayContaining([
        'samplePing',
        'sampleNotes',
        'sampleNote',
        'createSampleNote',
        'updateSampleNote',
        'deleteSampleNote',
      ]),
    );
    expect(boot.providers.map((p) => p.token)).toEqual(
      expect.arrayContaining(['sample.ping', 'sample.notes']),
    );
    expect(boot.listeners.map((l) => l.eventName)).toEqual(
      expect.arrayContaining(['PluginSampleEvent', 'ProductDeleted']),
    );
    expect(boot.jobs.map((j) => j.code)).toContain('prune-archived-notes');
    expect(boot.actions.map((a) => a.name)).toContain('sample.logNote');
    expect(boot.admin).toHaveLength(1);
  });

  it('supports note CRUD and product cascade cleanup', () => {
    const a = createSampleNote({
      title: 'Launch checklist',
      body: 'Verify payments',
      status: 'published',
      productId: PRODUCT_A,
    });
    createSampleNote({
      title: 'Other',
      body: '',
      productId: PRODUCT_B,
    });

    expect(listSampleNotes()).toHaveLength(2);
    expect(getSampleNote(a.id)?.title).toBe('Launch checklist');
    expect(listSampleNotes({ productId: PRODUCT_A })).toHaveLength(1);

    const updated = updateSampleNote({ id: a.id, status: 'archived' });
    expect(updated.status).toBe('archived');

    expect(removeSampleNotesForProduct(PRODUCT_A)).toBe(1);
    expect(listSampleNotes({ productId: PRODUCT_A })).toHaveLength(0);
    expect(deleteSampleNote(listSampleNotes()[0]!.id)).toBe(true);
    expect(listSampleNotes()).toHaveLength(0);
  });

  it('prunes old archived notes', () => {
    const note = createSampleNote({ title: 'Old', status: 'archived' });
    // Force an old updatedAt by mutating through update then backdating.
    updateSampleNote({ id: note.id, body: 'x' });
    const aged = getSampleNote(note.id)!;
    (aged as { updatedAt: Date }).updatedAt = new Date(Date.now() - 60 * 24 * 60 * 60 * 1000);

    expect(pruneArchivedSampleNotes(30 * 24 * 60 * 60 * 1000)).toBe(1);
    expect(listSampleNotes()).toHaveLength(0);
  });

  it('exports plugin-owned database surface', () => {
    expect(PLUGIN_ID).toBe('sample');
    expect(MIGRATIONS_TABLE_NAME).toBe('opoha_migrations_sample');
    expect(entities).toHaveLength(1);
    expect(migrations).toContain(SampleNotesInit1722801000000);
  });

  it('migration creates and drops plugin_sample_notes', async () => {
    const queries: string[] = [];
    const qr = {
      query: vi.fn(async (sql: string) => {
        queries.push(sql);
      }),
    };
    const migration = new SampleNotesInit1722801000000();
    await migration.up(qr as never);
    await migration.down(qr as never);
    expect(queries.some((q) => q.includes('plugin_sample_notes'))).toBe(true);
    expect(queries.some((q) => q.includes('DROP TABLE'))).toBe(true);
  });
});
