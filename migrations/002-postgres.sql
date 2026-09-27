ALTER TABLE articles ADD COLUMN IF NOT EXISTS search_vector tsvector GENERATED ALWAYS AS (setweight(to_tsvector('russian', coalesce(title,'')), 'A') || setweight(to_tsvector('russian', coalesce(body,'')), 'B')) STORED;
CREATE INDEX IF NOT EXISTS articles_search ON articles USING GIN(search_vector);
INSERT INTO schema_migrations(version,applied_at) VALUES('002','2026-09-28') ON CONFLICT(version) DO NOTHING;
