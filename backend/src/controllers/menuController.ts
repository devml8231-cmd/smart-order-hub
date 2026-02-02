import { Request, Response } from 'express';
import { supabaseAdmin } from '../config/supabase';
import { sendSuccess, sendError, getTimeOfDay, calculateRecommendationScore } from '../utils/helpers';
import { AuthenticatedRequest } from '../types';
import logger from '../utils/logger';

/**
 * Get all menu items with filters
 */
export const getMenuItems = async (req: Request, res: Response): Promise<void> => {
  try {
    const {
      vendor_id,
      category_id,
      food_type,
      is_special,
      is_best_seller,
      page = 1,
      limit = 50
    } = req.query;

    let query = supabaseAdmin
      .from('menu_items')
      .select(`
        *,
        category:menu_categories(*),
        vendor:vendors(*)
      `, { count: 'exact' })
      .is('deleted_at', null)
      .eq('is_available', true);

    if (vendor_id) query = query.eq('vendor_id', vendor_id);
    if (category_id) query = query.eq('category_id', category_id);
    if (food_type) query = query.eq('food_type', food_type);
    if (is_special === 'true') query = query.eq('is_special', true);
    if (is_best_seller === 'true') query = query.eq('is_best_seller', true);

    const { data: items, error, count } = await query
      .order('total_orders', { ascending: false })
      .range((Number(page) - 1) * Number(limit), Number(page) * Number(limit) - 1);

    if (error) {
      logger.error('Failed to fetch menu items:', error);
      sendError(res, 'Failed to fetch menu items', 500);
      return;
    }

    sendSuccess(res, {
      items,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total: count || 0,
        totalPages: Math.ceil((count || 0) / Number(limit)),
      },
    });
  } catch (error) {
    logger.error('Get menu items error:', error);
    sendError(res, 'Failed to fetch menu items', 500);
  }
};

/**
 * Get menu item by ID
 */
export const getMenuItemById = async (req: Request, res: Response): Promise<void> => {
  try {
    const { itemId } = req.params;
    const user = (req as AuthenticatedRequest).user;

    const { data: item, error } = await supabaseAdmin
      .from('menu_items')
      .select(`
        *,
        category:menu_categories(*),
        vendor:vendors(*)
      `)
      .eq('id', itemId)
      .is('deleted_at', null)
      .single();

    if (error || !item) {
      sendError(res, 'Menu item not found', 404);
      return;
    }

    // Check if user has favorited this item
    if (user) {
      const { data: favorite } = await supabaseAdmin
        .from('favorites')
        .select('id')
        .eq('user_id', user.id)
        .eq('menu_item_id', itemId)
        .single();

      item.is_favorite = !!favorite;
    }

    sendSuccess(res, item);
  } catch (error) {
    logger.error('Get menu item error:', error);
    sendError(res, 'Failed to fetch menu item', 500);
  }
};

/**
 * Search menu items
 */
export const searchMenuItems = async (req: Request, res: Response): Promise<void> => {
  try {
    const { q: query, vendor_id } = req.query;

    if (!query) {
      sendError(res, 'Search query is required', 400);
      return;
    }

    let dbQuery = supabaseAdmin
      .from('menu_items')
      .select(`
        *,
        category:menu_categories(*),
        vendor:vendors(*)
      `)
      .is('deleted_at', null)
      .eq('is_available', true)
      .ilike('name', `%${query}%`);

    if (vendor_id) {
      dbQuery = dbQuery.eq('vendor_id', vendor_id);
    }

    const { data: items, error } = await dbQuery
      .order('total_orders', { ascending: false })
      .limit(20);

    if (error) {
      logger.error('Search error:', error);
      sendError(res, 'Search failed', 500);
      return;
    }

    sendSuccess(res, items);
  } catch (error) {
    logger.error('Search menu items error:', error);
    sendError(res, 'Search failed', 500);
  }
};

/**
 * Get AI-powered recommendations with collaborative filtering
 */
