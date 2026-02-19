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

// Authentication helpers
export const authService = {
    // Sign up with email and password
    signUpWithEmail: async (email: string, password: string, fullName: string) => {
        const { data, error } = await supabase.auth.signUp({
            email,
            password,
            options: {
                data: {
                    full_name: fullName,
                }
            }
        });

        if (error) throw error;
        return data;
    },

    // Sign in with email and password
    signInWithEmail: async (email: string, password: string) => {
        const { data, error } = await supabase.auth.signInWithPassword({
            email,
            password,
        });

        if (error) throw error;
        return data;
    },

    // Sign out
    signOut: async () => {
        const { error } = await supabase.auth.signOut();
        if (error) throw error;
    },

    // Get current user
    getCurrentUser: async () => {
        const { data: { user }, error } = await supabase.auth.getUser();
        if (error) throw error;
        return user;
    },

    // Get current session
    getSession: async () => {
        const { data: { session }, error } = await supabase.auth.getSession();
        if (error) throw error;
        return session;
    },

    // Listen to auth state changes
    onAuthStateChange: (callback: (event: string, session: any) => void) => {
        return supabase.auth.onAuthStateChange(callback);
    },

    // Reset password
    resetPassword: async (email: string) => {
        const { error } = await supabase.auth.resetPasswordForEmail(email, {
            redirectTo: `${window.location.origin}/reset-password`,
        });
        if (error) throw error;
    },

    // Update password
    updatePassword: async (newPassword: string) => {
        const { error } = await supabase.auth.updateUser({
            password: newPassword,
        });
        if (error) throw error;
    },
};

// Cart helpers
export const cartService = {
    // Get all cart items for the current user
    getCartItems: async (userId: string) => {
        const { data, error } = await supabase
            .from('cart_items')
            .select('*')
            .eq('user_id', userId)
            .order('created_at', { ascending: true });

        if (error) throw error;
        return data || [];
    },

    // Add item to cart
    addCartItem: async (userId: string, menuItem: any, quantity: number = 1, notes?: string) => {
        // Check if item already exists
        const { data: existing } = await supabase
            .from('cart_items')
            .select('*')
            .eq('user_id', userId)
            .eq('menu_item_id', menuItem.id)
            .single();

        if (existing) {
            // Update quantity if item exists
            const { data, error } = await supabase
                .from('cart_items')
                .update({
                    quantity: existing.quantity + quantity,
                    updated_at: new Date().toISOString()
                })
                .eq('id', existing.id)
                .select()
                .single();

            if (error) throw error;
            return data;
        } else {
            // Insert new item
            const { data, error } = await supabase
                .from('cart_items')
                .insert({
                    user_id: userId,
                    menu_item_id: menuItem.id,
                    menu_item_data: menuItem,
                    quantity,
                    notes
                })
                .select()
                .single();

            if (error) throw error;
            return data;
        }
    },

    // Update cart item quantity
    updateCartItem: async (cartItemId: string, quantity: number) => {
        const { data, error } = await supabase
            .from('cart_items')
            .update({
                quantity,
                updated_at: new Date().toISOString()
            })
            .eq('id', cartItemId)
            .select()
            .single();

        if (error) throw error;
        return data;
    },

    // Remove item from cart
    removeCartItem: async (cartItemId: string) => {
        const { error } = await supabase
            .from('cart_items')
            .delete()
            .eq('id', cartItemId);

        if (error) throw error;
    },

    // Clear all cart items for user
    clearCart: async (userId: string) => {
        const { error } = await supabase
            .from('cart_items')
            .delete()
            .eq('user_id', userId);

        if (error) throw error;
    },

    // Subscribe to cart changes
    subscribeToCart: (userId: string, callback: (payload: any) => void) => {
        return supabase
            .channel('cart_items')
            .on(
                'postgres_changes',
                {
                    event: '*',
                    schema: 'public',
                    table: 'cart_items',
                    filter: `user_id=eq.${userId}`,
                },
                callback
            )
            .subscribe();
    },
};
