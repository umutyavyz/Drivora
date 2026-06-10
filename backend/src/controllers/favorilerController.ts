import { Request, Response } from "express";
import pool from "../db";

// Giriş yapan kullanıcının favori araçları (araç bilgileriyle birlikte)
export const favorileriListele = async (req: Request, res: Response) => {
  try {
    const kullanici_id = (req as any).kullanici.userId;
    const result = await pool.query(
      `SELECT a.*, f.olusturma_tarihi AS favori_tarihi
       FROM favoriler f
       JOIN araclar a ON a.id = f.arac_id
       WHERE f.kullanici_id = $1
       ORDER BY f.olusturma_tarihi DESC`,
      [kullanici_id]
    );
    res.json(result.rows);
  } catch (err: any) {
    console.error(err); res.status(500).json({ hata: "Sunucu hatası, lütfen tekrar deneyin" });
  }
};

// Favoriye ekle (idempotent)
export const favoriEkle = async (req: Request, res: Response) => {
  try {
    const kullanici_id = (req as any).kullanici.userId;
    const arac_id = Number(req.body.arac_id);
    if (!arac_id) {
      return res.status(400).json({ hata: "arac_id zorunlu" });
    }

    const arac = await pool.query("SELECT id FROM araclar WHERE id = $1", [arac_id]);
    if (arac.rows.length === 0) {
      return res.status(404).json({ hata: "Araç bulunamadı" });
    }

    await pool.query(
      `INSERT INTO favoriler (kullanici_id, arac_id) VALUES ($1, $2)
       ON CONFLICT (kullanici_id, arac_id) DO NOTHING`,
      [kullanici_id, arac_id]
    );
    res.status(201).json({ mesaj: "Favorilere eklendi", favori: true });
  } catch (err: any) {
    console.error(err); res.status(500).json({ hata: "Sunucu hatası, lütfen tekrar deneyin" });
  }
};

// Favoriden çıkar
export const favoriSil = async (req: Request, res: Response) => {
  try {
    const kullanici_id = (req as any).kullanici.userId;
    const arac_id = Number(req.params.aracId);
    if (!arac_id) {
      return res.status(400).json({ hata: "Geçersiz araç" });
    }
    await pool.query(
      "DELETE FROM favoriler WHERE kullanici_id = $1 AND arac_id = $2",
      [kullanici_id, arac_id]
    );
    res.json({ mesaj: "Favorilerden çıkarıldı", favori: false });
  } catch (err: any) {
    console.error(err); res.status(500).json({ hata: "Sunucu hatası, lütfen tekrar deneyin" });
  }
};
