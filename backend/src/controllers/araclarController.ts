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
    const { marka, model } = req.body;
    if (!marka || !model) {
      return res.status(400).json({ hata: "Marka ve model zorunludur" });
    }
    const result = await pool.query(
      "INSERT INTO araclar (marka, model) VALUES ($1, $2) RETURNING *",
      [marka, model]
    );
    res.status(201).json({ mesaj: "Araç eklendi", arac: result.rows[0] });
  } catch (err: any) {
    res.status(500).json({ hata: err.message });
  }
};

export const aracGuncelle = async (req: Request, res: Response) => {
  try {
    const id = req.params.id;
    const { marka, model, musait } = req.body;
    const result = await pool.query(
      "UPDATE araclar SET marka = $1, model = $2, musait = $3 WHERE id = $4 RETURNING *",
      [marka, model, musait, id]
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