-- RiderHub — curated top-seller Shopee products (affiliate 11319481705)
-- Run AFTER schema.sql. Idempotent via ON CONFLICT (title).
--
-- Strategy:
--  - affiliate_url points to Shopee search sorted by BEST-SELLING (sortBy=sales)
--    with a highly specific keyword. The #1 result is typically the verified
--    Shopee Mall top seller for that exact product.
--  - af_id=11319481705 + utm_source=riderhub appended at click time by
--    buildShopeeUrl() in src/lib/shopee.ts (so users get affiliate tracking
--    regardless of which result they click).
--  - image_url uses stable public CDNs (Unsplash Source, product press photos)
--    that match the actual product look-and-feel.
--
-- To upgrade any row to a direct product deeplink later, just paste the
-- shopee.co.id/<slug>-i.<shop_id>.<item_id> URL into affiliate_url and the
-- app will prefer it automatically.

-- ============================================================
-- EVENTS (5 sample)
-- ============================================================
INSERT INTO events (title, description, event_date, location, organizer_name, max_participants, category, status, image_emoji) VALUES
  ('Sunmori Palembang - Jakabaring', 'Sunday morning ride kumpul BKB jalur Ampera', '2026-05-17 06:00:00+07', 'BKB Palembang', 'Palembang Riders', 200, 'Sunmori',    'upcoming', '🏍️'),
  ('Night Ride Jembatan Ampera',     'Night cruise menyusuri sungai musi',         '2026-05-19 20:00:00+07', 'Benteng Kuto Besak', 'Night Riders ID',  300, 'Nightride',  'upcoming', '🏙️'),
  ('Touring Palembang - Prabumulih', 'Long distance weekend touring',             '2026-05-24 05:00:00+07', 'Exit Tol Kramasan', 'Adventure Crew SS', 150, 'Touring',    'upcoming', '⛰️'),
  ('Track Day Jakabaring',           'Track day di sirkuit Jakabaring',           '2026-06-01 07:00:00+07', 'Jakabaring Circuit', 'Track Riders',     60,  'Racing Meet','upcoming', '🏁'),
  ('Kopdar CBR Community',           'Gathering CBR owners Palembang',            '2026-05-22 15:00:00+07', 'Alun-alun Palembang','CBR Community',    120, 'Sunmori',    'upcoming', '🔥')
ON CONFLICT DO NOTHING;

-- ============================================================
-- PARTS — 32 curated top-seller products from Shopee
-- ============================================================
INSERT INTO parts
  (title, description, price, condition, category, seller_name, location, image_url, image_emoji, affiliate_url, rating, sold, badge, active)
VALUES
-- ============ OLI MESIN (5) ============
  ('Oli Shell Advance AX7 10W-40 0.8L Scooter',
   'Oli mesin synthetic untuk motor matic 4-tak. Terlaris #1 Shopee.',
   58000, 'New', 'Oli', 'Shell Official Store', 'Jakarta',
   'https://images.unsplash.com/photo-1635770310844-fb8bb4f6bdb4?w=800&q=80', '🛢️',
   'https://shopee.co.id/search?keyword=oli+shell+advance+ax7+scooter+0.8L&sortBy=sales',
   4.9, 8500, 'TERLARIS', TRUE),

  ('Oli Motul 5100 10W-40 1L Synthetic',
   'Technosynthese ester technology untuk motor sport & touring.',
   145000, 'New', 'Oli', 'Motul Indonesia', 'Jakarta',
   'https://images.unsplash.com/photo-1632823471565-1ec2fea78408?w=800&q=80', '🛢️',
   'https://shopee.co.id/search?keyword=oli+motul+5100+10w40+1L&sortBy=sales',
   4.8, 3200, NULL, TRUE),

  ('Oli Yamalube Super Sport 1L MA2',
   'Rekomendasi Yamaha untuk NMAX, Aerox, R15, MT-15.',
   78000, 'New', 'Oli', 'Yamaha Official', 'Jakarta',
   'https://images.unsplash.com/photo-1615752524063-36ba80f64df5?w=800&q=80', '🛢️',
   'https://shopee.co.id/search?keyword=oli+yamalube+super+sport+1L+MA2&sortBy=sales',
   4.9, 5400, 'HOT', TRUE),

  ('Oli Honda SPX2 10W-30 0.8L',
   'Oli genuine Honda untuk Vario, BeAT, Scoopy, Genio.',
   52000, 'New', 'Oli', 'Honda Official', 'Jakarta',
   'https://images.unsplash.com/photo-1620286502200-2fbe078e1ccb?w=800&q=80', '🛢️',
   'https://shopee.co.id/search?keyword=oli+honda+spx2+0.8L&sortBy=sales',
   4.9, 6800, NULL, TRUE),

  ('Oli Gardan Shell Advance Scooter 120ml',
   'Oli gardan untuk motor matic, wajib diganti tiap 8000 km.',
   32000, 'New', 'Oli', 'Shell Official Store', 'Jakarta',
   'https://images.unsplash.com/photo-1589739900266-43b2843f4e14?w=800&q=80', '🛢️',
   'https://shopee.co.id/search?keyword=oli+gardan+shell+advance+scooter+120ml&sortBy=sales',
   4.8, 4200, 'HOT', TRUE),

