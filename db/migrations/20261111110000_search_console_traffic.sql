-- Daily Google Search Console ingestion. The unique UTC day is the API call gate.
CREATE TABLE IF NOT EXISTS search_console_sync (
  sync_date date PRIMARY KEY,
  status text NOT NULL CHECK (status IN ('started','success','error')),
  started_at timestamptz NOT NULL DEFAULT now(),
  finished_at timestamptz,
  error_code text,
  row_count integer NOT NULL DEFAULT 0
);
CREATE TABLE IF NOT EXISTS search_console_daily (
  date date PRIMARY KEY,
  clicks bigint NOT NULL DEFAULT 0,
  impressions bigint NOT NULL DEFAULT 0,
  ctr double precision NOT NULL DEFAULT 0,
  position double precision NOT NULL DEFAULT 0,
  updated_at timestamptz NOT NULL DEFAULT now()
);
