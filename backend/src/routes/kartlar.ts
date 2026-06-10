import { Router } from "express";
import {
  kartlariListele,
  kartEkle,
  kartSil,
  kartVarsayilanYap,
} from "../controllers/kartlarController";
import { tokenKontrol } from "../middleware/authMiddleware";

const router = Router();

router.get("/", tokenKontrol, kartlariListele);
router.post("/", tokenKontrol, kartEkle);
router.put("/:id/varsayilan", tokenKontrol, kartVarsayilanYap);
router.delete("/:id", tokenKontrol, kartSil);

export default router;
