# Auth Flow Analysis — super-app

## Database Layout

All Auth.js tables live in the **`super` schema**. Foreign keys enforce referential integrity:

| Table | FK |
|---|---|
| `super.accounts` | `userId → super.users.id` |
| `super.sessions` | `userId → super.users.id` |
| `super.verification_tokens` | *(no FK, standalone)* |

---

## Table Schemas

### `super.users`
| Column | Type | Nullable | Default |
|---|---|---|---|
| `id` | `text` | NO | `gen_random_uuid()::text` |
| `name` | `text` | YES | — |
| `email` | `text` | YES | — |
| `emailVerified` | `timestamptz` | YES | — |
| `image` | `text` | YES | — |
| `password` | `text` | YES | — |

> **Note:** `password` is a **custom column** added on top of the standard Auth.js schema. It stores a `bcrypt`-hashed password and is only set for credential-based users. Google-only users have `password = NULL`.

---

### `super.accounts`
| Column | Type | Nullable | Notes |
|---|---|---|---|
| `id` | `text` | NO | auto UUID |
| `userId` | `text` | NO | FK → `super.users.id` |
| `type` | `text` | NO | e.g. `"oauth"`, `"credentials"` |
| `provider` | `text` | NO | e.g. `"google"`, `"credentials"` |
| `providerAccountId` | `text` | NO | Google's subject ID, or user ID for credentials |
| `refresh_token` | `text` | YES | OAuth only |
| `access_token` | `text` | YES | OAuth only |
| `expires_at` | `bigint` | YES | OAuth token expiry (unix epoch) |
| `token_type` | `text` | YES | e.g. `"bearer"` |
| `scope` | `text` | YES | OAuth scopes granted |
| `id_token` | `text` | YES | Google OIDC ID token (JWT) |
| `session_state` | `text` | YES | OAuth session state |

> **Purpose:** Links an identity provider to a `user`. One user can have multiple rows here (e.g., both Google and credentials). This is how the register route detects *how* someone signed up.

---

### `super.sessions`
| Column | Type | Nullable | Notes |
|---|---|---|---|
| `id` | `text` | NO | auto UUID |
| `sessionToken` | `text` | NO | random UUID used as the cookie value |
| `userId` | `text` | NO | FK → `super.users.id` |
| `expires` | `timestamptz` | NO | `now() + 30 days` |

> **Purpose:** Stores the active browser session. The `sessionToken` value is what sits in the browser cookie. On every request, Auth.js looks up this token here to find the authenticated user.

---

## Auth Flow — Step by Step

### Path 1: Credentials Registration (`/api/register`)

```
User fills in email + password → POST /api/register
```

1. **Validate** — email & password ≥ 8 chars required.
2. **Check existing user** — `SELECT id FROM super.users WHERE email = $1`
   - If found, query `super.accounts WHERE "userId" = $1` to get linked providers.
   - **Google-only?** → return `{ hint: "USE_GOOGLE" }` (409)
   - **Credentials already exists?** → return `{ hint: "USE_LOGIN" }` (409)
3. **Create user** — `bcrypt.hash(password, 12)` then `INSERT INTO super.users (email, password)`
   - Auth.js's `PostgresAdapter` **does NOT auto-insert** to `super.accounts` here — the register route only touches `super.users`.
4. **Auto sign-in** — The page calls `signIn("credentials", ...)` after a successful 201, which goes through **Path 2** below.

> [!IMPORTANT]
> The register route does NOT insert into `super.accounts`. For credential users, the `super.accounts` table may have no row unless you explicitly add one. This is by design in Auth.js v5 — credential accounts aren't tracked as OAuth accounts.

---

### Path 2: Credentials Login (`signIn("credentials", ...)`)

```
User fills email + password → signIn("credentials") → authorize() callback
```

1. **`authorize()` in auth.ts** — `SELECT * FROM super.users WHERE email = $1`
   - Checks `user.password` exists (null = Google-only, should be blocked).
   - `bcrypt.compare(inputPassword, storedHash)` — if match, returns `{ id, email, name }`.
2. **JWT `encode()` override** — Instead of creating a real JWT:
   - Generates a `crypto.randomUUID()` as `sessionToken`.
   - Manually **INSERTs into `sessions`** (note: this targets the unqualified `sessions` table, not `super.sessions` — see warning below).
   - Returns the `sessionToken` as the cookie value.
3. **Session cookie set** — Browser gets a `next-auth.session-token` cookie with that UUID.
4. **`session` callback** — On every auth check:
   - Auth.js looks up the session token in `sessions` → gets `userId` → loads the user.
   - Your callback adds `roles` and `teams` to the session object.

> [!WARNING]
> **Schema mismatch risk!** The `jwt.encode` override in `auth.ts` inserts into `sessions` (no schema prefix), while the `PostgresAdapter` is using `super.sessions`. Whether these resolve to the same table depends on your `search_path` setting on `authPool`. If `search_path` is not set to `super`, you may have a phantom public schema `sessions` table receiving inserts that the adapter can never find — causing session lookups to fail for credential logins.

---

### Path 3: Google OAuth (`signIn("google", ...)`)

```
User clicks "Continue with Google" → Google consent → callback
```

Auth.js's `PostgresAdapter` handles **everything automatically**:

1. **User lookup/create** — Checks `super.users` by email. If not found, inserts a new row (`name`, `email`, `image` from Google profile; `password = NULL`; `emailVerified` set to `now()`).
2. **Account link** — Inserts into `super.accounts` with:
   - `type = "oauth"`, `provider = "google"`
   - `providerAccountId` = Google's `sub` claim
   - `access_token`, `refresh_token`, `expires_at`, `scope`, `id_token`, `token_type` all populated from Google's token response.
3. **Session creation** — Inserts into `super.sessions` with a new `sessionToken` UUID.
4. **Session callback** — Same as credentials: roles + teams are added.

---

## Why Two Tables (`users` + `accounts`)?

| Concern | Table |
|---|---|
| *Who is this person?* | `super.users` — identity (email, name, avatar) |
| *How did they prove it?* | `super.accounts` — the provider link (Google token, credentials flag) |

This separation lets **one user have multiple sign-in methods**. The register route exploits this: it checks `super.accounts` to decide if the user is Google-only or already has a password.

---

## Key Decisions & Things to Be Aware Of

| # | Issue | Detail |
|---|---|---|
| 1 | **`sessions` schema prefix** | `jwt.encode` inserts into `sessions` (no `super.` prefix). Verify `search_path = super` on `authPool` or change to `super.sessions`. |
| 2 | **Credential users missing in `accounts`** | No `super.accounts` row is created for credentials users. The register route handles the duplicate check correctly by checking providers, but this means `hasCredentials` will always be `false` unless you explicitly insert an accounts row. |
| 3 | **`password` is a custom column** | Not part of standard Auth.js. If you ever run a migration tool that regenerates the schema, this column will be lost. |
| 4 | **Session strategy is `"database"`** | No JWT is ever stored in the cookie — only the opaque `sessionToken` UUID. This means sessions are fully server-side and can be revoked by deleting the row. |
| 5 | **`updateAge: 24h`** | Sessions auto-extend their expiry once per 24 hours of activity, up to the 30-day max. |
| 6 | **`decode()` returns `null`** | This is intentional. The database strategy doesn't use JWT decode; Auth.js uses the raw token string for DB lookup instead. |
