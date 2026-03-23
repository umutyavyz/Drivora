import express from "express";
import jwt from "jsonwebtoken";
import araclarRouter from "./routes/araclar";

const app = express();
const PORT = 3000;
const SECRET_KEY = "drivora-gizli-anahtar";

app.use(express.json());

// Giriş endpoint'i
app.post("/giris", (req, res) => {
  const { email, sifre } = req.body;

  if (email === "umut@drivora.com" && sifre === "1234") {
    const token = jwt.sign(
      { userId: 1, email },
      SECRET_KEY,
      { expiresIn: "1h" }
    );
    return res.json({ mesaj: "Giriş başarılı", token });
  }

  return res.status(401).json({ hata: "Email veya şifre yanlış" });
});

// Araçlar router'ı
app.use("/araclar", araclarRouter);

app.listen(PORT, () => {
  console.log(`Sunucu ${PORT} portunda çalışıyor`);
});