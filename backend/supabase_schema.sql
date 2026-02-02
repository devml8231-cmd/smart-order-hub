-- Smart Food Pre-Order System - Database Schema
-- Version: 1.0.0
-- Date: 2026-02-02

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- =============================================
-- ENUMS
-- =============================================

-- User roles
CREATE TYPE user_role AS ENUM ('USER', 'ADMIN', 'VENDOR');

-- Order status
CREATE TYPE order_status AS ENUM ('PLACED', 'PREPARING', 'READY', 'COMPLETED', 'CANCELLED');

-- Payment status
CREATE TYPE payment_status AS ENUM ('PENDING', 'COMPLETED', 'FAILED', 'REFUNDED');

-- Token status
CREATE TYPE token_status AS ENUM ('WAITING', 'PREPARING', 'READY', 'COMPLETED');

-- Food type
CREATE TYPE food_type AS ENUM ('VEG', 'NON_VEG', 'VEGAN', 'UPWAS');

-- Discount type
CREATE TYPE discount_type AS ENUM ('PERCENTAGE', 'FIXED', 'SURPLUS');

-- =============================================
-- TABLES
-- =============================================

-- Users table (extended from Supabase Auth)
CREATE TABLE users (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    phone_number VARCHAR(15) UNIQUE NOT NULL,
    full_name VARCHAR(255),
    email VARCHAR(255),
    role user_role DEFAULT 'USER',
    is_active BOOLEAN DEFAULT true,
    last_login_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    deleted_at TIMESTAMP WITH TIME ZONE
);

-- Vendors table
CREATE TABLE vendors (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    logo_url VARCHAR(500),
    phone_number VARCHAR(15) NOT NULL,
    email VARCHAR(255),
    address TEXT,
    is_active BOOLEAN DEFAULT true,
    opening_time TIME,
    closing_time TIME,
    average_prep_time_minutes INTEGER DEFAULT 15,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    deleted_at TIMESTAMP WITH TIME ZONE
);

-- Menu categories
CREATE TABLE menu_categories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    vendor_id UUID NOT NULL REFERENCES vendors(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    display_order INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    deleted_at TIMESTAMP WITH TIME ZONE
);

-- Menu items
CREATE TABLE menu_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    vendor_id UUID NOT NULL REFERENCES vendors(id) ON DELETE CASCADE,
    category_id UUID REFERENCES menu_categories(id) ON DELETE SET NULL,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    image_url VARCHAR(500),
    price DECIMAL(10, 2) NOT NULL,
    discount_price DECIMAL(10, 2),
    food_type food_type NOT NULL,
    preparation_time_minutes INTEGER DEFAULT 10,
    stock_quantity INTEGER DEFAULT 0,
    is_available BOOLEAN DEFAULT true,
    is_special BOOLEAN DEFAULT false,
    is_best_seller BOOLEAN DEFAULT false,
    is_seasonal BOOLEAN DEFAULT false,
    total_orders INTEGER DEFAULT 0,
    average_rating DECIMAL(3, 2) DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    deleted_at TIMESTAMP WITH TIME ZONE
);

-- Time slots for orders
CREATE TABLE time_slots (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    vendor_id UUID NOT NULL REFERENCES vendors(id) ON DELETE CASCADE,
    slot_time TIME NOT NULL,
    slot_date DATE NOT NULL,
    max_orders INTEGER DEFAULT 50,
    current_orders INTEGER DEFAULT 0,
    is_available BOOLEAN DEFAULT true,
    is_peak_hour BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(vendor_id, slot_date, slot_time)
);

