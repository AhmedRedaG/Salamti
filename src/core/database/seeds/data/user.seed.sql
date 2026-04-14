-- =====================================================
-- Default Password: Ahmed@123
-- Hash: $2a$10$4Q/D6g7mgKYJSIAaln7E2.k6gQks0kYX8z7Q1hl/67w9K6k3b2QHK
-- =====================================================

WITH admin_user AS (
  INSERT INTO users (
    id,
    full_name,
    email,
    phone,
    password_hash,
    role_id,
    is_active,
    created_at,
    updated_at
  )
  VALUES (
    gen_random_uuid(),
    'Ahmed Reda',
    'ahmedfarok2@gmail.com',
    '+201014821864',
    '$2a$10$4Q/D6g7mgKYJSIAaln7E2.k6gQks0kYX8z7Q1hl/67w9K6k3b2QHK',
    (SELECT id FROM roles WHERE name = 'admin'),
    true,
    now(),
    now()
  )
  RETURNING id
) 

INSERT INTO auth_attempts (id, user_id, updated_at)
SELECT
  gen_random_uuid(),
  id,
  now()
FROM admin_user;

INSERT INTO admin (id, institution, created_at)
SELECT
  id,
  'Central System Manager',
  now()
FROM admin_user;