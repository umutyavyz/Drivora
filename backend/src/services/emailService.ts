import nodemailer, { Transporter } from "nodemailer";

let transporter: Transporter | null = null;

const transporterAl = (): Transporter => {
  if (transporter) return transporter;

  const host = process.env.SMTP_HOST || "smtp.gmail.com";
  const port = Number(process.env.SMTP_PORT) || 465;
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;

  if (!user || !pass) {
    throw new Error("SMTP_USER veya SMTP_PASS .env'de tanımlı değil");
  }

  transporter = nodemailer.createTransport({
    host,
    port,
    secure: port === 465,
    auth: { user, pass },
  });

  return transporter;
};

const gondericiBasligi = (): string => {
  const ad = process.env.SMTP_FROM_NAME || "Drivora";
  const user = process.env.SMTP_USER || "noreply@drivora.app";
  return `"${ad}" <${user}>`;
};

const frontendUrl = () => process.env.FRONTEND_URL || "http://localhost:8100";

// Kullanıcı kaynaklı metni email HTML'ine güvenle gömmek için kaçış
const htmlKacis = (metin: string): string =>
  String(metin)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");

// SVG ikonlar — inline, email istemcilerinde çalışır
const SVG = {
  car: `<svg width="26" height="19" viewBox="0 0 26 19" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M4.5 8.5L6.8 3.5C7.1 2.9 7.7 2.5 8.4 2.5H17.6C18.3 2.5 18.9 2.9 19.2 3.5L21.5 8.5"
          stroke="white" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/>
    <rect x="1.5" y="8.5" width="23" height="7" rx="2.5" stroke="white" stroke-width="1.6"/>
    <circle cx="7.5" cy="16.5" r="2.5" stroke="white" stroke-width="1.5"/>
    <circle cx="18.5" cy="16.5" r="2.5" stroke="white" stroke-width="1.5"/>
  </svg>`,

  envelope: `<svg width="24" height="18" viewBox="0 0 24 18" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect x="1" y="1" width="22" height="16" rx="3" stroke="#4a9eff" stroke-width="1.6"/>
    <path d="M1.5 5L12 11.5L22.5 5" stroke="#4a9eff" stroke-width="1.6" stroke-linejoin="round"/>
  </svg>`,

  lock: `<svg width="20" height="24" viewBox="0 0 20 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect x="1" y="11" width="18" height="12" rx="3" stroke="#f59e0b" stroke-width="1.6"/>
    <path d="M5.5 11V7.5C5.5 4.7 14.5 4.7 14.5 7.5V11" stroke="#f59e0b" stroke-width="1.6" stroke-linecap="round"/>
    <circle cx="10" cy="17" r="2" stroke="#f59e0b" stroke-width="1.5"/>
  </svg>`,

  clock: (color: string) =>
    `<svg width="13" height="13" viewBox="0 0 16 16" fill="none" style="vertical-align:-2px;" xmlns="http://www.w3.org/2000/svg">
      <circle cx="8" cy="8" r="6.5" stroke="${color}" stroke-width="1.5"/>
      <path d="M8 5V8.5L10.5 10.5" stroke="${color}" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
    </svg>`,

  warning: `<svg width="14" height="13" viewBox="0 0 16 15" fill="none" xmlns="http://www.w3.org/2000/svg" style="vertical-align:-1px;flex-shrink:0;">
    <path d="M8 1.5L1 13.5H15L8 1.5Z" stroke="#dc2626" stroke-width="1.5" stroke-linejoin="round"/>
    <line x1="8" y1="6.5" x2="8" y2="9.5" stroke="#dc2626" stroke-width="1.5" stroke-linecap="round"/>
    <circle cx="8" cy="11.5" r="0.8" fill="#dc2626"/>
  </svg>`,
};

