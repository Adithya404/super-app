BEGIN;

-- ===============================
-- APPLICATIONS
-- ===============================
CREATE TABLE super.applications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  schema_name TEXT NOT NULL UNIQUE,

  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_applications_slug
ON super.applications(slug);

-- ===============================
-- USER APP ACCESS
-- ===============================
CREATE TABLE super.user_app_access (
  user_id UUID NOT NULL,
  application_id UUID NOT NULL,

  granted_at TIMESTAMPTZ DEFAULT now(),

  PRIMARY KEY (user_id, application_id),

  FOREIGN KEY (user_id)
    REFERENCES super.users(id)
    ON DELETE CASCADE,

  FOREIGN KEY (application_id)
    REFERENCES super.applications(id)
    ON DELETE CASCADE
);

CREATE INDEX idx_user_app_access_user
ON super.user_app_access(user_id);

CREATE INDEX idx_user_app_access_app
ON super.user_app_access(application_id);

-- ===============================
-- ROLES
-- ===============================
CREATE TABLE super.roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  name TEXT NOT NULL UNIQUE,
  description TEXT,

  created_at TIMESTAMPTZ DEFAULT now()
);

-- ===============================
-- PERMISSIONS
-- ===============================
CREATE TABLE super.permissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  name TEXT NOT NULL UNIQUE,
  description TEXT
);

-- ===============================
-- ROLE PERMISSIONS
-- ===============================
CREATE TABLE super.role_permissions (
  role_id UUID NOT NULL,
  permission_id UUID NOT NULL,

  PRIMARY KEY (role_id, permission_id),

  FOREIGN KEY (role_id)
    REFERENCES super.roles(id)
    ON DELETE CASCADE,

  FOREIGN KEY (permission_id)
    REFERENCES super.permissions(id)
    ON DELETE CASCADE
);

CREATE INDEX idx_role_permissions_role
ON super.role_permissions(role_id);

CREATE INDEX idx_role_permissions_permission
ON super.role_permissions(permission_id);

-- ===============================
-- USER ROLES
-- ===============================
CREATE TABLE super.user_roles (
  user_id UUID NOT NULL,
  role_id UUID NOT NULL,

  PRIMARY KEY (user_id, role_id),

  FOREIGN KEY (user_id)
    REFERENCES super.users(id)
    ON DELETE CASCADE,

  FOREIGN KEY (role_id)
    REFERENCES super.roles(id)
    ON DELETE CASCADE
);

CREATE INDEX idx_user_roles_user
ON super.user_roles(user_id);

CREATE INDEX idx_user_roles_role
ON super.user_roles(role_id);

COMMIT;