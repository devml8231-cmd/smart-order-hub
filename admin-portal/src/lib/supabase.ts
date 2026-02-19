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

export interface MenuItem {
    id: string;
    name: string;
    description?: string;
    price: number;
    image_url?: string;
    category: string;
    is_veg: boolean;
    is_best_seller: boolean;
    is_today_special: boolean;
    is_available: boolean;
    prep_time_minutes: number;
    created_at: string;
}

export const menuService = {
    getAll: async (): Promise<MenuItem[]> => {
        const { data, error } = await supabase
            .from('menu_items')
            .select('*')
            .order('created_at', { ascending: false });
        if (error) throw error;
        return (data || []) as MenuItem[];
    },

    uploadImage: async (file: File): Promise<string> => {
        const ext = file.name.split('.').pop();
        const fileName = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
        const { error } = await supabase.storage
            .from('menu-images')
            .upload(fileName, file, { upsert: true });
        if (error) throw error;
        const { data } = supabase.storage.from('menu-images').getPublicUrl(fileName);
        return data.publicUrl;
    },

    create: async (item: Omit<MenuItem, 'id' | 'created_at'>, imageFile?: File): Promise<MenuItem> => {
        let image_url = item.image_url;
        if (imageFile) {
            image_url = await menuService.uploadImage(imageFile);
        }
        const { data, error } = await supabase
            .from('menu_items')
            .insert({ ...item, image_url })
            .select()
            .single();
        if (error) throw error;
        return data as MenuItem;
    },

    update: async (id: string, item: Partial<Omit<MenuItem, 'id' | 'created_at'>>, imageFile?: File): Promise<MenuItem> => {
        let updates = { ...item };
        if (imageFile) {
            updates.image_url = await menuService.uploadImage(imageFile);
        }
        const { data, error } = await supabase
            .from('menu_items')
            .update(updates)
            .eq('id', id)
            .select()
            .single();
        if (error) throw error;
        return data as MenuItem;
    },

    delete: async (id: string): Promise<void> => {
        const { error } = await supabase.from('menu_items').delete().eq('id', id);
        if (error) throw error;
    },

    toggleAvailability: async (id: string, is_available: boolean): Promise<void> => {
        const { error } = await supabase
            .from('menu_items')
            .update({ is_available })
            .eq('id', id);
        if (error) throw error;
    },
};
