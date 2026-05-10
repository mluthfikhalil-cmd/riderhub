-- RiderHub — sample seed data
-- Run AFTER schema.sql. All strings quote-safe.
-- Parts redirect to Shopee with affiliate ID 11319481705.

-- Events ----------------------------------------------------
INSERT INTO events (title, description, event_date, location, organizer_name, max_participants, category, status, image_emoji) VALUES
  ('Sunmori Palembang - Jakabaring', 'Sunday morning ride kumpul BKB jalur Ampera', '2026-05-17 06:00:00+07', 'BKB Palembang', 'Palembang Riders', 200, 'Sunmori',    'upcoming', '🏍️'),
  ('Night Ride Jembatan Ampera',     'Night cruise menyusuri sungai musi',         '2026-05-19 20:00:00+07', 'Benteng Kuto Besak', 'Night Riders ID',  300, 'Nightride',  'upcoming', '🏙️'),
  ('Touring Palembang - Prabumulih', 'Long distance weekend touring',             '2026-05-24 05:00:00+07', 'Exit Tol Kramasan', 'Adventure Crew SS', 150, 'Touring',    'upcoming', '⛰️'),
  ('Track Day Jakabaring',           'Track day di sirkuit Jakabaring',           '2026-06-01 07:00:00+07', 'Jakabaring Circuit', 'Track Riders',     60,  'Racing Meet','upcoming', '🏁'),
  ('Kopdar CBR Community',           'Gathering CBR owners Palembang',            '2026-05-22 15:00:00+07', 'Alun-alun Palembang','CBR Community',    120, 'Sunmori',    'upcoming', '🔥')
ON CONFLICT DO NOTHING;

-- Parts (Shopee affiliate products) -------------------------
-- NOTE: image_url uses Unsplash (stable, free to use) as placeholder product photos.
--       affiliate_url is NULL so buildShopeeUrl() falls back to search-by-title
--       with af_id=11319481705 appended. Admins can override affiliate_url
--       per-row with a generated short link from affiliate.shopee.co.id.

-- Oli mesin ---------------------------------------------------
INSERT INTO parts (title, description, price, condition, category, seller_name, location, image_url, image_emoji, rating, sold, badge, active) VALUES
  ('Oli Shell Advance AX7 10W-40 1L',     'Full synthetic engine oil untuk motor 4-tak',                 85000,  'New', 'Oli',    'Shopee Official', 'Jakarta',  'https://images.unsplash.com/photo-1635770310844-fb8bb4f6bdb4?w=800&q=80', '🛢️', 4.9, 3200, 'HOT',     TRUE),
  ('Oli Motul 5100 4T 10W-40 1L',         'Ester synthetic technology untuk high performance',           145000, 'New', 'Oli',    'Motul Indonesia', 'Jakarta',  'https://images.unsplash.com/photo-1632823471565-1ec2fea78408?w=800&q=80', '🛢️', 4.8, 1800, NULL,      TRUE),
  ('Oli Yamalube Super Sport 1L',         'Oli khusus Yamaha sport bike',                                75000,  'New', 'Oli',    'Yamaha Store',    'Bandung',  'https://images.unsplash.com/photo-1615752524063-36ba80f64df5?w=800&q=80', '🛢️', 4.9, 2500, NULL,      TRUE),
  ('Oli Honda SPX 10W-30 0.8L',           'Oli original Honda matic & bebek',                            55000,  'New', 'Oli',    'Honda Official',  'Jakarta',  'https://images.unsplash.com/photo-1620286502200-2fbe078e1ccb?w=800&q=80', '🛢️', 4.9, 5400, 'HOT',     TRUE),
