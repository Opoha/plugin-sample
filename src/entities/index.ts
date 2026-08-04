import { SampleNoteEntity } from './sample-note.entity.js';

/** TypeORM entities owned by this plugin (ADR-0005). */
export const sampleEntities = [SampleNoteEntity] as const;

export { SampleNoteEntity };
