-- RiderHub Sample Data
-- Run this in Supabase SQL Editor after schema.sql

-- ============================================
-- EVENTS DATA (15 events)
-- ============================================
INSERT INTO events (title, description, location_start, location_end, event_date, organizer_name, participants_count, max_participants, category, status, image_emoji) VALUES
('Sunmori Jakarta - Bandung', 'Sunday morning ride from Jakarta to Bandung via Cipularang', 'Dago Pakar, Bandung', 'Jakarta', '2026-05-03 06:00:00', 'MotoSquad ID', 142, 200, 'Sunmori', 'upcoming', '🏍️'),
('Sunmori Surabaya - Bromo', 'Adventure ride to Bromo volcano', 'Surabaya', 'Bromo', '2026-05-10 04:00:00', 'East Java Riders', 89, 150, 'Touring', 'upcoming', '⛰️'),
('Night Ride Jakarta', 'Night ride around Jakarta city', 'Monas', 'PIK', '2026-05-05 20:00:00', 'Jakarta Night Riders', 215, 300, 'Night Ride', 'upcoming', '🏙️'),
('Kopdar CBR250RR', 'Gathering for CBR250RR owners', 'Alun-Alun Surabaya', 'Surabaya', '2026-05-08 15:00:00', 'CBR Community', 185, 250, 'Kopdar', 'upcoming', '🏎️'),
('Sunmori Bandung Raya', 'Big Sunday ride in Bandung area', 'Dago Pakar', 'Lembang', '2026-05-04 05:30:00', 'Bandung Riders', 320, 400, 'Sunmori', 'upcoming', '🔥'),
('Gede Bromo Sunset', 'Ride to Bromo for sunset view', 'Probolinggo', 'Bromo', '2026-05-11 15:00:00', 'Adventure Crew', 67, 100, 'Touring', 'upcoming', '🌅'),
(' Kopdar Ninja 250', 'Ninja 250 owner gathering', 'Pantai Losari', 'Makassar', '2026-05-12 14:00:00', 'Ninja Riders ID', 94, 120, 'Kopdar', 'upcoming', '🏍️'),
('Sunmori Morning Fun', 'Relaxed morning ride', 'Taman Menteng', 'Bogor', '2026-05-06 06:00:00', 'Jakarta Riders', 178, 200, 'Sunmori', 'upcoming', '☀️'),
('Mountain Twist', 'Mountain pass ride', 'Ciwidey', 'Kertasari', '2026-05-17 05:00:00', 'Adventure Bandung', 56, 80, 'Touring', 'upcoming', '🏔️'),
('City Night Cruise', 'City night ride', 'Thamrin', 'Sudirman', '2026-05-07 21:00:00', 'Night Cruisers', 234, 300, 'Night Ride', 'upcoming', '🌃'),
('Beach Ride Pangandaran', 'Ride to Pangandaran beach', 'Bandung', 'Pangandaran', '2026-05-18 04:30:00', 'Beach Riders', 112, 150, 'Touring', 'upcoming', '🏖️'),
('Track Day Sentul', 'Track day at Sentul', 'Sentul Circuit', 'Bogor', '2026-05-24 07:00:00', 'Track Riders', 45, 60, 'Race', 'upcoming', '🏁'),
('Coffe Ride Ngopi', 'Casual ride to coffee plantation', 'Jakarta', 'Bogor', '2026-05-13 08:00:00', 'Casual Riders', 89, 100, 'Kopdar', 'upcoming', '☕'),
(' Vespa Gathering', 'Vespa owner meet', 'Parkir Bundaran HI', 'Jakarta', '2026-05-20 10:00:00', 'Vespa Club', 156, 200, 'Kopdar', 'upcoming', '🛵'),
(' charity Ride', 'Charity ride for community', ' Jakarta', 'Tangerang', '2026-05-25 06:00:00', 'Good Riders', 267, 300, 'Charity', 'upcoming', '❤️');

