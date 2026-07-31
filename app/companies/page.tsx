import { sql } from '@/lib/db';
import { Company } from '@/types';

export default async function CompaniesPage({
    searchParams,
}: {
    searchParams: Promise<{ q?: string; city?: string }>;
}) {
    const { q = '', city = '' } = await searchParams;

    const citiesResult = await sql<{ city: string }>`
    SELECT DISTINCT city FROM companies ORDER BY city
  `;
    const cities = citiesResult.map((row) => row.city);

    let conditions = '1=1';
    const params: any[] = [];
    let paramIndex = 1;

    if (q) {
        conditions += ` AND name ILIKE $${paramIndex}`;
        params.push(`%${q}%`);
        paramIndex++;
    }
    if (city) {
        conditions += ` AND city = $${paramIndex}`;
        params.push(city);
        paramIndex++;
    }

    const query = `
    SELECT * FROM companies
    WHERE ${conditions}
    ORDER BY name
  `;

    const companies = await sql<Company>(query, ...params);

    // Исправленная функция отображения рейтинга
    const renderStars = (rating: number | null) => {
        if (rating === null) return <span className="text-gray-400">—</span>;
        // Принудительно преобразуем в число (если пришла строка)
        const numRating = typeof rating === 'string' ? parseFloat(rating) : rating;
        if (isNaN(numRating)) return <span className="text-gray-400">—</span>;

        const fullStars = Math.floor(numRating);
        const halfStar = numRating % 1 >= 0.5;
        const emptyStars = 5 - fullStars - (halfStar ? 1 : 0);
        return (
            <span className="flex items-center gap-0.5">
                {Array.from({ length: fullStars }).map((_, i) => (
                    <span key={i} className="text-yellow-400 text-sm">★</span>
                ))}
                {halfStar && <span className="text-yellow-400 text-sm">★</span>}
                {Array.from({ length: emptyStars }).map((_, i) => (
                    <span key={i} className="text-gray-300 text-sm">★</span>
                ))}
                <span className="ml-1 text-xs text-gray-500">{numRating.toFixed(1)}</span>
            </span>
        );
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-8 px-4">
            <div className="max-w-7xl mx-auto">
                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-gray-800 flex items-center gap-3">
                        <span className="bg-blue-600 text-white p-2 rounded-xl">🏢</span>
                        Компании
                    </h1>
                    <p className="text-gray-600 mt-1">
                        Найдено: <span className="font-semibold">{companies.length}</span> компаний
                        {q && ` по запросу «${q}»`}
                        {city && ` в городе ${city}`}
                    </p>
                </div>

                <div className="bg-white rounded-2xl shadow-lg p-6 mb-8 border border-gray-100">
                    <form method="GET" className="flex flex-col sm:flex-row gap-4">
                        <div className="flex-1">
                            <label htmlFor="q" className="block text-sm font-medium text-gray-700 mb-1">
                                Поиск по названию
                            </label>
                            <input
                                id="q"
                                type="text"
                                name="q"
                                style={{ color: 'black' }}
                                placeholder="Например: Оптовая"
                                defaultValue={q}
                                className="w-full border border-gray-300 rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition"
                            />
                        </div>
                        <div className="sm:w-64">
                            <label htmlFor="city" className="block text-sm font-medium text-gray-700 mb-1">
                                Город
                            </label>
                            <select
                                id="city"
                                name="city"
                                style={{ color: 'black' }}
                                defaultValue={city}
                                className="w-full border border-gray-300 rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition bg-white"
                            >
                                <option value="">Все города</option>
                                {cities.map((c) => (
                                    <option key={c} value={c}>
                                        {c}
                                    </option>
                                ))}
                            </select>
                        </div>
                        <div className="flex items-end">
                            <button
                                type="submit"
                                className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700 text-white font-medium px-6 py-2.5 rounded-lg transition shadow-sm hover:shadow-md"
                            >
                                Применить
                            </button>
                        </div>
                    </form>
                </div>

                <div className="bg-white rounded-2xl shadow-lg overflow-hidden border border-gray-100">
                    {companies.length === 0 ? (
                        <div className="text-center py-16 text-gray-500">
                            <div className="text-4xl mb-3">🔍</div>
                            <p className="text-lg">Ничего не найдено</p>
                            <p className="text-sm">Попробуйте изменить параметры поиска</p>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead>
                                    <tr className="bg-gray-50 border-b border-gray-200">
                                        <th className="text-left px-6 py-3 font-semibold text-gray-600">Название</th>
                                        <th className="text-left px-6 py-3 font-semibold text-gray-600">Категория</th>
                                        <th className="text-left px-6 py-3 font-semibold text-gray-600">Город</th>
                                        <th className="text-left px-6 py-3 font-semibold text-gray-600">Рейтинг</th>
                                        <th className="text-left px-6 py-3 font-semibold text-gray-600">Отзывов</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {companies.map((company, index) => (
                                        <tr
                                            key={company.id}
                                            className={`border-b border-gray-100 hover:bg-blue-50 transition-colors ${index % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'
                                                }`}
                                        >
                                            <td className="px-6 py-3 font-medium text-gray-800">{company.name}</td>
                                            <td className="px-6 py-3">
                                                <span className="inline-block bg-blue-100 text-blue-800 text-xs font-medium px-2.5 py-1 rounded-full">
                                                    {company.category || '—'}
                                                </span>
                                            </td>
                                            <td className="px-6 py-3 text-gray-700">{company.city || '—'}</td>
                                            <td className="px-6 py-3">{renderStars(company.rating)}</td>
                                            <td className="px-6 py-3 text-gray-700">
                                                {company.reviews_count}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                    <div className="bg-gray-50 px-6 py-3 text-xs text-gray-500 border-t border-gray-100">
                        Показано {companies.length} записей (максимум 100)
                    </div>
                </div>
            </div>
        </div>
    );
}