const sablonSar = (icerik: string, baslik: string) => `
<!DOCTYPE html>
<html lang="tr">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <title>${baslik}</title>
</head>
<body style="margin:0;padding:0;background-color:#0d1424;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" border="0">
    <tr>
      <td align="center" style="padding:48px 16px;background-color:#0d1424;">
        <table cellpadding="0" cellspacing="0" border="0" style="max-width:560px;width:100%;">

          <!-- HEADER -->
          <tr>
            <td style="background-color:#0f1e38;padding:24px 32px;border-radius:16px 16px 0 0;">
              <table cellpadding="0" cellspacing="0" border="0">
                <tr>
                  <td valign="middle" style="padding-right:10px;line-height:0;">${SVG.car}</td>
                  <td valign="middle">
                    <span style="font-size:20px;font-weight:800;color:#ffffff;letter-spacing:-0.4px;">Drivora</span>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- ACCENT LINE -->
          <tr>
            <td height="3" style="background-color:#4a9eff;background-image:linear-gradient(90deg,#4a9eff,#6c63ff);font-size:0;line-height:0;">&nbsp;</td>
          </tr>

          <!-- CONTENT -->
          <tr>
            <td style="background-color:#ffffff;padding:40px 32px 32px;border-left:1px solid #dee5ee;border-right:1px solid #dee5ee;">
              ${icerik}
            </td>
          </tr>

          <!-- FOOTER -->
          <tr>
            <td style="background-color:#f1f5f9;padding:18px 32px;border-radius:0 0 16px 16px;border:1px solid #dee5ee;border-top:none;text-align:center;">
              <p style="margin:0;font-size:12px;color:#94a3b8;line-height:1.7;">
                Bu mesaj Drivora bitirme projesi kapsamında gönderilmiştir.<br>
                Bu maili beklemiyorsan güvenle görmezden gelebilirsin.
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
`;

export const dogrulamaMailiGonder = async (alici: string, token: string, adSoyad?: string | null) => {
  const link = `${frontendUrl()}/email-dogrula?token=${token}`;
  const isimMetni = adSoyad ? `Merhaba <strong style="color:#1e293b;">${htmlKacis(adSoyad)}</strong>,` : "Merhaba,";

  const icerik = `
  
    <!-- Title -->
    <h2 style="margin:0 0 6px;font-size:22px;font-weight:800;color:#0f172a;letter-spacing:-0.4px;">E-postanı doğrula</h2>
    <p style="margin:0 0 28px;font-size:14px;color:#64748b;">Hesabını aktifleştirmek için bir adım kaldı</p>

    <!-- Divider -->
    <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-bottom:24px;">
      <tr><td height="1" style="background-color:#e2e8f0;font-size:0;line-height:0;">&nbsp;</td></tr>
    </table>

    <!-- Body -->
    <p style="margin:0 0 8px;font-size:15px;color:#334155;line-height:1.5;">${isimMetni}</p>
    <p style="margin:0 0 28px;font-size:15px;color:#475569;line-height:1.75;">
      Drivora hesabını oluşturduğun için teşekkürler. Araç kiralamaya başlamak için
      aşağıdaki butona tıklayarak e-posta adresini doğrula.
    </p>

    <!-- CTA -->
    <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-bottom:20px;">
      <tr>
        <td align="left">
          <a href="${link}"
             style="display:inline-block;background-color:#2563eb;background-image:linear-gradient(135deg,#4a9eff,#2563eb);color:#ffffff;text-decoration:none;font-size:15px;font-weight:700;padding:15px 36px;border-radius:12px;letter-spacing:0.2px;">
            Hesabımı doğrula
          </a>
        </td>
      </tr>
    </table>

    <!-- Time note -->
    <p style="margin:0 0 28px;font-size:13px;color:#64748b;">
      ${SVG.clock("#94a3b8")}&nbsp; Link <strong style="color:#334155;">24 saat</strong> geçerlidir.
    </p>

    <!-- Divider -->
    <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-bottom:16px;">
      <tr><td height="1" style="background-color:#f1f5f9;font-size:0;line-height:0;">&nbsp;</td></tr>
    </table>

    <!-- Fallback -->
    <p style="margin:0 0 6px;font-size:12px;color:#94a3b8;">Buton çalışmıyorsa bu bağlantıyı tarayıcına kopyala:</p>
    <p style="margin:0;font-size:12px;word-break:break-all;">
      <a href="${link}" style="color:#4a9eff;text-decoration:none;">${link}</a>
    </p>
  `;

  const duzMetin =
    `Merhaba${adSoyad ? " " + adSoyad : ""},\n\n` +
    `Drivora hesabını doğrulamak için aşağıdaki bağlantıyı aç:\n${link}\n\n` +
    `Link 24 saat geçerlidir. Bu maili beklemiyorsan güvenle görmezden gelebilirsin.`;

  await transporterAl().sendMail({
    from: gondericiBasligi(),
    to: alici,
    subject: "Drivora — E-posta adresini doğrula",
    text: duzMetin,
    html: sablonSar(icerik, "E-postanı doğrula"),
  });
};

