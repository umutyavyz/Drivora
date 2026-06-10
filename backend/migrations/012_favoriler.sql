-- Kullanıcıların favori araçları
CREATE TABLE IF NOT EXISTS favoriler (
  id SERIAL PRIMARY KEY,
  kullanici_id INTEGER NOT NULL REFERENCES kullanicilar(id) ON DELETE CASCADE,
  arac_id INTEGER NOT NULL REFERENCES araclar(id) ON DELETE CASCADE,
  olusturma_tarihi TIMESTAMP NOT NULL DEFAULT NOW(),
  UNIQUE (kullanici_id, arac_id)
);

CREATE INDEX IF NOT EXISTS idx_favoriler_kullanici ON favoriler(kullanici_id);
CREATE INDEX IF NOT EXISTS idx_favoriler_arac ON favoriler(arac_id);
