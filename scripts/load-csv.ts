import * as fs from 'fs';
import * as path from 'path';
import csv from 'csv-parser';
import { Client } from 'pg';
import 'dotenv/config';

const client = new Client({
  connectionString: process.env.DATABASE_URL,
});

// Функция для записи отчёта об аномалиях
function writeAnomaliesReport(anomalies: string[]) {
  const report = `# ANOMALIES REPORT

Найдено аномалий: ${anomalies.length}

${anomalies.map((a, i) => `${i + 1}. ${a}`).join('\n')}
`;
  fs.writeFileSync('ANOMALIES.md', report);
  console.log(`✅ Отчёт сохранён в ANOMALIES.md. Аномалий: ${anomalies.length}`);
}

async function main() {
  await client.connect();

  const filePath = path.join(__dirname, '..', 'data', 'review.csv');
  if (!fs.existsSync(filePath)) {
    console.error('❌ Файл review.csv не найден в папке data/');
    process.exit(1);
  }

  const anomalies: string[] = [];
  let rowCount = 0;

  const stream = fs.createReadStream(filePath).pipe(csv());

  for await (const row of stream) {
    rowCount++;
    const id = row.id?.trim();

    // 1. Проверка наличия id
    if (!id) {
      anomalies.push(`Пропущен id в строке #${rowCount}: ${JSON.stringify(row)}`);
      continue;
    }

    // 2. Проверка существования компании с таким id в основной таблице
    const res = await client.query('SELECT id FROM companies WHERE id = $1', [id]);
    if (res.rowCount === 0) {
      anomalies.push(`id "${id}" не найден в таблице companies (строка #${rowCount})`);
    }

    // 3. Проверка rating
    let rating: number | null = null;
    const ratingRaw = row.rating?.toString().trim();
    if (ratingRaw && ratingRaw.toUpperCase() !== 'N/A' && ratingRaw !== '') {
      const parsed = parseFloat(ratingRaw);
      if (isNaN(parsed)) {
        anomalies.push(`Некорректный rating для id "${id}": "${ratingRaw}"`);
      } else if (parsed < 0 || parsed > 5) {
        anomalies.push(`Rating вне диапазона 0–5 для id "${id}": ${parsed}`);
      } else {
        rating = parsed;
      }
    }

    // 4. Проверка reviews_count
    let reviews = 0;
    const reviewsRaw = row.reviews_count?.toString().trim();
    if (reviewsRaw && reviewsRaw !== '') {
      const parsed = parseInt(reviewsRaw, 10);
      if (isNaN(parsed) || parsed < 0) {
        anomalies.push(`Некорректное количество отзывов для id "${id}": "${reviewsRaw}"`);
      } else {
        reviews = parsed;
      }
    }

    // 5. Проверка телефона (базовая валидация)
    const phone = row.phone?.trim() || null;
    if (phone && !/^\+?[\d\s\-()]{7,}$/.test(phone)) {
      anomalies.push(`Подозрительный формат телефона для id "${id}": "${phone}"`);
    }

    // 6. Проверка сайта (наличие протокола)
    const site = row.site?.trim() || null;
    if (site && !/^https?:\/\//i.test(site)) {
      anomalies.push(`Сайт без протокола для id "${id}": "${site}"`);
    }

    // 7. Проверка названия (не должно быть пустым)
    const name = row.name?.trim();
    if (!name) {
      anomalies.push(`Пустое название для id "${id}"`);
    }

    // 8. Вставка/обновление в БД
    try {
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
          name || null,
          row.category?.trim() || null,
          row.city?.trim() || null,
          row.address?.trim() || null,
          rating,
          reviews,
          site,
          phone,
        ]
      );
    } catch (err: any) {
      anomalies.push(`Ошибка БД при вставке id "${id}": ${err.message}`);
    }
  }

  await client.end();

  // Запись отчёта
  writeAnomaliesReport(anomalies);

  console.log(`📊 Всего обработано строк: ${rowCount}`);
  if (anomalies.length === 0) {
    console.log('🎉 Аномалий не обнаружено!');
  } else {
    console.log(`⚠️ Найдено ${anomalies.length} аномалий. Подробности в ANOMALIES.md`);
  }
}

main().catch((err) => {
  console.error('❌ Ошибка выполнения:', err);
  process.exit(1);
});