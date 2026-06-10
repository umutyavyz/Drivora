-- Kiralama sözleşmesi kabul etme alanları
ALTER TABLE kiralamalar ADD COLUMN IF NOT EXISTS agreement_accepted BOOLEAN DEFAULT false;
ALTER TABLE kiralamalar ADD COLUMN IF NOT EXISTS agreement_accepted_at TIMESTAMP;
