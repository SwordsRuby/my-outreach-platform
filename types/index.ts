export interface Company {
    id: string;
    name: string;
    category: string | null;
    city: string | null;
    address: string | null;
    rating: number | null;
    reviews_count: number;
    site: string | null;
    phone: string | null;
}