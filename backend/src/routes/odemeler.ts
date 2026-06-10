import { Router } from "express";
import { odemelerimListele, adminOdemelerListele } from "../controllers/odemelerController";
import { tokenKontrol, adminKontrol } from "../middleware/authMiddleware";

const router = Router();

router.get("/admin", tokenKontrol, adminKontrol, adminOdemelerListele);
router.get("/", tokenKontrol, odemelerimListele);

export default router;
