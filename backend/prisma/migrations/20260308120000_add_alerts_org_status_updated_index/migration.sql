-- DropIndex
DROP INDEX IF EXISTS "idx_alerts_org_status_created";

-- CreateIndex
CREATE INDEX "idx_alerts_org_status_updated" ON "alerts"("org_id", "status", "updated_at" DESC);
