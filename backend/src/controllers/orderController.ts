import { Request, Response } from 'express';
import { supabaseAdmin } from '../config/supabase';
import { sendSuccess, sendError, calculateETA, generateTokenNumber } from '../utils/helpers';
import { AuthenticatedRequest, OrderStatus } from '../types';
import logger from '../utils/logger';

/**
 * Create new order
 */
export const createOrder = async (req: Request, res: Response): Promise<void> => {
  try {
    const user = (req as AuthenticatedRequest).user!;
    const { vendor_id, items, pickup_time, special_instructions, group_order_id } = req.body;

    // Validate vendor
    const { data: vendor, error: vendorError } = await supabaseAdmin
      .from('vendors')
      .select('*')
      .eq('id', vendor_id)
      .eq('is_active', true)
      .single();

    if (vendorError || !vendor) {
      sendError(res, 'Vendor not found or inactive', 404);
      return;
    }

    // Validate menu items and check stock
    const menuItemIds = items.map((item: any) => item.menu_item_id);
    const { data: menuItems, error: menuError } = await supabaseAdmin
      .from('menu_items')
      .select('*')
      .in('id', menuItemIds)
      .eq('is_available', true);

    if (menuError || !menuItems || menuItems.length !== items.length) {
      sendError(res, 'One or more menu items are unavailable', 400);
      return;
    }

    // Check stock availability
    for (const item of items) {
      const menuItem = menuItems.find((mi) => mi.id === item.menu_item_id);
      if (!menuItem || menuItem.stock_quantity < item.quantity) {
        sendError(res, `Insufficient stock for ${menuItem?.name || 'item'}`, 400);
        return;
      }
    }

    // Calculate total amount
    let totalAmount = 0;
    const orderItemsData = items.map((item: any) => {
      const menuItem = menuItems.find((mi) => mi.id === item.menu_item_id);
      const price = menuItem!.discount_price || menuItem!.price;
      const subtotal = price * item.quantity;
      totalAmount += subtotal;

      return {
        menu_item_id: item.menu_item_id,
        quantity: item.quantity,
        unit_price: menuItem!.price,
        discount_price: menuItem!.discount_price,
        subtotal,
        special_instructions: item.special_instructions,
      };
    });

    // Generate token number
    const orderDate = new Date();
    const tokenNumber = await generateTokenNumber(vendor_id, orderDate, supabaseAdmin);

    // Calculate estimated ready time
    const avgPrepTime = vendor.average_prep_time_minutes;
    const { data: queueCount } = await supabaseAdmin
      .from('orders')
      .select('id', { count: 'exact' })
      .eq('vendor_id', vendor_id)
      .in('status', ['PLACED', 'PREPARING']);

    const queuePosition = (queueCount?.length || 0) + 1;
    const { estimatedReadyTime, estimatedMinutes } = calculateETA(
      queuePosition,
      avgPrepTime
    );

    // Create order
    const { data: order, error: orderError } = await supabaseAdmin
      .from('orders')
      .insert({
        user_id: user.id,
        vendor_id,
        group_order_id,
        token_number: tokenNumber,
        order_date: orderDate.toISOString().split('T')[0],
        pickup_time: new Date(pickup_time).toISOString(),
        status: 'PLACED',
        total_amount: totalAmount,
        discount_amount: 0,
        final_amount: totalAmount,
        estimated_ready_time: estimatedReadyTime.toISOString(),
        special_instructions,
        is_preorder: true,
      })
      .select()
      .single();

    if (orderError) {
      logger.error('Failed to create order:', orderError);
      sendError(res, 'Failed to create order', 500);
      return;
    }

    // Create order items
    const orderItemsWithOrderId = orderItemsData.map((item) => ({
      ...item,
      order_id: order.id,
    }));

    const { error: itemsError } = await supabaseAdmin
      .from('order_items')
      .insert(orderItemsWithOrderId);

    if (itemsError) {
      logger.error('Failed to create order items:', itemsError);
      await supabaseAdmin.from('orders').delete().eq('id', order.id);
      sendError(res, 'Failed to create order items', 500);
      return;
    }

    // Create token
    const { error: tokenError } = await supabaseAdmin.from('tokens').insert({
      order_id: order.id,
      vendor_id,
      token_number: tokenNumber,
      token_date: orderDate.toISOString().split('T')[0],
      status: 'WAITING',
      queue_position: queuePosition,
      estimated_time_minutes: estimatedMinutes,
    });

    if (tokenError) {
      logger.error('Failed to create token:', tokenError);
    }

    sendSuccess(
      res,
      {
        order,
        token_number: tokenNumber,
        queue_position: queuePosition,
        estimated_ready_time: estimatedReadyTime,
      },
      'Order created successfully',
      201
    );
  } catch (error) {
    logger.error('Create order error:', error);
    sendError(res, 'Failed to create order', 500);
  }
};

/**
 * Get user orders
 */
