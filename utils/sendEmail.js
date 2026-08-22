// ============================================
// NIRMANMITRA - EMAIL TRANSPORTER (FORCE IPV4)
// ============================================

const nodemailer = require('nodemailer');

const sendEmail = async (options) => {
  if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
    console.warn('⚠️ EMAIL_USER or EMAIL_PASS environment variable is missing!');
    return;
  }

  // Gmail SMTP with explicit IPv4 family
  const transporter = nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 587,
    secure: false, // STARTTLS
    family: 4,     // <--- FORCE IPV4 (Fixes ENETUNREACH on Render)
    auth: {
      user: process.env.EMAIL_USER.trim(),
      pass: process.env.EMAIL_PASS.replace(/\s+/g, '').trim()
    },
    tls: {
      rejectUnauthorized: false
    }
  });

  const mailOptions = {
    from: `"NirmanMitra Support" <${process.env.EMAIL_USER.trim()}>`,
    to: options.email,
    subject: options.subject,
    html: `
      <div style="font-family: Arial, sans-serif; padding: 24px; border: 1px solid #e0e0e0; border-radius: 10px; max-width: 480px; margin: auto;">
        <h2 style="color: #FF6B00; margin-bottom: 10px;">🔨 NirmanMitra</h2>
        <p style="color: #333; font-size: 15px;">${options.message}</p>
        <div style="background: #F4F5F7; padding: 16px; font-size: 28px; font-weight: bold; letter-spacing: 6px; text-align: center; border-radius: 8px; color: #111; margin: 20px 0;">
          ${options.otp}
        </div>
        <p style="color: #888; font-size: 12px; margin-top: 15px;">This OTP is valid for 10 minutes. Do not share it with anyone.</p>
      </div>
    `
  };

  const info = await transporter.sendMail(mailOptions);
  console.log('✅ Email sent successfully! ID:', info.messageId);
};

module.exports = sendEmail;