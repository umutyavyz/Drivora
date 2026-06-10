import { Request, Response } from "express";
import pool from "../db";

// Yorum sahibinin adını gizlemek için: ad_soyad yoksa email maskelenir
const isimGizle = (adSoyad: string | null, email: string): string => {
  if (adSoyad && adSoyad.trim()) {
    // "Umut Yavuz" → "Umut Y."
    const parcalar = adSoyad.trim().split(/\s+/);
    if (parcalar.length > 1) {
      return `${parcalar[0]} ${parcalar[parcalar.length - 1][0].toUpperCase()}.`;
    }
    return parcalar[0];
  }
  const ad = email.split("@")[0];
  return ad.length <= 2 ? ad[0] + "***" : ad.slice(0, 2) + "***";
};

// Bir aracın değerlendirmeleri: ortalama, adet, liste ve (giriş yapana özel)
// kendi yorumu + değerlendirme hakkı
export const aracDegerlendirmeleri = async (req: Request, res: Response) => {
  try {
    const arac_id = Number(req.params.aracId);
    const kullanici_id = (req as any).kullanici?.userId ?? null;
    if (!arac_id) {
      return res.status(400).json({ hata: "Geçersiz araç" });
    }

    const ozet = await pool.query(
      `SELECT COALESCE(ROUND(AVG(puan)::numeric, 1), 0) AS ortalama,
              COUNT(*)::int AS adet
       FROM degerlendirmeler WHERE arac_id = $1`,
      [arac_id]
    );

    const liste = await pool.query(
      `SELECT d.id, d.puan, d.yorum, d.olusturma_tarihi, d.kullanici_id,
              k.ad_soyad, k.email
       FROM degerlendirmeler d
       JOIN kullanicilar k ON k.id = d.kullanici_id
       WHERE d.arac_id = $1
       ORDER BY d.olusturma_tarihi DESC`,
      [arac_id]
    );

    const liste2 = liste.rows.map((r) => ({
      id: r.id,
      puan: r.puan,
      yorum: r.yorum,
      tarih: r.olusturma_tarihi,
      isim: isimGizle(r.ad_soyad, r.email),
      benimMi: kullanici_id != null && r.kullanici_id === kullanici_id,
    }));

    const benimSatir = kullanici_id != null
      ? liste.rows.find((r) => r.kullanici_id === kullanici_id)
      : null;

    // Değerlendirme hakkı: kullanıcı bu aracı en az bir kez kiralamış olmalı
    let degerlendirebilir = false;
    if (kullanici_id != null) {
      const kira = await pool.query(
        "SELECT 1 FROM kiralamalar WHERE kullanici_id = $1 AND arac_id = $2 LIMIT 1",
        [kullanici_id, arac_id]
      );
      degerlendirebilir = kira.rows.length > 0;
    }

    res.json({
      ortalama: Number(ozet.rows[0].ortalama),
      adet: ozet.rows[0].adet,
      degerlendirebilir,
      benim: benimSatir ? { puan: benimSatir.puan, yorum: benimSatir.yorum } : null,
      liste: liste2,
    });
  } catch (err: any) {
    console.error(err); res.status(500).json({ hata: "Sunucu hatası, lütfen tekrar deneyin" });
  }
};

// Değerlendirme ekle/güncelle (kullanıcı+araç başına tek kayıt → upsert)
export const degerlendirmeEkle = async (req: Request, res: Response) => {
  try {
    const kullanici_id = (req as any).kullanici.userId;
    const arac_id = Number(req.body.arac_id);
    const puan = Number(req.body.puan);
    const yorum = req.body.yorum != null && String(req.body.yorum).trim() !== ""
      ? String(req.body.yorum).trim().slice(0, 1000)
      : null;

    if (!arac_id) {
      return res.status(400).json({ hata: "arac_id zorunlu" });
    }
    if (!Number.isInteger(puan) || puan < 1 || puan > 5) {
      return res.status(400).json({ hata: "Puan 1 ile 5 arasında olmalı" });
    }

    // Yalnızca kiraladığı aracı değerlendirebilir
    const kira = await pool.query(
      `SELECT id FROM kiralamalar
       WHERE kullanici_id = $1 AND arac_id = $2
       ORDER BY baslangic_tarihi DESC LIMIT 1`,
      [kullanici_id, arac_id]
    );
    if (kira.rows.length === 0) {
      return res.status(403).json({ hata: "Yalnızca kiraladığın araçları değerlendirebilirsin" });
    }
    const kiralama_id = kira.rows[0].id;

    const result = await pool.query(
      `INSERT INTO degerlendirmeler (kullanici_id, arac_id, kiralama_id, puan, yorum)
       VALUES ($1, $2, $3, $4, $5)
       ON CONFLICT (kullanici_id, arac_id)
       DO UPDATE SET puan = EXCLUDED.puan,
                     yorum = EXCLUDED.yorum,
                     kiralama_id = EXCLUDED.kiralama_id,
                     guncelleme_tarihi = NOW()
       RETURNING *`,
      [kullanici_id, arac_id, kiralama_id, puan, yorum]
    );

    res.status(201).json({ mesaj: "Değerlendirmen kaydedildi", degerlendirme: result.rows[0] });
  } catch (err: any) {
    console.error(err); res.status(500).json({ hata: "Sunucu hatası, lütfen tekrar deneyin" });
  }
};

// Kullanıcının kendi değerlendirmesini siler
export const degerlendirmeSil = async (req: Request, res: Response) => {
  try {
    const kullanici_id = (req as any).kullanici.userId;
    const arac_id = Number(req.params.aracId);
    if (!arac_id) {
      return res.status(400).json({ hata: "Geçersiz araç" });
    }
    await pool.query(
      "DELETE FROM degerlendirmeler WHERE kullanici_id = $1 AND arac_id = $2",
      [kullanici_id, arac_id]
    );
    res.json({ mesaj: "Değerlendirme silindi" });
  } catch (err: any) {
    console.error(err); res.status(500).json({ hata: "Sunucu hatası, lütfen tekrar deneyin" });
  }
};
