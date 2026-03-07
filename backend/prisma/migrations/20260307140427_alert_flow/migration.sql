-- RenameForeignKey
ALTER TABLE "alert_events" RENAME CONSTRAINT "fk_event_alert" TO "alert_events_alert_id_fkey";

-- RenameForeignKey
ALTER TABLE "alert_events" RENAME CONSTRAINT "fk_event_user" TO "alert_events_user_id_fkey";

-- RenameForeignKey
ALTER TABLE "alerts" RENAME CONSTRAINT "fk_alert_org" TO "alerts_org_id_fkey";

-- RenameForeignKey
ALTER TABLE "alerts" RENAME CONSTRAINT "fk_alert_user" TO "alerts_created_by_id_fkey";
