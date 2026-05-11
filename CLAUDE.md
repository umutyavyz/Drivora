# Drivora - Konum Destekli Akıllı Araç Kiralama Sistemi

## Proje Hakkında
Drivora, kullanıcının haritada çevresindeki araçları görüp kiralayabileceği bir mobil uygulama. Üniversite bitirme projesi. Öğrenci: Umut Yavuz (No: 2400004539), Koordinatör: Fettah Kurtuluş (IKU).

Proje tamamen sıfır bilgiyle başlandı, AI asistanı yardımıyla adım adım geliştirildi. Türkçe konuşulan bir proje, kod içindeki değişkenler ve veritabanı alanları Türkçe.

## Geliştirme Ortamı
- **OS:** macOS
- **Editör:** VS Code
- **Test araçları:** Postman, pgAdmin
- **Veritabanı:** PostgreSQL (Postgres.app)
- **Versiyon kontrol:** GitHub (private repo: `Drivora`)
- **Frontend port:** 8100
- **Backend port:** 3000

## Klasör Yapısı
Drivora/
├── backend/
│   ├── src/
│   │   ├── index.ts                        # Express sunucu, route bağlama
│   │   ├── db.ts                           # PostgreSQL Pool bağlantısı
│   │   ├── routes/
│   │   │   ├── araclar.ts
│   │   │   ├── kullanicilar.ts
│   │   │   └── kiralamalar.ts
│   │   ├── controllers/
│   │   │   ├── araclarController.ts
│   │   │   ├── kullanicilarController.ts
│   │   │   └── kiralamaController.ts
│   │   └── middleware/
│   │       └── authMiddleware.ts           # tokenKontrol + adminKontrol
│   ├── migrations/
│   │   └── 001_araclar_kolonlar.sql        # araclar tablosuna yakit + vites ekler
│   ├── package.json
│   └── tsconfig.json
├── frontend/
│   └── app/                                # Ionic + Angular proje kökü
│       ├── src/
│       │   ├── main.ts                     # bootstrapApplication, provider'lar
│       │   ├── global.scss                 # Leaflet CSS + tab animation
│       │   └── app/
│       │       ├── app.component.ts/html
│       │       ├── app.routes.ts           # Ana router
│       │       ├── welcome/                # Karşılama ekranı (token varsa /tabs/map'e atlar)
│       │       ├── login/                  # Giriş ekranı
│       │       ├── register/               # Kayıt ekranı (kayıt sonrası otomatik giriş)
│       │       ├── detail/                 # Araç detay ekranı (/detail/:id)
│       │       ├── guards/
│       │       │   └── auth-guard.ts       # CanActivate, token + exp kontrolü
│       │       ├── interceptors/
│       │       │   └── auth.interceptor.ts # HTTP 401 → logout + /login
│       │       ├── tabs/
│       │       │   ├── tabs.page.ts/html   # Tab bar
│       │       │   └── tabs.routes.ts
│       │       ├── map/                    # Harita (Leaflet)
│       │       ├── tab1/                   # Araçlar (kart listesi)
│       │       ├── tab2/                   # Kiralamalarım
│       │       └── tab3/                   # Profil
│       └── package.json
├── README.md
└── CLAUDE.md                               # Bu dosya

## Teknoloji Yığını

