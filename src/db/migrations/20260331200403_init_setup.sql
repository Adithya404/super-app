-- Migration: 20260331200403_init_setup.sql
-- Created at: 2026-03-31T14:34:03.677Z

BEGIN;

-- Write your SQL here

CREATE SCHEMA IF NOT EXISTS super;
-- =========================
-- 1. users
-- =========================
CREATE TABLE IF NOT EXISTS super.users (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,

    name TEXT,
    email TEXT UNIQUE,
    "emailVerified" TIMESTAMPTZ,
    image TEXT,
    password TEXT
);

-- =========================
-- 2. roles
-- =========================
CREATE TABLE IF NOT EXISTS super.roles (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,

    role TEXT NOT NULL,
    role_code TEXT NOT NULL,
    description TEXT,
    app TEXT NOT NULL,

    start_date DATE NOT NULL DEFAULT CURRENT_DATE,
    end_date DATE,

    created_at TIMESTAMPTZ DEFAULT now(),

    CONSTRAINT roles_role_code_key UNIQUE (role_code)
);

CREATE INDEX IF NOT EXISTS idx_super_roles_app
ON super.roles (app);

-- =========================
-- 3. verification_tokens
-- =========================
CREATE TABLE IF NOT EXISTS super.verification_tokens (
    identifier TEXT NOT NULL,
    token TEXT NOT NULL,
    expires TIMESTAMPTZ NOT NULL,

    CONSTRAINT verification_tokens_identifier_token_key
        UNIQUE (identifier, token)
);

-- =========================
-- 4. accounts (depends on users)
-- =========================
CREATE TABLE IF NOT EXISTS super.accounts (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,

    "userId" TEXT NOT NULL,
    type TEXT NOT NULL,
    provider TEXT NOT NULL,
    "providerAccountId" TEXT NOT NULL,

    refresh_token TEXT,
    access_token TEXT,
    expires_at BIGINT,
    token_type TEXT,
    scope TEXT,
    id_token TEXT,
    session_state TEXT,

    CONSTRAINT accounts_provider_providerAccountId_key
        UNIQUE (provider, "providerAccountId"),

    CONSTRAINT accounts_userId_fkey
        FOREIGN KEY ("userId")
        REFERENCES super.users (id)
        ON DELETE CASCADE
);

-- =========================
-- 5. sessions (depends on users)
-- =========================
CREATE TABLE IF NOT EXISTS super.sessions (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,

    "sessionToken" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    expires TIMESTAMPTZ NOT NULL,

    CONSTRAINT sessions_sessionToken_key UNIQUE ("sessionToken"),

    CONSTRAINT sessions_userId_fkey
        FOREIGN KEY ("userId")
        REFERENCES super.users (id)
        ON DELETE CASCADE
);

-- =========================
-- 6. user_roles (depends on users + roles)
-- =========================
CREATE TABLE IF NOT EXISTS super.user_roles (
    email TEXT NOT NULL,
    role_code TEXT NOT NULL,

    start_date DATE NOT NULL DEFAULT CURRENT_DATE,
    end_date DATE,
    created_at TIMESTAMPTZ DEFAULT now(),

    PRIMARY KEY (email, role_code),

    CONSTRAINT user_roles_email_fkey
        FOREIGN KEY (email)
        REFERENCES super.users (email)
        ON DELETE CASCADE,

    CONSTRAINT user_roles_role_code_fkey
        FOREIGN KEY (role_code)
        REFERENCES super.roles (role_code)
        ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_super_user_roles_email
ON super.user_roles (email);

CREATE INDEX IF NOT EXISTS idx_super_user_roles_role_code
ON super.user_roles (role_code);
COMMIT;
