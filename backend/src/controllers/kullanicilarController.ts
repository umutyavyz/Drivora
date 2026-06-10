import { Request, Response } from "express";
import crypto from "crypto";
import bcrypt from "bcrypt";
import pool from "../db";
import jwt from "jsonwebtoken";
import { dogrulamaMailiGonder, sifreSifirlamaMaili, smtpHazirMi } from "../services/emailService";

const SECRET_KEY = process.env.JWT_SECRET || "drivora-gizli-anahtar";
const GECERLI_ROLLER = ["kullanici", "admin"];
const BCRYPT_TUR = 10;

const tokenUret = () => crypto.randomBytes(32).toString("hex");

// Basit ama makul email format kontrolü (boşluksuz, tek @, alan adında nokta)
const emailGecerli = (email: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) && email.length <= 254;

// Bir değerin bcrypt hash'i olup olmadığını anlar ($2a/$2b/$2y ile başlar)
const hashliMi = (deger: string) => /^\$2[aby]\$/.test(deger || "");

const sifreHashle = (sifre: string) => bcrypt.hash(sifre, BCRYPT_TUR);

// Düz metin şifreyi saklanan değerle karşılaştırır. Saklanan değer eski (düz metin)
// ise düz karşılaştırma yapar; böylece migration öncesi kullanıcılar kilitlenmez.
const sifreDogru = async (girilen: string, saklanan: string): Promise<boolean> => {
  if (hashliMi(saklanan)) {
    return bcrypt.compare(girilen, saklanan);
  }
  return girilen === saklanan;
};

const jwtTokenOlustur = (kullanici: any) => {
  return jwt.sign(
    {
      userId: kullanici.id,
      email: kullanici.email,
      rol: kullanici.rol,
      ad_soyad: kullanici.ad_soyad || null,
      email_dogrulandi: !!kullanici.email_dogrulandi,
    },
    SECRET_KEY,
    { expiresIn: "1h" }
  );
};

export const profilGetir = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).kullanici?.userId;
    const result = await pool.query(
      "SELECT id, email, rol, ad_soyad, telefon, dogum_tarihi, email_dogrulandi FROM kullanicilar WHERE id = $1",
      [userId]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ hata: "Kullanıcı bulunamadı" });
    }
    res.json(result.rows[0]);
  } catch (err: any) {
    console.error(err); res.status(500).json({ hata: "Sunucu hatası, lütfen tekrar deneyin" });
  }
};

export const profilGuncelle = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).kullanici?.userId;
    const ad_soyad = req.body.ad_soyad?.trim() || null;
    const telefon = req.body.telefon?.trim() || null;
    const dogum_tarihi = req.body.dogum_tarihi || null;

    if (dogum_tarihi) {
      const sinir = new Date();
      sinir.setFullYear(sinir.getFullYear() - 18);
      if (new Date(dogum_tarihi) > sinir) {
        return res.status(400).json({ hata: "18 yaşından küçükler için bu tarih girilemez" });
      }
    }

    const result = await pool.query(
      `UPDATE kullanicilar SET
         ad_soyad    = COALESCE($1, ad_soyad),
         telefon     = $2,
         dogum_tarihi = $3
       WHERE id = $4
       RETURNING id, email, rol, ad_soyad, telefon, dogum_tarihi, email_dogrulandi`,
      [ad_soyad, telefon, dogum_tarihi, userId]
    );
    res.json({ mesaj: "Profil güncellendi", kullanici: result.rows[0] });
  } catch (err: any) {
    console.error(err); res.status(500).json({ hata: "Sunucu hatası, lütfen tekrar deneyin" });
  }
};

