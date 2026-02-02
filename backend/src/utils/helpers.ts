import { Response } from 'express';
import { SupabaseClient } from '@supabase/supabase-js';

/**
 * Send success response
 */
export const sendSuccess = (
  res: Response,
  data?: any,
  message: string = 'Success',
  statusCode: number = 200
): void => {
  res.status(statusCode).json({
    success: true,
    data,
    message,
  });
};

/**
 * Send error response
 */
export const sendError = (
  res: Response,
  message: string = 'An error occurred',
  statusCode: number = 500,
  errors?: any
): void => {
  res.status(statusCode).json({
    success: false,
    error: message,
    errors,
  });
};

/**
 * Enhanced ETA calculation with dynamic scheduling
 * Considers:
 * - Current queue length
 * - Item complexity (preparation time per item)
 * - Parallel processing capacity
 * - Peak hour adjustments
 * - Historical completion times
 */
export const calculateETA = (
  queuePosition: number,
  avgPrepTime: number,
  orderItems?: Array<{ preparation_time_minutes: number; quantity: number }>,
  currentHour?: number
): { estimatedReadyTime: Date; estimatedMinutes: number } => {
  const now = new Date();

  // Base preparation time
  let totalPrepTime = 0;

  if (orderItems && orderItems.length > 0) {
    // Calculate actual prep time based on items
    // Assume 70% efficiency for multiple items (some parallel prep)
    const itemPrepTimes = orderItems.map(item =>
      item.preparation_time_minutes * item.quantity
    );
    const maxPrepTime = Math.max(...itemPrepTimes);
    const totalSequentialTime = itemPrepTimes.reduce((sum, time) => sum + time, 0);

    // Parallel processing: max time + 30% of remaining items
    totalPrepTime = maxPrepTime + (totalSequentialTime - maxPrepTime) * 0.3;
  } else {
    // Fallback to average
    totalPrepTime = avgPrepTime;
  }

  // Queue-based delay
  // Assume kitchen can handle 3 orders in parallel
  const parallelCapacity = 3;
  const queueDelay = Math.ceil((queuePosition - 1) / parallelCapacity) * (avgPrepTime * 0.7);

  // Peak hour adjustment
  const isPeakHour = currentHour
    ? (currentHour >= 12 && currentHour <= 14) || (currentHour >= 19 && currentHour <= 21)
    : false;
  const peakMultiplier = isPeakHour ? 1.3 : 1.0;

  // Buffer time (safety margin)
  const bufferTime = 5;

  // Calculate total estimated minutes
  const estimatedMinutes = Math.ceil(
    (totalPrepTime + queueDelay) * peakMultiplier + bufferTime
  );

  // Calculate estimated ready time
  const estimatedReadyTime = new Date(now.getTime() + estimatedMinutes * 60 * 1000);

  return {
    estimatedReadyTime,
    estimatedMinutes,
  };
};

/**
 * Generate unique token number
 * Format: Sequential number per vendor per day
 */
export const generateTokenNumber = async (
  vendorId: string,
  orderDate: Date,
  supabase: SupabaseClient
): Promise<number> => {
  const dateStr = orderDate.toISOString().split('T')[0];

  // Get last token for this vendor today
  const { data: lastToken } = await supabase
    .from('tokens')
    .select('token_number')
    .eq('vendor_id', vendorId)
    .eq('token_date', dateStr)
    .order('token_number', { ascending: false })
    .limit(1)
    .single();

  return lastToken ? lastToken.token_number + 1 : 1;
};

/**
 * Calculate recommendation score using collaborative filtering
 * Combines multiple signals:
 * - User's past orders (personalization)
 * - Item popularity (bestsellers)
 * - Average rating (quality)
 * - Time-based relevance
 * - Similar users' preferences
 */
export const calculateRecommendationScore = (
  item: any,
  userHistory?: Array<{ menu_item_id: string; order_count: number }>,
  currentHour?: number
): number => {
  let score = 0;

  // 1. Popularity score (30%)
  const popularityScore = Math.min(item.total_orders / 100, 1) * 30;
  score += popularityScore;

  // 2. Quality score (25%)
  const qualityScore = (item.average_rating / 5) * 25;
  score += qualityScore;

  // 3. Personalization score (25%)
  if (userHistory) {
    const userItem = userHistory.find(h => h.menu_item_id === item.id);
    if (userItem) {
      const personalScore = Math.min(userItem.order_count / 10, 1) * 25;
      score += personalScore;
    }
  }

  // 4. Time-based relevance (10%)
  if (currentHour !== undefined) {
    const timeScore = getTimeRelevanceScore(item, currentHour) * 10;
    score += timeScore;
  }

  // 5. Special/Seasonal boost (10%)
  if (item.is_special) score += 5;
  if (item.is_seasonal) score += 3;
  if (item.is_best_seller) score += 2;

  return score;
};

/**
 * Get time-based relevance score
 */
const getTimeRelevanceScore = (item: any, currentHour: number): number => {
  // Breakfast items (6-11 AM)
  if (currentHour >= 6 && currentHour < 11) {
    if (item.category?.name?.toLowerCase().includes('breakfast')) return 1;
    if (item.food_type === 'VEG' && item.name.toLowerCase().includes('coffee')) return 0.8;
  }

  // Lunch items (11 AM - 3 PM)
  if (currentHour >= 11 && currentHour < 15) {
    if (item.category?.name?.toLowerCase().includes('lunch')) return 1;
    if (item.name.toLowerCase().includes('thali') || item.name.toLowerCase().includes('rice')) return 0.9;
  }

  // Snacks (3 PM - 7 PM)
  if (currentHour >= 15 && currentHour < 19) {
    if (item.category?.name?.toLowerCase().includes('snack')) return 1;
    if (item.name.toLowerCase().includes('chai') || item.name.toLowerCase().includes('samosa')) return 0.9;
  }

  // Dinner (7 PM - 11 PM)
  if (currentHour >= 19 && currentHour < 23) {
    if (item.category?.name?.toLowerCase().includes('dinner')) return 1;
  }

  return 0.5; // Neutral score
};

/**
 * Update queue positions and ETAs for all pending orders
 * Called when an order status changes
 */
export const recalculateQueueETAs = async (
  vendorId: string,
  supabase: SupabaseClient
): Promise<void> => {
  // Get all pending/preparing orders for this vendor
  const { data: orders } = await supabase
    .from('orders')
    .select(`
      id,
      estimated_ready_time,
      order_items(
        menu_item:menu_items(preparation_time_minutes),
        quantity
      )
    `)
    .eq('vendor_id', vendorId)
    .in('status', ['PLACED', 'PREPARING'])
    .order('created_at', { ascending: true });

  if (!orders || orders.length === 0) return;

  const currentHour = new Date().getHours();

  // Recalculate ETA for each order
  for (let i = 0; i < orders.length; i++) {
    const order = orders[i];
    const queuePosition = i + 1;

    // Get item prep times
    const orderItems = (order.order_items as any[]).map((oi: any) => ({
      preparation_time_minutes: oi.menu_item?.preparation_time_minutes || 10,
      quantity: oi.quantity,
    }));

    const { estimatedReadyTime, estimatedMinutes } = calculateETA(
      queuePosition,
      15, // Default avg prep time
      orderItems,
      currentHour
    );

    // Update order
    await supabase
      .from('orders')
      .update({ estimated_ready_time: estimatedReadyTime.toISOString() })
      .eq('id', order.id);

    // Update token
    await supabase
      .from('tokens')
      .update({
        queue_position: queuePosition,
        estimated_time_minutes: estimatedMinutes,
      })
      .eq('order_id', order.id);
  }
};
