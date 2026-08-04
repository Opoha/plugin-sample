import { definePlugin } from '@opoha/plugin-sdk';

import {
  createSampleNote,
  deleteSampleNote,
  getSampleNote,
  listSampleNotes,
  pruneArchivedSampleNotes,
  removeSampleNotesForProduct,
  sampleNotesProvider,
  updateSampleNote,
  type SampleNote,
  type SampleNoteStatus,
} from './notes.js';

/** Event name used by the sample plugin listener (loader / registry smoke). */
export const PLUGIN_SAMPLE_EVENT = 'PluginSampleEvent' as const;

/** Default age before archived notes are pruned by the scheduled job (30 days). */
export const SAMPLE_NOTE_PRUNE_MAX_AGE_MS = 30 * 24 * 60 * 60 * 1000;

export {
  createSampleNote,
  createSampleNoteSchema,
  deleteSampleNote,
  getSampleNote,
  listSampleNotes,
  pruneArchivedSampleNotes,
  removeSampleNotesForProduct,
  resetSampleNotesForTests,
  sampleNoteStatusSchema,
  sampleNotesProvider,
  updateSampleNote,
  updateSampleNoteSchema,
  type SampleNote,
  type SampleNoteStatus,
} from './notes.js';

/**
 * Official teaching sample — a **custom store-notes plugin** that shows authors
 * how to combine GraphQL, admin surfaces, providers, events, jobs, rule actions,
 * and plugin-owned TypeORM tables. Still doubles as the loader smoke fixture
 * (`samplePing`, `sample.ping`, `PluginSampleEvent`).
 */
export default definePlugin({
  id: 'sample',
  boot(ctx) {
    // --- Loader / registry smoke (do not remove) ----------------------------
    ctx.registerGraphQL({
      name: 'samplePing',
      kind: 'query',
      descriptor: { resolve: () => 'pong' },
    });
    ctx.registerProvider({
      token: 'sample.ping',
      provider: { ping: () => 'pong' },
    });
    ctx.registerListener(PLUGIN_SAMPLE_EVENT, () => {
      // Side-effect-free stub; hosts assert via ContributionRegistry / event bus.
    });

    // --- Custom feature: store notes ----------------------------------------
    ctx.registerProvider({
      token: 'sample.notes',
      provider: sampleNotesProvider,
    });

    ctx.registerGraphQL({
      name: 'sampleNotes',
      kind: 'query',
      descriptor: {
        resolve: (
          _parent: unknown,
          args: { status?: SampleNoteStatus; productId?: string },
        ): SampleNote[] => listSampleNotes(args),
      },
    });
    ctx.registerGraphQL({
      name: 'sampleNote',
      kind: 'query',
      descriptor: {
        resolve: (_parent: unknown, args: { id: string }): SampleNote | null =>
          getSampleNote(args.id),
      },
    });
    ctx.registerGraphQL({
      name: 'createSampleNote',
      kind: 'mutation',
      descriptor: {
        resolve: (
          _parent: unknown,
          args: { input: Parameters<typeof createSampleNote>[0] },
        ): SampleNote => createSampleNote(args.input),
      },
    });
    ctx.registerGraphQL({
      name: 'updateSampleNote',
      kind: 'mutation',
      descriptor: {
        resolve: (
          _parent: unknown,
          args: { input: Parameters<typeof updateSampleNote>[0] },
        ): SampleNote => updateSampleNote(args.input),
      },
    });
    ctx.registerGraphQL({
      name: 'deleteSampleNote',
      kind: 'mutation',
      descriptor: {
        resolve: (_parent: unknown, args: { id: string }): boolean =>
          deleteSampleNote(args.id),
      },
    });

    // React to a core domain event without patching core.
    ctx.registerListener('ProductDeleted', async (event) => {
      const productId = (event as { data?: { productId?: string } })?.data?.productId;
      if (typeof productId === 'string' && productId.length > 0) {
        removeSampleNotesForProduct(productId);
      }
    });

    // Cron job — host prefixes code with plugin id; no BullMQ import here.
    ctx.registerScheduledJob({
      code: 'prune-archived-notes',
      displayName: 'Prune archived sample notes',
      cron: '0 3 * * *',
      timezone: 'UTC',
      handler: async () => {
        pruneArchivedSampleNotes(SAMPLE_NOTE_PRUNE_MAX_AGE_MS);
      },
    });

    // Automation rule action other packs / workflows can invoke by name.
    ctx.registerRuleAction({
      name: 'sample.logNote',
      displayName: 'Log sample note id',
      handler: async (actionCtx) => {
        const noteId = actionCtx.params.noteId;
        if (typeof noteId === 'string') {
          void getSampleNote(noteId);
        }
      },
    });

    ctx.registerAdmin({
      navigation: [
        {
          id: 'sample-nav',
          label: 'Sample Notes',
          path: '/plugins/sample',
          order: 90,
          permission: 'plugin:sample:read',
        },
      ],
      pages: [
        {
          id: 'sample-notes',
          path: '/plugins/sample',
          title: 'Store Notes',
          permission: 'plugin:sample:read',
        },
      ],
      settings: [
        {
          id: 'sample-settings',
          title: 'Sample Notes',
          path: '/plugins/sample/settings',
          permission: 'plugin:sample:configure',
        },
      ],
      widgets: [
        {
          id: 'sample-notes-widget',
          title: 'Recent sample notes',
          permission: 'plugin:sample:read',
        },
      ],
      tabs: {
        product: [
          {
            id: 'sample-product-notes',
            label: 'Notes',
            permission: 'plugin:sample:read',
          },
        ],
      },
      permissions: [
        'plugin:sample:read',
        'plugin:sample:write',
        'plugin:sample:configure',
      ],
    });
  },
});