export const kayit = async (req: Request, res: Response) => {
  try {
    const email = String(req.body.email || "").trim().toLowerCase();
    const { sifre, ad_soyad, telefon, dogum_tarihi } = req.body;

    if (!email || !sifre) {
      return res.status(400).json({ hata: "Email ve şifre zorunludur" });
    }

    if (!emailGecerli(email)) {
      return res.status(400).json({ hata: "Geçerli bir email adresi girin" });
    }

    if (String(sifre).length < 6) {
      return res.status(400).json({ hata: "Şifre en az 6 karakter olmalı" });
    }

    if (dogum_tarihi) {
      const sinir = new Date();
      sinir.setFullYear(sinir.getFullYear() - 18);
      if (new Date(dogum_tarihi) > sinir) {
        return res.status(400).json({ hata: "18 yaşından küçükler kayıt olamaz" });
      }
    }

    const dogrulamaToken = tokenUret();
    const sonTarih = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 saat
    const hashliSifre = await sifreHashle(sifre);

    const result = await pool.query(
      `INSERT INTO kullanicilar
         (email, sifre, ad_soyad, telefon, dogum_tarihi, email_dogrulama_token, email_dogrulama_son_tarih)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING id, email, rol, ad_soyad, telefon, dogum_tarihi, email_dogrulandi`,
      [email, hashliSifre, ad_soyad || null, telefon || null, dogum_tarihi || null, dogrulamaToken, sonTarih]
    );

    const yeniKullanici = result.rows[0];

    let mailGonderildi = false;
    if (smtpHazirMi()) {
      try {
        await dogrulamaMailiGonder(email, dogrulamaToken, yeniKullanici.ad_soyad);
        mailGonderildi = true;
      } catch (mailHata: any) {
        console.error("Doğrulama maili gönderilemedi:", mailHata.message);
      }
    } else {
      console.warn(`[DEMO] Doğrulama linki: ${process.env.FRONTEND_URL}/email-dogrula?token=${dogrulamaToken}`);
    }

    const token = jwtTokenOlustur(yeniKullanici);

    res.status(201).json({
      mesaj: "Kayıt başarılı",
      kullanici: yeniKullanici,
      token,
      dogrulama_maili_gonderildi: mailGonderildi,
    });
  } catch (err: any) {
    if (err.code === "23505") {
      return res.status(400).json({ hata: "Bu email zaten kayıtlı" });
    }
    console.error(err); res.status(500).json({ hata: "Sunucu hatası, lütfen tekrar deneyin" });
  }
};

export const giris = async (req: Request, res: Response) => {
  try {
    const email = String(req.body.email || "").trim().toLowerCase();
    const { sifre } = req.body;

    const result = await pool.query(
      "SELECT * FROM kullanicilar WHERE LOWER(email) = $1",
      [email]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({ hata: "Email veya şifre yanlış" });
    }

    const kullanici = result.rows[0];

    if (!(await sifreDogru(sifre, kullanici.sifre))) {
      return res.status(401).json({ hata: "Email veya şifre yanlış" });
    }

    // Eski düz metin şifre ise girişte otomatik hash'le (upgrade-on-login)
    if (!hashliMi(kullanici.sifre)) {
      try {
        const yeniHash = await sifreHashle(sifre);
        await pool.query("UPDATE kullanicilar SET sifre = $1 WHERE id = $2", [yeniHash, kullanici.id]);
      } catch (e) {
        // yükseltme başarısız olsa bile giriş engellenmesin
      }
    }

    const token = jwtTokenOlustur(kullanici);

    res.json({
      mesaj: "Giriş başarılı",
      token,
      email_dogrulandi: !!kullanici.email_dogrulandi,
    });
  } catch (err: any) {
    console.error(err); res.status(500).json({ hata: "Sunucu hatası, lütfen tekrar deneyin" });
  }
};

export const emailDogrula = async (req: Request, res: Response) => {
  try {
    const token = String(req.body.token || req.query.token || "").trim();
    if (!token) {
      return res.status(400).json({ hata: "Token zorunlu" });
    }

    const result = await pool.query(
      `SELECT id, email, rol, ad_soyad, email_dogrulandi, email_dogrulama_son_tarih
       FROM kullanicilar
       WHERE email_dogrulama_token = $1`,
      [token]
    );

    if (result.rows.length === 0) {
      return res.status(400).json({ hata: "Doğrulama linki geçersiz veya zaten kullanılmış" });
    }

    const kullanici = result.rows[0];

    if (kullanici.email_dogrulandi) {
      return res.json({ mesaj: "Hesabın zaten doğrulanmış", zaten_dogrulu: true });
    }

    if (kullanici.email_dogrulama_son_tarih && new Date(kullanici.email_dogrulama_son_tarih) < new Date()) {
      return res.status(400).json({ hata: "Doğrulama linkinin süresi dolmuş. Yeniden mail gönderebilirsin." });
    }

    const guncel = await pool.query(
      `UPDATE kullanicilar
         SET email_dogrulandi = true,
             email_dogrulama_token = NULL,
             email_dogrulama_son_tarih = NULL
       WHERE id = $1
       RETURNING id, email, rol, ad_soyad, email_dogrulandi`,
      [kullanici.id]
    );

    const yeniToken = jwtTokenOlustur(guncel.rows[0]);

    res.json({
      mesaj: "Hesabın başarıyla doğrulandı",
      token: yeniToken,
    });
  } catch (err: any) {
    console.error(err); res.status(500).json({ hata: "Sunucu hatası, lütfen tekrar deneyin" });
  }
};

