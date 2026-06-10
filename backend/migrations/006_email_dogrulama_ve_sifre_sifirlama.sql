-- Email doğrulama ve şifre sıfırlama alanları
ALTER TABLE kullanicilar ADD COLUMN IF NOT EXISTS email_dogrulandi BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE kullanicilar ADD COLUMN IF NOT EXISTS email_dogrulama_token VARCHAR(80);
ALTER TABLE kullanicilar ADD COLUMN IF NOT EXISTS email_dogrulama_son_tarih TIMESTAMP;
ALTER TABLE kullanicilar ADD COLUMN IF NOT EXISTS sifre_sifirlama_token VARCHAR(80);
ALTER TABLE kullanicilar ADD COLUMN IF NOT EXISTS sifre_sifirlama_son_tarih TIMESTAMP;

CREATE INDEX IF NOT EXISTS idx_kullanicilar_email_dogrulama_token
  ON kullanicilar(email_dogrulama_token);
CREATE INDEX IF NOT EXISTS idx_kullanicilar_sifre_sifirlama_token
  ON kullanicilar(sifre_sifirlama_token);

-- Mevcut admin/test kullanıcılarını doğrulanmış say (opsiyonel — istersen kaldırılabilir)
UPDATE kullanicilar SET email_dogrulandi = true WHERE rol = 'admin';
