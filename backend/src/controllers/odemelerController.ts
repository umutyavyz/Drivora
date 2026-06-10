import { Request, Response } from "express";
import pool from "../db";

export const odemelerimListele = async (req: Request, res: Response) => {
  try {
    const kullanici_id = (req as any).kullanici.userId;

    const result = await pool.query(
      `SELECT o.id, o.tutar, o.kart_son_4, o.kart_sahibi, o.durum, o.islem_no,
              o.aciklama, o.olusturma_tarihi,
              o.kiralama_id,
              k.kiralama_tipi, k.sure, k.baslangic_tarihi, k.bitis_tarihi, k.durum AS kiralama_durum,
              a.marka, a.model, a.resim_url
       FROM odemeler o
       LEFT JOIN kiralamalar k ON k.id = o.kiralama_id
       LEFT JOIN araclar a ON a.id = k.arac_id
       WHERE o.kullanici_id = $1
       ORDER BY o.olusturma_tarihi DESC`,
      [kullanici_id]
    );

    res.json(result.rows);
  } catch (err: any) {
    console.error(err); res.status(500).json({ hata: "Sunucu hatası, lütfen tekrar deneyin" });
  }
};

export const adminOdemelerListele = async (req: Request, res: Response) => {
  try {
    const result = await pool.query(
      `SELECT o.id, o.tutar, o.kart_son_4, o.durum, o.islem_no,
              o.aciklama, o.olusturma_tarihi,
              o.kullanici_id, ku.email AS kullanici_email, ku.ad_soyad AS kullanici_ad_soyad,
              o.kiralama_id, a.marka, a.model
       FROM odemeler o
       JOIN kullanicilar ku ON ku.id = o.kullanici_id
       LEFT JOIN kiralamalar k ON k.id = o.kiralama_id
       LEFT JOIN araclar a ON a.id = k.arac_id
       ORDER BY o.olusturma_tarihi DESC`
    );
    res.json(result.rows);
  } catch (err: any) {
    console.error(err); res.status(500).json({ hata: "Sunucu hatası, lütfen tekrar deneyin" });
  }
};