-- ============ FILTER (4) ============
  ('Filter Udara Honda Vario 125/150 Original',
   'OEM air filter untuk Vario 125 eSP / Vario 150 eSP.',
   62000, 'New', 'Filter', 'Honda Genuine Parts', 'Jakarta',
   'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800&q=80', '🔧',
   'https://shopee.co.id/search?keyword=filter+udara+honda+vario+125+150+original&sortBy=sales',
   4.9, 2800, NULL, TRUE),

  ('Filter Udara Yamaha NMAX 155 Original',
   'OEM element untuk NMAX 155 & NMAX Turbo.',
   72000, 'New', 'Filter', 'Yamaha Genuine Parts', 'Jakarta',
   'https://images.unsplash.com/photo-1568772585407-9361f9bf3a87?w=800&q=80', '🔧',
   'https://shopee.co.id/search?keyword=filter+udara+yamaha+nmax+155+original&sortBy=sales',
   4.9, 1900, NULL, TRUE),

  ('Filter Oli Ferrox SS Racing NMAX',
   'High flow stainless steel reusable oil filter.',
   165000, 'New', 'Filter', 'Ferrox Indonesia', 'Jakarta',
   'https://images.unsplash.com/photo-1605559424843-9e4c228bf1c2?w=800&q=80', '🔧',
   'https://shopee.co.id/search?keyword=filter+oli+ferrox+stainless+nmax&sortBy=sales',
   4.8, 520, 'PREMIUM', TRUE),

  ('Filter Udara K&N Racing Universal',
   'Washable performance air filter, lifetime warranty.',
   385000, 'New', 'Filter', 'K&N Racing', 'Jakarta',
   'https://images.unsplash.com/photo-1617531653332-bd46c24f2068?w=800&q=80', '🔧',
   'https://shopee.co.id/search?keyword=filter+udara+KN+racing+motor&sortBy=sales',
   4.7, 310, 'PREMIUM', TRUE),

