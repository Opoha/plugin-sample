import 'reflect-metadata';

/**
 * Plugin-owned TypeORM surface for CLI / host migration aggregation (ADR-0005).
 * Core never imports this package statically — hosts load via dynamic import.
 */

import { SampleNoteEntity, sampleEntities } from './entities/index.js';
import { SampleNotesInit1722801000000 } from './migrations/1722801000000-SampleNotesInit.js';
import { sampleMigrations } from './migrations/index.js';

export const PLUGIN_ID = 'sample' as const;

/** Namespaced migrations table — never shares core `migrations`. */
export const MIGRATIONS_TABLE_NAME = 'opoha_migrations_sample' as const;

export const entities = sampleEntities;
export const migrations = sampleMigrations;

export {
  SampleNoteEntity,
  SampleNotesInit1722801000000,
  sampleEntities,
  sampleMigrations,
};
