import { useState, useEffect } from 'react';
import { api } from '@/services/api';
import { subscribeToOrders, subscribeToTokens } from '@/services/supabase';
import { toast } from './use-toast';

export interface Order {
    id: string;
    token_number: number;
    status: 'PLACED' | 'PREPARING' | 'READY' | 'COMPLETED' | 'CANCELLED';
    pickup_time: string;
    total_amount: number;
    final_amount: number;
    created_at: string;
    estimated_ready_time?: string;
    vendor: {
        id: string;
        name: string;
    };
    order_items: Array<{
        id: string;
        quantity: number;
        unit_price: number;
        subtotal: number;
        special_instructions?: string;
        menu_item: {
            id: string;
            name: string;
            image_url?: string;
        };
    }>;
    token?: {
        status: string;
        queue_position: number;
        estimated_time_minutes: number;
    };
}

export const useOrders = (status?: string) => {
    const [orders, setOrders] = useState<Order[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchOrders = async () => {
        try {
            setLoading(true);
            const response = await api.getUserOrders({ status });
            setOrders(response.data.data.orders);
            setError(null);
        } catch (err: any) {
            setError(err.response?.data?.error || 'Failed to fetch orders');
            toast({
                title: 'Error',
                description: 'Failed to load orders',
                variant: 'destructive',
            });
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchOrders();
    }, [status]);

    // Subscribe to real-time order updates
    useEffect(() => {
        const userId = localStorage.getItem('user_id');
        if (!userId) return;

        const subscription = subscribeToOrders(userId, (payload) => {
            const updatedOrder = payload.new;

            setOrders((prev) =>
                prev.map((order) =>
                    order.id === updatedOrder.id ? { ...order, ...updatedOrder } : order
                )
            );

            // Show notification for status changes
            if (updatedOrder.status === 'READY') {
                toast({
                    title: '🎉 Order Ready!',
                    description: `Your order #${updatedOrder.token_number} is ready for pickup!`,
                });

                // Play notification sound (optional)
                const audio = new Audio('/notification.mp3');
                audio.play().catch(() => { });
            }
        });

        return () => {
            subscription.unsubscribe();
        };
    }, []);

    return { orders, loading, error, refetch: fetchOrders };
};

export const useOrderDetails = (orderId: string) => {
    const [order, setOrder] = useState<Order | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchOrder = async () => {
        try {
            setLoading(true);
            const response = await api.getOrderById(orderId);
            setOrder(response.data.data);
            setError(null);
        } catch (err: any) {
            setError(err.response?.data?.error || 'Failed to fetch order');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (orderId) {
            fetchOrder();
        }
    }, [orderId]);

    // Subscribe to token updates
    useEffect(() => {
        if (!orderId) return;

        const subscription = subscribeToTokens(orderId, (payload) => {
            const updatedToken = payload.new;

            setOrder((prev) => {
                if (!prev) return prev;
                return {
                    ...prev,
                    token: updatedToken,
                };
            });
        });

        return () => {
            subscription.unsubscribe();
        };
    }, [orderId]);

    return { order, loading, error, refetch: fetchOrder };
};

export const useCancelOrder = () => {
    const [loading, setLoading] = useState(false);

    const cancelOrder = async (orderId: string, reason: string) => {
        try {
            setLoading(true);
            await api.cancelOrder(orderId, reason);
            toast({
                title: 'Order Cancelled',
                description: 'Your order has been cancelled successfully',
            });
            return true;
        } catch (err: any) {
            toast({
                title: 'Cancellation Failed',
                description: err.response?.data?.error || 'Failed to cancel order',
                variant: 'destructive',
            });
            return false;
        } finally {
            setLoading(false);
        }
    };

    return { cancelOrder, loading };
};

export const getCancellationTimeRemaining = (createdAt: string): number => {
    const created = new Date(createdAt);
    const now = new Date();
    const elapsed = (now.getTime() - created.getTime()) / 1000 / 60; // minutes
    return Math.max(0, 3 - elapsed); // 3 minute window
};

export const canCancelOrder = (order: Order): boolean => {
    if (order.status !== 'PLACED') return false;
    const timeRemaining = getCancellationTimeRemaining(order.created_at);
    return timeRemaining > 0;
};
