-- DropIndex
DROP INDEX IF EXISTS "idx_alert_events_alert_created";

-- CreateIndex
CREATE INDEX "idx_alert_events_alert_id" ON "alert_events"("alert_id");