-- Filter ------------------------------------------------------
  ('Filter Udara Honda Vario 125/150',    'OEM air filter Honda Vario 125/150',                          65000,  'New', 'Filter', 'Honda Center',    'Jakarta',  'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800&q=80', '🔧', 4.8, 1200, NULL,      TRUE),
  ('Filter Udara Yamaha NMAX',            'OEM air filter NMAX 155',                                     70000,  'New', 'Filter', 'Yamaha Store',    'Jakarta',  'https://images.unsplash.com/photo-1568772585407-9361f9bf3a87?w=800&q=80', '🔧', 4.8, 980,  NULL,      TRUE),
  ('Filter Oli K&N High Flow',            'Filter oli performance K&N',                                  185000, 'New', 'Filter', 'K&N Racing',      'Bandung',  'https://images.unsplash.com/photo-1605559424843-9e4c228bf1c2?w=800&q=80', '🔧', 4.7, 420,  'PREMIUM', TRUE),
  ('Filter Udara Ferrox Racing',          'High flow performance air filter',                            450000, 'New', 'Filter', 'Ferrox Indonesia','Jakarta',  'https://images.unsplash.com/photo-1617531653332-bd46c24f2068?w=800&q=80', '🔧', 4.9, 310,  'PREMIUM', TRUE),
-- Kampas Rem --------------------------------------------------
  ('Kampas Rem Brembo CBR150R',           'Front brake pad Brembo untuk CBR150R',                        220000, 'New', 'Kampas', 'Brembo Official', 'Jakarta',  'https://images.unsplash.com/photo-1605559424843-9e4c228bf1c2?w=800&q=80', '🛑', 4.9, 850,  'PREMIUM', TRUE),
  ('Kampas Rem Yamaha NMAX Original',     'Original brake pad front & rear set',                         120000, 'New', 'Kampas', 'Yamaha Store',    'Jakarta',  'https://images.unsplash.com/photo-1568772585407-9361f9bf3a87?w=800&q=80', '🛑', 4.7, 1400, NULL,      TRUE),
  ('Kampas Rem Vario 125/150',            'Depan belakang set original Honda',                           95000,  'New', 'Kampas', 'Honda Center',    'Bandung',  'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800&q=80', '🛑', 4.8, 2100, 'HOT',     TRUE),
  ('Kampas Rem Galfer Racing',            'Sintered racing brake pad',                                   380000, 'New', 'Kampas', 'Galfer Racing',   'Surabaya', 'https://images.unsplash.com/photo-1617531653332-bd46c24f2068?w=800&q=80', '🛑', 4.9, 180,  'PREMIUM', TRUE),
-- Busi --------------------------------------------------------
  ('Busi NGK Iridium IRUK7D',             'Iridium spark plug NMAX / Aerox / R15',                       85000,  'New', 'Busi',   'NGK Indonesia',   'Jakarta',  'https://images.unsplash.com/photo-1632823471565-1ec2fea78408?w=800&q=80', '⚡', 4.9, 4200, 'SALE',    TRUE),
  ('Busi NGK CR8E Standard',              'Standard copper plug untuk sport bike',                       25000,  'New', 'Busi',   'NGK Indonesia',   'Jakarta',  'https://images.unsplash.com/photo-1620286502200-2fbe078e1ccb?w=800&q=80', '⚡', 4.8, 6800, NULL,      TRUE),
  ('Busi Denso Iridium IUH24D',           'Iridium plug Vario / BeAT / Scoopy',                          75000,  'New', 'Busi',   'Denso Official',  'Jakarta',  'https://images.unsplash.com/photo-1615752524063-36ba80f64df5?w=800&q=80', '⚡', 4.8, 2900, NULL,      TRUE),
  ('Busi Brisk Silver Racing',            'Racing silver electrode plug',                                55000,  'New', 'Busi',   'Brisk Racing',    'Bandung',  'https://images.unsplash.com/photo-1635770310844-fb8bb4f6bdb4?w=800&q=80', '⚡', 4.7, 1200, NULL,      TRUE),
-- Ban ---------------------------------------------------------
  ('Ban Michelin Pilot Street 140/70-17', 'Sport touring tire ring 17',                                  550000, 'New', 'Ban',    'Michelin Indonesia','Jakarta','https://images.unsplash.com/photo-1568772585407-9361f9bf3a87?w=800&q=80', '🛞', 4.9, 890,  'PREMIUM', TRUE),
  ('Ban IRC Road Winner 90/80-14',        'Untuk matic Vario / Beat / Scoopy',                           220000, 'New', 'Ban',    'IRC Tire',        'Jakarta',  'https://images.unsplash.com/photo-1617531653332-bd46c24f2068?w=800&q=80', '🛞', 4.7, 3100, 'HOT',     TRUE),
  ('Ban Pirelli Diablo Rosso IV 120/70', 'Sport radial tire front',                                     1250000,'New', 'Ban',    'Pirelli Moto',    'Jakarta',  'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800&q=80', '🛞', 4.9, 240,  'PREMIUM', TRUE),
  ('Ban FDR Genzi 80/90-14',              'Tubeless untuk matic harian',                                 180000, 'New', 'Ban',    'FDR Tire',        'Bandung',  'https://images.unsplash.com/photo-1605559424843-9e4c228bf1c2?w=800&q=80', '🛞', 4.6, 4500, NULL,      TRUE),