export const getRecommendations = async (req: Request, res: Response): Promise<void> => {
  try {
    const user = (req as AuthenticatedRequest).user;
    const { vendor_id } = req.query;
    const currentHour = new Date().getHours();

    // Get user's order history for personalization
    let userHistory: Array<{ menu_item_id: string; order_count: number }> = [];
    if (user) {
      const { data: history } = await supabaseAdmin
        .from('user_order_history')
        .select('menu_item_id, order_count')
        .eq('user_id', user.id);

      if (history) {
        userHistory = history;
      }
    }

    // Get all available menu items with category info
    let menuQuery = supabaseAdmin
      .from('menu_items')
      .select(`
        *,
        category:menu_categories(*)
      `)
      .is('deleted_at', null)
      .eq('is_available', true);

    if (vendor_id) menuQuery = menuQuery.eq('vendor_id', vendor_id);

    const { data: allItems } = await menuQuery;

    if (!allItems || allItems.length === 0) {
      sendSuccess(res, {
        personalized: [],
        best_sellers: [],
        today_special: [],
        based_on_time: [],
        trending: [],
      });
      return;
    }

    // Calculate recommendation score for each item
    const itemsWithScores = allItems.map((item) => ({
      ...item,
      score: calculateRecommendationScore(item, userHistory, currentHour),
    }));

    // Sort by score
    itemsWithScores.sort((a, b) => b.score - a.score);

    // Separate into categories
    const bestSellers = itemsWithScores
      .filter((item) => item.is_best_seller)
      .slice(0, 10);

    const todaySpecial = itemsWithScores
      .filter((item) => item.is_special)
      .slice(0, 10);

    // Time-based recommendations (breakfast, lunch, snacks, dinner)
    const timeOfDay = getTimeOfDay(currentHour);
    const timeBasedItems = itemsWithScores
      .filter((item) => {
        const categoryName = item.category?.name?.toLowerCase() || '';
        return categoryName.includes(timeOfDay);
      })
      .slice(0, 10);

    // Personalized recommendations (top scored items for this user)
    const personalized = user
      ? itemsWithScores
        .filter((item) => userHistory.some((h) => h.menu_item_id === item.id))
        .slice(0, 10)
      : [];

    // Trending items (high recent orders + good ratings)
    const trending = itemsWithScores
      .filter((item) => item.total_orders > 20 && item.average_rating >= 4.0)
      .slice(0, 10);

    // If no personalized items, use top scored items
    const finalPersonalized = personalized.length > 0
      ? personalized
      : itemsWithScores.slice(0, 10);

    sendSuccess(res, {
      personalized: finalPersonalized.map(({ score, ...item }) => item),
      best_sellers: bestSellers.map(({ score, ...item }) => item),
      today_special: todaySpecial.map(({ score, ...item }) => item),
      based_on_time: timeBasedItems.length > 0
        ? timeBasedItems.map(({ score, ...item }) => item)
        : itemsWithScores.slice(0, 10).map(({ score, ...item }) => item),
      trending: trending.map(({ score, ...item }) => item),
    });
  } catch (error) {
    logger.error('Get recommendations error:', error);
    sendError(res, 'Failed to fetch recommendations', 500);
  }
};

/**
 * Create menu item (Admin only)
 */
export const createMenuItem = async (req: Request, res: Response): Promise<void> => {
  try {
    const {
      vendor_id,
      category_id,
      name,
      description,
      image_url,
      price,
      food_type,
      preparation_time_minutes,
      stock_quantity,
    } = req.body;

    const { data: item, error } = await supabaseAdmin
      .from('menu_items')
      .insert({
        vendor_id,
        category_id,
        name,
        description,
        image_url,
        price,
        food_type,
        preparation_time_minutes: preparation_time_minutes || 10,
        stock_quantity,
        is_available: true,
      })
      .select()
      .single();

    if (error) {
      logger.error('Failed to create menu item:', error);
      sendError(res, 'Failed to create menu item', 500);
      return;
    }

    sendSuccess(res, item, 'Menu item created successfully', 201);
  } catch (error) {
    logger.error('Create menu item error:', error);
    sendError(res, 'Failed to create menu item', 500);
  }
};

/**
 * Update menu item (Admin only)
 */
export const updateMenuItem = async (req: Request, res: Response): Promise<void> => {
  try {
    const { itemId } = req.params;
    const updates = req.body;

    const { data: item, error } = await supabaseAdmin
      .from('menu_items')
      .update(updates)
      .eq('id', itemId)
      .select()
      .single();

    if (error) {
      logger.error('Failed to update menu item:', error);
      sendError(res, 'Failed to update menu item', 500);
      return;
    }

    sendSuccess(res, item, 'Menu item updated successfully');
  } catch (error) {
    logger.error('Update menu item error:', error);
    sendError(res, 'Failed to update menu item', 500);
  }
};

/**
 * Update stock (Admin only)
 */
export const updateStock = async (req: Request, res: Response): Promise<void> => {
  try {
    const { itemId } = req.params;
    const { quantity, reason } = req.body;
    const user = (req as AuthenticatedRequest).user!;

    const { data: item, error } = await supabaseAdmin
      .from('menu_items')
      .update({ stock_quantity: quantity })
      .eq('id', itemId)
      .select()
      .single();

    if (error) {
      logger.error('Failed to update stock:', error);
      sendError(res, 'Failed to update stock', 500);
      return;
    }

    // Log stock change
    await supabaseAdmin.from('stock_history').insert({
      menu_item_id: itemId,
      previous_quantity: item.stock_quantity,
      new_quantity: quantity,
      change_reason: reason || 'Manual update',
      changed_by: user.id,
    });

    sendSuccess(res, item, 'Stock updated successfully');
  } catch (error) {
    logger.error('Update stock error:', error);
    sendError(res, 'Failed to update stock', 500);
  }
};

export default {
  getMenuItems,
  getMenuItemById,
  searchMenuItems,
  getRecommendations,
  createMenuItem,
  updateMenuItem,
  updateStock,
};
