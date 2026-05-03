import { Router } from "express";
import { kiralamaBaslat, kiralamaListele, kiralamaBitir } from "../controllers/kiralamaController";
import { tokenKontrol } from "../middleware/authMiddleware";

const router = Router();

router.get("/", tokenKontrol, kiralamaListele);
router.post("/", tokenKontrol, kiralamaBaslat);
router.put("/:id/bitir", tokenKontrol, kiralamaBitir);

export default router;