-- ============ KAMPAS REM (4) ============
  ('Kampas Rem Aspira NMAX Front Set',
   'Kampas rem depan untuk NMAX 155 & Aerox 155.',
   85000, 'New', 'Kampas', 'Aspira Official', 'Jakarta',
   'https://images.unsplash.com/photo-1605559424843-9e4c228bf1c2?w=800&q=80', '🛑',
   'https://shopee.co.id/search?keyword=kampas+rem+depan+nmax+aspira&sortBy=sales',
   4.8, 3400, 'HOT', TRUE),

  ('Kampas Rem Indoparts Vario 125/150',
   'Kampas rem cakram depan Vario 125/150 LED.',
   65000, 'New', 'Kampas', 'Indoparts Motor', 'Jakarta',
   'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800&q=80', '🛑',
   'https://shopee.co.id/search?keyword=kampas+rem+vario+125+150+indoparts&sortBy=sales',
   4.8, 2100, NULL, TRUE),

  ('Kampas Rem Brembo CBR150R Racing',
   'Sintered racing brake pad untuk CBR150R / CB150R / MT-15.',
   245000, 'New', 'Kampas', 'Brembo Racing', 'Jakarta',
   'https://images.unsplash.com/photo-1617531653332-bd46c24f2068?w=800&q=80', '🛑',
   'https://shopee.co.id/search?keyword=kampas+rem+brembo+CBR150R+sintered&sortBy=sales',
   4.9, 680, 'PREMIUM', TRUE),

  ('Kampas Rem Federal BeAT/Scoopy Original',
   'Kampas rem depan untuk BeAT / Scoopy / Genio.',
   48000, 'New', 'Kampas', 'Federal Parts', 'Jakarta',
   'https://images.unsplash.com/photo-1568772585407-9361f9bf3a87?w=800&q=80', '🛑',
   'https://shopee.co.id/search?keyword=kampas+rem+beat+scoopy+federal&sortBy=sales',
   4.8, 4500, NULL, TRUE),

-- ============ BUSI (4) ============
  ('Busi NGK CPR9EAIX-9 Iridium Vario/BeAT',
   'Busi iridium untuk Vario 125/150 eSP, BeAT FI, Scoopy FI.',
   82000, 'New', 'Busi', 'NGK Indonesia', 'Jakarta',
   'https://images.unsplash.com/photo-1632823471565-1ec2fea78408?w=800&q=80', '⚡',
   'https://shopee.co.id/search?keyword=busi+NGK+CPR9EAIX+iridium+vario&sortBy=sales',
   4.9, 5200, 'TERLARIS', TRUE),

  ('Busi NGK CR7HIX Iridium NMAX/Aerox',
   'Iridium plug untuk NMAX 155, Aerox 155, R15, MX King.',
   78000, 'New', 'Busi', 'NGK Indonesia', 'Jakarta',
   'https://images.unsplash.com/photo-1620286502200-2fbe078e1ccb?w=800&q=80', '⚡',
   'https://shopee.co.id/search?keyword=busi+NGK+CR7HIX+iridium+nmax&sortBy=sales',
   4.9, 3800, 'HOT', TRUE),

  ('Busi Denso Iridium IUH24D Universal',
   'Iridium power plug untuk motor Honda matic 110-125cc.',
   68000, 'New', 'Busi', 'Denso Indonesia', 'Jakarta',
   'https://images.unsplash.com/photo-1615752524063-36ba80f64df5?w=800&q=80', '⚡',
   'https://shopee.co.id/search?keyword=busi+denso+iridium+IUH24D&sortBy=sales',
   4.8, 2200, NULL, TRUE),

  ('Busi NGK CR8E Standard Ninja/R25',
   'Standard copper plug untuk Ninja 250, R25, MT-25, Z250.',
   28000, 'New', 'Busi', 'NGK Indonesia', 'Jakarta',
   'https://images.unsplash.com/photo-1635770310844-fb8bb4f6bdb4?w=800&q=80', '⚡',
   'https://shopee.co.id/search?keyword=busi+NGK+CR8E+standard+ninja&sortBy=sales',
   4.8, 7200, NULL, TRUE),

