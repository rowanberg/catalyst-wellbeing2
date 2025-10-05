-- Super Admin Dashboard Schema
-- Extends existing Catalyst database with super admin functionality

-- Add super admin columns to existing schools table
ALTER TABLE schools 
ADD COLUMN IF NOT EXISTS plan_type VARCHAR(20) DEFAULT 'free' CHECK (plan_type IN ('free', 'basic', 'premium')),
ADD COLUMN IF NOT EXISTS user_limit INTEGER DEFAULT 100,
ADD COLUMN IF NOT EXISTS current_users INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS payment_status VARCHAR(20) DEFAULT 'active' CHECK (payment_status IN ('active', 'overdue', 'suspended', 'cancelled')),
ADD COLUMN IF NOT EXISTS payment_due_date TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS last_payment_date TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS monthly_fee DECIMAL(10,2) DEFAULT 0.00,
ADD COLUMN IF NOT EXISTS city VARCHAR(100),
ADD COLUMN IF NOT EXISTS country VARCHAR(100) DEFAULT 'India',
ADD COLUMN IF NOT EXISTS logo_url TEXT,
ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS last_activity TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- Super Admin Activity Logs
CREATE TABLE IF NOT EXISTS super_admin_logs (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    admin_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    action VARCHAR(100) NOT NULL,
    target_school_id UUID REFERENCES schools(id) ON DELETE SET NULL,
    ip_address INET,
    user_agent TEXT,
    details JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- School Usage Analytics
CREATE TABLE IF NOT EXISTS school_analytics (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    school_id UUID REFERENCES schools(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    daily_active_users INTEGER DEFAULT 0,
    total_logins INTEGER DEFAULT 0,
    new_registrations INTEGER DEFAULT 0,
    student_activity_rate DECIMAL(5,2) DEFAULT 0.00,
    teacher_activity_rate DECIMAL(5,2) DEFAULT 0.00,
    parent_activity_rate DECIMAL(5,2) DEFAULT 0.00,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(school_id, date)
);

-- Payment Transactions
CREATE TABLE IF NOT EXISTS payment_transactions (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    school_id UUID REFERENCES schools(id) ON DELETE CASCADE,
    transaction_id VARCHAR(100) UNIQUE NOT NULL,
    amount DECIMAL(10,2) NOT NULL,
    currency VARCHAR(3) DEFAULT 'INR',
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'failed', 'refunded')),
    payment_method VARCHAR(50),
    razorpay_payment_id VARCHAR(100),
    razorpay_order_id VARCHAR(100),
    billing_period_start DATE,
    billing_period_end DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Super Admin Notifications
CREATE TABLE IF NOT EXISTS super_admin_notifications (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    school_id UUID REFERENCES schools(id) ON DELETE CASCADE,
    type VARCHAR(50) NOT NULL CHECK (type IN ('user_limit_warning', 'user_limit_exceeded', 'payment_due', 'payment_overdue', 'low_activity')),
    title VARCHAR(200) NOT NULL,
    message TEXT NOT NULL,
    severity VARCHAR(20) DEFAULT 'info' CHECK (severity IN ('info', 'warning', 'error', 'critical')),
    is_read BOOLEAN DEFAULT false,
    auto_resolved BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    resolved_at TIMESTAMP WITH TIME ZONE
);

-- Plan Configurations
CREATE TABLE IF NOT EXISTS subscription_plans (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    name VARCHAR(50) UNIQUE NOT NULL,
    display_name VARCHAR(100) NOT NULL,
    user_limit INTEGER NOT NULL,
    monthly_price DECIMAL(10,2) NOT NULL,
    features JSONB NOT NULL,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert default subscription plans
INSERT INTO subscription_plans (name, display_name, user_limit, monthly_price, features) VALUES
('free', 'Free Plan', 50, 0.00, '{"features": ["Basic Dashboard", "Up to 50 users", "Email Support"]}'),
('basic', 'Basic Plan', 200, 999.00, '{"features": ["Advanced Dashboard", "Up to 200 users", "Priority Support", "Analytics"]}'),
('premium', 'Premium Plan', 1000, 2999.00, '{"features": ["Full Dashboard", "Up to 1000 users", "24/7 Support", "Advanced Analytics", "Custom Branding"]}')
ON CONFLICT (name) DO NOTHING;

-- Add super_admin role to profiles table check constraint
ALTER TABLE profiles DROP CONSTRAINT IF EXISTS profiles_role_check;
ALTER TABLE profiles ADD CONSTRAINT profiles_role_check 
CHECK (role IN ('student', 'parent', 'teacher', 'admin', 'super_admin'));

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_schools_plan_type ON schools(plan_type);
CREATE INDEX IF NOT EXISTS idx_schools_payment_status ON schools(payment_status);
CREATE INDEX IF NOT EXISTS idx_schools_last_activity ON schools(last_activity);
CREATE INDEX IF NOT EXISTS idx_super_admin_logs_admin_id ON super_admin_logs(admin_id);
CREATE INDEX IF NOT EXISTS idx_super_admin_logs_created_at ON super_admin_logs(created_at);
CREATE INDEX IF NOT EXISTS idx_school_analytics_school_id_date ON school_analytics(school_id, date);
CREATE INDEX IF NOT EXISTS idx_payment_transactions_school_id ON payment_transactions(school_id);
CREATE INDEX IF NOT EXISTS idx_super_admin_notifications_school_id ON super_admin_notifications(school_id);
CREATE INDEX IF NOT EXISTS idx_super_admin_notifications_is_read ON super_admin_notifications(is_read);

-- RLS Policies for Super Admin
ALTER TABLE super_admin_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE school_analytics ENABLE ROW LEVEL SECURITY;
ALTER TABLE payment_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE super_admin_notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscription_plans ENABLE ROW LEVEL SECURITY;

-- Super admin can access everything
CREATE POLICY "Super admin full access" ON super_admin_logs
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE profiles.user_id = auth.uid() 
            AND profiles.role = 'super_admin'
        )
    );

