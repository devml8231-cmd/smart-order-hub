import { Request, Response } from 'express';
import { supabaseAdmin } from '../config/supabase';
import { sendSuccess, sendError } from '../utils/helpers';
import logger from '../utils/logger';

/**
 * Update order status (Admin)
 */
export const updateOrderStatus = async (req: Request, res: Response): Promise<void> => {
  try {
    const { orderId } = req.params;
    const { status } = req.body;

    const updates: any = { status };

    if (status === 'PREPARING') {
      updates.preparation_started_at = new Date().toISOString();
    } else if (status === 'READY') {
      updates.preparation_completed_at = new Date().toISOString();
      updates.actual_ready_time = new Date().toISOString();
    } else if (status === 'COMPLETED') {
      updates.completed_at = new Date().toISOString();
    }

    const { data: order, error } = await supabaseAdmin
      .from('orders')
      .update(updates)
      .eq('id', orderId)
      .select()
      .single();

    if (error) {
      logger.error('Failed to update order status:', error);
      sendError(res, 'Failed to update order status', 500);
      return;
    }

    // Update token status
    if (status === 'PREPARING') {
      await supabaseAdmin
        .from('tokens')
        .update({ status: 'PREPARING', started_at: new Date().toISOString() })
        .eq('order_id', orderId);
    } else if (status === 'READY') {
      await supabaseAdmin
        .from('tokens')
        .update({ status: 'READY', ready_at: new Date().toISOString() })
        .eq('order_id', orderId);
    }

    sendSuccess(res, order, 'Order status updated successfully');
  } catch (error) {
    logger.error('Update order status error:', error);
    sendError(res, 'Failed to update order status', 500);
  }
};

/**
 * Get order queue
 */
export const getOrderQueue = async (req: Request, res: Response): Promise<void> => {
  try {
    const { vendor_id, date } = req.query;

    let query = supabaseAdmin
      .from('orders')
      .select(`
        *,
        user:users(id, full_name, phone_number),
        order_items(
          *,
          menu_item:menu_items(name, preparation_time_minutes)
        ),
        token:tokens(*)
      `)
      .in('status', ['PLACED', 'PREPARING'])
      .order('pickup_time', { ascending: true });

    if (vendor_id) query = query.eq('vendor_id', vendor_id);
    if (date) query = query.eq('order_date', date);

    const { data: orders, error } = await query;

    if (error) {
      logger.error('Failed to fetch order queue:', error);
      sendError(res, 'Failed to fetch order queue', 500);
      return;
    }

    sendSuccess(res, orders);
  } catch (error) {
    logger.error('Get order queue error:', error);
    sendError(res, 'Failed to fetch order queue', 500);
  }
};

/**
 * Get analytics
 */
export const getAnalytics = async (req: Request, res: Response): Promise<void> => {
  try {
    const { vendor_id, start_date, end_date } = req.query;

    // Total orders and revenue
    let ordersQuery = supabaseAdmin
      .from('orders')
      .select('final_amount, status, created_at')
      .in('status', ['COMPLETED']);

    if (vendor_id) ordersQuery = ordersQuery.eq('vendor_id', vendor_id);
    if (start_date) ordersQuery = ordersQuery.gte('created_at', start_date);
    if (end_date) ordersQuery = ordersQuery.lte('created_at', end_date);

    const { data: orders } = await ordersQuery;

    const totalOrders = orders?.length || 0;
    const totalRevenue = orders?.reduce((sum, o) => sum + Number(o.final_amount), 0) || 0;
    const avgOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;

    // Best selling items
    const { data: bestSellers } = await supabaseAdmin
      .from('menu_items')
      .select('id, name, total_orders, price')
      .order('total_orders', { ascending: false })
      .limit(10);

    // Peak hours analysis
    const { data: hourlyOrders } = await supabaseAdmin
      .rpc('get_hourly_order_stats', { p_vendor_id: vendor_id || null })
      .catch(() => ({ data: [] }));

    // User feedback summary
    let reviewsQuery = supabaseAdmin
      .from('reviews')
      .select('rating');

    if (vendor_id) reviewsQuery = reviewsQuery.eq('vendor_id', vendor_id);

    const { data: reviews } = await reviewsQuery;

    const avgRating = reviews?.reduce((sum, r) => sum + r.rating, 0) / (reviews?.length || 1) || 0;
    const ratingDistribution = reviews?.reduce((acc: any, r) => {
      acc[r.rating] = (acc[r.rating] || 0) + 1;
      return acc;
    }, {}) || {};

    sendSuccess(res, {
      total_orders: totalOrders,
      total_revenue: totalRevenue,
      average_order_value: avgOrderValue,
      best_selling_items: bestSellers || [],
      peak_hours: hourlyOrders || [],
      user_feedback_summary: {
        average_rating: avgRating,
        total_reviews: reviews?.length || 0,
        rating_distribution: ratingDistribution,
      },
    });
  } catch (error) {
    logger.error('Get analytics error:', error);
    sendError(res, 'Failed to fetch analytics', 500);
  }
};

/**
 * Manage surplus food discounts
 */
export const manageSurplusFood = async (req: Request, res: Response): Promise<void> => {
  try {
    const { menu_item_id, surplus_quantity, discount_percentage } = req.body;

    const { data: menuItem } = await supabaseAdmin
      .from('menu_items')
      .select('*')
      .eq('id', menu_item_id)
      .single();

    if (!menuItem) {
      sendError(res, 'Menu item not found', 404);
      return;
    }

    const discountPrice = menuItem.price * (1 - discount_percentage / 100);

    const { data: surplus, error } = await supabaseAdmin
      .from('surplus_food')
      .insert({
        vendor_id: menuItem.vendor_id,
        menu_item_id,
        original_quantity: menuItem.stock_quantity,
        surplus_quantity,
        discount_percentage,
        discount_price: discountPrice,
        is_active: true,
        expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // 24 hours
      })
      .select()
      .single();

    if (error) {
      logger.error('Failed to create surplus food:', error);
      sendError(res, 'Failed to create surplus food entry', 500);
      return;
    }

    // Update menu item with discount
    await supabaseAdmin
      .from('menu_items')
      .update({ discount_price: discountPrice })
      .eq('id', menu_item_id);

    sendSuccess(res, surplus, 'Surplus food discount activated', 201);
  } catch (error) {
    logger.error('Manage surplus food error:', error);
    sendError(res, 'Failed to manage surplus food', 500);
  }
};

/**
 * Get idle time slots
 */
export const getIdleTimeSlots = async (req: Request, res: Response): Promise<void> => {
  try {
    const { vendor_id, date } = req.query;

    let query = supabaseAdmin
      .from('time_slots')
      .select('*')
      .eq('is_peak_hour', false)
      .eq('is_available', true);

    if (vendor_id) query = query.eq('vendor_id', vendor_id);
    if (date) query = query.eq('slot_date', date);

    const { data: slots, error } = await query.order('slot_time', { ascending: true });

    if (error) {
      logger.error('Failed to fetch idle slots:', error);
      sendError(res, 'Failed to fetch idle time slots', 500);
      return;
    }

    sendSuccess(res, slots);
  } catch (error) {
    logger.error('Get idle time slots error:', error);
    sendError(res, 'Failed to fetch idle time slots', 500);
  }
};

export default {
  updateOrderStatus,
  getOrderQueue,
  getAnalytics,
  manageSurplusFood,
  getIdleTimeSlots,
};
