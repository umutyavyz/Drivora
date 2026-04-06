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