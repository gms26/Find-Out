import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { pool, query } from './src/db.js';
import { SEED_HOTELS } from './src/seed-data.js';

// Usage: npm run seed          (inserts 12 hotels only if the table is empty)
//        npm run seed:force    (node seed.js --force — clears the table first)
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const force = process.argv.includes('--force');

async function main() {
  try {
    const schema = fs.readFileSync(path.join(__dirname, 'schema.sql'), 'utf8');
    await query(schema);

    const { rows } = await query('SELECT COUNT(*)::int AS count FROM hotels');
    if (rows[0].count > 0 && !force) {
      console.log(`Hotels table already has ${rows[0].count} row(s). Nothing seeded. Use --force to reseed.`);
      return;
    }
    if (force) await query('TRUNCATE TABLE hotels RESTART IDENTITY');

    for (const h of SEED_HOTELS) {
      await query(
        'INSERT INTO hotels (title, description, latitude, longitude, price, image_path) VALUES ($1, $2, $3, $4, $5, $6)',
        [h.title, h.description, h.latitude, h.longitude, h.price, h.image_path],
      );
    }
    console.log(`Seeded ${SEED_HOTELS.length} hotels.`);
  } catch (err) {
    console.error('Seed failed:', err.message);
    process.exitCode = 1;
  } finally {
    await pool.end();
  }
}

main();
