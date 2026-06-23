-- Migration: 20260617120000_pingpal_calls.sql
-- Call logging for PingPal voice/video calls

BEGIN;

ALTER TABLE pingpal.messages DROP CONSTRAINT IF EXISTS messages_type_check;
ALTER TABLE pingpal.messages ADD CONSTRAINT messages_type_check
  CHECK (type IN ('text', 'image', 'file', 'system', 'call'));

CREATE TABLE pingpal.calls (
  id               TEXT PRIMARY KEY,
  room_id          TEXT NOT NULL REFERENCES pingpal.rooms(id) ON DELETE CASCADE,
  initiator_id     TEXT NOT NULL REFERENCES super.users(id),
  recipient_id     TEXT NOT NULL REFERENCES super.users(id),
  call_type        TEXT NOT NULL CHECK (call_type IN ('audio', 'video')),
  status           TEXT NOT NULL DEFAULT 'ringing'
                   CHECK (status IN ('ringing', 'answered', 'completed', 'rejected', 'no_answer', 'cancelled', 'missed')),
  started_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  answered_at      TIMESTAMPTZ,
  ended_at         TIMESTAMPTZ,
  duration_seconds INT,
  message_id       TEXT REFERENCES pingpal.messages(id),
  ended_by         TEXT REFERENCES super.users(id)
);

CREATE INDEX idx_calls_room_id ON pingpal.calls(room_id, started_at DESC);
CREATE INDEX idx_calls_initiator ON pingpal.calls(initiator_id);

COMMIT;
