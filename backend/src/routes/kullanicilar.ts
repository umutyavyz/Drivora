import { Router } from "express";
import {
  kayit,
  giris,
  sifreDegistir,
  profilGetir,
  profilGuncelle,
  kullanicilariListele,
  kullaniciEkleAdmin,
  kullaniciGuncelleAdmin,
  kullaniciSilAdmin,
  emailDogrula,
  dogrulamaMailiYenidenGonder,
  sifreSifirlamaIstek,
  sifreSifirla,
} from "../controllers/kullanicilarController";
import { tokenKontrol, adminKontrol } from "../middleware/authMiddleware";
import rateLimit from "express-rate-limit";

const router = Router();

// Kimlik doğrulama endpoint'lerinde brute-force'a karşı oran sınırı:
// 15 dakikada IP başına 20 deneme.
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { hata: "Çok fazla deneme yapıldı. Lütfen biraz sonra tekrar deneyin." },
});

// Mail gönderen uçlar için daha sıkı sınır: 15 dakikada IP başına 5 istek
// (doğrulama mailini yeniden gönderme spam'ine karşı).
const mailLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: { hata: "Çok fazla mail isteği. Lütfen biraz sonra tekrar deneyin." },
});

router.post("/kayit", authLimiter, kayit);
router.post("/giris", authLimiter, giris);
router.post("/email-dogrula", authLimiter, emailDogrula);
router.post("/dogrulama-yeniden-gonder", mailLimiter, tokenKontrol, dogrulamaMailiYenidenGonder);
router.post("/sifre-sifirlama-istek", authLimiter, sifreSifirlamaIstek);
router.post("/sifre-sifirla", authLimiter, sifreSifirla);
router.put("/sifre-degistir", tokenKontrol, sifreDegistir);
router.get("/profil", tokenKontrol, profilGetir);
router.put("/profil", tokenKontrol, profilGuncelle);
router.get("/", tokenKontrol, adminKontrol, kullanicilariListele);
router.post("/", tokenKontrol, adminKontrol, kullaniciEkleAdmin);
router.put("/:id", tokenKontrol, adminKontrol, kullaniciGuncelleAdmin);
router.delete("/:id", tokenKontrol, adminKontrol, kullaniciSilAdmin);

export default router;
