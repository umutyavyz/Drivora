/**
 * Uygulama genelinde paylaşılan veri modelleri.
 * Backend esnek alanlar dönebildiği için her arayüzde `[key: string]: any`
 * index imzası bırakıldı — bu, kademeli tip geçişine izin verir (bilinen
 * alanlarda otomatik tamamlama + tip kontrolü, bilinmeyenlerde esneklik).
 */

export interface Arac {
  id: number;
  marka: string;
  model: string;
  musait: boolean;
  gunluk_fiyat: number;
  saatlik_fiyat?: number | null;
  resim_url?: string | null;
  resim_urls?: string[] | null;
  kategori?: string | null;
  yakit?: string | null;
  vites?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  kasa_tipi?: string | null;
  fiyat_sinifi?: string | null;
  mesafe?: number;
  [key: string]: any;
}

export interface Kiralama {
  id: number;
  kullanici_id: number;
  arac_id: number;
  kiralama_tipi: 'saatlik' | 'gunluk' | string;
  sure: number;
  toplam_tutar?: number | null;
  durum: 'aktif' | 'tamamlandi' | string;
  baslangic_tarihi: string;
  bitis_tarihi?: string | null;
  kart_son_4?: string | null;
  marka?: string;
  model?: string;
  resim_url?: string | null;
  [key: string]: any;
}

export interface Kullanici {
  id: number;
  email: string;
  rol: 'admin' | 'kullanici' | string;
  ad_soyad?: string | null;
  telefon?: string | null;
  dogum_tarihi?: string | null;
  email_dogrulandi?: boolean;
  [key: string]: any;
}

export interface Odeme {
  id: number;
  tutar: number;
  kart_son_4?: string | null;
  kart_sahibi?: string | null;
  durum: 'basarili' | string;
  islem_no: string;
  aciklama?: string;
  olusturma_tarihi: string;
  // Ödeme listesinde JOIN ile gelen araç bilgileri
  marka?: string;
  model?: string;
  [key: string]: any;
}

export interface KayitliKart {
  id: number;
  kart_sahibi: string;
  kart_son_4: string;
  son_kullanma: string;
  kart_marka: string;
  varsayilan: boolean;
  [key: string]: any;
}
