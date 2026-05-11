import { Request, Response } from "express";
import pool from "../db";

export const kiralamaBaslat = async (req: Request, res: Response) => {
  try {
    const { arac_id } = req.body;
    const kullanici_id = (req as any).kullanici.userId;

    // Kullanıcının aktif kiralaması var mı kontrol et
    const aktifKiralama = await pool.query(
      "SELECT id FROM kiralamalar WHERE kullanici_id = $1 AND durum = 'aktif' LIMIT 1",
      [kullanici_id]
    );

    if (aktifKiralama.rows.length > 0) {
      return res.status(409).json({ hata: "Zaten aktif bir kiralaman var. Yeni araç kiralamak için önce mevcut kiralamayı bitir." });
    }

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
      `SELECT k.*,
              a.marka, a.model, a.resim_url, a.kategori,
              a.yakit, a.vites, a.gunluk_fiyat
       FROM kiralamalar k
       JOIN araclar a ON k.arac_id = a.id
       WHERE k.kullanici_id = $1
       ORDER BY (k.durum = 'aktif') DESC, k.baslangic_tarihi DESC`,
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

export const adminKiralamaListele = async (req: Request, res: Response) => {
  try {
    const durum = req.query.durum as string | undefined;
    const params: any[] = [];
    let whereClause = "";

    if (durum) {
      if (durum !== "aktif" && durum !== "tamamlandi") {
        return res.status(400).json({ hata: "Geçersiz durum filtresi" });
      }
      whereClause = "WHERE k.durum = $1";
      params.push(durum);
    }

    const result = await pool.query(
      `SELECT k.id, k.kullanici_id, k.arac_id, k.baslangic_tarihi, k.bitis_tarihi, k.durum,
              ku.email AS kullanici_email, ku.rol AS kullanici_rol,
              a.marka, a.model, a.gunluk_fiyat
       FROM kiralamalar k
       JOIN kullanicilar ku ON ku.id = k.kullanici_id
       JOIN araclar a ON a.id = k.arac_id
       ${whereClause}
       ORDER BY (k.durum = 'aktif') DESC, k.baslangic_tarihi DESC`,
      params
    );

    res.json(result.rows);
  } catch (err: any) {
    res.status(500).json({ hata: err.message });
  }
};
