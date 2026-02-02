// =============================================
// Type Definitions for Smart Food Pre-Order System
// =============================================

export type UserRole = 'USER' | 'ADMIN' | 'VENDOR';

export type OrderStatus = 'PLACED' | 'PREPARING' | 'READY' | 'COMPLETED' | 'CANCELLED';

export type PaymentStatus = 'PENDING' | 'COMPLETED' | 'FAILED' | 'REFUNDED';

export type TokenStatus = 'WAITING' | 'PREPARING' | 'READY' | 'COMPLETED';

export type FoodType = 'VEG' | 'NON_VEG' | 'VEGAN' | 'UPWAS';

export type DiscountType = 'PERCENTAGE' | 'FIXED' | 'SURPLUS';

// =============================================
// Entity Interfaces
// =============================================

export interface User {
  id: string;
  phone_number: string;
  full_name?: string;
  email?: string;
  role: UserRole;
  is_active: boolean;
  last_login_at?: Date;
  created_at: Date;
  updated_at: Date;
  deleted_at?: Date;
}

export interface Vendor {
  id: string;
  name: string;
  description?: string;
  logo_url?: string;
  phone_number: string;
  email?: string;
  address?: string;
  is_active: boolean;
  opening_time?: string;
  closing_time?: string;
  average_prep_time_minutes: number;
  created_at: Date;
  updated_at: Date;
  deleted_at?: Date;
}

export interface MenuCategory {
  id: string;
  vendor_id: string;
  name: string;
  description?: string;
  display_order: number;
  is_active: boolean;
  created_at: Date;
  updated_at: Date;
  deleted_at?: Date;
}

export interface MenuItem {
  id: string;
  vendor_id: string;
  category_id?: string;
  name: string;
  description?: string;
  image_url?: string;
  price: number;
  discount_price?: number;
  food_type: FoodType;
  preparation_time_minutes: number;
  stock_quantity: number;
  is_available: boolean;
  is_special: boolean;
  is_best_seller: boolean;
  is_seasonal: boolean;
  total_orders: number;
  average_rating: number;
  created_at: Date;
  updated_at: Date;
  deleted_at?: Date;
}

export interface Order {
  id: string;
  user_id: string;
  vendor_id: string;
  group_order_id?: string;
  token_number: number;
  order_date: Date;
  pickup_time: Date;
  status: OrderStatus;
  total_amount: number;
  discount_amount: number;
  final_amount: number;
  preparation_started_at?: Date;
  preparation_completed_at?: Date;
  estimated_ready_time?: Date;
  actual_ready_time?: Date;
  completed_at?: Date;
  cancelled_at?: Date;
  cancellation_reason?: string;
  special_instructions?: string;
  is_preorder: boolean;
  created_at: Date;
  updated_at: Date;
}

export interface OrderItem {
  id: string;
  order_id: string;
  menu_item_id: string;
  quantity: number;
  unit_price: number;
  discount_price?: number;
  subtotal: number;
  special_instructions?: string;
  created_at: Date;
}

export interface Token {
  id: string;
  order_id: string;
  vendor_id: string;
  token_number: number;
  token_date: Date;
  status: TokenStatus;
  queue_position?: number;
  estimated_time_minutes?: number;
  started_at?: Date;
  ready_at?: Date;
  completed_at?: Date;
  is_notified: boolean;
  created_at: Date;
  updated_at: Date;
}

export interface Payment {
  id: string;
  order_id: string;
  user_id: string;
  razorpay_order_id?: string;
  razorpay_payment_id?: string;
  razorpay_signature?: string;
  amount: number;
  currency: string;
  status: PaymentStatus;
  payment_method?: string;
  payment_date?: Date;
  failure_reason?: string;
  created_at: Date;
  updated_at: Date;
}

export interface Favorite {
  id: string;
  user_id: string;
  menu_item_id: string;
  created_at: Date;
}

export interface Review {
  id: string;
  user_id?: string;
  order_id: string;
  menu_item_id: string;
  vendor_id: string;
  rating: number;
  comment?: string;
  is_anonymous: boolean;
  is_verified_purchase: boolean;
  helpful_count: number;
  created_at: Date;
  updated_at: Date;
}

export interface GroupOrder {
  id: string;
  vendor_id: string;
  creator_id: string;
  group_name?: string;
  shared_code: string;
  pickup_time: Date;
  is_locked: boolean;
  total_amount: number;
  status: OrderStatus;
  created_at: Date;
  updated_at: Date;
}

