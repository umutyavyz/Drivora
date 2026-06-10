import { Request, Response } from "express";
import pool from "../db";
import { kartKaydet } from "./kartlarController";

const islemNoUret = () => {
  const ts = Date.now().toString(36).toUpperCase();
  const rnd = Math.random().toString(36).slice(2, 8).toUpperCase();
  return `DRV-${ts}-${rnd}`;
};

const fiyatHesapla = (tip: string, sure: number, saatlik: number | null, gunluk: number | null): number => {
  const adet = Math.max(1, Number(sure) || 1);
  if (tip === 'saatlik') {
    const birim = Number(saatlik) || 0;
    return Math.round(birim * adet * 100) / 100;
  }
  const birim = Number(gunluk) || 0;
  return Math.round(birim * adet * 100) / 100;
};

export const kiralamaBaslat = async (req: Request, res: Response) => {
  const client = await pool.connect();
  try {
    const { arac_id, kiralama_tipi, sure, kart_no, kart_sahibi, kart_son_kullanma, kart_cvv, kayitli_kart_id, kart_kaydet } = req.body;
    const tip = (kiralama_tipi === 'saatlik' || kiralama_tipi === 'gunluk') ? kiralama_tipi : 'gunluk';
    // Süre üst sınırı kiralama tipine göre: saatlik en fazla 24 saat, günlük en fazla 365 gün
    const sureUstSinir = tip === 'saatlik' ? 24 : 365;
    const sureSayi = Math.max(1, Math.min(sureUstSinir, Number(sure) || 1));
    const kullanici_id = (req as any).kullanici.userId;

    await client.query('BEGIN');

    // Email doğrulama kontrolü
    const dogrulamaKontrol = await client.query(
      "SELECT email_dogrulandi FROM kullanicilar WHERE id = $1",
      [kullanici_id]
    );
    if (dogrulamaKontrol.rows.length === 0 || !dogrulamaKontrol.rows[0].email_dogrulandi) {
      await client.query('ROLLBACK');
      return res.status(403).json({
        hata: "Araç kiralamak için önce email adresini doğrulaman gerekiyor.",
        kod: "EMAIL_DOGRULANMADI"
      });
    }

    // Kart çözümleme: kayıtlı kart ya da yeni kart
    let kartSon4: string;
    let kartSahibiAd: string;

    if (kayitli_kart_id) {
      const kayitliKart = await client.query(
        "SELECT kart_son_4, kart_sahibi FROM kayitli_kartlar WHERE id = $1 AND kullanici_id = $2",
        [kayitli_kart_id, kullanici_id]
      );
      if (kayitliKart.rows.length === 0) {
        await client.query('ROLLBACK');
        return res.status(400).json({ hata: "Kayıtlı kart bulunamadı" });
      }
      kartSon4 = kayitliKart.rows[0].kart_son_4;
      kartSahibiAd = kayitliKart.rows[0].kart_sahibi;
    } else {
      if (!kart_no || !kart_sahibi || !kart_son_kullanma || !kart_cvv) {
        await client.query('ROLLBACK');
        return res.status(400).json({ hata: "Ödeme bilgileri eksik" });
      }
      const kartTemiz = String(kart_no).replace(/\s+/g, '');
      if (kartTemiz.length < 13 || kartTemiz.length > 19 || !/^\d+$/.test(kartTemiz)) {
        await client.query('ROLLBACK');
        return res.status(400).json({ hata: "Geçersiz kart numarası" });
      }
      if (!/^\d{3,4}$/.test(String(kart_cvv))) {
        await client.query('ROLLBACK');
        return res.status(400).json({ hata: "Geçersiz CVV" });
      }
      kartSon4 = kartTemiz.slice(-4);
      kartSahibiAd = String(kart_sahibi).trim().slice(0, 100);

      // İstenirse kartı kaydet (tam numara/CVV saklanmaz)
      if (kart_kaydet) {
        await kartKaydet(kullanici_id, kart_no, kart_sahibi, kart_son_kullanma, false, client);
      }
    }

    const aktifKiralama = await client.query(
      "SELECT id FROM kiralamalar WHERE kullanici_id = $1 AND durum = 'aktif' LIMIT 1",
      [kullanici_id]
    );
    if (aktifKiralama.rows.length > 0) {
      await client.query('ROLLBACK');
      return res.status(409).json({ hata: "Zaten aktif bir kiralaman var. Yeni araç kiralamak için önce mevcut kiralamayı bitir." });
    }

    const aracKontrol = await client.query(
      "SELECT * FROM araclar WHERE id = $1 AND musait = true",
      [arac_id]
    );
    if (aracKontrol.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(400).json({ hata: "Araç müsait değil veya bulunamadı" });
    }
    const arac = aracKontrol.rows[0];

    if (tip === 'saatlik' && !arac.saatlik_fiyat) {
      await client.query('ROLLBACK');
      return res.status(400).json({ hata: "Bu araç için saatlik kiralama mevcut değil" });
    }

    const toplamTutar = fiyatHesapla(tip, sureSayi, arac.saatlik_fiyat, arac.gunluk_fiyat);

    const kullaniciKontrol = await client.query(
      "SELECT agreement_accepted FROM kullanicilar WHERE id = $1",
      [kullanici_id]
    );
    const isFirstRental = kullaniciKontrol.rows.length > 0 && !kullaniciKontrol.rows[0].agreement_accepted;

    const kiralama = await client.query(
      `INSERT INTO kiralamalar
        (kullanici_id, arac_id, kiralama_tipi, sure, toplam_tutar, kart_son_4, kart_sahibi)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING *`,
      [kullanici_id, arac_id, tip, sureSayi, toplamTutar, kartSon4, kartSahibiAd]
    );

    await client.query(
      "UPDATE araclar SET musait = false WHERE id = $1",
      [arac_id]
    );

    const odeme = await client.query(
      `INSERT INTO odemeler
        (kullanici_id, kiralama_id, tutar, kart_son_4, kart_sahibi, durum, islem_no, aciklama)
       VALUES ($1, $2, $3, $4, $5, 'basarili', $6, $7)
       RETURNING *`,
      [
        kullanici_id,
        kiralama.rows[0].id,
        toplamTutar,
        kartSon4,
        kartSahibiAd,
        islemNoUret(),
        `${arac.marka} ${arac.model} - ${tip === 'saatlik' ? sureSayi + ' saat' : sureSayi + ' gün'} kiralama`
      ]
    );

    await client.query('COMMIT');

    res.status(201).json({
      mesaj: "Kiralama başlatıldı",
      is_first_rental: isFirstRental,
      kiralama: kiralama.rows[0],
      odeme: odeme.rows[0]
    });
  } catch (err: any) {
    await client.query('ROLLBACK');
    console.error(err); res.status(500).json({ hata: "Sunucu hatası, lütfen tekrar deneyin" });
  } finally {
    client.release();
  }
};