-- Group orders
CREATE TABLE group_orders (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    vendor_id UUID NOT NULL REFERENCES vendors(id) ON DELETE CASCADE,
    creator_id UUID NOT NULL REFERENCES users(id),
    group_name VARCHAR(255),
    shared_code VARCHAR(50) UNIQUE NOT NULL,
    pickup_time TIMESTAMP WITH TIME ZONE NOT NULL,
    is_locked BOOLEAN DEFAULT false,
    total_amount DECIMAL(10, 2) DEFAULT 0,
    status order_status DEFAULT 'PLACED',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Orders table
CREATE TABLE orders (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id),
    vendor_id UUID NOT NULL REFERENCES vendors(id) ON DELETE CASCADE,
    group_order_id UUID REFERENCES group_orders(id),
    token_number INTEGER NOT NULL,
    order_date DATE NOT NULL DEFAULT CURRENT_DATE,
    pickup_time TIMESTAMP WITH TIME ZONE NOT NULL,
    status order_status DEFAULT 'PLACED',
    total_amount DECIMAL(10, 2) NOT NULL,
    discount_amount DECIMAL(10, 2) DEFAULT 0,
    final_amount DECIMAL(10, 2) NOT NULL,
    preparation_started_at TIMESTAMP WITH TIME ZONE,
    preparation_completed_at TIMESTAMP WITH TIME ZONE,
    estimated_ready_time TIMESTAMP WITH TIME ZONE,
    actual_ready_time TIMESTAMP WITH TIME ZONE,
    completed_at TIMESTAMP WITH TIME ZONE,
    cancelled_at TIMESTAMP WITH TIME ZONE,
    cancellation_reason TEXT,
    special_instructions TEXT,
    is_preorder BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Order items
CREATE TABLE order_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    menu_item_id UUID NOT NULL REFERENCES menu_items(id),
    quantity INTEGER NOT NULL CHECK (quantity > 0),
    unit_price DECIMAL(10, 2) NOT NULL,
    discount_price DECIMAL(10, 2),
    subtotal DECIMAL(10, 2) NOT NULL,
    special_instructions TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tokens table (for real-time tracking)
CREATE TABLE tokens (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    vendor_id UUID NOT NULL REFERENCES vendors(id) ON DELETE CASCADE,
    token_number INTEGER NOT NULL,
    token_date DATE NOT NULL DEFAULT CURRENT_DATE,
    status token_status DEFAULT 'WAITING',
    queue_position INTEGER,
    estimated_time_minutes INTEGER,
    started_at TIMESTAMP WITH TIME ZONE,
    ready_at TIMESTAMP WITH TIME ZONE,
    completed_at TIMESTAMP WITH TIME ZONE,
    is_notified BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(vendor_id, token_date, token_number)
);

-- Payments table
CREATE TABLE payments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id),
    razorpay_order_id VARCHAR(255) UNIQUE,
    razorpay_payment_id VARCHAR(255) UNIQUE,
    razorpay_signature VARCHAR(500),
    amount DECIMAL(10, 2) NOT NULL,
    currency VARCHAR(3) DEFAULT 'INR',
    status payment_status DEFAULT 'PENDING',
    payment_method VARCHAR(50),
    payment_date TIMESTAMP WITH TIME ZONE,
    failure_reason TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Favorites table
CREATE TABLE favorites (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    menu_item_id UUID NOT NULL REFERENCES menu_items(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, menu_item_id)
);

