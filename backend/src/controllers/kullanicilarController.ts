import { Request, Response } from "express";
import pool from "../db";
import jwt from "jsonwebtoken";

const SECRET_KEY = "drivora-gizli-anahtar";
const GECERLI_ROLLER = ["kullanici", "admin"];

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

export const kullanicilariListele = async (req: Request, res: Response) => {
  try {
    const result = await pool.query(
      "SELECT id, email, rol FROM kullanicilar ORDER BY id"
    );
    res.json(result.rows);
  } catch (err: any) {
    res.status(500).json({ hata: err.message });
  }
};

export const kullaniciEkleAdmin = async (req: Request, res: Response) => {
  try {
    const email = req.body.email?.trim();
    const sifre = req.body.sifre;
    const rol = req.body.rol || "kullanici";

    if (!email || !sifre) {
      return res.status(400).json({ hata: "Email ve şifre zorunludur" });
    }

    if (!GECERLI_ROLLER.includes(rol)) {
      return res.status(400).json({ hata: "Geçersiz rol bilgisi" });
    }

    const result = await pool.query(
      "INSERT INTO kullanicilar (email, sifre, rol) VALUES ($1, $2, $3) RETURNING id, email, rol",
      [email, sifre, rol]
    );

    res.status(201).json({
      mesaj: "Kullanıcı eklendi",
      kullanici: result.rows[0],
    });
  } catch (err: any) {
    if (err.code === "23505") {
      return res.status(400).json({ hata: "Bu email zaten kayıtlı" });
    }
    res.status(500).json({ hata: err.message });
  }
};

export const kullaniciGuncelleAdmin = async (req: Request, res: Response) => {
  try {
    const id = req.params.id;
    const email = req.body.email?.trim() || null;
    const sifre = req.body.sifre || null;
    const rol = req.body.rol || null;

    if (rol && !GECERLI_ROLLER.includes(rol)) {
      return res.status(400).json({ hata: "Geçersiz rol bilgisi" });
    }

    const result = await pool.query(
      `UPDATE kullanicilar SET
         email = COALESCE($1, email),
         sifre = COALESCE($2, sifre),
         rol   = COALESCE($3, rol)
       WHERE id = $4
       RETURNING id, email, rol`,
      [email, sifre, rol, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ hata: "Kullanıcı bulunamadı" });
    }

    res.json({
      mesaj: "Kullanıcı güncellendi",
      kullanici: result.rows[0],
    });
  } catch (err: any) {
    if (err.code === "23505") {
      return res.status(400).json({ hata: "Bu email zaten kayıtlı" });
    }
    res.status(500).json({ hata: err.message });
  }
};

export const kullaniciSilAdmin = async (req: Request, res: Response) => {
  try {
    const id = Number(req.params.id);
    const aktifKullaniciId = Number((req as any).kullanici?.userId);

    if (id === aktifKullaniciId) {
      return res.status(400).json({ hata: "Kendi hesabını silemezsin" });
    }

    const result = await pool.query(
      "DELETE FROM kullanicilar WHERE id = $1 RETURNING id, email, rol",
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ hata: "Kullanıcı bulunamadı" });
    }

    res.json({
      mesaj: "Kullanıcı silindi",
      kullanici: result.rows[0],
    });
  } catch (err: any) {
    if (err.code === "23503") {
      return res.status(400).json({
        hata: "Bu kullanıcının kiralama kayıtları olduğu için silinemez",
      });
    }
    res.status(500).json({ hata: err.message });
  }
};
