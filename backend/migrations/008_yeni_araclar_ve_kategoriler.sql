-- Mevcut kategorileri mantıklı hale getir
UPDATE araclar SET marka = 'Mercedes', kategori = 'Lüks'      WHERE id = 5; -- C180 Sedan değil Lüks
UPDATE araclar SET                     kategori = 'Ekonomik'  WHERE id = 1; -- Jazz küçük araç
UPDATE araclar SET                     kategori = 'Orta Sınıf' WHERE id = 2; -- Civic orta sınıf
UPDATE araclar SET                     kategori = 'Orta Sınıf' WHERE id = 8; -- A3 spor değil kompakt premium

-- 10 yeni araç
INSERT INTO araclar (marka, model, kategori, yakit, vites, saatlik_fiyat, gunluk_fiyat, musait, resim_url) VALUES
('Volkswagen', 'Polo',      'Ekonomik',   'Benzin',   'Manuel',    130,  850,  true, 'https://images.unsplash.com/photo-1541899481282-d53bffe3c35d?w=900'),
('Toyota',     'Yaris',     'Ekonomik',   'Hibrit',   'Otomatik',  125,  820,  true, 'https://images.unsplash.com/photo-1559416523-140ddc3d238c?w=900'),
('Renault',    'Megane',    'Orta Sınıf', 'Benzin',   'Manuel',    165, 1150,  true, 'https://images.unsplash.com/photo-1549317661-bd32c8ce0db2?w=900'),
('Ford',       'Focus',     'Orta Sınıf', 'Benzin',   'Manuel',    155, 1100,  true, 'https://images.unsplash.com/photo-1568605117036-5fe5e7bab0b7?w=900'),
('Volkswagen', 'Tiguan',    'SUV',        'Dizel',    'Otomatik',  280, 1900,  true, 'https://images.unsplash.com/photo-1519641471654-76ce0107ad1b?w=900'),
('Toyota',     'RAV4',      'SUV',        'Hibrit',   'Otomatik',  260, 1800,  true, 'https://images.unsplash.com/photo-1583267746897-2cf415887172?w=900'),
('BMW',        '320i',      'Lüks',       'Benzin',   'Otomatik',  350, 2400,  true, 'https://images.unsplash.com/photo-1555215695-3004980ad54e?w=900'),
('Audi',       'A6',        'Lüks',       'Dizel',    'Otomatik',  400, 2800,  true, 'https://images.unsplash.com/photo-1606664515524-ed2f786a0bd6?w=900'),
('Ford',       'Mustang',   'Spor',       'Benzin',   'Otomatik',  500, 3500,  true, 'https://images.unsplash.com/photo-1494976388531-d1058494cdd8?w=900'),
('Tesla',      'Model 3',   'Elektrikli', 'Elektrik', 'Otomatik',  300, 2100,  true, 'https://images.unsplash.com/photo-1560958089-b8a1929cea89?w=900');
