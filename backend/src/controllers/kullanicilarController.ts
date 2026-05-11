import { Request, Response } from "express";
import pool from "../db";
import jwt from "jsonwebtoken";

const SECRET_KEY = "drivora-gizli-anahtar";
const GECERLI_ROLLER = ["kullanici", "admin"];

export const kayit = async (req: Request, res: Response) => {
  try {
    const { email, sifre, ad_soyad } = req.body;

    if (!email || !sifre) {
      return res.status(400).json({ hata: "Email ve şifre zorunludur" });
    }

    const result = await pool.query(
      "INSERT INTO kullanicilar (email, sifre, ad_soyad) VALUES ($1, $2, $3) RETURNING id, email, rol, ad_soyad",
      [email, sifre, ad_soyad || null]
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
      { userId: kullanici.id, email: kullanici.email, rol: kullanici.rol, ad_soyad: kullanici.ad_soyad || null },
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
      "SELECT id, email, rol, ad_soyad FROM kullanicilar ORDER BY id"
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
    const ad_soyad = req.body.ad_soyad?.trim() || null;

    if (rol && !GECERLI_ROLLER.includes(rol)) {
      return res.status(400).json({ hata: "Geçersiz rol bilgisi" });
    }

    const result = await pool.query(
      `UPDATE kullanicilar SET
         email    = COALESCE($1, email),
         sifre    = COALESCE($2, sifre),
         rol      = COALESCE($3, rol),
         ad_soyad = COALESCE($4, ad_soyad)
       WHERE id = $5
       RETURNING id, email, rol, ad_soyad`,
      [email, sifre, rol, ad_soyad, id]
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

export const sifreDegistir = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).kullanici?.userId;
    const { mevcutSifre, yeniSifre } = req.body;

    if (!mevcutSifre || !yeniSifre) {
      return res.status(400).json({ hata: "Mevcut ve yeni şifre zorunludur" });
    }

    const result = await pool.query(
      "SELECT sifre FROM kullanicilar WHERE id = $1",
      [userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ hata: "Kullanıcı bulunamadı" });
    }

    if (result.rows[0].sifre !== mevcutSifre) {
      return res.status(401).json({ hata: "Mevcut şifre yanlış" });
    }

    await pool.query(
      "UPDATE kullanicilar SET sifre = $1 WHERE id = $2",
      [yeniSifre, userId]
    );

    res.json({ mesaj: "Şifre güncellendi" });
  } catch (err: any) {
    res.status(500).json({ hata: err.message });
  }
};

export const kullaniciSilAdmin = async (req: Request, res: Response) => {
  const client = await pool.connect();
  try {
    const id = Number(req.params.id);
    const aktifKullaniciId = Number((req as any).kullanici?.userId);

    if (id === aktifKullaniciId) {
      return res.status(400).json({ hata: "Kendi hesabını silemezsin" });
    }

    await client.query('BEGIN');
    await client.query("DELETE FROM kiralamalar WHERE kullanici_id = $1", [id]);
    const result = await client.query(
      "DELETE FROM kullanicilar WHERE id = $1 RETURNING id, email, rol",
      [id]
    );

    if (result.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ hata: "Kullanıcı bulunamadı" });
    }

    await client.query('COMMIT');
    res.json({
      mesaj: "Kullanıcı silindi",
      kullanici: result.rows[0],
    });
  } catch (err: any) {
    await client.query('ROLLBACK');
    res.status(500).json({ hata: err.message });
  } finally {
    client.release();
  }
};
