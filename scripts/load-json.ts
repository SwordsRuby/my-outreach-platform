import * as fs from 'fs';
import * as path from 'path';
import { Client } from 'pg';
import 'dotenv/config';

const client = new Client({
  connectionString: process.env.DATABASE_URL,
});

async function loadPage(page: number) {
  const filePath = path.join(__dirname, '..', 'data', `page_${String(page).padStart(3, '0')}.json`);
  if (!fs.existsSync(filePath)) return;

  const raw = fs.readFileSync(filePath, 'utf-8');
  const data = JSON.parse(raw);
  const items = data.items || [];

  for (const item of items) {
    const {
      id,
      name,
      category,
      city,
      address,
      rating,
      reviews_count,
      site,
      phone,
    } = item;

    await client.query(
      `
        INSERT INTO companies (id, name, category, city, address, rating, reviews_count, site, phone)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
        ON CONFLICT (id) DO UPDATE SET
          name = EXCLUDED.name,
          category = EXCLUDED.category,
          city = EXCLUDED.city,
          address = EXCLUDED.address,
          rating = EXCLUDED.rating,
          reviews_count = EXCLUDED.reviews_count,
          site = EXCLUDED.site,
          phone = EXCLUDED.phone;
      `,
      [
        id,
        name,
        category,
        city,
        address,
        rating ?? null,
        reviews_count ?? 0,
        site ?? null,
        phone ?? null,
      ]
    );
  }
  console.log(`Page ${page} loaded: ${items.length} records`);
}

async function main() {
  await client.connect();
  for (let page = 1; page <= 20; page++) {
    await loadPage(page);
  }
  await client.end();
  console.log('All pages loaded.');
}

main().catch(console.error);