CREATE TABLE IF NOT EXISTS photo_objects (
 key TEXT PRIMARY KEY,
 bytes BYTEA NOT NULL,
 content_type TEXT NOT NULL,
 sha256 TEXT NOT NULL,
 size_bytes INTEGER NOT NULL CHECK (size_bytes > 0),
 created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
 CHECK (octet_length(bytes)=size_bytes)
);
ALTER TABLE photo_objects ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON photo_objects FROM PUBLIC;