### Backend
- Node.js + Express **4.18.2** (5.x ile uyumsuzluk yaşandı, 4.x'te kalındı)
- TypeScript **5.4.5**
- ts-node **10.9.2**
- PostgreSQL driver: `pg`
- JWT: `jsonwebtoken`
- CORS: `cors`

### Frontend
- Ionic + Angular (standalone components, NgModules değil)
- Leaflet (harita kütüphanesi)
- jwt-decode (token client-side decode için)
- @ionic/angular/standalone import'ları kullanılıyor

### Önemli Komutlar
```bash
# Backend
cd backend
npm run dev                  # ts-node src/index.ts

# Frontend
cd frontend/app
ionic serve                  # localhost:8100

# Veritabanı yeniden başlat (gerekirse)
# Menü çubuğunda Postgres.app simgesi → Stop/Start
```

## Veritabanı Şeması

**Veritabanı adı:** `drivora`
**Kullanıcı:** `postgres`
**Şifre:** `drivora123`
**Host:** localhost:5432

### Tablolar

```sql
-- kullanicilar
CREATE TABLE kullanicilar (
  id SERIAL PRIMARY KEY,
  email VARCHAR(100) UNIQUE NOT NULL,
  sifre VARCHAR(255) NOT NULL,
  rol VARCHAR(20) DEFAULT 'kullanici'        -- 'kullanici' veya 'admin'
);

-- araclar
CREATE TABLE araclar (
  id SERIAL PRIMARY KEY,
  marka VARCHAR(50) NOT NULL,
  model VARCHAR(50) NOT NULL,
  musait BOOLEAN DEFAULT true,
  gunluk_fiyat INTEGER DEFAULT 1000,
  resim_url VARCHAR(500),
  kategori VARCHAR(50) DEFAULT 'Sedan',      -- 'Spor', 'Sedan', 'Ekonomik'
  latitude DECIMAL(10, 8),
  longitude DECIMAL(11, 8),
  yakit VARCHAR(20),                         -- 'Benzin', 'Dizel', 'Hibrit', 'Elektrik'
  vites VARCHAR(20)                          -- 'Manuel', 'Otomatik'
);
-- yakit + vites kolonları sonradan eklendi: backend/migrations/001_araclar_kolonlar.sql

-- kiralamalar
CREATE TABLE kiralamalar (
  id SERIAL PRIMARY KEY,
  kullanici_id INTEGER REFERENCES kullanicilar(id),
  arac_id INTEGER REFERENCES araclar(id),
  baslangic_tarihi TIMESTAMP DEFAULT NOW(),
  bitis_tarihi TIMESTAMP,
  durum VARCHAR(20) DEFAULT 'aktif'          -- 'aktif' veya 'tamamlandi'
);
```

### Test Kullanıcıları
- **Normal kullanıcı:** `umut@drivora.com` / `1234`
- **Admin kullanıcı:** `admin@drivora.com` / `admin123`

## Backend API Endpoint'leri

### Kullanıcı
- `POST /kullanicilar/kayit` — Yeni kullanıcı kaydı (email, sifre)
- `POST /kullanicilar/giris` — JWT token üretir (email, sifre)

### Araç
- `GET /araclar` — Tüm araçlar (tokenKontrol)
- `POST /araclar` — Yeni araç (tokenKontrol + adminKontrol)
- `PUT /araclar/:id` — Araç güncelle (tokenKontrol + adminKontrol)
- `DELETE /araclar/:id` — Araç sil (tokenKontrol + adminKontrol)

### Kiralama
- `GET /kiralamalar` — Kullanıcının kiralamaları (JOIN ile araç bilgisi)
- `POST /kiralamalar` — Kiralama başlat (arac_id), aracı müsait=false yapar
- `PUT /kiralamalar/:id/bitir` — Kiralamayı bitir, aracı müsait=true yapar

### Auth
- JWT secret: `"drivora-gizli-anahtar"`
- Token süresi: `1h`
- Token payload: `{ userId, email, rol }`
- Header formatı: `Authorization: Bearer <token>`

### Middleware
- **tokenKontrol** — Token yoksa 401, geçersizse 401, geçerliyse `req.kullanici` set edilir, `next()` çağrılır
- **adminKontrol** — Sadece `rol === 'admin'` olanlar geçer, değilse 403

## Frontend Yapısı

### Routing (app.routes.ts)
/                  → /welcome
/welcome           → karşılama ekranı
/login             → giriş
/register          → kayıt
/tabs/*            → AuthGuard ile korumalı
/tabs/map        → Harita (varsayılan)
/tabs/tab1       → Araçlar (kart listesi)
/tabs/tab2       → Kiralamalarım
/tabs/tab3       → Profil

### Tab Sırası
Harita → Araçlar → Kiralamalarım → Profil

### Auth Guard
`localStorage.getItem('token')` kontrolü. Token yoksa `/login`'e yönlendirir. Ayrıca `jwt-decode` ile token'ın `exp` alanı kontrol edilir; süresi dolmuşsa token silinir ve `/login`'e yönlendirilir.

### Auth Interceptor
`frontend/app/src/app/interceptors/auth.interceptor.ts` — Tüm HTTP isteklerini izler. Backend 401 dönerse token localStorage'dan silinir ve kullanıcı `/login`'e yönlendirilir. `main.ts`'te `withInterceptors([authInterceptor])` ile kayıt edilmiş.

### Sayfa Özetleri

**Welcome:** Hero görseli (Unsplash car), "Hadi Başlayalım" butonu → login. "Giriş Yap" linki de var.

**Login:** Dark tema, email/sifre input'ları. POST /kullanicilar/giris → token localStorage'a kayıt → `/tabs/map`'e yönlendir. Hesap Oluştur linki register'a gider.

**Register:** Email, sifre, sifre tekrar. Şifre eşleşme kontrolü. POST /kullanicilar/kayit → /login'e yönlendir. (NOT: Kayıt sonrası otomatik giriş yok, planlanan iyileştirme.)

**Map (Harita):**
- Leaflet kütüphanesi
- `L.tileLayer` ile CARTO dark theme: `https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png`
- `navigator.geolocation.getCurrentPosition` ile gerçek konum
- Backend'den araç listesi alınır
- Her aracın konumu kullanıcı koordinatlarına `+/- 0.02` (yaklaşık 2km) rastgele atanarak override edilir
- Her araç için `L.divIcon` ile inline SVG marker (beyaz arka plan, siyah araç ön çizimi)
- Müsait araç opacity 1, dolu olan 0.5
- Marker click → `seciliArac` set + harita zoom + slide-up bottom sheet
- Bottom sheet: marka, model, mesafe (Haversine formülü), fiyat, "Kirala" butonu
- Filtre butonu: sadece müsait araçlar
- Locate butonu: kullanıcı konumuna git + araçları yeniden dağıt

**Tab1 (Araçlar):**
- Kategori filtreleme tab'ları: Tümü, Spor, Sedan, Ekonomik
- Arama çubuğu (marka veya model)
- Premium dark kart tasarımı
- "Detay →" butonu (NOT: Henüz bağlı değil, detay sayfası yok)

**Tab2 (Kiralamalarım):**
- Aktif ve geçmiş kiralamalar
- Status badge (aktif = yeşil)
- Aktif kiralamalar için "Kiralamayı Bitir" butonu
- AlertController ile onay → PUT /kiralamalar/:id/bitir
- ToastController ile bildirim
- Boş ekran göstergesi var

**Tab3 (Profil):**
- jwt-decode ile token decode → email, rol
- Avatar (linear-gradient mavi-mor)
- Rol etiketi: "Yönetici" (admin) / "Üye" (kullanici)
- Bilgi listesi: e-posta, hesap tipi, üyelik durumu
- Çıkış yap butonu → AlertController onayı → localStorage temizle → /login

**Detail (Araç Detayı):**
- Route: `/detail/:id` (AuthGuard korumalı)
- `aracGetir(id)` — backend'den araç bilgisini çeker
- `aktifKiralamayiKontrolEt()` — kullanıcının başka aktif kiralaması var mı kontrol eder
- `kirala()` — POST /kiralamalar + toast bildirimi; aktif kiralama varsa engellenir
- `geri()` — geri navigasyon
- Kirala butonu disabled durumu: `!arac.musait || !!aktifKiralama`
- IonSpinner ile loading state mevcut

## Tasarım Sistemi

### Renkler
- Ana arka plan: `#0a0a0a`
- Kart arka plan: `#161616`
- Kenar: `rgba(255,255,255,0.06)` veya `rgba(255,255,255,0.08)`
- Vurgu (mavi-mor gradient): `linear-gradient(135deg, #4a9eff, #6c63ff)`
- Beyaz CTA: `white` (welcome ekranı için)
- Başarılı: `#22c55e` (yeşil)
- Hata/Dolu: `#ef4444` (kırmızı)
- Tehlike (logout): `rgba(239, 68, 68, 0.1)` arka plan, `#ef4444` text

### Tipografi
- Başlıklar: 24-36px, font-weight 700-800
- Body: 14-15px
- Etiketler: 11-12px, letter-spacing 1px, uppercase
- Brand: monospace tarzı durabilir

### Bileşenler
- Border radius: 16-24px (kartlar), 100px (butonlar)
- Shadow: minimal, sadece light efektler
- İkonlar: ionicons kütüphanesi (`ionicons/icons`)
- Emoji KULLANMA — her zaman SVG veya ion-icon

### Animasyonlar (global.scss)
```scss
@import 'leaflet/dist/leaflet.css';

ion-tabs ion-router-outlet > .ion-page {
  animation: tabSlide 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

@keyframes tabSlide {
  from { opacity: 0; transform: translateX(30px); }
  to { opacity: 1; transform: translateX(0); }
}
```

`provideIonicAngular({ mode: 'ios', animated: true })` — iOS tarzı sayfa geçişleri.

## Yaşanan Sorunlar ve Çözümler

1. **Express 5.x uyumsuzluğu** — 4.18.2'ye düşürüldü
2. **TypeScript module hatası** — tsconfig.json'da `"module": "CommonJS"`, `"esModuleInterop": true`
3. **CORS hatası** — Backend'e `app.use(cors())` eklendi
4. **Postgres.app trust auth** — Uygulama yeniden başlatıldı
5. **Postgres locale provider** — Veritabanı oluştururken template `template0` seçildi
6. **npm EACCES** — `sudo chown -R $(whoami) ~/.npm`
7. **Ionic CLI permission** — `sudo npm install -g @ionic/cli`
8. **Ionic proje klasör çakışması** — `frontend/app` altında `--no-git` ile oluşturuldu
9. **Çift `/araclar` endpoint** — Express ilk match'i alır, eski hardcoded silindi
10. **Çift `tabs` route path** — `tabs.routes.ts` içinde `path: ''` yapıldı
11. **Standalone component import'lar** — Her bileşen ayrı ayrı import edilir (IonHeader, IonContent vs), `@ionic/angular/standalone` deseninden
12. **app.config.ts yok** — Provider'lar `main.ts`'te tanımlanır
13. **Marker emoji sorunu** — Inline SVG'ye geçildi

## Bilinen Sapmalar
- **Şifre düz metin saklanıyor** — `kullanicilarController.ts` içinde bcrypt yok, demo/bitirme amaçlı. Üretime alınırsa bcrypt + tuz şart.
- **JWT secret hardcoded** — `"drivora-gizli-anahtar"` koda gömülü, env değişkenine taşınmalı.
- **Migrations sadece ALTER içerir** — `CREATE TABLE` deyimleri elle çalıştırılmış, migration dosyasında yok.

## Yapılacaklar (Önem Sırasına Göre)

### TAMAMLANANLAR ✅
1. ✅ Welcome bypass — Token varsa direkt `/tabs/map` (welcome.page.ts:16-19)
2. ✅ Araç detay sayfası — `/detail/:id` route'u + sayfa (detail/)
3. ✅ Araçlar sayfası → Detay bağlantısı — `detayaGit()` (tab1.page.ts:32-34)
4. ✅ Harita → Detay bağlantısı — Bottom sheet'ten detay (map.page.ts:35-38)
5. ✅ Kayıt sonrası otomatik giriş — `otomatikGirisYap()` (register.page.ts:59-74)
6. ✅ Login başarılı toast — (login.page.ts:52)
7. ✅ Tab1 boş ekran göstergesi — Filtre boşsa empty state (tab1.page.html:55-59)
8. ✅ Çıkış yap onayı — AlertController ile (tab3.page.ts:39-56)
9. ✅ Token süresi kontrolü — AuthGuard'da `exp` kontrolü + Auth Interceptor 401 yakalar
10. ✅ Aktif kiralama tek olabilsin — Backend 409 döner (kiralamaController.ts:10-17), Detail sayfasında kirala butonu disable (detail.page.ts:70-79). **NOT: Harita bottom sheet'inde aynı kontrol henüz yok.**
12. ✅ Haritada aktif araç farklı işaret — Gradient marker (map.page.ts:165-175)

### AÇIK ✅ KÜÇÜK İŞLER
- **Harita bottom sheet'te aktif kiralama kontrolü** — Şu an haritadan ikinci kiralama denenince backend 409 dönüyor ama UX kötü, frontend tarafında engellenmeli
- **Madde 11 — Canlı kiralama timer** — Kiralamalarım sayfasında geçen süreyi gösteren timer
- **Madde 15 — Status bar / safe area** — iOS notch, Android status bar ayarları
- **Madde 16 — Loading spinner** — Detail dışındaki sayfalarda (tab1, tab2, map) yükleme göstergesi
- **Madde 17 — Demo verisi** — Her kategoriden yeterince araç
- **Madde 18 — Backend kapalıyken hata davranışı** — Bağlantı kesilme senaryosu

### BÜYÜK İŞLER (Sunum için kritik)
- **Madde 13 — Admin paneli** — Backend zaten hazır (POST/PUT/DELETE /araclar admin korumalı), sadece arayüz: araç ekle/sil/güncelle ekranları
- **Madde 14 — Araç simülasyonu** — Kiralanan araç haritada hareket etsin. **Proje önermesindeki ANA VAAT, sunumda mutlaka olmalı.**

## Sunum Stratejisi
Mayıs sonu sunumu. Ana demo akışı:
1. Welcome → Login (umut@drivora.com / 1234)
2. Harita → Yakındaki araçlar
3. Bir araca tıkla → Bottom sheet
4. "Kirala" → Toast bildirimi
5. Kiralamalarım sekmesi → Aktif kiralama
6. "Kiralamayı Bitir"
7. Profil → Çıkış
8. Admin login (admin@drivora.com / admin123)
9. Admin paneli (yapılırsa)

## Önemli Notlar (Claude için)
- **Türkçe yazılı kod** — değişken isimleri, tablo adları, JSON key'leri Türkçe (marka, model, musait, kullanicilar, araclar)
- **Standalone components** — Her bileşen ayrı import edilmeli
- **Emoji yasak** — UI'da emoji yok, hep ion-icon veya SVG
- **Dark tema** — Bütün ekranlar koyu, açık tema asla
- **Backend ve frontend ayrı çalışıyor** — İkisi de aynı anda açık olmalı (3000 ve 8100 portları)
- **JWT secret production-grade değil** — sadece test amaçlı
- **Kullanıcı backend kodu için yeni şeyler isterse** önce var olan controller/route yapısına uygun olmalı

## GitHub
- Repo: `https://github.com/[KULLANICI_ADIN]/drivora`
- Private repo
- Branch: main
- Her büyük özellik sonrası commit + push

## İletişim Tarzı
Kullanıcı Türkçe konuşuyor, samimi bir üslubu var ("kanka", "bro", "hocam"). Cevaplar:
- Türkçe
- Kısa ve net
- Adım adım talimat ver, hepsini bir seferde değil
- Hata olursa önce sebebi sor, sonra çözüm
- Emoji sadece nadiren ve doğru bağlamda (🎉 başarı, 👀 sonucu bekle)
- Pre-amble yapma, direkt iş