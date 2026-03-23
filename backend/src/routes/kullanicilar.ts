import { Router } from "express";
import { kayit, giris } from "../controllers/kullanicilarController";

const router = Router();

router.post("/kayit", kayit);
router.post("/giris", giris);

export default router;