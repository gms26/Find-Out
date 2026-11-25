-- Find-Out hotels table. Run with: psql "$DATABASE_URL" -f schema.sql
-- or: npm run db:setup   (runs this file through the pg driver)
CREATE TABLE IF NOT EXISTS hotels (
  id SERIAL PRIMARY KEY,
  title VARCHAR(200) NOT NULL,
  description TEXT NOT NULL,
  latitude NUMERIC(9, 6) NOT NULL CHECK (latitude BETWEEN -90 AND 90),
  longitude NUMERIC(9, 6) NOT NULL CHECK (longitude BETWEEN -180 AND 180),
  price NUMERIC(12, 2) NOT NULL CHECK (price > 0),
  image_path VARCHAR(500),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_hotels_title ON hotels (title);
CREATE INDEX IF NOT EXISTS idx_hotels_price ON hotels (price);
CREATE INDEX IF NOT EXISTS idx_hotels_created_at ON hotels (created_at DESC);
