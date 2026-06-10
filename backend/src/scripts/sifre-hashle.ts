/**
 * Tek seferlik migration: veritabanındaki düz metin şifreleri bcrypt ile hash'ler.
 *
 * Çalıştırma:
 *   cd backend && npx ts-node src/scripts/sifre-hashle.ts
 *
 * Güvenli ve idempotent'tir: zaten hash'li ($2a/$2b/$2y ile başlayan) şifreler
 * atlanır, dolayısıyla script birden fazla kez çalıştırılabilir.
 */
import "dotenv/config";
import bcrypt from "bcrypt";
import pool from "../db";

const BCRYPT_TUR = 10;
const hashliMi = (deger: string) => /^\$2[aby]\$/.test(deger || "");

const calistir = async () => {
  const { rows } = await pool.query("SELECT id, email, sifre FROM kullanicilar");
  let hashlenecek = 0;
  let atlanan = 0;

  for (const k of rows) {
    if (!k.sifre || hashliMi(k.sifre)) {
      atlanan++;
      continue;
    }
    const yeniHash = await bcrypt.hash(k.sifre, BCRYPT_TUR);
    await pool.query("UPDATE kullanicilar SET sifre = $1 WHERE id = $2", [yeniHash, k.id]);
    hashlenecek++;
    console.log(`  ✓ #${k.id} (${k.email}) hash'lendi`);
  }

  console.log(`\nTamamlandı. Hash'lenen: ${hashlenecek}, zaten hash'li/atlanan: ${atlanan}, toplam: ${rows.length}`);
};

calistir()
  .catch((err) => {
    console.error("Migration hatası:", err.message);
    process.exitCode = 1;
  })
  .finally(() => pool.end());
