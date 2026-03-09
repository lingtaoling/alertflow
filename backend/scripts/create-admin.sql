-- Create first admin user (no org, role=admin)
-- Run: docker exec -i alerts_db psql -U postgres -d alert_workflow_db < backend/scripts/create-admin.sql
-- Or run the INSERT below in your DB client.

INSERT INTO users (id, org_id, email, password, name, role, created_at, updated_at)
VALUES (
  gen_random_uuid(),
  NULL,
  'admin@alertflow.com',
  'Demouser123',
  'Admin',
  'admin',
  NOW(),
  NOW()
)
ON CONFLICT (email) DO NOTHING;
