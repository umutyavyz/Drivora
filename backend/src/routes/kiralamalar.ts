import { Router } from "express";
import {
  kiralamaBaslat,
  kiralamaListele,
  kiralamaBitir,
  adminKiralamaListele,
} from "../controllers/kiralamaController";
import { tokenKontrol, adminKontrol } from "../middleware/authMiddleware";

const router = Router();

router.get("/admin", tokenKontrol, adminKontrol, adminKiralamaListele);
router.get("/", tokenKontrol, kiralamaListele);
router.post("/", tokenKontrol, kiralamaBaslat);
router.put("/:id/bitir", tokenKontrol, kiralamaBitir);

export default router;
