-- ============================================================================
-- Uzhavar Sandhai - Supabase Database Schema
-- ============================================================================

-- Enable pgcrypto for generating UUIDs if needed (optional)
-- CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Clean up existing tables if they exist
DROP TABLE IF EXISTS payouts CASCADE;
DROP TABLE IF EXISTS orders CASCADE;
DROP TABLE IF EXISTS products CASCADE;
DROP TABLE IF EXISTS riders CASCADE;
DROP TABLE IF EXISTS customers CASCADE;
DROP TABLE IF EXISTS farmers CASCADE;
DROP TABLE IF EXISTS support_tickets CASCADE;

-- 1. Farmers Table
CREATE TABLE farmers (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    name TEXT NOT NULL,
    farm_name TEXT NOT NULL,
    phone TEXT UNIQUE NOT NULL,
    location TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    rating NUMERIC(3, 2) DEFAULT 0.0,
    status TEXT NOT NULL DEFAULT 'Pending' CHECK (status IN ('Pending', 'Verified', 'Rejected', 'Suspended')),
    joined_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    image TEXT DEFAULT 'https://images.unsplash.com/photo-1595856728032-47d06634b070?w=500&auto=format&fit=crop&fm=webp',
    bank_details JSONB DEFAULT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Customers Table
CREATE TABLE customers (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    full_name TEXT NOT NULL,
    phone TEXT NOT NULL,
    location TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Riders Table
CREATE TABLE riders (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    name TEXT NOT NULL,
    phone TEXT UNIQUE NOT NULL,
    email TEXT UNIQUE,
    vehicle TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'Online' CHECK (status IN ('Online', 'Busy', 'Offline')),
    rating NUMERIC(3, 2) DEFAULT 5.0,
    distance NUMERIC(3, 1) DEFAULT 1.0,
    active_orders INT DEFAULT 0,
    weekly_deliveries INT DEFAULT 0,
    weekly_earnings NUMERIC(10, 2) DEFAULT 0.0,
    bonus NUMERIC(10, 2) DEFAULT 0.0,
    acceptance_rate INT DEFAULT 100 CHECK (acceptance_rate BETWEEN 0 AND 100),
    acceptances INT DEFAULT 0,
    rejections INT DEFAULT 0,
    password TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. Products Table
CREATE TABLE products (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    farmer_id BIGINT REFERENCES farmers(id) ON DELETE CASCADE,
    farmer_name TEXT NOT NULL,
    name TEXT NOT NULL,
    category TEXT NOT NULL,
    price NUMERIC(10, 2) NOT NULL,
    unit TEXT NOT NULL,
    stock INT NOT NULL DEFAULT 0,
    is_organic BOOLEAN DEFAULT FALSE,
    image TEXT,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. Orders Table
CREATE TABLE orders (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    customer_id BIGINT REFERENCES customers(id) ON DELETE SET NULL,
    farmer_id BIGINT REFERENCES farmers(id) ON DELETE SET NULL,
    status TEXT NOT NULL CHECK (status IN ('Pending', 'Confirmed', 'Packed', 'Picked Up', 'On The Way', 'Near Customer', 'Delivered', 'Cancelled')),
    items JSONB NOT NULL, -- Array of items with id, name, price, quantity, unit, image
    total NUMERIC(10, 2) NOT NULL,
    discount NUMERIC(10, 2) DEFAULT 0.0,
    delivery_fee NUMERIC(10, 2) DEFAULT 0.0,
    subtotal NUMERIC(10, 2) NOT NULL,
    address TEXT NOT NULL,
    payment_method TEXT NOT NULL,
    payment_status TEXT NOT NULL DEFAULT 'Pending' CHECK (payment_status IN ('Pending', 'Paid', 'Refunded')),
    delivery_info JSONB DEFAULT NULL, -- Contains rider details: person, phone, vehicle, riderId
    live_coordinates JSONB DEFAULT NULL, -- Percent progress: e.g. {"percent": 15}
    rejection_history JSONB DEFAULT '[]'::jsonb, -- Array of rejection details: [{"riderId", "riderName", "reason", "time"}]
    reassignment_failed BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    delivered_at TIMESTAMP WITH TIME ZONE DEFAULT NULL
);

-- 6. Payouts Table
CREATE TABLE payouts (
    id TEXT PRIMARY KEY, -- Format: 'FP-XXXX' or 'RP-XXXX'
    type TEXT NOT NULL CHECK (type IN ('farmer', 'rider')),
    recipient_id BIGINT NOT NULL,
    name TEXT NOT NULL,
    farm_name TEXT, -- Only for farmers
    delivery_count INT DEFAULT 0, -- Only for riders
    total_sales NUMERIC(10, 2) DEFAULT 0.0, -- Only for farmers
    commission NUMERIC(10, 2) DEFAULT 0.0, -- Only for farmers
    net_earnings NUMERIC(10, 2) NOT NULL,
    status TEXT NOT NULL DEFAULT 'Pending' CHECK (status IN ('Pending', 'Paid')),
    week_end_date DATE NOT NULL DEFAULT CURRENT_DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 7. Support Tickets Table
CREATE TABLE support_tickets (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    role TEXT NOT NULL CHECK (role IN ('farmer', 'customer', 'delivery', 'admin')),
    user_id BIGINT,
    name TEXT NOT NULL,
    email_or_phone TEXT NOT NULL,
    subject TEXT NOT NULL,
    message TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'Open' CHECK (status IN ('Open', 'Resolved')),
    response TEXT DEFAULT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Realtime subscriptions for orders table
ALTER TABLE orders REPLICA IDENTITY FULL;
alter publication supabase_realtime add table orders;

-- Enable Realtime subscriptions for riders table
ALTER TABLE riders REPLICA IDENTITY FULL;
alter publication supabase_realtime add table riders;

-- Enable Realtime subscriptions for farmers table
ALTER TABLE farmers REPLICA IDENTITY FULL;
alter publication supabase_realtime add table farmers;

-- Enable Realtime subscriptions for payouts table
ALTER TABLE payouts REPLICA IDENTITY FULL;
alter publication supabase_realtime add table payouts;

-- Enable Realtime subscriptions for products table
ALTER TABLE products REPLICA IDENTITY FULL;
alter publication supabase_realtime add table products;

-- Enable Realtime subscriptions for customers table
ALTER TABLE customers REPLICA IDENTITY FULL;
alter publication supabase_realtime add table customers;

-- Enable Realtime subscriptions for support_tickets table
ALTER TABLE support_tickets REPLICA IDENTITY FULL;
alter publication supabase_realtime add table support_tickets;


