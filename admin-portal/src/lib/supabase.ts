import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export interface OrderItem {
    id: string;
    order_id: string;
    menu_item_id: string;
    menu_item_data: { id: string; name: string; image?: string; price: number };
    quantity: number;
    unit_price: number;
    subtotal: number;
}

export interface Order {
    id: string;
    user_id: string;
    token_number: number;
    status: 'PLACED' | 'PREPARING' | 'READY' | 'COMPLETED' | 'CANCELLED';
    total_amount: number;
    phone?: string;
    created_at: string;
    updated_at: string;
    estimated_ready_at?: string;
    order_items: OrderItem[];
}

export const orderService = {
    getAllOrders: async (): Promise<Order[]> => {
        const { data, error } = await supabase
            .from('orders')
            .select('*, order_items (*)')
            .order('created_at', { ascending: false });
        if (error) throw error;
        return (data || []) as Order[];
    },

    updateOrderStatus: async (orderId: string, status: string, estimatedReadyAt?: string) => {
        const payload: Record<string, any> = { status, updated_at: new Date().toISOString() };
        if (estimatedReadyAt) payload.estimated_ready_at = estimatedReadyAt;
        const { data, error } = await supabase
            .from('orders')
            .update(payload)
            .eq('id', orderId)
            .select()
            .single();
        if (error) throw error;
        return data;
    },

    subscribeToAllOrders: (callback: (payload: any) => void) => {
        return supabase
            .channel('admin_all_orders')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'orders' }, callback)
            .subscribe();
    },
};
