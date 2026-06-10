import { Request, Response } from "express";
import { PoolClient } from "pg";
import pool from "../db";

// Kart numarasından marka tespiti (sadece BIN aralıklarına bakar)
export const kartMarkasiBul = (kartNo: string): string => {
  const n = kartNo.replace(/\D/g, "");
  if (n.startsWith("4")) return "VISA";
  if (/^5[1-5]/.test(n) || /^2[2-7]/.test(n)) return "MASTERCARD";
  if (/^3[47]/.test(n)) return "AMEX";
  if (/^9792/.test(n) || /^65/.test(n)) return "TROY";
  return "KART";
};

// AA/YY format ve gelecekte olma kontrolü
const sonKullanmaGecerli = (sk: string): boolean => {
  if (!/^\d{2}\/\d{2}$/.test(sk)) return false;
  const [ayStr, yilStr] = sk.split("/");
  const ay = parseInt(ayStr, 10);
  const yil = parseInt(yilStr, 10);
  if (ay < 1 || ay > 12) return false;
  const simdi = new Date();
  const buYil = simdi.getFullYear() % 100;
  const buAy = simdi.getMonth() + 1;
  if (yil < buYil || (yil === buYil && ay < buAy)) return false;
  return true;
};

/**
 * Yeni kartı kaydeder. Tam numara/CVV saklanmaz; sadece son 4 hane + sahip +
 * son kullanma + marka. kiralamaBaslat içinden de çağrılabilsin diye opsiyonel
 * olarak mevcut bir transaction client'ı alır. Aynı kart zaten varsa onun
 * id'sini döner (idempotent).
 */
export const kartKaydet = async (
  kullanici_id: number,
  kart_no: string,
  kart_sahibi: string,
  son_kullanma: string,
  varsayilan: boolean,
  client: PoolClient | typeof pool = pool
): Promise<number | null> => {
  const kartTemiz = String(kart_no).replace(/\s+/g, "");
  if (kartTemiz.length < 13 || !/^\d+$/.test(kartTemiz)) return null;
  if (!sonKullanmaGecerli(son_kullanma)) return null;

  const son4 = kartTemiz.slice(-4);
  const sahip = String(kart_sahibi).trim().slice(0, 100);
  const marka = kartMarkasiBul(kartTemiz);

  if (varsayilan) {
    await client.query(
      "UPDATE kayitli_kartlar SET varsayilan = false WHERE kullanici_id = $1",
      [kullanici_id]
    );
  }

  // İlk kart otomatik varsayılan olsun
  const mevcutSayi = await client.query(
    "SELECT COUNT(*)::int AS adet FROM kayitli_kartlar WHERE kullanici_id = $1",
    [kullanici_id]
  );
  const ilkKart = mevcutSayi.rows[0].adet === 0;

  const sonuc = await client.query(
    `INSERT INTO kayitli_kartlar (kullanici_id, kart_sahibi, kart_son_4, son_kullanma, kart_marka, varsayilan)
     VALUES ($1, $2, $3, $4, $5, $6)
     ON CONFLICT (kullanici_id, kart_son_4, son_kullanma)
     DO UPDATE SET kart_sahibi = EXCLUDED.kart_sahibi, kart_marka = EXCLUDED.kart_marka
     RETURNING id`,
    [kullanici_id, sahip, son4, son_kullanma, marka, varsayilan || ilkKart]
  );
  return sonuc.rows[0].id;
};

export const kartlariListele = async (req: Request, res: Response) => {
  try {
    const kullanici_id = (req as any).kullanici.userId;
    const sonuc = await pool.query(
      `SELECT id, kart_sahibi, kart_son_4, son_kullanma, kart_marka, varsayilan, olusturma_tarihi
       FROM kayitli_kartlar
       WHERE kullanici_id = $1
       ORDER BY varsayilan DESC, olusturma_tarihi DESC`,
      [kullanici_id]
    );
    res.json(sonuc.rows);
  } catch (err: any) {
    console.error(err); res.status(500).json({ hata: "Sunucu hatası, lütfen tekrar deneyin" });
  }
};

export const kartEkle = async (req: Request, res: Response) => {
  try {
    const kullanici_id = (req as any).kullanici.userId;
    const { kart_no, kart_sahibi, kart_son_kullanma, varsayilan } = req.body;

    if (!kart_no || !kart_sahibi || !kart_son_kullanma) {
      return res.status(400).json({ hata: "Kart bilgileri eksik" });
    }

    const id = await kartKaydet(
      kullanici_id,
      kart_no,
      kart_sahibi,
      kart_son_kullanma,
      !!varsayilan
    );

    if (!id) {
      return res.status(400).json({ hata: "Geçersiz kart bilgileri" });
    }

    const sonuc = await pool.query(
      `SELECT id, kart_sahibi, kart_son_4, son_kullanma, kart_marka, varsayilan, olusturma_tarihi
       FROM kayitli_kartlar WHERE id = $1`,
      [id]
    );
    res.status(201).json(sonuc.rows[0]);
  } catch (err: any) {
    console.error(err); res.status(500).json({ hata: "Sunucu hatası, lütfen tekrar deneyin" });
  }
};

export const kartSil = async (req: Request, res: Response) => {
  try {
    const kullanici_id = (req as any).kullanici.userId;
    const id = req.params.id;

    const sonuc = await pool.query(
      "DELETE FROM kayitli_kartlar WHERE id = $1 AND kullanici_id = $2 RETURNING varsayilan",
      [id, kullanici_id]
    );

    if (sonuc.rows.length === 0) {
      return res.status(404).json({ hata: "Kart bulunamadı" });
    }

    // Silinen kart varsayılan ise, kalan en yeni kartı varsayılan yap
    if (sonuc.rows[0].varsayilan) {
      await pool.query(
        `UPDATE kayitli_kartlar SET varsayilan = true
         WHERE id = (
           SELECT id FROM kayitli_kartlar WHERE kullanici_id = $1
           ORDER BY olusturma_tarihi DESC LIMIT 1
         )`,
        [kullanici_id]
      );
    }

    res.json({ mesaj: "Kart silindi" });
  } catch (err: any) {
    console.error(err); res.status(500).json({ hata: "Sunucu hatası, lütfen tekrar deneyin" });
  }
};

export const kartVarsayilanYap = async (req: Request, res: Response) => {
  try {
    const kullanici_id = (req as any).kullanici.userId;
    const id = req.params.id;

    const kontrol = await pool.query(
      "SELECT id FROM kayitli_kartlar WHERE id = $1 AND kullanici_id = $2",
      [id, kullanici_id]
    );
    if (kontrol.rows.length === 0) {
      return res.status(404).json({ hata: "Kart bulunamadı" });
    }

    await pool.query(
      "UPDATE kayitli_kartlar SET varsayilan = false WHERE kullanici_id = $1",
      [kullanici_id]
    );
    await pool.query(
      "UPDATE kayitli_kartlar SET varsayilan = true WHERE id = $1",
      [id]
    );

    res.json({ mesaj: "Varsayılan kart güncellendi" });
  } catch (err: any) {
    console.error(err); res.status(500).json({ hata: "Sunucu hatası, lütfen tekrar deneyin" });
  }
};
