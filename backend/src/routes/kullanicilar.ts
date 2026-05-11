import { Router } from "express";
import {
  kayit,
  giris,
  sifreDegistir,
  kullanicilariListele,
  kullaniciEkleAdmin,
  kullaniciGuncelleAdmin,
  kullaniciSilAdmin,
} from "../controllers/kullanicilarController";
import { tokenKontrol, adminKontrol } from "../middleware/authMiddleware";

const router = Router();

router.post("/kayit", kayit);
router.post("/giris", giris);
router.put("/sifre-degistir", tokenKontrol, sifreDegistir);
router.get("/", tokenKontrol, adminKontrol, kullanicilariListele);
router.post("/", tokenKontrol, adminKontrol, kullaniciEkleAdmin);
router.put("/:id", tokenKontrol, adminKontrol, kullaniciGuncelleAdmin);
router.delete("/:id", tokenKontrol, adminKontrol, kullaniciSilAdmin);

export default router;
