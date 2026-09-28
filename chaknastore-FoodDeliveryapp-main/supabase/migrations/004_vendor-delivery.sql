-- Migration: Add delivery_time enum to orders for vendor acceptance
-- up.sql

-- Create enum for delivery time slots
CREATE TYPE delivery_time_enum AS ENUM ('10m', '20m', '30m', '45m');

-- Alter orders table to add delivery_time column (nullable initially)
ALTER TABLE public.orders 
ADD COLUMN delivery_time delivery_time_enum;

-- Set default for new orders (optional)
ALTER TABLE public.orders 
ALTER COLUMN delivery_time DROP DEFAULT;

-- down.sql (for rollback)
-- DROP TYPE IF EXISTS delivery_time_enum CASCADE;
-- ALTER TABLE public.orders DROP COLUMN IF EXISTS delivery_time;

-- Verify: SELECT * FROM orders LIMIT 5;
COMMENT ON COLUMN public.orders.delivery_time IS 'Vendor-selected delivery time slot: 10m,20m,30m,45m - set on accept';
