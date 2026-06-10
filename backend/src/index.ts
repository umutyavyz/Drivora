import "dotenv/config";
import express from "express";
import cors from "cors";
import helmet from "helmet";
import https from "https";
import http from "http";
import fs from "fs";
import path from "path";
import araclarRouter from "./routes/araclar";
import kullanicilarRouter from "./routes/kullanicilar";
import kiralamaRouter from "./routes/kiralamalar";
import odemelerRouter from "./routes/odemeler";
import kartlarRouter from "./routes/kartlar";
import favorilerRouter from "./routes/favoriler";
import degerlendirmelerRouter from "./routes/degerlendirmeler";
import { emailDogrulaSayfa, sifreSifirlaSayfa } from "./controllers/authPagesController";

const app = express();
const PORT = Number(process.env.PORT) || 3000;

// Güvenlik başlıkları
app.use(helmet());

// CORS — yalnızca izinli kaynaklar (origin'siz istekler: mobil uygulama/curl serbest)
const varsayilanKaynaklar = [
  process.env.FRONTEND_URL,
  "http://localhost:8100",
  "https://localhost:8100",
  "http://localhost:4200",
].filter(Boolean) as string[];
const ekKaynaklar = (process.env.CORS_ORIGINS || "")
  .split(",")
  .map((s) => s.trim())
  .filter(Boolean);
const izinliKaynaklar = [...new Set([...varsayilanKaynaklar, ...ekKaynaklar])];

// localhost ve özel ağ (LAN) IP'lerinden gelen origin'lere her portta izin ver.
// Bu, IP değişen geliştirme/telefon testlerinde girişin bozulmasını önler;
// kamuya açık origin'ler yine engellenir.
const yerelVeyaLanMi = (origin: string): boolean => {
  try {
    const { hostname } = new URL(origin);
    if (hostname === "localhost" || hostname === "127.0.0.1") return true;
    if (/^10\.\d{1,3}\.\d{1,3}\.\d{1,3}$/.test(hostname)) return true;
    if (/^192\.168\.\d{1,3}\.\d{1,3}$/.test(hostname)) return true;
    if (/^172\.(1[6-9]|2\d|3[01])\.\d{1,3}\.\d{1,3}$/.test(hostname)) return true;
    return false;
  } catch {
    return false;
  }
};

app.use(
  cors({
    origin: (origin, cb) => {
      if (!origin || origin === 'null' || origin === 'capacitor://localhost' || origin === 'ionic://localhost' || izinliKaynaklar.includes(origin) || yerelVeyaLanMi(origin)) {
        return cb(null, true);
      }
      return cb(new Error(`CORS engellendi: ${origin}`));
    },
  })
);

app.use(express.json());

// E-postadaki linkler doğrudan backend'e gelir; bu sayfalar kendi içinde HTML
// döner (frontend barındırmaya gerek yok). FRONTEND_URL backend adresine işaret
// ettiğinde link'ler bu uçlara düşer.
app.get("/email-dogrula", emailDogrulaSayfa);
app.get("/sifre-sifirla", sifreSifirlaSayfa);

app.use("/araclar", araclarRouter);
app.use("/kullanicilar", kullanicilarRouter);
app.use("/kiralamalar", kiralamaRouter);
app.use("/odemeler", odemelerRouter);
app.use("/kartlar", kartlarRouter);
app.use("/favoriler", favorilerRouter);
app.use("/degerlendirmeler", degerlendirmelerRouter);

// Eşleşmeyen route → 404
app.use((req, res) => {
  res.status(404).json({ hata: "Kaynak bulunamadı" });
});

// Merkezi hata yakalayıcı — beklenmeyen hataları yutar, detay sızdırmaz
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error("Beklenmeyen hata:", err);
  res.status(500).json({ hata: "Sunucu hatası, lütfen tekrar deneyin" });
});

const smtpDurumLog = () => {
  const smtpHazir = !!(process.env.SMTP_USER && process.env.SMTP_PASS);
  console.log(`SMTP yapılandırması: ${smtpHazir ? `HAZIR (${process.env.SMTP_USER})` : "EKSIK — .env dosyasını kontrol et"}`);
};

// SSL sertifikalarını esnek şekilde yükle; yoksa HTTP'ye düş (başka makinelerde çökmesin)
const keyPath = process.env.SSL_KEY_PATH || path.join(__dirname, "../../frontend/app/10.77.234.40-key.pem");
const certPath = process.env.SSL_CERT_PATH || path.join(__dirname, "../../frontend/app/10.77.234.40.pem");

try {
  const sslOptions = {
    key: fs.readFileSync(keyPath),
    cert: fs.readFileSync(certPath),
  };
  https.createServer(sslOptions, app).listen(PORT, "0.0.0.0", () => {
    console.log(`Sunucu HTTPS https://0.0.0.0:${PORT} adresinde çalışıyor`);
    smtpDurumLog();
  });
} catch (e: any) {
  console.warn(`SSL sertifikası okunamadı (${e.message}). HTTP'ye düşülüyor.`);
  http.createServer(app).listen(PORT, "0.0.0.0", () => {
    console.log(`Sunucu HTTP http://0.0.0.0:${PORT} adresinde çalışıyor (SSL yok)`);
    smtpDurumLog();
  });
}
