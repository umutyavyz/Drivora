import express from "express";
import araclarRouter from "./routes/araclar";
import kullanicilarRouter from "./routes/kullanicilar";
import kiralamaRouter from "./routes/kiralamalar";

const app = express();
const PORT = 3000;

app.use(express.json());

app.use("/araclar", araclarRouter);
app.use("/kullanicilar", kullanicilarRouter);
app.use("/kiralamalar", kiralamaRouter);

app.listen(PORT, () => {
  console.log(`Sunucu ${PORT} portunda çalışıyor`);
});