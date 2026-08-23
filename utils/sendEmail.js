// ============================================
// NIRMANMITRA - EMAIL SERVICE VIA HTTP API (RESEND)
// Bypasses Render SMTP Port Blocking
// ============================================

const { Resend } = require('resend');

const sendEmail = async (options) => {
  try {
    const apiKey = process.env.RESEND_API_KEY;

    if (!apiKey) {
      console.warn('⚠️ RESEND_API_KEY is not set in environment variables!');
      return;
    }

    const resend = new Resend(apiKey);

    const data = await resend.emails.send({
      from: 'NirmanMitra <onboarding@resend.dev>', // Resend Free Default Sender
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
    });

    console.log('✅ Email delivered successfully via API:', data);
  } catch (err) {
    console.error('❌ Resend API Error:', err.message);
  }
};

module.exports = sendEmail;