-- =====================================================
-- Roles Seed Data with Management Relations
-- =====================================================
-- Roles:
-- 1. Admin 
-- 2. Driver
-- 3. Paramedic
-- =====================================================

-- Insert roles first
INSERT INTO roles (id, name, description, is_active, can_access_web, created_at) VALUES
  (gen_random_uuid(), 'admin', 'Administrator who manages area managers', true, true, now()),
  (gen_random_uuid(), 'driver', 'Driver who transports patients', true, false, now()),
  (gen_random_uuid(), 'paramedic', 'Paramedic who provides medical care', true, false, now());