export interface SurplusFood {
  id: string;
  vendor_id: string;
  menu_item_id: string;
  surplus_date: Date;
  original_quantity: number;
  surplus_quantity: number;
  discount_percentage?: number;
  discount_price?: number;
  is_active: boolean;
  expires_at?: Date;
  created_at: Date;
  updated_at: Date;
}

export interface TimeSlot {
  id: string;
  vendor_id: string;
  slot_time: string;
  slot_date: Date;
  max_orders: number;
  current_orders: number;
  is_available: boolean;
  is_peak_hour: boolean;
  created_at: Date;
  updated_at: Date;
}

export interface AdminAction {
  id: string;
  admin_id: string;
  action_type: string;
  entity_type?: string;
  entity_id?: string;
  description?: string;
  metadata?: Record<string, any>;
  ip_address?: string;
  created_at: Date;
}

export interface UserOrderHistory {
  id: string;
  user_id: string;
  menu_item_id: string;
  order_count: number;
  last_ordered_at: Date;
  created_at: Date;
  updated_at: Date;
}

// =============================================
// API Request/Response Types
// =============================================

export interface AuthRequest {
  phone_number: string;
}

export interface VerifyOtpRequest {
  phone_number: string;
  otp: string;
}

export interface CreateOrderRequest {
  vendor_id: string;
  items: Array<{
    menu_item_id: string;
    quantity: number;
    special_instructions?: string;
  }>;
  pickup_time: string;
  special_instructions?: string;
  group_order_id?: string;
}

export interface CreateGroupOrderRequest {
  vendor_id: string;
  group_name?: string;
  pickup_time: string;
}

export interface PaymentVerificationRequest {
  razorpay_order_id: string;
  razorpay_payment_id: string;
  razorpay_signature: string;
}

export interface ReviewRequest {
  order_id: string;
  menu_item_id: string;
  rating: number;
  comment?: string;
  is_anonymous?: boolean;
}

export interface StockUpdateRequest {
  quantity: number;
  reason?: string;
}

export interface MenuItemCreateRequest {
  vendor_id: string;
  category_id?: string;
  name: string;
  description?: string;
  image_url?: string;
  price: number;
  food_type: FoodType;
  preparation_time_minutes?: number;
  stock_quantity: number;
}

// =============================================
// API Response Types
// =============================================

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}

export interface PaginatedResponse<T> {
  success: boolean;
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface OrderWithDetails extends Order {
  vendor: Vendor;
  items: Array<OrderItem & { menu_item: MenuItem }>;
  token?: Token;
  payment?: Payment;
}

export interface MenuItemWithDetails extends MenuItem {
  category?: MenuCategory;
  vendor: Vendor;
  is_favorite?: boolean;
  user_order_count?: number;
}

export interface RecommendationResponse {
  personalized: MenuItem[];
  best_sellers: MenuItem[];
  today_special: MenuItem[];
  based_on_time: MenuItem[];
}

export interface TokenStatusResponse {
  token_number: number;
  status: TokenStatus;
  queue_position?: number;
  estimated_time_minutes?: number;
  is_ready: boolean;
  should_blink: boolean;
  order: OrderWithDetails;
}

export interface AnalyticsResponse {
  total_orders: number;
  total_revenue: number;
  average_order_value: number;
  peak_hours: Array<{ hour: number; order_count: number }>;
  idle_hours: Array<{ hour: number; order_count: number }>;
  best_selling_items: Array<MenuItem & { total_sold: number }>;
  user_feedback_summary: {
    average_rating: number;
    total_reviews: number;
    rating_distribution: Record<number, number>;
  };
}

export interface ETACalculation {
  estimated_ready_time: Date;
  estimated_minutes: number;
  queue_position: number;
  orders_ahead: number;
}

// =============================================
// Express Request Extension
// =============================================

export interface AuthenticatedRequest extends Express.Request {
  user?: {
    id: string;
    phone_number: string;
    role: UserRole;
    email?: string;
  };
}

// =============================================
// Configuration Types
// =============================================

export interface Config {
  port: number;
  nodeEnv: string;
  apiVersion: string;
  supabase: {
    url: string;
    anonKey: string;
    serviceRoleKey: string;
  };
  jwt: {
    secret: string;
    expiresIn: string;
  };
  razorpay: {
    keyId: string;
    keySecret: string;
  };
  cors: {
    origin: string;
  };
  rateLimit: {
    windowMs: number;
    maxRequests: number;
  };
  notification: {
    thresholdMinutes: number;
  };
}
