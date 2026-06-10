-- A grubu: bütünlük kısıtları ve denetim sütunları
-- Idempotent — tekrar çalıştırılabilir. (NULL değerler CHECK'i geçer, eski kayıtlar bozulmaz.)

-- 1) Serbest VARCHAR alanlar için CHECK kısıtları
DO $$ BEGIN
  ALTER TABLE kiralamalar ADD CONSTRAINT chk_kiralama_durum
    CHECK (durum IN ('aktif','tamamlandi','iptal'));
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE kiralamalar ADD CONSTRAINT chk_kiralama_tipi
    CHECK (kiralama_tipi IN ('saatlik','gunluk'));
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE kullanicilar ADD CONSTRAINT chk_kullanici_rol
    CHECK (rol IN ('kullanici','admin'));
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE odemeler ADD CONSTRAINT chk_odeme_durum
    CHECK (durum IN ('basarili','basarisiz','iade'));
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- 2) Bir kullanıcının aynı anda yalnızca BİR aktif kiralaması olabilir
--    (uygulama kodu da kontrol ediyor; bu DB seviyesinde garanti eder)
CREATE UNIQUE INDEX IF NOT EXISTS uniq_aktif_kiralama
  ON kiralamalar(kullanici_id) WHERE durum = 'aktif';

-- 3) Email benzersizliği büyük/küçük harfe duyarsız
--    (giriş LOWER(email) ile arıyor; aynı emailin farklı yazımlarını engeller)
--    NOT: Mevcut veride büyük/küçük harf farkıyla yinelenen email varsa bu satır
--    hata verir; o durumda önce yinelenenleri temizleyin.
CREATE UNIQUE INDEX IF NOT EXISTS uniq_kullanici_email_lower
  ON kullanicilar(LOWER(email));

-- 4) Denetim zaman damgaları
ALTER TABLE kullanicilar ADD COLUMN IF NOT EXISTS olusturma_tarihi  TIMESTAMP NOT NULL DEFAULT NOW();
ALTER TABLE araclar      ADD COLUMN IF NOT EXISTS olusturma_tarihi  TIMESTAMP NOT NULL DEFAULT NOW();
ALTER TABLE araclar      ADD COLUMN IF NOT EXISTS guncelleme_tarihi TIMESTAMP NOT NULL DEFAULT NOW();
