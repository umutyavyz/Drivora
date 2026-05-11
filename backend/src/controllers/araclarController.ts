import { Request, Response } from "express";
import pool from "../db";

export const araclarListele = async (req: Request, res: Response) => {
  try {
    const result = await pool.query("SELECT * FROM araclar ORDER BY id");
    res.json(result.rows);
  } catch (err: any) {
    res.status(500).json({ hata: err.message });
  }
};

export const aracEkle = async (req: Request, res: Response) => {
  try {
    const {
      marka, model, musait, gunluk_fiyat, resim_url,
      kategori, latitude, longitude, yakit, vites
    } = req.body;

    if (!marka || !model) {
      return res.status(400).json({ hata: "Marka ve model zorunludur" });
    }

    const result = await pool.query(
      `INSERT INTO araclar
        (marka, model, musait, gunluk_fiyat, resim_url, kategori, latitude, longitude, yakit, vites)
       VALUES ($1, $2, COALESCE($3, true), $4, $5, $6, $7, $8, $9, $10)
       RETURNING *`,
      [marka, model, musait, gunluk_fiyat, resim_url, kategori, latitude, longitude, yakit, vites]
    );
    res.status(201).json({ mesaj: "Araç eklendi", arac: result.rows[0] });
  } catch (err: any) {
    res.status(500).json({ hata: err.message });
  }
};

export const aracGuncelle = async (req: Request, res: Response) => {
  try {
    const id = req.params.id;
    const {
      marka, model, musait, gunluk_fiyat, resim_url,
      kategori, latitude, longitude, yakit, vites
    } = req.body;

    const result = await pool.query(
      `UPDATE araclar SET
         marka        = COALESCE($1, marka),
         model        = COALESCE($2, model),
         musait       = COALESCE($3, musait),
         gunluk_fiyat = COALESCE($4, gunluk_fiyat),
         resim_url    = COALESCE($5, resim_url),
         kategori     = COALESCE($6, kategori),
         latitude     = COALESCE($7, latitude),
         longitude    = COALESCE($8, longitude),
         yakit        = COALESCE($9, yakit),
         vites        = COALESCE($10, vites)
       WHERE id = $11
       RETURNING *`,
      [marka, model, musait, gunluk_fiyat, resim_url, kategori, latitude, longitude, yakit, vites, id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ hata: "Araç bulunamadı" });
    }
    res.json({ mesaj: "Araç güncellendi", arac: result.rows[0] });
  } catch (err: any) {
    res.status(500).json({ hata: err.message });
  }
};

export const aracSil = async (req: Request, res: Response) => {
  try {
    const id = req.params.id;
    const result = await pool.query(
      "DELETE FROM araclar WHERE id = $1 RETURNING *",
      [id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ hata: "Araç bulunamadı" });
    }
    res.json({ mesaj: "Araç silindi", arac: result.rows[0] });
  } catch (err: any) {
    res.status(500).json({ hata: err.message });
  }
};