import { Router } from "express";
import {
  aracDegerlendirmeleri,
  degerlendirmeEkle,
  degerlendirmeSil,
} from "../controllers/degerlendirmelerController";
import { tokenKontrol } from "../middleware/authMiddleware";

const router = Router();

router.get("/arac/:aracId", tokenKontrol, aracDegerlendirmeleri);
router.post("/", tokenKontrol, degerlendirmeEkle);
router.delete("/arac/:aracId", tokenKontrol, degerlendirmeSil);

export default router;