-- Aksesoris ---------------------------------------------------
  ('Helm KYT TT-Course Full Face',        'Full face helmet SNI standard, visor 2D',                     1850000,'New', 'Aksesoris','HelmZone Official','Jakarta','https://images.unsplash.com/photo-1609630875171-b1321377ee65?w=800&q=80', '🪖', 4.9, 520,  'PREMIUM', TRUE),
  ('Helm INK Centro Jet Half Face',       'Half face SNI, visor anti gores',                             380000, 'New', 'Aksesoris','INK Helm',        'Jakarta',  'https://images.unsplash.com/photo-1599256630498-4b79f55cf4d6?w=800&q=80', '🪖', 4.8, 2200, 'HOT',     TRUE),
  ('Akrapovic Slip-on R25/MT-25',         'Titanium exhaust Akrapovic 90% like new',                     4500000,'90%', 'Aksesoris','BangJuli Motor',  'Bandung',  'https://images.unsplash.com/photo-1558980664-10e7170b5df9?w=800&q=80', '🔩', 4.9, 45,   'PREMIUM', TRUE),
  ('LED Headlamp Kit 80W H4 HS1',         'Plug and play LED H4 / HS1 untuk motor',                      185000, 'New', 'Aksesoris','LightZone',       'Palembang','https://images.unsplash.com/photo-1589739900266-43b2843f4e14?w=800&q=80', '💡', 4.7, 3800, 'HOT',     TRUE),
  ('Sarung Jok Anti Panas Universal',     'Cover jok waterproof + anti panas',                           65000,  'New', 'Aksesoris','JokMotor Store',  'Jakarta',  'https://images.unsplash.com/photo-1568772585407-9361f9bf3a87?w=800&q=80', '🪑', 4.6, 5200, NULL,      TRUE),
  ('Spion Rizoma Carbon Universal',       'Carbon fiber spion adjustable',                               750000, 'New', 'Aksesoris','Rizoma Official', 'Jakarta',  'https://images.unsplash.com/photo-1568772585407-9361f9bf3a87?w=800&q=80', '🪞', 4.8, 320,  'PREMIUM', TRUE),
  ('Stabilizer Motor Ring 17',            'Anti geal universal sport / matic',                           95000,  'New', 'Aksesoris','BikeParts ID',    'Bandung',  'https://images.unsplash.com/photo-1605559424843-9e4c228bf1c2?w=800&q=80', '🔧', 4.7, 1800, NULL,      TRUE),
  ('Shock Belakang YSS G-Plus CBR',       'Racing mono shock untuk CBR150R',                             1450000,'New', 'Aksesoris','YSS Indonesia',   'Jakarta',  'https://images.unsplash.com/photo-1580273916550-e323be2ae537?w=800&q=80', '🔩', 4.9, 180,  'PREMIUM', TRUE),
  ('Rem Cakram Disc Front Vario 150',     'Rotor cakram original honda',                                 220000, 'New', 'Aksesoris','Honda Official',  'Bandung',  'https://images.unsplash.com/photo-1617531653332-bd46c24f2068?w=800&q=80', '🛞', 4.8, 650,  NULL,      TRUE),
  ('Jas Hujan 2 Piece Axio Premium',      'Setelan jas hujan PVC tebal warna variasi',                   120000, 'New', 'Aksesoris','Axio Gear',       'Jakarta',  'https://images.unsplash.com/photo-1589956618515-0f1a35aee83c?w=800&q=80', '🧥', 4.7, 2800, 'HOT',     TRUE)
ON CONFLICT (title) DO NOTHING;