CREATE POLICY "Super admin analytics access" ON school_analytics
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE profiles.user_id = auth.uid() 
            AND profiles.role = 'super_admin'
        )
    );

CREATE POLICY "Super admin payments access" ON payment_transactions
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE profiles.user_id = auth.uid() 
            AND profiles.role = 'super_admin'
        )
    );

CREATE POLICY "Super admin notifications access" ON super_admin_notifications
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE profiles.user_id = auth.uid() 
            AND profiles.role = 'super_admin'
        )
    );

CREATE POLICY "Super admin plans access" ON subscription_plans
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE profiles.user_id = auth.uid() 
            AND profiles.role = 'super_admin'
        )
    );

-- Functions for analytics
CREATE OR REPLACE FUNCTION update_school_user_count()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        UPDATE schools 
        SET current_users = (
            SELECT COUNT(*) FROM profiles 
            WHERE school_id = NEW.school_id
        )
        WHERE id = NEW.school_id;
        RETURN NEW;
    ELSIF TG_OP = 'DELETE' THEN
        UPDATE schools 
        SET current_users = (
            SELECT COUNT(*) FROM profiles 
            WHERE school_id = OLD.school_id
        )
        WHERE id = OLD.school_id;
        RETURN OLD;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Trigger to update user counts
DROP TRIGGER IF EXISTS update_school_user_count_trigger ON profiles;
CREATE TRIGGER update_school_user_count_trigger
    AFTER INSERT OR DELETE ON profiles
    FOR EACH ROW
    EXECUTE FUNCTION update_school_user_count();

-- Function to create notifications
CREATE OR REPLACE FUNCTION check_school_limits()
RETURNS void AS $$
DECLARE
    school_record RECORD;
    warning_threshold DECIMAL := 0.8; -- 80% of limit
BEGIN
    FOR school_record IN 
        SELECT s.*, sp.user_limit as plan_user_limit
        FROM schools s
        JOIN subscription_plans sp ON s.plan_type = sp.name
        WHERE s.is_active = true
    LOOP
        -- Check user limit warnings
        IF school_record.current_users >= school_record.plan_user_limit THEN
            INSERT INTO super_admin_notifications (school_id, type, title, message, severity)
            VALUES (
                school_record.id,
                'user_limit_exceeded',
                'User Limit Exceeded',
                format('School %s has exceeded their user limit (%s/%s users)', 
                       school_record.name, school_record.current_users, school_record.plan_user_limit),
                'critical'
            )
            ON CONFLICT DO NOTHING;
        ELSIF school_record.current_users >= (school_record.plan_user_limit * warning_threshold) THEN
            INSERT INTO super_admin_notifications (school_id, type, title, message, severity)
            VALUES (
                school_record.id,
                'user_limit_warning',
                'User Limit Warning',
                format('School %s is approaching their user limit (%s/%s users)', 
                       school_record.name, school_record.current_users, school_record.plan_user_limit),
                'warning'
            )
            ON CONFLICT DO NOTHING;
        END IF;

        -- Check payment due dates
        IF school_record.payment_due_date < NOW() AND school_record.payment_status = 'active' THEN
            UPDATE schools SET payment_status = 'overdue' WHERE id = school_record.id;
            
            INSERT INTO super_admin_notifications (school_id, type, title, message, severity)
            VALUES (
                school_record.id,
                'payment_overdue',
                'Payment Overdue',
                format('School %s payment is overdue (Due: %s)', 
                       school_record.name, school_record.payment_due_date::date),
                'error'
            )
            ON CONFLICT DO NOTHING;
        END IF;
    END LOOP;
END;
$$ LANGUAGE plpgsql;

-- Create super admin user (run this manually with your details)
-- INSERT INTO auth.users (id, email, encrypted_password, email_confirmed_at, created_at, updated_at)
-- VALUES (uuid_generate_v4(), 'superadmin@catalyst.com', crypt('your_secure_password', gen_salt('bf')), NOW(), NOW(), NOW());

COMMENT ON TABLE super_admin_logs IS 'Tracks all super admin activities for security auditing';
COMMENT ON TABLE school_analytics IS 'Daily analytics data for each school';
COMMENT ON TABLE payment_transactions IS 'Payment history and transaction records';
COMMENT ON TABLE super_admin_notifications IS 'Automated alerts and notifications for super admin';
COMMENT ON TABLE subscription_plans IS 'Available subscription plans and their features';
