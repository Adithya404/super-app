-- Migration: 20260405014509_pingpal_init.sql
-- Created at: 2026-04-04T20:15:09.082Z

BEGIN;

-- Create schema
CREATE SCHEMA IF NOT EXISTS pingpal;

-- Users cache (mirrors super.users for quick joins)
CREATE TABLE pingpal.users (
  id          TEXT PRIMARY KEY REFERENCES "super".users(id) ON DELETE CASCADE,
  email       TEXT NOT NULL UNIQUE,
  name        TEXT,
  avatar_url  TEXT,
  is_online   BOOLEAN DEFAULT false,
  last_seen   TIMESTAMPTZ DEFAULT NOW(),
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- Rooms (both DM and group)
CREATE TABLE pingpal.rooms (
  id            TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  name          TEXT,                          -- NULL for DMs, required for groups
  description   TEXT,
  type          TEXT NOT NULL CHECK (type IN ('dm', 'group')),
  avatar_url    TEXT,
  created_by    TEXT NOT NULL REFERENCES pingpal.users(id),
  created_at    TIMESTAMPTZ DEFAULT NOW(),
  updated_at    TIMESTAMPTZ DEFAULT NOW()
);

-- Room members
CREATE TABLE pingpal.room_members (
  room_id     TEXT NOT NULL REFERENCES pingpal.rooms(id) ON DELETE CASCADE,
  user_id     TEXT NOT NULL REFERENCES pingpal.users(id) ON DELETE CASCADE,
  role        TEXT NOT NULL DEFAULT 'member' CHECK (role IN ('owner', 'admin', 'member')),
  joined_at   TIMESTAMPTZ DEFAULT NOW(),
  last_read_at TIMESTAMPTZ DEFAULT NOW(),      -- for unread count tracking
  PRIMARY KEY (room_id, user_id)
);

-- Messages
CREATE TABLE pingpal.messages (
  id            TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  room_id       TEXT NOT NULL REFERENCES pingpal.rooms(id) ON DELETE CASCADE,
  sender_id     TEXT NOT NULL REFERENCES pingpal.users(id),
  content       TEXT,
  type          TEXT NOT NULL DEFAULT 'text' CHECK (type IN ('text', 'image', 'file', 'system')),
  file_url      TEXT,                          -- for image/file messages
  reply_to_id   TEXT REFERENCES pingpal.messages(id),  -- thread replies
  is_edited     BOOLEAN DEFAULT false,
  is_deleted    BOOLEAN DEFAULT false,         -- soft delete
  created_at    TIMESTAMPTZ DEFAULT NOW(),
  updated_at    TIMESTAMPTZ DEFAULT NOW()
);

-- Message reactions
CREATE TABLE pingpal.reactions (
  message_id  TEXT NOT NULL REFERENCES pingpal.messages(id) ON DELETE CASCADE,
  user_id     TEXT NOT NULL REFERENCES pingpal.users(id) ON DELETE CASCADE,
  emoji       TEXT NOT NULL,
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (message_id, user_id, emoji)
);

-- Indexes
CREATE INDEX idx_messages_room_id    ON pingpal.messages(room_id, created_at DESC);
CREATE INDEX idx_messages_sender_id  ON pingpal.messages(sender_id);
CREATE INDEX idx_room_members_user   ON pingpal.room_members(user_id);
CREATE INDEX idx_rooms_updated_at    ON pingpal.rooms(updated_at DESC);


COMMIT;
