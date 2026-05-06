INSERT INTO notification_types (id, slug, title, template, priority) VALUES

(gen_random_uuid(), 'new_login_detected', 
 'New Login Detected', 
 'A new login was detected on your account from {{platform}} at {{time}} with ip {{ip_address}}.', 'high'),

(gen_random_uuid(), 'password_changed', 
 'Password Changed', 
 'Your account password was successfully changed. If this wasn''t you, contact admin.', 'urgent'),

(gen_random_uuid(), 'accident_detected', 'Accident Detected', 'An accident has been recorded by your OBU unit {{obuInst}}.', 'high'),
(gen_random_uuid(), 'accident_confirmed', 'Accident Confirmed', 'Your accident has been confirmed and we are finding a paramedic.', 'urgent'),
(gen_random_uuid(), 'paramedic_dispatched', 'Paramedic Dispatched', 'A paramedic has accepted the accident response and is on the way.', 'urgent'),
(gen_random_uuid(), 'paramedic_arrived', 'Paramedic Arrived', 'The paramedic has arrived at the accident location.', 'high'),
(gen_random_uuid(), 'accident_completed', 'Accident Completed', 'Your accident response has been completed.', 'normal'),
(gen_random_uuid(), 'accident_canceled', 'Accident Canceled', 'The accident has been canceled.', 'normal'),

(gen_random_uuid(), 'obu_claimed', 'OBU Claimed', 'You have successfully claimed OBU {{obuInst}}.', 'normal'),
(gen_random_uuid(), 'obu_connected', 'OBU Connected', 'OBU {{obuInst}} is now connected to vehicle {{vehicleLicense}}.', 'normal'),
(gen_random_uuid(), 'obu_disconnected', 'OBU Disconnected', 'OBU {{obuInst}} was disconnected from your vehicle.', 'normal'),
(gen_random_uuid(), 'obu_activated', 'OBU Activated', 'OBU {{obuInst}} is now active.', 'normal'),
(gen_random_uuid(), 'obu_deactivated', 'OBU Deactivated', 'OBU {{obuInst}} has been deactivated.', 'normal'),
(gen_random_uuid(), 'obu_updated', 'OBU Updated', 'Your OBU {{obuInst}} details have been updated.', 'low'),

(gen_random_uuid(), 'vehicle_created', 'Vehicle Added', 'Vehicle {{vehicleLicense}} has been added to your profile.', 'normal'),
(gen_random_uuid(), 'vehicle_updated', 'Vehicle Updated', 'Vehicle {{vehicleLicense}} details have been updated.', 'low'),
(gen_random_uuid(), 'vehicle_deleted', 'Vehicle Removed', 'Vehicle {{vehicleLicense}} was removed from your profile.', 'normal');