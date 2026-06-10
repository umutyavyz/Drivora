-- Mustang'ın kategorisini Spor→Otomatik olarak güncelle
-- (Spor kasa_tipi içinde filtre artık Manuel/Otomatik olacak)
UPDATE araclar SET kategori = 'Otomatik' WHERE id = 19;

-- +1 Hatchback (toplam 7)
INSERT INTO araclar (marka, model, kasa_tipi, kategori, yakit, vites, saatlik_fiyat, gunluk_fiyat, musait, resim_url) VALUES
('MINI', 'Cooper', 'Hatchback', 'Ekonomik', 'Benzin', 'Manuel', 135, 900, true,
 'https://images.unsplash.com/photo-1619682817568-c85cc85ce63b?w=900');

-- +2 Sedan (toplam 7)
INSERT INTO araclar (marka, model, kasa_tipi, kategori, yakit, vites, saatlik_fiyat, gunluk_fiyat, musait, resim_url) VALUES
('Toyota',     'Corolla', 'Sedan', 'Orta Sınıf', 'Benzin', 'Otomatik', 170, 1200, true,
 'https://images.unsplash.com/photo-1621007947382-bb3c3994e3fb?w=900'),
('Volkswagen', 'Passat',  'Sedan', 'Lüks',       'Dizel',  'Otomatik', 340, 2400, true,
 'https://images.unsplash.com/photo-1541899481282-d53bffe3c35d?w=900');

-- +5 SUV (toplam 7)
INSERT INTO araclar (marka, model, kasa_tipi, kategori, yakit, vites, saatlik_fiyat, gunluk_fiyat, musait, resim_url) VALUES
('Hyundai',   'Tucson', 'SUV', 'Orta Sınıf', 'Benzin', 'Otomatik', 250, 1700, true,
 'https://images.unsplash.com/photo-1633710122555-4ac16d6bb9f5?w=900'),
('Kia',       'Sportage', 'SUV', 'Orta Sınıf', 'Hibrit', 'Otomatik', 245, 1650, true,
 'https://images.unsplash.com/photo-1606016159991-dfe4f2746ad5?w=900'),
('Ford',      'Kuga', 'SUV', 'Orta Sınıf', 'Benzin', 'Manuel', 230, 1600, true,
 'https://images.unsplash.com/photo-1568605117036-5fe5e7bab0b7?w=900'),
('BMW',       'X3', 'SUV', 'Lüks', 'Dizel', 'Otomatik', 390, 2700, true,
 'https://images.unsplash.com/photo-1555215695-3004980ad54e?w=900'),
('Mercedes',  'GLC', 'SUV', 'Lüks', 'Dizel', 'Otomatik', 430, 3000, true,
 'https://images.unsplash.com/photo-1606664515524-ed2f786a0bd6?w=900');

-- +6 Spor — 3 Manuel + 3 Otomatik (toplam 7: 3M + 4O)
INSERT INTO araclar (marka, model, kasa_tipi, kategori, yakit, vites, saatlik_fiyat, gunluk_fiyat, musait, resim_url) VALUES
('Toyota',  'GR86',          'Spor', 'Manuel', 'Benzin', 'Manuel',   420, 2900, true,
 'https://images.unsplash.com/photo-1614162692292-7ac56d7f7f1e?w=900'),
('Mazda',   'MX-5',          'Spor', 'Manuel', 'Benzin', 'Manuel',   380, 2600, true,
 'https://images.unsplash.com/photo-1552519507-da3b142c6e3d?w=900'),
('Honda',   'Civic Type R',  'Spor', 'Manuel', 'Benzin', 'Manuel',   460, 3200, true,
 'https://images.unsplash.com/photo-1611566026373-c6c8da0ea861?w=900'),
('BMW',     'M2',            'Spor', 'Otomatik', 'Benzin', 'Otomatik', 530, 3700, true,
 'https://images.unsplash.com/photo-1556189250-72ba954cfc2b?w=900'),
('Audi',    'TT',            'Spor', 'Otomatik', 'Benzin', 'Otomatik', 490, 3400, true,
 'https://images.unsplash.com/photo-1606664515524-ed2f786a0bd6?w=900'),
('Porsche', '718 Cayman',    'Spor', 'Otomatik', 'Benzin', 'Otomatik', 620, 4300, true,
 'https://images.unsplash.com/photo-1503376780353-7e6692767b70?w=900');
