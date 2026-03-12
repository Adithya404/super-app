-- =====================================
-- Enable UUID generation
-- =====================================
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "citext";


-- =====================================
-- USERS TABLE
-- =====================================
CREATE TABLE IF NOT EXISTS super.users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    email CITEXT NOT NULL UNIQUE,
    password_hash TEXT,

    name TEXT,
    avatar_url TEXT,

    email_verified_at TIMESTAMPTZ,

    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_super_users_email
ON super.users(email);

-- =====================================
-- ACCOUNTS TABLE (OAuth)
-- =====================================
CREATE TABLE IF NOT EXISTS super.accounts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    user_id UUID NOT NULL,
    provider TEXT NOT NULL,
    provider_account_id TEXT NOT NULL,

    access_token TEXT,
    refresh_token TEXT,
    expires_at TIMESTAMPTZ,

    created_at TIMESTAMPTZ DEFAULT now(),

    CONSTRAINT fk_accounts_user
        FOREIGN KEY (user_id)
        REFERENCES super.users(id)
        ON DELETE CASCADE,

    CONSTRAINT provider_unique
        UNIQUE (provider, provider_account_id)
);

CREATE INDEX IF NOT EXISTS idx_super_accounts_lookup
ON super.accounts(provider, provider_account_id);

-- =====================================
-- SESSIONS TABLE
-- =====================================
CREATE TABLE IF NOT EXISTS super.sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    user_id UUID NOT NULL,
    session_token TEXT NOT NULL UNIQUE,

    expires_at TIMESTAMPTZ NOT NULL,

    created_at TIMESTAMPTZ DEFAULT now(),

    CONSTRAINT fk_sessions_user
        FOREIGN KEY (user_id)
        REFERENCES super.users(id)
        ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_super_sessions_token
ON super.sessions(session_token);

-- =====================================
-- VERIFICATION TOKENS
-- =====================================
CREATE TABLE IF NOT EXISTS super.verification_tokens (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    identifier TEXT NOT NULL,
    token TEXT NOT NULL UNIQUE,

    expires_at TIMESTAMPTZ NOT NULL,

    created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_super_verification_tokens_token
ON super.verification_tokens(token);