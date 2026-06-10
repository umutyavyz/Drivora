import { Request, Response } from "express";
import pool from "../db";

// E-postadaki doğrulama/sıfırlama linkleri doğrudan backend'e gelir ve burada
// kendi içinde (frontend barındırmaya gerek kalmadan) HTML sayfası döner.
// Böylece linkler her cihazdan, herhangi bir ağdan çalışır.

const sayfaSar = (baslik: string, govde: string): string => `<!DOCTYPE html>
<html lang="tr"><head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>${baslik} · Drivora</title>
<style>
  *{box-sizing:border-box} body{margin:0;min-height:100vh;display:flex;align-items:center;justify-content:center;
    background:#0d1424;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;padding:20px}
  .card{background:#fff;max-width:420px;width:100%;border-radius:18px;overflow:hidden;box-shadow:0 20px 60px rgba(0,0,0,.4)}
  .head{background:#0f1e38;padding:22px 28px;border-bottom:3px solid #4a9eff}
  .brand{font-size:20px;font-weight:800;color:#fff;letter-spacing:-.4px}
  .body{padding:34px 28px}
  h1{margin:0 0 8px;font-size:21px;color:#0f172a;font-weight:800}
  p{margin:0 0 14px;font-size:14px;color:#475569;line-height:1.6}
  .ok{color:#16a34a;font-weight:700} .err{color:#dc2626;font-weight:700}
  label{display:block;font-size:11px;font-weight:700;color:#64748b;letter-spacing:1px;margin:16px 0 6px}
  input{width:100%;padding:12px 14px;border:1px solid #cbd5e1;border-radius:10px;font-size:16px;outline:none}
  input:focus{border-color:#4a9eff}
  button{width:100%;margin-top:20px;padding:14px;border:none;border-radius:12px;background:linear-gradient(135deg,#4a9eff,#2563eb);
    color:#fff;font-size:15px;font-weight:700;cursor:pointer}
  button:disabled{opacity:.6}
  .msg{margin-top:16px;font-size:14px;text-align:center}
</style></head>
<body><div class="card"><div class="head"><span class="brand">Drivora</span></div>
<div class="body">${govde}</div></div></body></html>`;

// GET /email-dogrula?token=...
export const emailDogrulaSayfa = async (req: Request, res: Response) => {
  const token = String(req.query.token || "").trim();
  const hata = (mesaj: string) =>
    res.status(200).send(sayfaSar("Doğrulama", `<h1 class="err">Doğrulanamadı</h1><p>${mesaj}</p>`));
  try {
    if (!token) return hata("Geçersiz bağlantı.");

    const result = await pool.query(
      `SELECT id, email_dogrulandi, email_dogrulama_son_tarih
       FROM kullanicilar WHERE email_dogrulama_token = $1`,
      [token]
    );
    if (result.rows.length === 0) return hata("Bağlantı geçersiz veya zaten kullanılmış.");

    const k = result.rows[0];
    if (k.email_dogrulandi)
      return res.status(200).send(
        sayfaSar("Doğrulama", `<h1 class="ok">Zaten doğrulanmış</h1><p>Hesabın daha önce doğrulanmış. Uygulamaya dönebilirsin.</p>`)
      );
    if (k.email_dogrulama_son_tarih && new Date(k.email_dogrulama_son_tarih) < new Date())
      return hata("Bağlantının süresi dolmuş. Uygulamadan yeni doğrulama maili gönderebilirsin.");

    await pool.query(
      `UPDATE kullanicilar
         SET email_dogrulandi = true, email_dogrulama_token = NULL, email_dogrulama_son_tarih = NULL
       WHERE id = $1`,
      [k.id]
    );

    res.status(200).send(
      sayfaSar("Doğrulama", `<h1 class="ok">E-posta doğrulandı ✓</h1><p>Hesabın başarıyla doğrulandı. Artık Drivora uygulamasına dönüp araç kiralayabilirsin.</p>`)
    );
  } catch {
    hata("Beklenmeyen bir hata oluştu, lütfen tekrar dene.");
  }
};

// GET /sifre-sifirla?token=...  → yeni şifre formu (POST /kullanicilar/sifre-sifirla'ya gider)
export const sifreSifirlaSayfa = async (req: Request, res: Response) => {
  const token = String(req.query.token || "").trim();
  const hata = (mesaj: string) =>
    res.status(200).send(sayfaSar("Şifre Sıfırlama", `<h1 class="err">Bağlantı geçersiz</h1><p>${mesaj}</p>`));
  try {
    if (!token) return hata("Geçersiz bağlantı.");

    const result = await pool.query(
      `SELECT sifre_sifirlama_son_tarih FROM kullanicilar WHERE sifre_sifirlama_token = $1`,
      [token]
    );
    if (result.rows.length === 0) return hata("Bağlantı geçersiz veya zaten kullanılmış.");
    const k = result.rows[0];
    if (k.sifre_sifirlama_son_tarih && new Date(k.sifre_sifirlama_son_tarih) < new Date())
      return hata("Bağlantının süresi dolmuş (30 dakika). Uygulamadan yeniden sıfırlama isteyebilirsin.");

    const tokenJson = JSON.stringify(token);
    const govde = `
      <h1>Yeni şifre belirle</h1>
      <p>Hesabın için yeni bir şifre gir (en az 6 karakter).</p>
      <label>YENİ ŞİFRE</label>
      <input id="s1" type="password" placeholder="••••••••" autocomplete="new-password"/>
      <label>YENİ ŞİFRE (TEKRAR)</label>
      <input id="s2" type="password" placeholder="••••••••" autocomplete="new-password"/>
      <button id="btn" onclick="gonder()">Şifremi güncelle</button>
      <div id="msg" class="msg"></div>
      <script>
        var TOKEN = ${tokenJson};
        async function gonder(){
          var s1=document.getElementById('s1').value, s2=document.getElementById('s2').value;
          var msg=document.getElementById('msg'), btn=document.getElementById('btn');
          msg.className='msg'; msg.textContent='';
          if(s1.length<6){msg.className='msg err';msg.textContent='Şifre en az 6 karakter olmalı.';return;}
          if(s1!==s2){msg.className='msg err';msg.textContent='Şifreler eşleşmiyor.';return;}
          btn.disabled=true; btn.textContent='Gönderiliyor...';
          try{
            var r=await fetch('/kullanicilar/sifre-sifirla',{method:'POST',headers:{'Content-Type':'application/json'},
              body:JSON.stringify({token:TOKEN,yeniSifre:s1})});
            var d=await r.json();
            if(r.ok){msg.className='msg ok';msg.textContent='✓ '+(d.mesaj||'Şifren güncellendi. Uygulamadan giriş yapabilirsin.');
              btn.style.display='none';document.getElementById('s1').disabled=true;document.getElementById('s2').disabled=true;}
            else{msg.className='msg err';msg.textContent=d.hata||'Bir hata oluştu.';btn.disabled=false;btn.textContent='Şifremi güncelle';}
          }catch(e){msg.className='msg err';msg.textContent='Sunucuya ulaşılamadı.';btn.disabled=false;btn.textContent='Şifremi güncelle';}
        }
      </script>`;
    res.status(200).send(sayfaSar("Şifre Sıfırlama", govde));
  } catch {
    hata("Beklenmeyen bir hata oluştu, lütfen tekrar dene.");
  }
};
