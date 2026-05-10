-- RiderHub — sample seed data
-- Run AFTER schema.sql. All strings quote-safe.

-- Events ----------------------------------------------------
INSERT INTO events (title, description, event_date, location, organizer_name, max_participants, category, status, image_emoji) VALUES
  ('Sunmori Palembang - Jakabaring', 'Sunday morning ride kumpul BKB jalur Ampera', '2026-05-17 06:00:00+07', 'BKB Palembang', 'Palembang Riders', 200, 'Sunmori',    'upcoming', '🏍️'),
  ('Night Ride Jembatan Ampera',     'Night cruise menyusuri sungai musi',         '2026-05-19 20:00:00+07', 'Benteng Kuto Besak', 'Night Riders ID',  300, 'Nightride',  'upcoming', '🏙️'),
  ('Touring Palembang - Prabumulih', 'Long distance weekend touring',             '2026-05-24 05:00:00+07', 'Exit Tol Kramasan', 'Adventure Crew SS', 150, 'Touring',    'upcoming', '⛰️'),
  ('Track Day Jakabaring',           'Track day di sirkuit Jakabaring',           '2026-06-01 07:00:00+07', 'Jakabaring Circuit', 'Track Riders',     60,  'Racing Meet','upcoming', '🏁'),
  ('Kopdar CBR Community',           'Gathering CBR owners Palembang',            '2026-05-22 15:00:00+07', 'Alun-alun Palembang','CBR Community',    120, 'Sunmori',    'upcoming', '🔥')
ON CONFLICT DO NOTHING;

-- Parts -----------------------------------------------------
INSERT INTO parts (title, description, price, condition, category, seller_name, location, image_emoji, rating, sold, badge, active) VALUES
  ('Oli Shell Advance AX7 1L',         'Full synthetic engine oil 10W-40',           85000,  'New',  'Oli',       'MotoPart Palembang', 'Palembang', '🛢️', 4.9, 1500, 'HOT',    TRUE),
  ('Filter Udara Honda CBR150R',       'Original OEM air filter',                    65000,  'New',  'Filter',    'Honda Center',       'Palembang', '🔧', 4.8, 800,  NULL,     TRUE),
  ('Kampas Rem Yamaha NMAX',           'Original brake pads front + rear',           120000, 'New',  'Kampas',    'Yamaha Store',       'Palembang', '🛑', 4.7, 620,  NULL,     TRUE),
  ('Busi NGK Iridium IRUK7D',          'Iridium spark plug for sport bikes',         45000,  'New',  'Busi',      'SparkPlug Shop',     'Jakarta',   '⚡', 4.9, 2400, 'SALE',   TRUE),
  ('Ban Michelin Pilot Street 140/70-17','Sport touring tire for big bike',          450000, 'New',  'Ban',       'Tire Pro',           'Jakarta',   '🛞', 4.8, 310,  NULL,     TRUE),
  ('Akrapovic Slip-on R25',            'Premium exhaust system R25 / MT-25',         4500000,'90%',  'Aksesoris', 'BangJuli Motor',     'Bandung',   '🔩', 4.9, 85,   'PREMIUM',TRUE),
  ('Helm KYT TT-Course',               'Full face helmet SNI standard',              2800000,'New',  'Aksesoris', 'HelmZone',           'Jakarta',   '🪖', 4.8, 450,  NULL,     TRUE),
  ('LED Headlamp Kit',                 'Plug and play LED conversion',               450000, 'New',  'Aksesoris', 'LightZone',          'Palembang', '💡', 4.6, 1100, NULL,     TRUE)
ON CONFLICT DO NOTHING;
