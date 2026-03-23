import { Request, Response } from "express";
import pool from "../db";
import jwt from "jsonwebtoken";

const SECRET_KEY = "drivora-gizli-anahtar";

export const kayit = async (req: Request, res: Response) => {
  try {
    const { email, sifre } = req.body;

    if (!email || !sifre) {
      return res.status(400).json({ hata: "Email ve şifre zorunludur" });
    }

    const result = await pool.query(
      "INSERT INTO kullanicilar (email, sifre) VALUES ($1, $2) RETURNING id, email, rol",
      [email, sifre]
    );

    res.status(201).json({
      mesaj: "Kayıt başarılı",
      kullanici: result.rows[0]
    });
  } catch (err: any) {
    if (err.code === "23505") {
      return res.status(400).json({ hata: "Bu email zaten kayıtlı" });
    }
    res.status(500).json({ hata: err.message });
  }
};

export const giris = async (req: Request, res: Response) => {
  try {
    const { email, sifre } = req.body;

    const result = await pool.query(
      "SELECT * FROM kullanicilar WHERE email = $1",
      [email]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({ hata: "Email veya şifre yanlış" });
    }

    const kullanici = result.rows[0];

    if (kullanici.sifre !== sifre) {
      return res.status(401).json({ hata: "Email veya şifre yanlış" });
    }

    const token = jwt.sign(
      { userId: kullanici.id, email: kullanici.email, rol: kullanici.rol },
      SECRET_KEY,
      { expiresIn: "1h" }
    );

    res.json({ mesaj: "Giriş başarılı", token });
  } catch (err: any) {
    res.status(500).json({ hata: err.message });
  }
};