export const kiralamaListele = async (req: Request, res: Response) => {
  try {
    const kullanici_id = (req as any).kullanici.userId;

    const result = await pool.query(
      `SELECT k.*,
              a.marka, a.model, a.resim_url, a.kategori,
              a.yakit, a.vites, a.gunluk_fiyat, a.saatlik_fiyat
       FROM kiralamalar k
       JOIN araclar a ON k.arac_id = a.id
       WHERE k.kullanici_id = $1
       ORDER BY (k.durum = 'aktif') DESC, k.baslangic_tarihi DESC`,
      [kullanici_id]
    );

    res.json(result.rows);
  } catch (err: any) {
    console.error(err); res.status(500).json({ hata: "Sunucu hatası, lütfen tekrar deneyin" });
  }
};

export const kiralamaBitir = async (req: Request, res: Response) => {
  try {
    const id = req.params.id;
    const kullanici_id = (req as any).kullanici.userId;

    const kiralamaKontrol = await pool.query(
      "SELECT * FROM kiralamalar WHERE id = $1 AND kullanici_id = $2 AND durum = 'aktif'",
      [id, kullanici_id]
    );

    if (kiralamaKontrol.rows.length === 0) {
      return res.status(404).json({ hata: "Aktif kiralama bulunamadı" });
    }

    const kiralama = kiralamaKontrol.rows[0];

    await pool.query(
      "UPDATE kiralamalar SET bitis_tarihi = NOW(), durum = 'tamamlandi' WHERE id = $1",
      [id]
    );

    await pool.query(
      "UPDATE araclar SET musait = true WHERE id = $1",
      [kiralama.arac_id]
    );

    res.json({ mesaj: "Kiralama bitirildi" });
  } catch (err: any) {
    console.error(err); res.status(500).json({ hata: "Sunucu hatası, lütfen tekrar deneyin" });
  }
};

