import { randomUUID } from 'node:crypto';

import { z } from 'zod';

/**
 * In-memory domain for the sample “store notes” feature.
 * TypeORM entities under `./database` own the durable schema (ADR-0005);
 * this module is the runtime surface wired through GraphQL / providers.
 */

export const sampleNoteStatusSchema = z.enum(['draft', 'published', 'archived']);
export type SampleNoteStatus = z.infer<typeof sampleNoteStatusSchema>;

export const createSampleNoteSchema = z.object({
  title: z.string().trim().min(1).max(200),
  body: z.string().trim().max(5000).default(''),
  status: sampleNoteStatusSchema.default('draft'),
  /** Optional opaque product UUID — no FK into core tables. */
  productId: z.string().uuid().optional(),
});

export const updateSampleNoteSchema = z.object({
  id: z.string().uuid(),
  title: z.string().trim().min(1).max(200).optional(),
  body: z.string().trim().max(5000).optional(),
  status: sampleNoteStatusSchema.optional(),
  productId: z.string().uuid().nullable().optional(),
});

export type SampleNote = {
  id: string;
  title: string;
  body: string;
  status: SampleNoteStatus;
  productId: string | null;
  createdAt: Date;
  updatedAt: Date;
};

let notes: SampleNote[] = [];

/** Test helper — reset module state between Vitest cases. */
export function resetSampleNotesForTests(): void {
  notes = [];
}

export function listSampleNotes(filter?: {
  status?: SampleNoteStatus;
  productId?: string;
}): SampleNote[] {
  return notes
    .filter((n) => (filter?.status ? n.status === filter.status : true))
    .filter((n) => (filter?.productId ? n.productId === filter.productId : true))
    .slice()
    .sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime());
}

export function getSampleNote(id: string): SampleNote | null {
  return notes.find((n) => n.id === id) ?? null;
}

export function createSampleNote(input: z.input<typeof createSampleNoteSchema>): SampleNote {
  const parsed = createSampleNoteSchema.parse(input);
  const now = new Date();
  const row: SampleNote = {
    id: randomUUID(),
    title: parsed.title,
    body: parsed.body,
    status: parsed.status,
    productId: parsed.productId ?? null,
    createdAt: now,
    updatedAt: now,
  };
  notes = [...notes, row];
  return row;
}

export function updateSampleNote(input: z.input<typeof updateSampleNoteSchema>): SampleNote {
  const parsed = updateSampleNoteSchema.parse(input);
  const idx = notes.findIndex((n) => n.id === parsed.id);
  if (idx < 0) {
    throw new Error(`Sample note not found: ${parsed.id}`);
  }
  const current = notes[idx]!;
  const next: SampleNote = {
    ...current,
    title: parsed.title ?? current.title,
    body: parsed.body ?? current.body,
    status: parsed.status ?? current.status,
    productId:
      parsed.productId === undefined ? current.productId : parsed.productId,
    updatedAt: new Date(),
  };
  notes = notes.map((n, i) => (i === idx ? next : n));
  return next;
}

export function deleteSampleNote(id: string): boolean {
  const before = notes.length;
  notes = notes.filter((n) => n.id !== id);
  return notes.length < before;
}

/** Cascade-remove notes linked to a deleted product (`ProductDeleted`). */
export function removeSampleNotesForProduct(productId: string): number {
  const before = notes.length;
  notes = notes.filter((n) => n.productId !== productId);
  return before - notes.length;
}

/** Archive notes older than `maxAgeMs` (used by the scheduled prune job). */
export function pruneArchivedSampleNotes(maxAgeMs: number, now = new Date()): number {
  const cutoff = now.getTime() - maxAgeMs;
  const before = notes.length;
  notes = notes.filter(
    (n) => !(n.status === 'archived' && n.updatedAt.getTime() < cutoff),
  );
  return before - notes.length;
}

/** Extension surface registered via `PluginContext.registerProvider`. */
export const sampleNotesProvider = {
  list: listSampleNotes,
  get: getSampleNote,
  create: createSampleNote,
  update: updateSampleNote,
  delete: deleteSampleNote,
};
