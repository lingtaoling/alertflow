-- CreateEnum
CREATE TYPE "UserRole" AS ENUM (
  'admin',
  'normal'
);

-- CreateEnum
CREATE TYPE "AlertStatus" AS ENUM (
  'NEW',
  'ACKNOWLEDGED',
  'RESOLVED'
);

-- CreateTable
CREATE TABLE "organizations" (
  "id"         UUID         NOT NULL DEFAULT gen_random_uuid(),
  "name"       VARCHAR(100) NOT NULL,
  "created_at" TIMESTAMPTZ  NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMPTZ  NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "organizations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "users" (
  "id"         UUID         NOT NULL DEFAULT gen_random_uuid(),
  "org_id"     UUID,
  "email"      TEXT         NOT NULL,
  "password"   VARCHAR(100) NOT NULL,
  "name"       VARCHAR(40),
  "role"       "UserRole"   NOT NULL DEFAULT 'normal',
  "created_at" TIMESTAMPTZ  NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMPTZ  NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "alerts" (
  "id"              UUID           NOT NULL DEFAULT gen_random_uuid(),
  "title"           TEXT           NOT NULL,
  "description"     TEXT,
  "status"          "AlertStatus"  NOT NULL DEFAULT 'NEW',
  "org_id"          UUID           NOT NULL,
  "created_by_id"   UUID,
  "created_at"      TIMESTAMPTZ    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at"      TIMESTAMPTZ    NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "alerts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "alert_events" (
  "id"          UUID           NOT NULL DEFAULT gen_random_uuid(),
  "alert_id"    UUID           NOT NULL,
  "user_id"     UUID,
  "from_status" "AlertStatus",
  "to_status"   "AlertStatus"  NOT NULL,
  "note"        TEXT,
  "created_at"  TIMESTAMPTZ    NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "alert_events_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE INDEX "idx_alerts_org_status" ON "alerts"("org_id", "status");

-- CreateIndex
CREATE INDEX "idx_alerts_org_status_created" ON "alerts"("org_id", "status", "created_at" DESC);

-- CreateIndex
CREATE INDEX "idx_alert_events_alert_created" ON "alert_events"("alert_id", "created_at");

-- AddForeignKey
ALTER TABLE "users"
  ADD CONSTRAINT "users_org_id_fkey"
  FOREIGN KEY ("org_id") REFERENCES "organizations"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "alerts"
  ADD CONSTRAINT "fk_alert_org"
  FOREIGN KEY ("org_id") REFERENCES "organizations"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "alerts"
  ADD CONSTRAINT "fk_alert_user"
  FOREIGN KEY ("created_by_id") REFERENCES "users"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "alert_events"
  ADD CONSTRAINT "fk_event_alert"
  FOREIGN KEY ("alert_id") REFERENCES "alerts"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "alert_events"
  ADD CONSTRAINT "fk_event_user"
  FOREIGN KEY ("user_id") REFERENCES "users"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;