export const dogrulamaMailiYenidenGonder = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).kullanici?.userId;

    const result = await pool.query(
      "SELECT id, email, ad_soyad, email_dogrulandi FROM kullanicilar WHERE id = $1",
      [userId]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ hata: "Kullanıcı bulunamadı" });
    }
    const kullanici = result.rows[0];
    if (kullanici.email_dogrulandi) {
      return res.status(400).json({ hata: "Hesabın zaten doğrulanmış" });
    }

    const yeniToken = tokenUret();
    const sonTarih = new Date(Date.now() + 24 * 60 * 60 * 1000);

    await pool.query(
      "UPDATE kullanicilar SET email_dogrulama_token = $1, email_dogrulama_son_tarih = $2 WHERE id = $3",
      [yeniToken, sonTarih, kullanici.id]
    );

    if (smtpHazirMi()) {
      try {
        await dogrulamaMailiGonder(kullanici.email, yeniToken, kullanici.ad_soyad);
      } catch (mailHata: any) {
        console.error("Doğrulama maili gönderilemedi:", mailHata.message);
        return res.status(502).json({ hata: "Doğrulama maili şu an gönderilemedi, lütfen biraz sonra tekrar dene" });
      }
    } else {
      console.warn(`[DEMO] Doğrulama linki: ${process.env.FRONTEND_URL}/email-dogrula?token=${yeniToken}`);
    }

    res.json({ mesaj: "Doğrulama maili tekrar gönderildi" });
  } catch (err: any) {
    console.error(err); res.status(500).json({ hata: "Sunucu hatası, lütfen tekrar deneyin" });
  }
};

export const sifreSifirlamaIstek = async (req: Request, res: Response) => {
  try {
    const email = String(req.body.email || "").trim().toLowerCase();
    if (!email) {
      return res.status(400).json({ hata: "Email zorunlu" });
    }

    const result = await pool.query(
      "SELECT id, email, ad_soyad FROM kullanicilar WHERE LOWER(email) = $1",
      [email]
    );

    // Kullanıcı bulunsa da bulunmasa da aynı cevabı dön — email enumeration'a karşı
    if (result.rows.length > 0) {
      const kullanici = result.rows[0];
      const token = tokenUret();
      const sonTarih = new Date(Date.now() + 30 * 60 * 1000); // 30 dakika

      await pool.query(
        "UPDATE kullanicilar SET sifre_sifirlama_token = $1, sifre_sifirlama_son_tarih = $2 WHERE id = $3",
        [token, sonTarih, kullanici.id]
      );

      if (smtpHazirMi()) {
        try {
          await sifreSifirlamaMaili(kullanici.email, token, kullanici.ad_soyad);
        } catch (mailHata: any) {
          console.error("Şifre sıfırlama maili gönderilemedi:", mailHata.message);
        }
      } else {
        console.warn(`[DEMO] Sıfırlama linki: ${process.env.FRONTEND_URL}/sifre-sifirla?token=${token}`);
      }
    }

    res.json({ mesaj: "Eğer bu email kayıtlıysa, sıfırlama linki gönderildi" });
  } catch (err: any) {
    console.error(err); res.status(500).json({ hata: "Sunucu hatası, lütfen tekrar deneyin" });
  }
};

export const sifreSifirla = async (req: Request, res: Response) => {
  try {
    const token = String(req.body.token || "").trim();
    const yeniSifre = String(req.body.yeniSifre || "");
    if (!token || !yeniSifre) {
      return res.status(400).json({ hata: "Token ve yeni şifre zorunludur" });
    }
    if (yeniSifre.length < 6) {
      return res.status(400).json({ hata: "Şifre en az 6 karakter olmalı" });
    }

    const result = await pool.query(
      `SELECT id, sifre_sifirlama_son_tarih
       FROM kullanicilar
       WHERE sifre_sifirlama_token = $1`,
      [token]
    );

    if (result.rows.length === 0) {
      return res.status(400).json({ hata: "Sıfırlama linki geçersiz veya zaten kullanılmış" });
    }

    const kullanici = result.rows[0];
    if (kullanici.sifre_sifirlama_son_tarih && new Date(kullanici.sifre_sifirlama_son_tarih) < new Date()) {
      return res.status(400).json({ hata: "Sıfırlama linkinin süresi dolmuş" });
    }

    const hashliSifre = await sifreHashle(yeniSifre);

    await pool.query(
      `UPDATE kullanicilar
         SET sifre = $1,
             sifre_sifirlama_token = NULL,
             sifre_sifirlama_son_tarih = NULL
       WHERE id = $2`,
      [hashliSifre, kullanici.id]
    );

    res.json({ mesaj: "Şifren başarıyla güncellendi" });
  } catch (err: any) {
    console.error(err); res.status(500).json({ hata: "Sunucu hatası, lütfen tekrar deneyin" });
  }
};

