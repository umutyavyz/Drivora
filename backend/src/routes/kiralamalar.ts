import { Router } from "express";
import {
  kiralamaBaslat,
  kiralamaListele,
  kiralamaBitir,
  adminKiralamaListele,
  adminKiralamaBitir,
  confirmAgreement,
} from "../controllers/kiralamaController";
import { tokenKontrol, adminKontrol } from "../middleware/authMiddleware";

const router = Router();

router.get("/admin", tokenKontrol, adminKontrol, adminKiralamaListele);
router.put("/admin/:id/bitir", tokenKontrol, adminKontrol, adminKiralamaBitir);
router.post("/confirm-agreement", tokenKontrol, confirmAgreement);
router.get("/", tokenKontrol, kiralamaListele);
router.post("/", tokenKontrol, kiralamaBaslat);
router.put("/:id/bitir", tokenKontrol, kiralamaBitir);

export default router;
