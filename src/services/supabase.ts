import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error('Missing Supabase environment variables');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Real-time subscription helpers
export const subscribeToOrders = (userId: string, callback: (payload: any) => void) => {
    return supabase
        .channel('orders')
        .on(
            'postgres_changes',
            {
                event: 'UPDATE',
                schema: 'public',
                table: 'orders',
                filter: `user_id=eq.${userId}`,
            },
            callback
        )
        .subscribe();
};

export const subscribeToTokens = (orderId: string, callback: (payload: any) => void) => {
    return supabase
        .channel('tokens')
        .on(
            'postgres_changes',
            {
                event: '*',
                schema: 'public',
                table: 'tokens',
                filter: `order_id=eq.${orderId}`,
            },
            callback
        )
        .subscribe();
};

export const subscribeToMenuItems = (vendorId: string, callback: (payload: any) => void) => {
    return supabase
        .channel('menu_items')
        .on(
            'postgres_changes',
            {
                event: 'UPDATE',
                schema: 'public',
                table: 'menu_items',
                filter: `vendor_id=eq.${vendorId}`,
            },
            callback
        )
        .subscribe();
};

export const subscribeToSurplusFood = (callback: (payload: any) => void) => {
    return supabase
        .channel('surplus_food')
        .on(
            'postgres_changes',
            {
                event: 'INSERT',
                schema: 'public',
                table: 'surplus_food',
            },
            callback
        )
        .subscribe();
};
