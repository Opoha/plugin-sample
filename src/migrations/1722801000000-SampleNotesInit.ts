import type { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Initial sample notes table (ADR-0005).
 * Table prefix: plugin id `sample` → `plugin_sample_*`
 * (never touches core tables).
 */
export class SampleNotesInit1722801000000 implements MigrationInterface {
  name = 'SampleNotesInit1722801000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "plugin_sample_notes" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "title" character varying(200) NOT NULL,
        "body" text NOT NULL DEFAULT '',
        "status" character varying(32) NOT NULL DEFAULT 'draft',
        "product_id" uuid,
        "created_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
        CONSTRAINT "plugin_sample_notes_pkey" PRIMARY KEY ("id")
      )
    `);
    await queryRunner.query(`
      CREATE INDEX "plugin_sample_notes_status_idx"
        ON "plugin_sample_notes" ("status")
    `);
    await queryRunner.query(`
      CREATE INDEX "plugin_sample_notes_product_idx"
        ON "plugin_sample_notes" ("product_id")
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS "plugin_sample_notes"`);
  }
}
