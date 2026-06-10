-- Kiralama akışına ücret ve kart bilgisi alanları
ALTER TABLE kiralamalar ADD COLUMN IF NOT EXISTS toplam_tutar DECIMAL(10,2);
ALTER TABLE kiralamalar ADD COLUMN IF NOT EXISTS kart_son_4 VARCHAR(4);
ALTER TABLE kiralamalar ADD COLUMN IF NOT EXISTS kart_sahibi VARCHAR(100);
ALTER TABLE kiralamalar ADD COLUMN IF NOT EXISTS sure INTEGER;

-- Ödeme kayıtları tablosu
CREATE TABLE IF NOT EXISTS odemeler (
  id SERIAL PRIMARY KEY,
  kullanici_id INTEGER NOT NULL REFERENCES kullanicilar(id) ON DELETE CASCADE,
  kiralama_id INTEGER REFERENCES kiralamalar(id) ON DELETE SET NULL,
  tutar DECIMAL(10,2) NOT NULL,
  kart_son_4 VARCHAR(4),
  kart_sahibi VARCHAR(100),
  durum VARCHAR(20) NOT NULL DEFAULT 'basarili',
  islem_no VARCHAR(32) UNIQUE NOT NULL,
  aciklama TEXT,
  olusturma_tarihi TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_odemeler_kullanici ON odemeler(kullanici_id);
CREATE INDEX IF NOT EXISTS idx_odemeler_kiralama ON odemeler(kiralama_id);
CREATE INDEX IF NOT EXISTS idx_kiralamalar_kullanici ON kiralamalar(kullanici_id);
CREATE INDEX IF NOT EXISTS idx_kiralamalar_arac ON kiralamalar(arac_id);
