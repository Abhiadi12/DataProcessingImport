-- CreateEnum
CREATE TYPE "import_status" AS ENUM ('UPLOADING', 'QUEUED', 'PROCESSING', 'COMPLETED', 'FAILED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "import_stage" AS ENUM ('FILE_VALIDATION', 'SCHEMA_VALIDATION', 'IMPORTING', 'REPORT_GENERATION');

-- CreateTable
CREATE TABLE "import_schemas" (
    "id" UUID NOT NULL,
    "project_id" UUID,
    "created_by_id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "fields" JSONB NOT NULL,
    "archived_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "import_schemas_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "imports" (
    "id" UUID NOT NULL,
    "project_id" UUID NOT NULL,
    "schema_id" UUID NOT NULL,
    "uploaded_by_id" UUID NOT NULL,
    "filename" TEXT NOT NULL,
    "object_key" TEXT NOT NULL,
    "size_bytes" BIGINT NOT NULL,
    "content_type" TEXT NOT NULL,
    "status" "import_status" NOT NULL DEFAULT 'UPLOADING',
    "stage" "import_stage",
    "attempt" INTEGER NOT NULL DEFAULT 0,
    "failure_reason" TEXT,
    "total_rows" INTEGER,
    "processed_rows" INTEGER NOT NULL DEFAULT 0,
    "successful_rows" INTEGER NOT NULL DEFAULT 0,
    "failed_rows" INTEGER NOT NULL DEFAULT 0,
    "duplicate_rows" INTEGER NOT NULL DEFAULT 0,
    "bytes_read" BIGINT NOT NULL DEFAULT 0,
    "error_report_key" TEXT,
    "queued_at" TIMESTAMP(3),
    "started_at" TIMESTAMP(3),
    "completed_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "imports_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "imported_records" (
    "id" BIGSERIAL NOT NULL,
    "project_id" UUID NOT NULL,
    "schema_id" UUID NOT NULL,
    "import_id" UUID NOT NULL,
    "data" JSONB NOT NULL,
    "dedupe_hash" BYTEA NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "imported_records_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "import_errors" (
    "id" BIGSERIAL NOT NULL,
    "import_id" UUID NOT NULL,
    "row_number" INTEGER NOT NULL,
    "raw_row" TEXT NOT NULL,
    "errors" JSONB NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "import_errors_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "import_schemas_project_id_idx" ON "import_schemas"("project_id");

-- CreateIndex
CREATE UNIQUE INDEX "import_schemas_project_id_name_key" ON "import_schemas"("project_id", "name");

-- CreateIndex
CREATE INDEX "imports_project_id_created_at_idx" ON "imports"("project_id", "created_at" DESC);

-- CreateIndex
CREATE INDEX "imports_status_idx" ON "imports"("status");

-- CreateIndex
CREATE INDEX "imported_records_import_id_idx" ON "imported_records"("import_id");

-- CreateIndex
CREATE UNIQUE INDEX "imported_records_project_id_schema_id_dedupe_hash_key" ON "imported_records"("project_id", "schema_id", "dedupe_hash");

-- CreateIndex
CREATE INDEX "import_errors_import_id_row_number_idx" ON "import_errors"("import_id", "row_number");

-- AddForeignKey
ALTER TABLE "import_schemas" ADD CONSTRAINT "import_schemas_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "import_schemas" ADD CONSTRAINT "import_schemas_created_by_id_fkey" FOREIGN KEY ("created_by_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "imports" ADD CONSTRAINT "imports_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "imports" ADD CONSTRAINT "imports_schema_id_fkey" FOREIGN KEY ("schema_id") REFERENCES "import_schemas"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "imports" ADD CONSTRAINT "imports_uploaded_by_id_fkey" FOREIGN KEY ("uploaded_by_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "imported_records" ADD CONSTRAINT "imported_records_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "imported_records" ADD CONSTRAINT "imported_records_schema_id_fkey" FOREIGN KEY ("schema_id") REFERENCES "import_schemas"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "imported_records" ADD CONSTRAINT "imported_records_import_id_fkey" FOREIGN KEY ("import_id") REFERENCES "imports"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "import_errors" ADD CONSTRAINT "import_errors_import_id_fkey" FOREIGN KEY ("import_id") REFERENCES "imports"("id") ON DELETE CASCADE ON UPDATE CASCADE;