-- Reviews table
CREATE TABLE reviews (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    menu_item_id UUID NOT NULL REFERENCES menu_items(id) ON DELETE CASCADE,
    vendor_id UUID NOT NULL REFERENCES vendors(id) ON DELETE CASCADE,
    rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
    comment TEXT,
    is_anonymous BOOLEAN DEFAULT false,
    is_verified_purchase BOOLEAN DEFAULT true,
    helpful_count INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Surplus food tracking
CREATE TABLE surplus_food (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    vendor_id UUID NOT NULL REFERENCES vendors(id) ON DELETE CASCADE,
    menu_item_id UUID NOT NULL REFERENCES menu_items(id) ON DELETE CASCADE,
    surplus_date DATE NOT NULL DEFAULT CURRENT_DATE,
    original_quantity INTEGER NOT NULL,
    surplus_quantity INTEGER NOT NULL,
    discount_percentage DECIMAL(5, 2),
    discount_price DECIMAL(10, 2),
    is_active BOOLEAN DEFAULT true,
    expires_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Admin actions log
CREATE TABLE admin_actions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    admin_id UUID NOT NULL REFERENCES users(id),
    action_type VARCHAR(100) NOT NULL,
    entity_type VARCHAR(50),
    entity_id UUID,
    description TEXT,
    metadata JSONB,
    ip_address INET,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Stock history
CREATE TABLE stock_history (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    menu_item_id UUID NOT NULL REFERENCES menu_items(id) ON DELETE CASCADE,
    previous_quantity INTEGER NOT NULL,
    new_quantity INTEGER NOT NULL,
    change_reason VARCHAR(255),
    changed_by UUID REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- User order history (for recommendations)
CREATE TABLE user_order_history (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    menu_item_id UUID NOT NULL REFERENCES menu_items(id) ON DELETE CASCADE,
    order_count INTEGER DEFAULT 1,
    last_ordered_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, menu_item_id)
);

-- =============================================
-- INDEXES
-- =============================================

-- Users indexes
CREATE INDEX idx_users_phone ON users(phone_number);
CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_users_active ON users(is_active) WHERE deleted_at IS NULL;

-- Vendors indexes
CREATE INDEX idx_vendors_active ON vendors(is_active) WHERE deleted_at IS NULL;

-- Menu items indexes
CREATE INDEX idx_menu_items_vendor ON menu_items(vendor_id);
CREATE INDEX idx_menu_items_category ON menu_items(category_id);
CREATE INDEX idx_menu_items_available ON menu_items(is_available) WHERE deleted_at IS NULL;
CREATE INDEX idx_menu_items_best_seller ON menu_items(is_best_seller) WHERE is_best_seller = true;
CREATE INDEX idx_menu_items_special ON menu_items(is_special) WHERE is_special = true;
CREATE INDEX idx_menu_items_rating ON menu_items(average_rating DESC);
CREATE INDEX idx_menu_items_orders ON menu_items(total_orders DESC);

-- Orders indexes
CREATE INDEX idx_orders_user ON orders(user_id);
CREATE INDEX idx_orders_vendor ON orders(vendor_id);
CREATE INDEX idx_orders_status ON orders(status);
CREATE INDEX idx_orders_date ON orders(order_date);
CREATE INDEX idx_orders_pickup_time ON orders(pickup_time);
CREATE INDEX idx_orders_token ON orders(token_number, order_date);
CREATE INDEX idx_orders_group ON orders(group_order_id);

-- Tokens indexes
CREATE INDEX idx_tokens_vendor ON tokens(vendor_id);
CREATE INDEX idx_tokens_status ON tokens(status);
CREATE INDEX idx_tokens_date ON tokens(token_date);
CREATE INDEX idx_tokens_number ON tokens(vendor_id, token_date, token_number);

-- Payments indexes
CREATE INDEX idx_payments_order ON payments(order_id);
CREATE INDEX idx_payments_user ON payments(user_id);
CREATE INDEX idx_payments_status ON payments(status);
CREATE INDEX idx_payments_razorpay_order ON payments(razorpay_order_id);

-- Reviews indexes
CREATE INDEX idx_reviews_menu_item ON reviews(menu_item_id);
CREATE INDEX idx_reviews_vendor ON reviews(vendor_id);
CREATE INDEX idx_reviews_user ON reviews(user_id);
CREATE INDEX idx_reviews_rating ON reviews(rating);

-- Favorites indexes
CREATE INDEX idx_favorites_user ON favorites(user_id);
CREATE INDEX idx_favorites_item ON favorites(menu_item_id);

-- User order history indexes
CREATE INDEX idx_user_order_history_user ON user_order_history(user_id);
CREATE INDEX idx_user_order_history_item ON user_order_history(menu_item_id);
CREATE INDEX idx_user_order_history_count ON user_order_history(order_count DESC);

-- Time slots indexes
CREATE INDEX idx_time_slots_vendor_date ON time_slots(vendor_id, slot_date);
CREATE INDEX idx_time_slots_available ON time_slots(is_available) WHERE is_available = true;

-- Admin actions indexes
CREATE INDEX idx_admin_actions_admin ON admin_actions(admin_id);
CREATE INDEX idx_admin_actions_type ON admin_actions(action_type);
CREATE INDEX idx_admin_actions_date ON admin_actions(created_at);

-- =============================================
-- FUNCTIONS & TRIGGERS
-- =============================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply updated_at trigger to relevant tables
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_vendors_updated_at BEFORE UPDATE ON vendors
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_menu_categories_updated_at BEFORE UPDATE ON menu_categories
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_menu_items_updated_at BEFORE UPDATE ON menu_items
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_orders_updated_at BEFORE UPDATE ON orders
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_tokens_updated_at BEFORE UPDATE ON tokens
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_payments_updated_at BEFORE UPDATE ON payments
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_reviews_updated_at BEFORE UPDATE ON reviews
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_time_slots_updated_at BEFORE UPDATE ON time_slots
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_order_history_updated_at BEFORE UPDATE ON user_order_history
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to generate sequential token numbers per vendor per day
CREATE OR REPLACE FUNCTION get_next_token_number(p_vendor_id UUID, p_order_date DATE)
RETURNS INTEGER AS $$
DECLARE
    next_token INTEGER;
BEGIN
    SELECT COALESCE(MAX(token_number), 0) + 1 INTO next_token
    FROM orders
    WHERE vendor_id = p_vendor_id AND order_date = p_order_date;
    
    RETURN next_token;
END;
$$ LANGUAGE plpgsql;

-- Function to update menu item statistics after order
CREATE OR REPLACE FUNCTION update_menu_item_stats()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        UPDATE menu_items
        SET total_orders = total_orders + NEW.quantity
        WHERE id = NEW.menu_item_id;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_menu_stats_on_order AFTER INSERT ON order_items
    FOR EACH ROW EXECUTE FUNCTION update_menu_item_stats();

-- Function to update menu item rating
CREATE OR REPLACE FUNCTION update_menu_item_rating()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE menu_items
    SET average_rating = (
        SELECT COALESCE(AVG(rating), 0)
        FROM reviews
        WHERE menu_item_id = NEW.menu_item_id
    )
    WHERE id = NEW.menu_item_id;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_rating_on_review AFTER INSERT OR UPDATE ON reviews
    FOR EACH ROW EXECUTE FUNCTION update_menu_item_rating();

-- Function to update stock quantity
CREATE OR REPLACE FUNCTION update_stock_on_order()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        UPDATE menu_items
        SET stock_quantity = stock_quantity - NEW.quantity
        WHERE id = NEW.menu_item_id;
        
        -- Log stock change
        INSERT INTO stock_history (menu_item_id, previous_quantity, new_quantity, change_reason)
        SELECT id, stock_quantity + NEW.quantity, stock_quantity, 'Order placed'
        FROM menu_items
        WHERE id = NEW.menu_item_id;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_stock_on_order_item AFTER INSERT ON order_items
    FOR EACH ROW EXECUTE FUNCTION update_stock_on_order();

-- Function to update user order history
CREATE OR REPLACE FUNCTION update_user_order_history()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        INSERT INTO user_order_history (user_id, menu_item_id, order_count, last_ordered_at)
        SELECT 
            o.user_id,
            NEW.menu_item_id,
            NEW.quantity,
            NOW()
        FROM orders o
        WHERE o.id = NEW.order_id
        ON CONFLICT (user_id, menu_item_id) DO UPDATE
        SET 
            order_count = user_order_history.order_count + EXCLUDED.order_count,
            last_ordered_at = NOW();
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_user_history_on_order AFTER INSERT ON order_items
    FOR EACH ROW EXECUTE FUNCTION update_user_order_history();

-- =============================================
-- ROW LEVEL SECURITY (RLS)
-- =============================================

-- Enable RLS on all tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE vendors ENABLE ROW LEVEL SECURITY;
ALTER TABLE menu_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE menu_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE tokens ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE favorites ENABLE ROW LEVEL SECURITY;
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE group_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE surplus_food ENABLE ROW LEVEL SECURITY;
ALTER TABLE time_slots ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_actions ENABLE ROW LEVEL SECURITY;

-- RLS Policies for users (can read own data, admins can read all)
CREATE POLICY users_select_own ON users FOR SELECT
    USING (auth.uid() = id OR EXISTS (
        SELECT 1 FROM users WHERE id = auth.uid() AND role = 'ADMIN'
    ));

CREATE POLICY users_update_own ON users FOR UPDATE
    USING (auth.uid() = id);

-- RLS Policies for vendors (public read, admin write)
CREATE POLICY vendors_select_all ON vendors FOR SELECT
    USING (true);

CREATE POLICY vendors_admin_all ON vendors FOR ALL
    USING (EXISTS (
        SELECT 1 FROM users WHERE id = auth.uid() AND role = 'ADMIN'
    ));

-- RLS Policies for menu items (public read, admin write)
CREATE POLICY menu_items_select_all ON menu_items FOR SELECT
    USING (is_available = true AND deleted_at IS NULL);

CREATE POLICY menu_items_admin_all ON menu_items FOR ALL
    USING (EXISTS (
        SELECT 1 FROM users WHERE id = auth.uid() AND role = 'ADMIN'
    ));

-- RLS Policies for orders (users can access own orders, admins all)
CREATE POLICY orders_select_own ON orders FOR SELECT
    USING (user_id = auth.uid() OR EXISTS (
        SELECT 1 FROM users WHERE id = auth.uid() AND role = 'ADMIN'
    ));

CREATE POLICY orders_insert_own ON orders FOR INSERT
    WITH CHECK (user_id = auth.uid());

CREATE POLICY orders_update_own ON orders FOR UPDATE
    USING (user_id = auth.uid() OR EXISTS (
        SELECT 1 FROM users WHERE id = auth.uid() AND role = 'ADMIN'
    ));

-- RLS Policies for favorites (users can manage own)
CREATE POLICY favorites_select_own ON favorites FOR SELECT
    USING (user_id = auth.uid());

CREATE POLICY favorites_insert_own ON favorites FOR INSERT
    WITH CHECK (user_id = auth.uid());

CREATE POLICY favorites_delete_own ON favorites FOR DELETE
    USING (user_id = auth.uid());

-- RLS Policies for reviews (public read, users can create/update own)
CREATE POLICY reviews_select_all ON reviews FOR SELECT
    USING (true);

CREATE POLICY reviews_insert_own ON reviews FOR INSERT
    WITH CHECK (user_id = auth.uid() OR is_anonymous = true);

CREATE POLICY reviews_update_own ON reviews FOR UPDATE
    USING (user_id = auth.uid());

-- Admin actions (admin only)
CREATE POLICY admin_actions_admin_only ON admin_actions FOR ALL
    USING (EXISTS (
        SELECT 1 FROM users WHERE id = auth.uid() AND role = 'ADMIN'
    ));

-- =============================================
-- VIEWS
-- =============================================

-- View for order details with items
CREATE OR REPLACE VIEW order_details AS
SELECT 
    o.id as order_id,
    o.user_id,
    o.vendor_id,
    v.name as vendor_name,
    o.token_number,
    o.order_date,
    o.pickup_time,
    o.status,
    o.total_amount,
    o.final_amount,
    o.estimated_ready_time,
    t.status as token_status,
    t.queue_position,
    json_agg(json_build_object(
        'item_id', mi.id,
        'item_name', mi.name,
        'quantity', oi.quantity,
        'unit_price', oi.unit_price,
        'subtotal', oi.subtotal
    )) as items,
    o.created_at
FROM orders o
JOIN vendors v ON o.vendor_id = v.id
LEFT JOIN tokens t ON o.id = t.order_id
LEFT JOIN order_items oi ON o.id = oi.order_id
LEFT JOIN menu_items mi ON oi.menu_item_id = mi.id
GROUP BY o.id, v.name, t.status, t.queue_position;

-- View for best selling items
CREATE OR REPLACE VIEW best_selling_items AS
SELECT 
    mi.id,
    mi.vendor_id,
    v.name as vendor_name,
    mi.name as item_name,
    mi.price,
    mi.total_orders,
    mi.average_rating,
    COUNT(DISTINCT oi.order_id) as unique_orders,
    SUM(oi.quantity) as total_quantity_sold
FROM menu_items mi
JOIN vendors v ON mi.vendor_id = v.id
LEFT JOIN order_items oi ON mi.id = oi.menu_item_id
WHERE mi.deleted_at IS NULL
GROUP BY mi.id, v.name
ORDER BY total_quantity_sold DESC;

-- View for vendor analytics
CREATE OR REPLACE VIEW vendor_analytics AS
SELECT 
    v.id as vendor_id,
    v.name as vendor_name,
    COUNT(DISTINCT o.id) as total_orders,
    COUNT(DISTINCT o.user_id) as unique_customers,
    SUM(o.final_amount) as total_revenue,
    AVG(mi.average_rating) as average_rating,
    COUNT(DISTINCT mi.id) as total_menu_items
FROM vendors v
LEFT JOIN orders o ON v.id = o.vendor_id
LEFT JOIN menu_items mi ON v.id = mi.vendor_id
WHERE v.deleted_at IS NULL
GROUP BY v.id;

-- =============================================
-- INITIAL DATA (Optional)
-- =============================================

-- Insert default admin user (will be created via Supabase Auth)
-- This is just a reference structure

COMMENT ON TABLE users IS 'Extended user profile data linked to Supabase Auth';
COMMENT ON TABLE vendors IS 'Food vendors/restaurants in the system';
COMMENT ON TABLE menu_items IS 'Food items offered by vendors';
COMMENT ON TABLE orders IS 'Customer orders with token system';
COMMENT ON TABLE tokens IS 'Real-time token tracking for order preparation';
COMMENT ON TABLE payments IS 'Payment transaction records with Razorpay integration';
COMMENT ON TABLE reviews IS 'Customer reviews and ratings';
COMMENT ON TABLE surplus_food IS 'Surplus food tracking with dynamic discounts';

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO authenticated;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO authenticated;

-- End of schema