export const adminKiralamaBitir = async (req: Request, res: Response) => {
  try {
    const id = req.params.id;

    const kiralamaKontrol = await pool.query(
      "SELECT * FROM kiralamalar WHERE id = $1",
      [id]
    );

    if (kiralamaKontrol.rows.length === 0) {
      return res.status(404).json({ hata: "Kiralama bulunamadı" });
    }

    const kiralama = kiralamaKontrol.rows[0];

    if (kiralama.durum !== 'aktif') {
      return res.status(400).json({ hata: "Bu kiralama zaten tamamlanmış" });
    }

    await pool.query(
      "UPDATE kiralamalar SET bitis_tarihi = NOW(), durum = 'tamamlandi' WHERE id = $1",
      [id]
    );

    await pool.query(
      "UPDATE araclar SET musait = true WHERE id = $1",
      [kiralama.arac_id]
    );

    res.json({ mesaj: "Kiralama yönetici tarafından sonlandırıldı" });
  } catch (err: any) {
    console.error(err); res.status(500).json({ hata: "Sunucu hatası, lütfen tekrar deneyin" });
  }
};

export const adminKiralamaListele = async (req: Request, res: Response) => {
  try {
    const durum = req.query.durum as string | undefined;
    const params: any[] = [];
    let whereClause = "";

    if (durum) {
      if (durum !== "aktif" && durum !== "tamamlandi") {
        return res.status(400).json({ hata: "Geçersiz durum filtresi" });
      }
      whereClause = "WHERE k.durum = $1";
      params.push(durum);
    }

    const result = await pool.query(
      `SELECT k.id, k.kullanici_id, k.arac_id, k.baslangic_tarihi, k.bitis_tarihi, k.durum,
              k.kiralama_tipi, k.sure, k.toplam_tutar, k.kart_son_4,
              ku.email AS kullanici_email, ku.rol AS kullanici_rol,
              a.marka, a.model, a.gunluk_fiyat, a.saatlik_fiyat
       FROM kiralamalar k
       JOIN kullanicilar ku ON ku.id = k.kullanici_id
       JOIN araclar a ON a.id = k.arac_id
       ${whereClause}
       ORDER BY (k.durum = 'aktif') DESC, k.baslangic_tarihi DESC`,
      params
    );

    res.json(result.rows);
  } catch (err: any) {
    console.error(err); res.status(500).json({ hata: "Sunucu hatası, lütfen tekrar deneyin" });
  }
};

export const confirmAgreement = async (req: Request, res: Response) => {
  try {
    const { kiralama_id } = req.body;
    const kullanici_id = (req as any).kullanici.userId;

    const kiralama = await pool.query(
      "SELECT * FROM kiralamalar WHERE id = $1 AND kullanici_id = $2",
      [kiralama_id, kullanici_id]
    );

    if (kiralama.rows.length === 0) {
      return res.status(404).json({ hata: "Kiralama bulunamadı" });
    }

    const kullaniciKontrol = await pool.query(
      "SELECT agreement_accepted FROM kullanicilar WHERE id = $1",
      [kullanici_id]
    );

    if (kullaniciKontrol.rows[0].agreement_accepted) {
      return res.status(400).json({ hata: "Sözleşme zaten onaylanmış" });
    }

    await pool.query(
      "UPDATE kullanicilar SET agreement_accepted = true, agreement_accepted_at = NOW() WHERE id = $1",
      [kullanici_id]
    );

    res.json({ mesaj: "Sözleşme kabul edildi. Kiralama başlatıldı." });
  } catch (err: any) {
    console.error(err); res.status(500).json({ hata: "Sunucu hatası, lütfen tekrar deneyin" });
  }
};
