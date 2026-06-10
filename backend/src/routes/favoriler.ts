import { Router } from "express";
import { favorileriListele, favoriEkle, favoriSil } from "../controllers/favorilerController";
import { tokenKontrol } from "../middleware/authMiddleware";

const router = Router();

router.get("/", tokenKontrol, favorileriListele);
router.post("/", tokenKontrol, favoriEkle);
router.delete("/:aracId", tokenKontrol, favoriSil);

export default router;
