import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";

const SECRET_KEY = "drivora-gizli-anahtar";

export const tokenKontrol = (req: Request, res: Response, next: NextFunction) => {
  const authHeader = req.headers["authorization"];
  const token = authHeader?.split(" ")[1];

  if (!token) {
    return res.status(401).json({ hata: "Token gerekli" });
  }

  try {
    const decoded = jwt.verify(token, SECRET_KEY);
    (req as any).kullanici = decoded;
    next();
  } catch {
    return res.status(401).json({ hata: "Geçersiz token" });
  }
};

export const adminKontrol = (req: Request, res: Response, next:NextFunction) => {
  const kullanici = (req as any).kullanici;

  if (!kullanici){
    return res.status(401).json({hata:"Token Gerekli"});
  }
  if (kullanici.rol !== "admin"){
    return res.status(403).json({hata:"Bu işlem için admin yetkisi gerekli"});
  }
  next();
};