import { Router } from "express";
import { araclarListele, aracEkle, aracGuncelle, aracSil } from "../controllers/araclarController";
import { tokenKontrol } from "../middleware/authMiddleware";

const router = Router();

router.get("/", tokenKontrol, araclarListele);
router.post("/", tokenKontrol, aracEkle);
router.put("/:id", tokenKontrol, aracGuncelle);
router.delete("/:id", tokenKontrol, aracSil);

export default router;