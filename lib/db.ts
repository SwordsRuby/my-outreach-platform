import { Pool } from 'pg';

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
});

export async function sql<T = any>(
    strings: TemplateStringsArray | string,
    ...values: any[]
): Promise<T[]> {
    let query: string;
    if (typeof strings === 'string') {
        query = strings;
    } else {
        query = '';
        for (let i = 0; i < strings.length; i++) {
            query += strings[i];
            if (i < values.length) {
                query += `$${i + 1}`;
            }
        }
    }
    const result = await pool.query(query, values);
    return result.rows as T[];
}