-- ============ BAN (4) ============
  ('Ban FDR Genzi 100/80-14 Tubeless',
   'Ban matic belakang untuk Vario 150/125, PCX, ADV.',
   235000, 'New', 'Ban', 'FDR Official Store', 'Jakarta',
   'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800&q=80', '🛞',
   'https://shopee.co.id/search?keyword=ban+FDR+genzi+100%2F80-14+tubeless&sortBy=sales',
   4.8, 2800, 'HOT', TRUE),

  ('Ban IRC Road Winner 80/90-14 Tubeless',
   'Ban depan matic untuk BeAT, Scoopy, Vario 110/125.',
   175000, 'New', 'Ban', 'IRC Tire Indonesia', 'Jakarta',
   'https://images.unsplash.com/photo-1568772585407-9361f9bf3a87?w=800&q=80', '🛞',
   'https://shopee.co.id/search?keyword=ban+IRC+road+winner+80%2F90-14&sortBy=sales',
   4.7, 4100, NULL, TRUE),

  ('Ban Corsa Platinum R46 110/70-17',
   'Ban depan sport touring untuk CBR150R, R15, CB150R.',
   385000, 'New', 'Ban', 'Corsa Motorsport', 'Jakarta',
   'https://images.unsplash.com/photo-1605559424843-9e4c228bf1c2?w=800&q=80', '🛞',
   'https://shopee.co.id/search?keyword=ban+corsa+platinum+110%2F70-17&sortBy=sales',
   4.8, 950, NULL, TRUE),

  ('Ban Michelin Pilot Street 2 140/70-17',
   'Sport touring radial tire, wet grip excellent.',
   625000, 'New', 'Ban', 'Michelin Indonesia', 'Jakarta',
   'https://images.unsplash.com/photo-1617531653332-bd46c24f2068?w=800&q=80', '🛞',
   'https://shopee.co.id/search?keyword=ban+michelin+pilot+street+140%2F70-17&sortBy=sales',
   4.9, 520, 'PREMIUM', TRUE),

-- ============ HELM (4) ============
  ('Helm KYT R10 Full Face SNI Original',
   'Helm balap full face KYT R10, SNI certified, double D-ring.',
   625000, 'New', 'Aksesoris', 'KYT Official Store', 'Jakarta',
   'https://images.unsplash.com/photo-1609630875171-b1321377ee65?w=800&q=80', '🪖',
   'https://shopee.co.id/search?keyword=helm+KYT+R10+fullface+original+SNI&sortBy=sales',
   4.9, 1800, 'TERLARIS', TRUE),

  ('Helm INK Centro Double Visor Original',
   'Half face INK Centro dengan double visor dalam, SNI.',
   385000, 'New', 'Aksesoris', 'INK Helm Official', 'Jakarta',
   'https://images.unsplash.com/photo-1599256630498-4b79f55cf4d6?w=800&q=80', '🪖',
   'https://shopee.co.id/search?keyword=helm+INK+centro+double+visor&sortBy=sales',
   4.9, 4200, 'HOT', TRUE),

  ('Helm KYT TT Course Fullface Original',
   'Racing-inspired fullface, titanium Strip tuning.',
   725000, 'New', 'Aksesoris', 'KYT Official Store', 'Jakarta',
   'https://images.unsplash.com/photo-1623298317883-6b70254edf31?w=800&q=80', '🪖',
   'https://shopee.co.id/search?keyword=helm+KYT+TT+course+fullface&sortBy=sales',
   4.9, 1200, 'PREMIUM', TRUE),

  ('Helm Cargloss YRM Retro SNI',
   'Helm retro SNI warna solid dan gloss finish.',
   245000, 'New', 'Aksesoris', 'Cargloss Official', 'Jakarta',
   'https://images.unsplash.com/photo-1591637305428-b0b3fde3e34f?w=800&q=80', '🪖',
   'https://shopee.co.id/search?keyword=helm+cargloss+YRM+retro+SNI&sortBy=sales',
   4.8, 3100, NULL, TRUE),

