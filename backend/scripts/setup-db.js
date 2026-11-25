import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { pool, query } from '../src/db.js';

// npm run db:setup — creates the hotels table from schema.sql.
const __dirname = path.dirname(fileURLToPath(import.meta.url));
async function main() {
  try {
    const schema = fs.readFileSync(path.join(__dirname, '..', 'schema.sql'), 'utf8');
    await query(schema);
    console.log('Database setup done: hotels table ready.');
  } catch (err) {
    console.error('DB setup failed:', err.message);
    process.exitCode = 1;
  } finally {
    await pool.end();
  }
}
main();
