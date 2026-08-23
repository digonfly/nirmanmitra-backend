// ============================================
// NIRMANMITRA - EMAIL SERVICE (BREVO HTTP API)
// Works on Render for all recipient emails
// ============================================

const sendEmail = async (options) => {
  const apiKey = process.env.BREVO_API_KEY;
  const senderEmail = process.env.SENDER_EMAIL || 'nirmanmitra.official@gmail.com';

  if (!apiKey) {
    console.warn('⚠️ BREVO_API_KEY environment variable is missing!');
    return;
  }

  try {
    const response = await fetch('https://api.brevo.com/v3/smtp/email', {
      method: 'POST',
      headers: {
        'accept': 'application/json',
        'api-key': apiKey.trim(),
        'content-type': 'application/json'
      },
      body: JSON.stringify({
        sender: {
          name: 'NirmanMitra Support',
          email: senderEmail.trim()
        },
        to: [{ email: options.email }],
        subject: options.subject,
        htmlContent: `
          <div style="font-family: Arial, sans-serif; padding: 24px; border: 1px solid #e0e0e0; border-radius: 10px; max-width: 480px; margin: auto;">
            <h2 style="color: #FF6B00; margin-bottom: 10px;">🔨 NirmanMitra</h2>
            <p style="color: #333; font-size: 15px;">${options.message}</p>
            <div style="background: #F4F5F7; padding: 16px; font-size: 28px; font-weight: bold; letter-spacing: 6px; text-align: center; border-radius: 8px; color: #111; margin: 20px 0;">
              ${options.otp}
            </div>
            <p style="color: #888; font-size: 12px; margin-top: 15px;">This OTP is valid for 10 minutes. Do not share it with anyone.</p>
          </div>
        `
      })
    });

    const data = await response.json();
    if (response.ok) {
      console.log('✅ Email delivered successfully via Brevo API:', data.messageId);
    } else {
      console.error('❌ Brevo API Delivery Error:', data);
    }
  } catch (err) {
    console.error('❌ Network Error while sending email:', err.message);
  }
};

module.exports = sendEmail;