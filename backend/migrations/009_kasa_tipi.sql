ALTER TABLE araclar ADD COLUMN IF NOT EXISTS kasa_tipi VARCHAR(30);

-- Hatchback'ler
UPDATE araclar SET kasa_tipi = 'Hatchback'
  WHERE id IN (7, 12, 11, 1, 13, 14, 8);
  -- Clio, Yaris, Polo, Jazz, Megane, Focus, A3 (Sportback)

-- Sedan'lar
UPDATE araclar SET kasa_tipi = 'Sedan'
  WHERE id IN (2, 5, 17, 18, 20);
  -- Civic, C180, 320i, A6, Tesla Model 3

-- SUV'lar
UPDATE araclar SET kasa_tipi = 'SUV'
  WHERE id IN (15, 16);
  -- Tiguan, RAV4

-- Spor
UPDATE araclar SET kasa_tipi = 'Spor'
  WHERE id = 19;
  -- Mustang

-- SUV'ların kategorisini fiyat sınıfına çevir (SUV artık kasa_tipi'nde)
UPDATE araclar SET kategori = 'Orta Sınıf' WHERE kasa_tipi = 'SUV';
