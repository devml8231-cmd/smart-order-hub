import { useState, useEffect } from 'react';
import { api } from '@/services/api';
import { subscribeToMenuItems } from '@/services/supabase';

export interface MenuItem {
    id: string;
    name: string;
    description?: string;
    image_url?: string;
    price: number;
    discount_price?: number;
    food_type: 'VEG' | 'NON_VEG' | 'VEGAN' | 'UPWAS';
    stock_quantity: number;
    is_available: boolean;
    is_special: boolean;
    is_best_seller: boolean;
    is_seasonal: boolean;
    total_orders: number;
    average_rating: number;
    preparation_time_minutes: number;
    vendor_id: string;
    category_id?: string;
}

export const useMenuItems = (params?: {
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
            const response = await api.getMenuItems(params);
            setItems(response.data.data.items);
            setError(null);
        } catch (err: any) {
            setError(err.response?.data?.error || 'Failed to fetch menu items');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchItems();
    }, [JSON.stringify(params)]);

    // Subscribe to real-time stock updates
    useEffect(() => {
        if (!params?.vendor_id) return;

        const subscription = subscribeToMenuItems(params.vendor_id, (payload) => {
            const updatedItem = payload.new;

            setItems((prev) =>
                prev.map((item) =>
                    item.id === updatedItem.id ? { ...item, ...updatedItem } : item
                )
            );
        });

        return () => {
            subscription.unsubscribe();
        };
    }, [params?.vendor_id]);

    return { items, loading, error, refetch: fetchItems };
};

export const useSearchMenu = () => {
    const [results, setResults] = useState<MenuItem[]>([]);
    const [loading, setLoading] = useState(false);

    const search = async (query: string, vendorId?: string) => {
        if (query.length < 2) {
            setResults([]);
            return;
        }

        try {
            setLoading(true);
            const response = await api.searchMenuItems(query, vendorId);
            setResults(response.data.data);
        } catch (err) {
            setResults([]);
        } finally {
            setLoading(false);
        }
    };

    return { results, loading, search };
};

export const useRecommendations = (vendorId?: string) => {
    const [recommendations, setRecommendations] = useState<{
        personalized: MenuItem[];
        best_sellers: MenuItem[];
        today_special: MenuItem[];
        based_on_time: MenuItem[];
    }>({
        personalized: [],
        best_sellers: [],
        today_special: [],
        based_on_time: [],
    });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchRecommendations = async () => {
            try {
                setLoading(true);
                const response = await api.getRecommendations(vendorId);
                setRecommendations(response.data.data);
            } catch (err) {
                console.error('Failed to fetch recommendations:', err);
            } finally {
                setLoading(false);
            }
        };

        fetchRecommendations();
    }, [vendorId]);

    return { recommendations, loading };
};