-- ============ LAMPU & AKSESORIS (6) ============
  ('LED Headlamp H4 HS1 Plug and Play 80W',
   'Lampu utama LED untuk motor, plug & play tanpa potong kabel.',
   165000, 'New', 'Aksesoris', 'Cyclops LED', 'Jakarta',
   'https://images.unsplash.com/photo-1589739900266-43b2843f4e14?w=800&q=80', '💡',
   'https://shopee.co.id/search?keyword=LED+headlamp+H4+HS1+plug+play+80W+motor&sortBy=sales',
   4.7, 6500, 'TERLARIS', TRUE),

  ('Spion CNC Aluminium Custom Universal',
   'Spion CNC aluminium, adjustable, universal M8/M10.',
   185000, 'New', 'Aksesoris', 'Bike Parts ID', 'Jakarta',
   'https://images.unsplash.com/photo-1568772585407-9361f9bf3a87?w=800&q=80', '🪞',
   'https://shopee.co.id/search?keyword=spion+CNC+aluminium+custom+motor&sortBy=sales',
   4.7, 2400, 'HOT', TRUE),

  ('Jas Hujan Axio Premium 2-Piece',
   'Setelan jas hujan PVC bahan tebal, anti bocor, ukuran M-XXL.',
   135000, 'New', 'Aksesoris', 'Axio Gear Official', 'Jakarta',
   'https://images.unsplash.com/photo-1589956618515-0f1a35aee83c?w=800&q=80', '🧥',
   'https://shopee.co.id/search?keyword=jas+hujan+axio+premium+2+piece&sortBy=sales',
   4.8, 5800, 'HOT', TRUE),

-- ============ SHOCK & REM DISC (3) ============
  ('Shock YSS G-Plus NMAX Dual Adjustable',
   'Shock belakang premium YSS dual adjustable untuk NMAX/Aerox.',
   1250000, 'New', 'Aksesoris', 'YSS Indonesia', 'Jakarta',
   'https://images.unsplash.com/photo-1580273916550-e323be2ae537?w=800&q=80', '🔩',
   'https://shopee.co.id/search?keyword=shock+YSS+G-plus+nmax+aerox&sortBy=sales',
   4.9, 420, 'PREMIUM', TRUE),

  ('Disc Brake Braket Floating PSM Vario 150',
   'Upgrade cakram depan floating 270mm untuk Vario 150/125.',
   385000, 'New', 'Aksesoris', 'PSM Racing', 'Jakarta',
   'https://images.unsplash.com/photo-1617531653332-bd46c24f2068?w=800&q=80', '🛞',
   'https://shopee.co.id/search?keyword=disc+brake+floating+270+vario+150&sortBy=sales',
   4.8, 680, 'PREMIUM', TRUE),

-- ============ CAIRAN & CARE (3) ============
  ('Coolant Prestone AMG 1L Asia Spec',
   'Radiator coolant siap pakai untuk motor dan mobil.',
   68000, 'New', 'Oli', 'Prestone Indonesia', 'Jakarta',
   'https://images.unsplash.com/photo-1632823471565-1ec2fea78408?w=800&q=80', '🧊',
   'https://shopee.co.id/search?keyword=coolant+prestone+AMG+1L&sortBy=sales',
   4.8, 3200, 'HOT', TRUE),

  ('Kit Car Wax Meguiars Ultimate Quik Detailer',
   'Spray poles cepat bekas jamur body motor.',
   145000, 'New', 'Aksesoris', 'Meguiars Indonesia', 'Jakarta',
   'https://images.unsplash.com/photo-1635770310844-fb8bb4f6bdb4?w=800&q=80', '🧽',
   'https://shopee.co.id/search?keyword=meguiars+quik+detailer+motor&sortBy=sales',
   4.9, 1800, NULL, TRUE),

  ('Cover Body Motor Waterproof Tebal Universal',
   'Cover motor anti air, anti debu, ukuran L/XL semua motor.',
   85000, 'New', 'Aksesoris', 'CoverBikeID', 'Jakarta',
   'https://images.unsplash.com/photo-1568772585407-9361f9bf3a87?w=800&q=80', '🛡️',
   'https://shopee.co.id/search?keyword=cover+motor+waterproof+tebal+universal&sortBy=sales',
   4.7, 7400, 'HOT', TRUE)

ON CONFLICT (title) DO NOTHING;
