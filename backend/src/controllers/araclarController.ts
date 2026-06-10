import { Request, Response } from "express";
import pool from "../db";

// Sayısal alan doğrulama yardımcıları
const sayiGecerli = (v: any) => v !== null && v !== undefined && v !== "" && !isNaN(Number(v));

/**
 * Araç sayısal alanlarını doğrular. `zorunluFiyat` true ise gunluk_fiyat'ı
 * zorunlu kılar (ekleme); güncellemede yalnızca gönderilen alanlar denetlenir.
 * Hata varsa mesaj döner, yoksa null.
 */
const aracSayisalHata = (b: any, zorunluFiyat: boolean): string | null => {
  const { gunluk_fiyat, saatlik_fiyat, latitude, longitude } = b;

  if (zorunluFiyat || gunluk_fiyat !== undefined) {
    if (!sayiGecerli(gunluk_fiyat) || Number(gunluk_fiyat) <= 0) {
      return "Günlük fiyat pozitif bir sayı olmalı";
    }
  }
  if (saatlik_fiyat !== undefined && saatlik_fiyat !== null) {
    if (!sayiGecerli(saatlik_fiyat) || Number(saatlik_fiyat) < 0) {
      return "Saatlik fiyat geçersiz";
    }
  }
  if (latitude !== undefined && latitude !== null) {
    if (!sayiGecerli(latitude) || Number(latitude) < -90 || Number(latitude) > 90) {
      return "Enlem (latitude) -90 ile 90 arasında olmalı";
    }
  }
  if (longitude !== undefined && longitude !== null) {
    if (!sayiGecerli(longitude) || Number(longitude) < -180 || Number(longitude) > 180) {
      return "Boylam (longitude) -180 ile 180 arasında olmalı";
    }
  }
  return null;
};

export const araclarListele = async (req: Request, res: Response) => {
  try {
    const result = await pool.query(
      `SELECT a.*,
              COALESCE(ROUND(AVG(d.puan)::numeric, 1), 0) AS ortalama_puan,
              COUNT(d.id)::int AS degerlendirme_sayisi
       FROM araclar a
       LEFT JOIN degerlendirmeler d ON d.arac_id = a.id
       GROUP BY a.id
       ORDER BY a.id`
    );
    res.json(result.rows);
  } catch (err: any) {
    console.error(err); res.status(500).json({ hata: "Sunucu hatası, lütfen tekrar deneyin" });
  }
};

export const aracEkle = async (req: Request, res: Response) => {
  try {
    const {
      marka, model, musait, gunluk_fiyat, saatlik_fiyat, resim_url,
      kategori, kasa_tipi, latitude, longitude, yakit, vites, resim_urls
    } = req.body;

    if (!marka || !model) {
      return res.status(400).json({ hata: "Marka ve model zorunludur" });
    }

    const sayisalHata = aracSayisalHata(req.body, true);
    if (sayisalHata) {
      return res.status(400).json({ hata: sayisalHata });
    }

    const result = await pool.query(
      `INSERT INTO araclar
        (marka, model, musait, gunluk_fiyat, saatlik_fiyat, resim_url, kategori, kasa_tipi, latitude, longitude, yakit, vites, resim_urls)
       VALUES ($1, $2, COALESCE($3, true), $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
       RETURNING *`,
      [marka, model, musait, gunluk_fiyat, saatlik_fiyat || null, resim_url, kategori, kasa_tipi, latitude, longitude, yakit, vites, resim_urls || null]
    );
    res.status(201).json({ mesaj: "Araç eklendi", arac: result.rows[0] });
  } catch (err: any) {
    console.error(err); res.status(500).json({ hata: "Sunucu hatası, lütfen tekrar deneyin" });
  }
};

export const aracGuncelle = async (req: Request, res: Response) => {
  try {
    const id = req.params.id;
    const {
      marka, model, musait, gunluk_fiyat, saatlik_fiyat, resim_url,
      kategori, kasa_tipi, latitude, longitude, yakit, vites, resim_urls
    } = req.body;

    const sayisalHata = aracSayisalHata(req.body, false);
    if (sayisalHata) {
      return res.status(400).json({ hata: sayisalHata });
    }

    const result = await pool.query(
      `UPDATE araclar SET
         marka        = COALESCE($1, marka),
         model        = COALESCE($2, model),
         musait       = COALESCE($3, musait),
         gunluk_fiyat = COALESCE($4, gunluk_fiyat),
         saatlik_fiyat = $5,
         resim_url    = COALESCE($6, resim_url),
         kategori     = COALESCE($7, kategori),
         kasa_tipi    = COALESCE($8, kasa_tipi),
         latitude     = COALESCE($9, latitude),
         longitude    = COALESCE($10, longitude),
         yakit        = COALESCE($11, yakit),
         vites        = COALESCE($12, vites),
         resim_urls   = $13,
         guncelleme_tarihi = NOW()
       WHERE id = $14
       RETURNING *`,
      [marka, model, musait, gunluk_fiyat, saatlik_fiyat ?? null, resim_url, kategori, kasa_tipi, latitude, longitude, yakit, vites, resim_urls ?? null, id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ hata: "Araç bulunamadı" });
    }
    res.json({ mesaj: "Araç güncellendi", arac: result.rows[0] });
  } catch (err: any) {
    console.error(err); res.status(500).json({ hata: "Sunucu hatası, lütfen tekrar deneyin" });
  }
};

export const aracSil = async (req: Request, res: Response) => {
  const client = await pool.connect();
  try {
    const id = req.params.id;
    await client.query('BEGIN');
    await client.query("DELETE FROM kiralamalar WHERE arac_id = $1", [id]);
    const result = await client.query(
      "DELETE FROM araclar WHERE id = $1 RETURNING *",
      [id]
    );
    if (result.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ hata: "Araç bulunamadı" });
    }
    await client.query('COMMIT');
    res.json({ mesaj: "Araç silindi", arac: result.rows[0] });
  } catch (err: any) {
    await client.query('ROLLBACK');
    console.error(err); res.status(500).json({ hata: "Sunucu hatası, lütfen tekrar deneyin" });
  } finally {
    client.release();
  }
};