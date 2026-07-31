CREATE TABLE IF NOT EXISTS companies (
    id            TEXT PRIMARY KEY,
    name          TEXT NOT NULL,
    category      TEXT,
    city          TEXT,
    address       TEXT,
    rating        NUMERIC(3,1),          -- NULL, если нет оценки
    reviews_count INTEGER DEFAULT 0,
    site          TEXT,
    phone         TEXT
);

-- Индексы для ускорения поиска и фильтрации
CREATE INDEX idx_companies_name ON companies USING GIN (name gin_trgm_ops);   -- для ILIKE
CREATE INDEX idx_companies_city ON companies (city);
CREATE INDEX idx_companies_category ON companies (category);