export const kullanicilariListele = async (req: Request, res: Response) => {
  try {
    const result = await pool.query(
      "SELECT id, email, rol, ad_soyad, telefon, dogum_tarihi, email_dogrulandi FROM kullanicilar ORDER BY id"
    );
    res.json(result.rows);
  } catch (err: any) {
    console.error(err); res.status(500).json({ hata: "Sunucu hatası, lütfen tekrar deneyin" });
  }
};

export const kullaniciEkleAdmin = async (req: Request, res: Response) => {
  try {
    const email = req.body.email?.trim().toLowerCase();
    const sifre = req.body.sifre;
    const rol = req.body.rol || "kullanici";

    if (!email || !sifre) {
      return res.status(400).json({ hata: "Email ve şifre zorunludur" });
    }

    if (!emailGecerli(email)) {
      return res.status(400).json({ hata: "Geçerli bir email adresi girin" });
    }

    if (String(sifre).length < 6) {
      return res.status(400).json({ hata: "Şifre en az 6 karakter olmalı" });
    }

    if (!GECERLI_ROLLER.includes(rol)) {
      return res.status(400).json({ hata: "Geçersiz rol bilgisi" });
    }

    const hashliSifre = await sifreHashle(sifre);

    // Admin tarafından eklenen kullanıcılar doğrulanmış sayılır
    const result = await pool.query(
      "INSERT INTO kullanicilar (email, sifre, rol, email_dogrulandi) VALUES ($1, $2, $3, true) RETURNING id, email, rol, email_dogrulandi",
      [email, hashliSifre, rol]
    );

    res.status(201).json({
      mesaj: "Kullanıcı eklendi",
      kullanici: result.rows[0],
    });
  } catch (err: any) {
    if (err.code === "23505") {
      return res.status(400).json({ hata: "Bu email zaten kayıtlı" });
    }
    console.error(err); res.status(500).json({ hata: "Sunucu hatası, lütfen tekrar deneyin" });
  }
};

export const kullaniciGuncelleAdmin = async (req: Request, res: Response) => {
  try {
    const id = req.params.id;
    const email = req.body.email?.trim().toLowerCase() || null;
    const sifre = req.body.sifre || null;
    const rol = req.body.rol || null;
    const ad_soyad = req.body.ad_soyad?.trim() || null;
    const telefon = req.body.telefon?.trim() || null;
    const dogum_tarihi = req.body.dogum_tarihi || null;

    if (rol && !GECERLI_ROLLER.includes(rol)) {
      return res.status(400).json({ hata: "Geçersiz rol bilgisi" });
    }

    const hashliSifre = sifre ? await sifreHashle(sifre) : null;

    const result = await pool.query(
      `UPDATE kullanicilar SET
         email        = COALESCE($1, email),
         sifre        = COALESCE($2, sifre),
         rol          = COALESCE($3, rol),
         ad_soyad     = COALESCE($4, ad_soyad),
         telefon      = $5,
         dogum_tarihi = $6
       WHERE id = $7
       RETURNING id, email, rol, ad_soyad, telefon, dogum_tarihi, email_dogrulandi`,
      [email, hashliSifre, rol, ad_soyad, telefon, dogum_tarihi, id]
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
    console.error(err); res.status(500).json({ hata: "Sunucu hatası, lütfen tekrar deneyin" });
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

    if (!(await sifreDogru(mevcutSifre, result.rows[0].sifre))) {
      return res.status(400).json({ hata: "Mevcut şifre yanlış" });
    }

    const hashliSifre = await sifreHashle(yeniSifre);

    await pool.query(
      "UPDATE kullanicilar SET sifre = $1 WHERE id = $2",
      [hashliSifre, userId]
    );

    res.json({ mesaj: "Şifre güncellendi" });
  } catch (err: any) {
    console.error(err); res.status(500).json({ hata: "Sunucu hatası, lütfen tekrar deneyin" });
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
    console.error(err); res.status(500).json({ hata: "Sunucu hatası, lütfen tekrar deneyin" });
  } finally {
    client.release();
  }
};
