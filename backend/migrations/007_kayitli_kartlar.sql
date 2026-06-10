-- Kullanıcıların kayıtlı (tokenize edilmiş) kartları
-- GÜVENLİK: Tam kart numarası ve CVV ASLA saklanmaz. Yalnızca son 4 hane,
-- kart sahibi, son kullanma (AA/YY) ve marka tutulur. Bu, gerçek ödeme
-- altyapılarının "kart token" yaklaşımına benzer ve bitirme projesi için yeterlidir.
CREATE TABLE IF NOT EXISTS kayitli_kartlar (
  id SERIAL PRIMARY KEY,
  kullanici_id INTEGER NOT NULL REFERENCES kullanicilar(id) ON DELETE CASCADE,
  kart_sahibi VARCHAR(100) NOT NULL,
  kart_son_4 VARCHAR(4) NOT NULL,
  son_kullanma VARCHAR(5) NOT NULL,        -- AA/YY
  kart_marka VARCHAR(20),                  -- VISA / MASTERCARD / AMEX / TROY
  varsayilan BOOLEAN NOT NULL DEFAULT false,
  olusturma_tarihi TIMESTAMP NOT NULL DEFAULT NOW(),
  UNIQUE (kullanici_id, kart_son_4, son_kullanma)
);

CREATE INDEX IF NOT EXISTS idx_kayitli_kartlar_kullanici ON kayitli_kartlar(kullanici_id);
