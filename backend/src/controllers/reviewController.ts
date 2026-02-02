import { Request, Response } from 'express';
import { supabaseAdmin } from '../config/supabase';
import { sendSuccess, sendError } from '../utils/helpers';
import { AuthenticatedRequest } from '../types';
import logger from '../utils/logger';

/**
 * Create review
 */
export const createReview = async (req: Request, res: Response): Promise<void> => {
  try {
    const user = (req as AuthenticatedRequest).user!;
    const { order_id, menu_item_id, rating, comment, is_anonymous } = req.body;

    // Verify order belongs to user and is completed
    const { data: order } = await supabaseAdmin
      .from('orders')
      .select('*, vendor_id')
      .eq('id', order_id)
      .eq('user_id', user.id)
      .eq('status', 'COMPLETED')
      .single();

    if (!order) {
      sendError(res, 'Order not found or not completed', 404);
      return;
    }

    const { data: review, error } = await supabaseAdmin
      .from('reviews')
      .insert({
        user_id: is_anonymous ? null : user.id,
        order_id,
        menu_item_id,
        vendor_id: order.vendor_id,
        rating,
        comment,
        is_anonymous: is_anonymous || false,
      })
      .select()
      .single();

    if (error) {
      logger.error('Failed to create review:', error);
      sendError(res, 'Failed to create review', 500);
      return;
    }

    sendSuccess(res, review, 'Review submitted successfully', 201);
  } catch (error) {
    logger.error('Create review error:', error);
    sendError(res, 'Failed to create review', 500);
  }
};

/**
 * Get reviews for menu item
 */
export const getMenuItemReviews = async (req: Request, res: Response): Promise<void> => {
  try {
    const { itemId } = req.params;
    const { page = 1, limit = 20 } = req.query;

    const { data: reviews, error, count } = await supabaseAdmin
      .from('reviews')
      .select(`
        *,
        user:users(full_name)
      `, { count: 'exact' })
      .eq('menu_item_id', itemId)
      .order('created_at', { ascending: false })
      .range((Number(page) - 1) * Number(limit), Number(page) * Number(limit) - 1);

    if (error) {
      logger.error('Failed to fetch reviews:', error);
      sendError(res, 'Failed to fetch reviews', 500);
      return;
    }

    sendSuccess(res, {
      reviews,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total: count || 0,
        totalPages: Math.ceil((count || 0) / Number(limit)),
      },
    });
  } catch (error) {
    logger.error('Get reviews error:', error);
    sendError(res, 'Failed to fetch reviews', 500);
  }
};

/**
 * Add to favorites
 */
export const addFavorite = async (req: Request, res: Response): Promise<void> => {
  try {
    const user = (req as AuthenticatedRequest).user!;
    const { menu_item_id } = req.body;

    const { data: favorite, error } = await supabaseAdmin
      .from('favorites')
      .insert({
        user_id: user.id,
        menu_item_id,
      })
      .select()
      .single();

    if (error) {
      if (error.code === '23505') {
        sendError(res, 'Item already in favorites', 409);
        return;
      }
      logger.error('Failed to add favorite:', error);
      sendError(res, 'Failed to add to favorites', 500);
      return;
    }

    sendSuccess(res, favorite, 'Added to favorites', 201);
  } catch (error) {
    logger.error('Add favorite error:', error);
    sendError(res, 'Failed to add to favorites', 500);
  }
};

/**
 * Remove from favorites
 */
export const removeFavorite = async (req: Request, res: Response): Promise<void> => {
  try {
    const user = (req as AuthenticatedRequest).user!;
    const { itemId } = req.params;

    const { error } = await supabaseAdmin
      .from('favorites')
      .delete()
      .eq('user_id', user.id)
      .eq('menu_item_id', itemId);

    if (error) {
      logger.error('Failed to remove favorite:', error);
      sendError(res, 'Failed to remove from favorites', 500);
      return;
    }

    sendSuccess(res, null, 'Removed from favorites');
  } catch (error) {
    logger.error('Remove favorite error:', error);
    sendError(res, 'Failed to remove from favorites', 500);
  }
};

/**
 * Get user favorites
 */
export const getUserFavorites = async (req: Request, res: Response): Promise<void> => {
  try {
    const user = (req as AuthenticatedRequest).user!;

    const { data: favorites, error } = await supabaseAdmin
      .from('favorites')
      .select(`
        *,
        menu_item:menu_items(
          *,
          vendor:vendors(*)
        )
      `)
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (error) {
      logger.error('Failed to fetch favorites:', error);
      sendError(res, 'Failed to fetch favorites', 500);
      return;
    }

    sendSuccess(res, favorites);
  } catch (error) {
    logger.error('Get favorites error:', error);
    sendError(res, 'Failed to fetch favorites', 500);
  }
};

export default {
  createReview,
  getMenuItemReviews,
  addFavorite,
  removeFavorite,
  getUserFavorites,
};
