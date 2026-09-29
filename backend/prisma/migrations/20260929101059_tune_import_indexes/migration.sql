-- DropIndex
DROP INDEX "import_schemas_project_id_idx";

-- CreateIndex
CREATE INDEX "imports_schema_id_idx" ON "imports"("schema_id");

-- CreateIndex
CREATE INDEX "imports_uploaded_by_id_idx" ON "imports"("uploaded_by_id");
