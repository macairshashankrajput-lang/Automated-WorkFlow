-- Enhance catering_requests with event/customer details
ALTER TABLE catering_requests ADD COLUMN IF NOT EXISTS event_name TEXT;
ALTER TABLE catering_requests ADD COLUMN IF NOT EXISTS event_date DATE;
ALTER TABLE catering_requests ADD COLUMN IF NOT EXISTS budget DECIMAL(10,2);
ALTER TABLE catering_requests ADD COLUMN IF NOT EXISTS guest_count INT;
ALTER TABLE catering_requests ADD COLUMN IF NOT EXISTS customer_id TEXT REFERENCES customers(id);
ALTER TABLE catering_requests ADD COLUMN IF NOT EXISTS special_requirements TEXT;

-- Enhance tiffin tables for flexible plans
ALTER TABLE tiffin_plans ADD COLUMN IF NOT EXISTS duration_days INT DEFAULT 30; -- monthly/weekly
ALTER TABLE tiffin_plans ADD COLUMN IF NOT EXISTS meals_per_day INT DEFAULT 1; -- 1/3 times
ALTER TABLE tiffin_daily_orders ADD COLUMN IF NOT EXISTS plan_id UUID REFERENCES tiffin_plans(id);
ALTER TABLE tiffin_subscriptions ADD COLUMN IF NOT EXISTS points_used INT;
ALTER TABLE tiffin_subscriptions ADD COLUMN IF NOT EXISTS customer_id TEXT REFERENCES customers(id);
ALTER TABLE tiffin_subscriptions ADD COLUMN IF NOT EXISTS plan_id UUID REFERENCES tiffin_plans(id);

-- Indexes for queries
CREATE INDEX IF NOT EXISTS idx_catering_customer ON catering_requests(customer_id);
CREATE INDEX IF NOT EXISTS idx_tiffin_customer ON tiffin_subscriptions(customer_id);
CREATE INDEX IF NOT EXISTS idx_tiffin_plan ON tiffin_daily_orders(plan_id);

-- View for tiffin export (relational)
CREATE OR REPLACE VIEW tiffin_export AS
SELECT 
  ts.*, c.name as customer_name, c.phone,
  tp.duration_days, tp.meals_per_day
FROM tiffin_subscriptions ts
JOIN customers c ON ts.customer_id = c.id
JOIN tiffin_plans tp ON tp.id = ts.plan_id;
