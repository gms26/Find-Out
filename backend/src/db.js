import pg from 'pg';
import dotenv from 'dotenv';

dotenv.config();

if (!process.env.DATABASE_URL) {
  throw new Error('DATABASE_URL is not set. Copy backend/.env.example to backend/.env and set it.');
}

export const pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL,
});

// Single place for every DB call. All SQL in this project is native,
// parameterised SQL — no ORM.
export async function query(text, params = []) {
  return pool.query(text, params);
}
