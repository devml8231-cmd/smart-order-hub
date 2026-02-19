import { useState, useEffect } from 'react';
import { supabase } from '@/services/supabase';
import { MenuItem } from '@/types/food';

// Map DB row → MenuItem used by the frontend
const mapRow = (row: any): MenuItem => ({
    id: row.id,
    name: row.name,
    description: row.description || '',
    price: row.price,
    image: row.image_url || 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=400',
    category: row.category || 'Other',
    isVeg: row.is_veg ?? true,
    isBestSeller: row.is_best_seller ?? false,
    isTodaySpecial: row.is_today_special ?? false,
    rating: 4.5,
    prepTime: row.prep_time_minutes ?? 15,
    available: row.is_available ?? true,
    tags: [],
});

export const useMenuItems = (_params?: {
    vendor_id?: string;
    category_id?: string;
    food_type?: string;
    is_special?: boolean;
    is_best_seller?: boolean;
}) => {
    const [items, setItems] = useState<MenuItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchItems = async () => {
        try {
            setLoading(true);
            const { data, error: err } = await supabase
                .from('menu_items')
                .select('*')
                .eq('is_available', true)
                .order('created_at', { ascending: false });
            if (err) throw err;
            setItems((data || []).map(mapRow));
            setError(null);
        } catch (e: any) {
            setError(e.message || 'Failed to fetch menu items');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchItems();

        // Real-time: refresh on any menu_items change
        const channel = supabase
            .channel('menu_items_changes')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'menu_items' }, () => {
                fetchItems();
            })
            .subscribe();

        return () => { supabase.removeChannel(channel); };
    }, []);

    return { items, loading, error, refetch: fetchItems };
};

export const useSearchMenu = () => {
    const [results, setResults] = useState<MenuItem[]>([]);
    const [loading, setLoading] = useState(false);

    const search = async (query: string) => {
        if (query.length < 2) { setResults([]); return; }
        try {
            setLoading(true);
            const { data } = await supabase
                .from('menu_items')
                .select('*')
                .ilike('name', `%${query}%`)
                .eq('is_available', true)
                .limit(20);
            setResults((data || []).map(mapRow));
        } catch {
            setResults([]);
        } finally {
            setLoading(false);
        }
    };

    return { results, loading, search };
};

// Re-export MenuItem for anything that imports it from this hook
export type { MenuItem };


