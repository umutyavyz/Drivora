-- Kiralama sözleşmesi kabul etme alanları
ALTER TABLE kullanicilar ADD COLUMN IF NOT EXISTS agreement_accepted BOOLEAN DEFAULT false;
ALTER TABLE kullanicilar ADD COLUMN IF NOT EXISTS agreement_accepted_at TIMESTAMP;
