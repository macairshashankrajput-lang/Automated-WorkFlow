-- Migration: Admin tiffin mgmt + revenue view
-- up

-- Tiffin vendor assignment
ALTER TABLE tiffin_subscriptions 
ADD COLUMN IF NOT EXISTS vendor_id varchar(255) REFERENCES public.users(id) ON DELETE SET NULL;

-- Tiffin shift enum (Morning, Afternoon, Night)
CREATE TYPE IF NOT EXISTS tiffin_shift_enum AS ENUM ('morning', 'afternoon', 'night');

ALTER TABLE tiffin_schedule 
ADD COLUMN IF NOT EXISTS shift tiffin_shift_enum;

-- Frequency per subscription (1,2,3 times/day)
ALTER TABLE tiffin_subscriptions 
ADD COLUMN IF NOT EXISTS frequency integer DEFAULT 1 CHECK (frequency >=1 AND frequency <=3);

-- Revenue view for order history/financials
CREATE OR REPLACE VIEW order_revenue AS
SELECT 
  vendor_id, 
  date_trunc('day', created_at)::date as date,
  sum(total_price)::bigint as revenue,
  count(*) as order_count
FROM orders 
WHERE status = 'delivered'
GROUP BY vendor_id, date_trunc('day', created_at)
ORDER BY date DESC, revenue DESC;

-- Customer wise tiffin tracking view
CREATE OR REPLACE VIEW tiffin_customer_view AS
SELECT 
  ts.id as subscription_id,
  u.name as customer_name,
  u.phone,
  ts.start_date,
  ts.end_date,
  ts.frequency,
  ts.vendor_id,
  count(tsch.id) as scheduled_meals,
  count(case when tsch.status = 'delivered' then 1 end) as delivered
FROM tiffin_subscriptions ts
JOIN users u ON ts.user_id = u.id
LEFT JOIN tiffin_schedule tsch ON ts.id = tsch.subscription_id
GROUP BY ts.id, u.name, u.phone, ts.start_date, ts.end_date, ts.frequency, ts.vendor_id
ORDER BY ts.start_date DESC;

COMMENT ON VIEW order_revenue IS 'Admin revenue by vendor/date from delivered orders';
COMMENT ON VIEW tiffin_customer_view IS 'Admin tiffin tracking: Customer wise/upcoming/vendor assigned';