export const getUserOrders = async (req: Request, res: Response): Promise<void> => {
  try {
    const user = (req as AuthenticatedRequest).user!;
    const { page = 1, limit = 20, status } = req.query;

    let query = supabaseAdmin
      .from('orders')
      .select(`
        *,
        vendor:vendors(*),
        order_items(
          *,
          menu_item:menu_items(*)
        ),
        token:tokens(*)
      `)
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (status) {
      query = query.eq('status', status);
    }

    const { data: orders, error, count } = await query
      .range((Number(page) - 1) * Number(limit), Number(page) * Number(limit) - 1);

    if (error) {
      logger.error('Failed to fetch orders:', error);
      sendError(res, 'Failed to fetch orders', 500);
      return;
    }

    sendSuccess(res, {
      orders,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total: count || 0,
        totalPages: Math.ceil((count || 0) / Number(limit)),
      },
    });
  } catch (error) {
    logger.error('Get user orders error:', error);
    sendError(res, 'Failed to fetch orders', 500);
  }
};

/**
 * Get order by ID
 */
export const getOrderById = async (req: Request, res: Response): Promise<void> => {
  try {
    const user = (req as AuthenticatedRequest).user!;
    const { orderId } = req.params;

    const { data: order, error } = await supabaseAdmin
      .from('orders')
      .select(`
        *,
        vendor:vendors(*),
        order_items(
          *,
          menu_item:menu_items(*)
        ),
        token:tokens(*),
        payment:payments(*)
      `)
      .eq('id', orderId)
      .single();

    if (error || !order) {
      sendError(res, 'Order not found', 404);
      return;
    }

    // Check authorization
    if (order.user_id !== user.id && user.role !== 'ADMIN') {
      sendError(res, 'Unauthorized to view this order', 403);
      return;
    }

    sendSuccess(res, order);
  } catch (error) {
    logger.error('Get order error:', error);
    sendError(res, 'Failed to fetch order', 500);
  }
};

/**
 * Cancel order
 */
export const cancelOrder = async (req: Request, res: Response): Promise<void> => {
  try {
    const user = (req as AuthenticatedRequest).user!;
    const { orderId } = req.params;
    const { cancellation_reason } = req.body;

    const { data: order, error: fetchError } = await supabaseAdmin
      .from('orders')
      .select('*')
      .eq('id', orderId)
      .single();

    if (fetchError || !order) {
      sendError(res, 'Order not found', 404);
      return;
    }

    if (order.user_id !== user.id) {
      sendError(res, 'Unauthorized to cancel this order', 403);
      return;
    }

    // Check if order can be cancelled
    if (['READY', 'COMPLETED', 'CANCELLED'].includes(order.status)) {
      sendError(res, 'Order cannot be cancelled', 400);
      return;
    }

    if (order.status === 'PREPARING' && order.preparation_started_at) {
      sendError(res, 'Order is already being prepared and cannot be cancelled', 400);
      return;
    }

    // Cancel order
    const { data: updatedOrder, error: updateError } = await supabaseAdmin
      .from('orders')
      .update({
        status: 'CANCELLED',
        cancelled_at: new Date().toISOString(),
        cancellation_reason,
      })
      .eq('id', orderId)
      .select()
      .single();

    if (updateError) {
      logger.error('Failed to cancel order:', updateError);
      sendError(res, 'Failed to cancel order', 500);
      return;
    }

    // Update token status
    await supabaseAdmin
      .from('tokens')
      .update({ status: 'COMPLETED' })
      .eq('order_id', orderId);

    sendSuccess(res, updatedOrder, 'Order cancelled successfully');
  } catch (error) {
    logger.error('Cancel order error:', error);
    sendError(res, 'Failed to cancel order', 500);
  }
};

/**
 * Get token status
 */
export const getTokenStatus = async (req: Request, res: Response): Promise<void> => {
  try {
    const { orderId } = req.params;

    const { data: token, error } = await supabaseAdmin
      .from('tokens')
      .select(`
        *,
        order:orders(
          *,
          vendor:vendors(*),
          order_items(
            *,
            menu_item:menu_items(*)
          )
        )
      `)
      .eq('order_id', orderId)
      .single();

    if (error || !token) {
      sendError(res, 'Token not found', 404);
      return;
    }

    const isReady = token.status === 'READY';
    const shouldBlink = token.status === 'READY' && !token.is_notified;

    sendSuccess(res, {
      token_number: token.token_number,
      status: token.status,
      queue_position: token.queue_position,
      estimated_time_minutes: token.estimated_time_minutes,
      is_ready: isReady,
      should_blink: shouldBlink,
      order: token.order,
    });
  } catch (error) {
    logger.error('Get token status error:', error);
    sendError(res, 'Failed to fetch token status', 500);
  }
};

export default {
  createOrder,
  getUserOrders,
  getOrderById,
  cancelOrder,
  getTokenStatus,
};
