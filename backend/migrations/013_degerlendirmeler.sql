-- Araç değerlendirmeleri (puan + yorum). Kullanıcı başına araç başına tek kayıt.
CREATE TABLE IF NOT EXISTS degerlendirmeler (
  id SERIAL PRIMARY KEY,
  kullanici_id INTEGER NOT NULL REFERENCES kullanicilar(id) ON DELETE CASCADE,
  arac_id INTEGER NOT NULL REFERENCES araclar(id) ON DELETE CASCADE,
  kiralama_id INTEGER REFERENCES kiralamalar(id) ON DELETE SET NULL,
  puan SMALLINT NOT NULL CHECK (puan BETWEEN 1 AND 5),
  yorum TEXT,
  olusturma_tarihi  TIMESTAMP NOT NULL DEFAULT NOW(),
  guncelleme_tarihi TIMESTAMP NOT NULL DEFAULT NOW(),
  UNIQUE (kullanici_id, arac_id)
);

CREATE INDEX IF NOT EXISTS idx_degerlendirmeler_arac ON degerlendirmeler(arac_id);
CREATE INDEX IF NOT EXISTS idx_degerlendirmeler_kullanici ON degerlendirmeler(kullanici_id);
