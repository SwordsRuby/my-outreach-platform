-- 1. Топ-5 категорий по числу компаний
SELECT category, COUNT(*) AS company_count
FROM companies
GROUP BY category
ORDER BY company_count DESC
LIMIT 5;

-- 2. Средний рейтинг по городам среди компаний с 10+ отзывами
SELECT city, ROUND(AVG(rating)::NUMERIC, 2) AS avg_rating
FROM companies
WHERE reviews_count >= 10
  AND rating IS NOT NULL
GROUP BY city
ORDER BY avg_rating DESC;

-- 3. Доля компаний с сайтом по категориям
SELECT
    category,
    COUNT(*) AS total,
    COUNT(site) AS with_site,
    ROUND((COUNT(site)::NUMERIC / COUNT(*)) * 100, 2) AS site_percentage
FROM companies
GROUP BY category
ORDER BY site_percentage DESC;