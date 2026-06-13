-- Migration: seed default admin role and user for fresh databases
-- Default credentials (change after first login):
--   Email:    admin@super-app.local
--   Password: Admin@123
--
-- Login storage:
--   super.users      — identity + bcrypt password (credentials sign-in)
--   super.roles      — role definitions (must exist for role_code FK join)
--   super.user_roles — assigns role to user by email
--   super.accounts   — OAuth only (not created for credentials users)

BEGIN;

-- 1. Admin role definition (required by getUserRoles JOIN on super.roles)
INSERT INTO super.roles (role, role_code, description, app, start_date)
VALUES (
  'Administrator',
  'admin',
  'Full system administrator',
  '*',
  CURRENT_DATE
)
ON CONFLICT (role_code) DO NOTHING;

-- 2. Default admin user (bcrypt hash for "Admin@123", cost 12)
INSERT INTO super.users (name, email, password)
VALUES (
  'Admin',
  'admin@super-app.local',
  '$2b$12$NTiaUSKp8Gv9Z5HQwfhg4urlv0nwxkfDaRN2dQlnFa3Mgx2slxrWS'
)
ON CONFLICT (email) DO NOTHING;

-- 3. Assign admin role to the default user
INSERT INTO super.user_roles (email, role_code, start_date)
VALUES ('admin@super-app.local', 'admin', CURRENT_DATE)
ON CONFLICT (email, role_code) DO NOTHING;

COMMIT;
