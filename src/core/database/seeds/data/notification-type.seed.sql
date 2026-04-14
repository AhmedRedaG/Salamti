INSERT INTO notification_types (id, slug, title, template, priority) VALUES

(gen_random_uuid(), 'new_login_detected', 
 'New Login Detected', 
 'A new login was detected on your account from {{platform}} at {{time}} with ip {{ip_address}}.', 'high'),

(gen_random_uuid(), 'password_changed', 
 'Password Changed', 
 'Your account password was successfully changed. If this wasn''t you, contact admin.', 'urgent');