-- ============================================
-- PARTS DATA (15 parts)
-- ============================================
INSERT INTO parts (title, description, price, condition, category, seller_name, location, status, image_emoji) VALUES
('Akrapovic slip-on R25', 'Original Akrapovic exhaust for R25, 90% like new', 4500000, '90%', 'Exhaust', 'BangJuli', 'Bandung', 'available', '🔩'),
('KYT TT-Course helmet', 'New KYT helmet, never used', 2800000, 'New', 'Gear', 'PakAgus', 'Jakarta', 'available', '🪖'),
('Pirelli Diablo Rosso III', 'Pirelli tire size 110/70-17', 1200000, 'New', 'Tires', 'MotorPart Surabaya', 'Surabaya', 'available', '🛞'),
('Ohlins Rear Shock', 'Ohlins rear shock for Ninja 250', 3500000, '85%', 'Suspension', 'RacingTech', 'Jakarta', 'available', '🔧'),
('Brembo Brake Pump', 'Brembo brake pump for sport bike', 1800000, 'New', 'Brake', 'BrakeExpert', 'Surabaya', 'available', '🛑'),
('Led Headlamp LED', 'LED headlamp conversion kit', 450000, 'New', 'Lighting', 'LightZone', 'Jakarta', 'available', '💡'),
('Renthal Handlebar', 'Renthal handlebar 7/8 inch', 850000, 'New', 'Handlebar', 'BarsMotorsport', 'Bandung', 'available', '🎋'),
('Pro Armor Swingarm', 'Pro Armor swingarm for mx', 2200000, '80%', 'Frame', 'MXParts', 'Jakarta', 'available', '🔩'),
('Dynojet Power Commander', 'Power Commander V for tuning', 2600000, '85%', 'ECU', 'TuneTech', 'Surabaya', 'available', '💻'),
('BST Carbon Wheel', 'BST carbon wheel front', 8500000, 'New', 'Wheels', 'CarbonWheels', 'Jakarta', 'available', '⚫'),
('Samco Coolant Hose', 'Samco radiator hose kit', 650000, 'New', 'Cooling', 'CoolingSystem', 'Bandung', 'available', '🧊'),
('NGK Iridium Plug', 'NGK iridium spark plug set', 250000, 'New', 'Spark', 'SparkPlugs', 'Jakarta', 'available', '⚡'),
('Galfer Brake Disc', 'Galfer floating brake disc', 1450000, 'New', 'Brake', 'BrakeGalfer', 'Surabaya', 'available', '🔵'),
('Yamalube Oil', 'Yamalube synthetic oil 4L', 380000, 'New', 'Oil', 'OilLube', 'Jakarta', 'available', '🛢️'),
('Racing Seat', 'Racing seat for Ninja 150', 1200000, '85%', 'Seat', 'SeatRacing', 'Bandung', 'available', '🪑');

-- ============================================
-- POSTS DATA (15 posts)
-- ============================================
INSERT INTO posts (user_name, motor, content, likes_count, comments_count, image_emoji) VALUES
('RizkyCBR', 'CBR250RR', 'Baru ganti ECU racing, tarikan bawah langsung beda jauh! 🚀 Ada yang mau review lengkapnya?', 482, 67, '🏍️'),
('DimasNinja', 'Ninja ZX-25R', 'Weekend ride ke Lembang, jalanan kosong banget pagi-pagi 🌄 Recommended route buat yang suka cornering!', 321, 38, '🏎️'),
('AldiAdventure', 'Adv 150', 'Touring ke Bromo yesterday, viewnya mantap poll! Siapa mau ikut next weekend?', 567, 89, '⛰️'),
('FarelSunmori', 'CB150R', '第一次 Sunmori bareng komunitas, seru banget! 💪🔥', 234, 45, '☀️'),
('BudiRacing', 'Ninja 250', 'Finally upgrade ke racing parts! Budget akhirnya numa cukup buat ban+ban mesen 😂', 189, 32, '💰'),
('AndiMoto', 'CBR150R', 'Service motor hari ini, kuning oil banyak bgt ternyata 😱 Remember buat rutin service ya!', 445, 56, '🔧'),
('RezaBiker', 'Vixion', 'Nemu jalan baru buat main cornering di BSD, asphalt mulus lagi sepi! 🏁', 378, 41, '🏔️'),
('YogaTrack', 'KTM Duke', 'Track day Sentul kemarin🔥 best experience ever! Kira2下次 kapan ya?', 623, 78, '🏁'),
('DoniTouring', 'Adv 160', 'Touring jauh2 ke Jogjakarta 3 hari, sleeping bag+tenger matiii 😂 Tapi worth it!', 445, 67, '🗺️'),
('FajarNight', 'CBR250RR', 'Night ride selalu是最 fun! Traffic sepi, bisa kebut 😊 Tapi tetapsafety ya!', 289, 34, '🌃'),
('BayuParts', 'xer', 'Jual barang nih, ada yang mau?: Akrapovic slip-on R25, nego paling 4.5jt aja!', 156, 23, '💰'),
('HendraGear', 'Ninja 250', 'Review KYT helm baru, nyaman+bagus, 推荐 buat yang cari gear!', 234, 28, '🪖'),
('IvanSunmori', 'CB150R', 'Sunmori jangan terlambat ya, point pertemuan harus jelas, nanti pada nyasar 😂', 167, 19, '🏍️'),
('MadeAdventure', 'Adv 150', 'Bromo-Semeru trip complete! Viewngakjub, nature poll 🔥, 712, 92, '⛰️'),
('DediTrack', 'KTM RC', 'My bike ready for track day! Wish me luck guys 🏁🔥 baru pertama kali main circuit', 334, 45, '🏁');