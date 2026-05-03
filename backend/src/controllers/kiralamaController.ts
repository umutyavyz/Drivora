import { Request, Response } from "express";
import pool from "../db";

export const kiralamaBaslat = async (req: Request, res: Response) => {
  try {
    const { arac_id } = req.body;
    const kullanici_id = (req as any).kullanici.userId;

    // Araç müsait mi kontrol et
    const aracKontrol = await pool.query(
      "SELECT * FROM araclar WHERE id = $1 AND musait = true",
      [arac_id]
    );

    if (aracKontrol.rows.length === 0) {
      return res.status(400).json({ hata: "Araç müsait değil veya bulunamadı" });
    }

    // Kiralama oluştur
    const kiralama = await pool.query(
      "INSERT INTO kiralamalar (kullanici_id, arac_id) VALUES ($1, $2) RETURNING *",
      [kullanici_id, arac_id]
    );

    // Aracı müsait değil olarak güncelle
    await pool.query(
      "UPDATE araclar SET musait = false WHERE id = $1",
      [arac_id]
    );

    res.status(201).json({
      mesaj: "Kiralama başlatıldı",
      kiralama: kiralama.rows[0]
    });
  } catch (err: any) {
    res.status(500).json({ hata: err.message });
  }
};

export const kiralamaListele = async (req: Request, res: Response) => {
  try {
    const kullanici_id = (req as any).kullanici.userId;

    const result = await pool.query(
      `SELECT k.*, a.marka, a.model 
       FROM kiralamalar k 
       JOIN araclar a ON k.arac_id = a.id 
       WHERE k.kullanici_id = $1`,
      [kullanici_id]
    );

    res.json(result.rows);
  } catch (err: any) {
    res.status(500).json({ hata: err.message });
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
    res.status(500).json({ hata: err.message });
  }
};