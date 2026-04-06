import { Router } from "express";
import { araclarListele, aracEkle, aracGuncelle, aracSil } from "../controllers/araclarController";
import { tokenKontrol,adminKontrol } from "../middleware/authMiddleware";

const router = Router();

router.get("/", tokenKontrol, araclarListele);
router.post("/", tokenKontrol,adminKontrol, aracEkle);
router.put("/:id", tokenKontrol,adminKontrol,aracGuncelle);
router.delete("/:id", tokenKontrol,adminKontrol, aracSil);

export default router;