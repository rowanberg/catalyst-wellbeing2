-- Insert sample schools for testing
INSERT INTO schools (id, name, school_code, address, phone, email, created_at) VALUES
('550e8400-e29b-41d4-a716-446655440000', 'Greenwood Elementary', '123456789012', '123 Main St, Springfield', '+1-555-0123', 'admin@greenwood.edu', NOW()),
('550e8400-e29b-41d4-a716-446655440001', 'Riverside High School', '234567890123', '456 Oak Ave, Riverside', '+1-555-0124', 'admin@riverside.edu', NOW()),
('550e8400-e29b-41d4-a716-446655440002', 'Sunset Middle School', '345678901234', '789 Pine Rd, Sunset', '+1-555-0125', 'admin@sunset.edu', NOW())
ON CONFLICT (school_code) DO NOTHING;
