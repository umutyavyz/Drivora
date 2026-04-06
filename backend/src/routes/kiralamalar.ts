import { Router } from "express";
import { kiralamaBaslat, kiralamaListele } from "../controllers/kiralamaController";
import { tokenKontrol } from "../middleware/authMiddleware";

const router = Router();

router.get("/", tokenKontrol, kiralamaListele);
router.post("/", tokenKontrol, kiralamaBaslat);

export default router;