export const sifreSifirlamaMaili = async (alici: string, token: string, adSoyad?: string | null) => {
  const link = `${frontendUrl()}/sifre-sifirla?token=${token}`;
  const isimMetni = adSoyad ? `Merhaba <strong style="color:#1e293b;">${htmlKacis(adSoyad)}</strong>,` : "Merhaba,";

  const icerik = `
    <!-- Title -->
    <h2 style="margin:0 0 6px;font-size:22px;font-weight:800;color:#0f172a;letter-spacing:-0.4px;">Şifre sıfırlama</h2>
    <p style="margin:0 0 28px;font-size:14px;color:#64748b;">Hesabına yeniden erişmek için aşağıdaki adımı takip et</p>

    <!-- Divider -->
    <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-bottom:24px;">
      <tr><td height="1" style="background-color:#e2e8f0;font-size:0;line-height:0;">&nbsp;</td></tr>
    </table>

    <!-- Body -->
    <p style="margin:0 0 8px;font-size:15px;color:#334155;line-height:1.5;">${isimMetni}</p>
    <p style="margin:0 0 28px;font-size:15px;color:#475569;line-height:1.75;">
      Hesabın için bir şifre sıfırlama isteği aldık.
      Yeni bir şifre belirlemek için aşağıdaki butona tıkla.
    </p>

    <!-- CTA -->
    <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-bottom:20px;">
      <tr>
        <td align="left">
          <a href="${link}"
             style="display:inline-block;background-color:#d97706;background-image:linear-gradient(135deg,#fb923c,#d97706);color:#ffffff;text-decoration:none;font-size:15px;font-weight:700;padding:15px 36px;border-radius:12px;letter-spacing:0.2px;">
            Şifremi sıfırla
          </a>
        </td>
      </tr>
    </table>

    <!-- Time note -->
    <p style="margin:0 0 24px;font-size:13px;color:#64748b;">
      ${SVG.clock("#94a3b8")}&nbsp; Link <strong style="color:#334155;">30 dakika</strong> geçerlidir.
    </p>

    <!-- Warning -->
    <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-bottom:28px;">
      <tr>
        <td style="background-color:#fef2f2;border-left:3px solid #dc2626;border-radius:0 8px 8px 0;padding:12px 16px;">
          <p style="margin:0;font-size:13px;color:#991b1b;line-height:1.6;">
            ${SVG.warning}&nbsp; Bu isteği sen yapmadıysan bu maili görmezden gelebilirsin — şifren değişmez.
          </p>
        </td>
      </tr>
    </table>

    <!-- Divider -->
    <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-bottom:16px;">
      <tr><td height="1" style="background-color:#f1f5f9;font-size:0;line-height:0;">&nbsp;</td></tr>
    </table>

    <!-- Fallback -->
    <p style="margin:0 0 6px;font-size:12px;color:#94a3b8;">Buton çalışmıyorsa bu bağlantıyı tarayıcına kopyala:</p>
    <p style="margin:0;font-size:12px;word-break:break-all;">
      <a href="${link}" style="color:#f59e0b;text-decoration:none;">${link}</a>
    </p>
  `;

  const duzMetin =
    `Merhaba${adSoyad ? " " + adSoyad : ""},\n\n` +
    `Şifreni sıfırlamak için aşağıdaki bağlantıyı aç:\n${link}\n\n` +
    `Link 30 dakika geçerlidir. Bu isteği sen yapmadıysan görmezden gelebilirsin; şifren değişmez.`;

  await transporterAl().sendMail({
    from: gondericiBasligi(),
    to: alici,
    subject: "Drivora — Şifre sıfırlama isteği",
    text: duzMetin,
    html: sablonSar(icerik, "Şifre sıfırlama"),
  });
};

export const smtpHazirMi = (): boolean => {
  return !!(process.env.SMTP_USER && process.env.SMTP_PASS);
};
