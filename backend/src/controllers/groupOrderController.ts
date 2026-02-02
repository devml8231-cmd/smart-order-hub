import { Request, Response } from 'express';
import { supabaseAdmin } from '../config/supabase';
import { sendSuccess, sendError, generateUniqueCode } from '../utils/helpers';
import { AuthenticatedRequest } from '../types';
import logger from '../utils/logger';

/**
 * Create group order
 */
export const createGroupOrder = async (req: Request, res: Response): Promise<void> => {
  try {
    const user = (req as AuthenticatedRequest).user!;
    const { vendor_id, group_name, pickup_time } = req.body;

    const sharedCode = generateUniqueCode(8);

    const { data: groupOrder, error } = await supabaseAdmin
      .from('group_orders')
      .insert({
        vendor_id,
        creator_id: user.id,
        group_name,
        shared_code: sharedCode,
        pickup_time: new Date(pickup_time).toISOString(),
        is_locked: false,
        status: 'PLACED',
      })
      .select()
      .single();

    if (error) {
      logger.error('Failed to create group order:', error);
      sendError(res, 'Failed to create group order', 500);
      return;
    }

    sendSuccess(res, groupOrder, 'Group order created successfully', 201);
  } catch (error) {
    logger.error('Create group order error:', error);
    sendError(res, 'Failed to create group order', 500);
  }
};

/**
 * Join group order
 */
export const joinGroupOrder = async (req: Request, res: Response): Promise<void> => {
  try {
    const { groupCode } = req.params;

    const { data: groupOrder, error } = await supabaseAdmin
      .from('group_orders')
      .select(`
        *,
        vendor:vendors(*),
        orders(
          *,
          user:users(full_name),
          order_items(
            *,
            menu_item:menu_items(*)
          )
        )
      `)
      .eq('shared_code', groupCode)
      .single();

    if (error || !groupOrder) {
      sendError(res, 'Group order not found', 404);
      return;
    }

    if (groupOrder.is_locked) {
      sendError(res, 'Group order is locked', 400);
      return;
    }

    sendSuccess(res, groupOrder);
  } catch (error) {
    logger.error('Join group order error:', error);
    sendError(res, 'Failed to join group order', 500);
  }
};

/**
 * Lock group order
 */
export const lockGroupOrder = async (req: Request, res: Response): Promise<void> => {
  try {
    const user = (req as AuthenticatedRequest).user!;
    const { groupId } = req.params;

    const { data: groupOrder } = await supabaseAdmin
      .from('group_orders')
      .select('*')
      .eq('id', groupId)
      .single();

    if (!groupOrder || groupOrder.creator_id !== user.id) {
      sendError(res, 'Unauthorized or group order not found', 403);
      return;
    }

    // Calculate total amount
    const { data: orders } = await supabaseAdmin
      .from('orders')
      .select('final_amount')
      .eq('group_order_id', groupId);

    const totalAmount = orders?.reduce((sum, o) => sum + Number(o.final_amount), 0) || 0;

    const { data: updated, error } = await supabaseAdmin
      .from('group_orders')
      .update({
        is_locked: true,
        total_amount: totalAmount,
      })
      .eq('id', groupId)
      .select()
      .single();

    if (error) {
      logger.error('Failed to lock group order:', error);
      sendError(res, 'Failed to lock group order', 500);
      return;
    }

    sendSuccess(res, updated, 'Group order locked successfully');
  } catch (error) {
    logger.error('Lock group order error:', error);
    sendError(res, 'Failed to lock group order', 500);
  }
};

/**
 * Get group order details
 */
export const getGroupOrderDetails = async (req: Request, res: Response): Promise<void> => {
  try {
    const { groupId } = req.params;

    const { data: groupOrder, error } = await supabaseAdmin
      .from('group_orders')
      .select(`
        *,
        vendor:vendors(*),
        orders(
          *,
          user:users(full_name),
          order_items(
            *,
            menu_item:menu_items(*)
          )
        )
      `)
      .eq('id', groupId)
      .single();

    if (error || !groupOrder) {
      sendError(res, 'Group order not found', 404);
      return;
    }

    sendSuccess(res, groupOrder);
  } catch (error) {
    logger.error('Get group order details error:', error);
    sendError(res, 'Failed to fetch group order', 500);
  }
};

export default {
  createGroupOrder,
  joinGroupOrder,
  lockGroupOrder,
  getGroupOrderDetails,
};
