import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

/**
 * OWNER: @opoha/plugin-sample — merchant store note (ADR-0005).
 * Table prefix: plugin id `sample` → `plugin_sample_*`.
 * productId is an opaque UUID — no FK into core tables.
 */
@Entity({ name: 'plugin_sample_notes' })
@Index('plugin_sample_notes_status_idx', ['status'])
@Index('plugin_sample_notes_product_idx', ['productId'])
export class SampleNoteEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'varchar', length: 200 })
  title!: string;

  @Column({ type: 'text', default: '' })
  body!: string;

  @Column({ type: 'varchar', length: 32, default: 'draft' })
  status!: string;

  /** Opaque reference to a core catalog product (optional). */
  @Column({ name: 'product_id', type: 'uuid', nullable: true })
  productId!: string | null;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt!: Date;
}
