const nodemailer = require('nodemailer');

const sendEmail = async (options) => {
  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS // Gmail App Password
    }
  });

  const mailOptions = {
    from: `"NirmanMitra Support" <${process.env.EMAIL_USER}>`,
    to: options.email,
    subject: options.subject,
    html: `
      <div style="font-family: Arial, sans-serif; padding: 20px; border: 1px solid #e0e0e0; border-radius: 8px; max-width: 500px;">
        <h2 style="color: #ff6b00;">🔨 NirmanMitra</h2>
        <p>${options.message}</p>
        <div style="background: #f4f4f4; padding: 12px; font-size: 24px; font-weight: bold; letter-spacing: 5px; text-align: center; border-radius: 6px; color: #333;">
          ${options.otp}
        </div>
        <p style="color: #777; font-size: 12px; margin-top: 20px;">This OTP is valid for 10 minutes. Do not share this with anyone.</p>
      </div>
    `
  };

  await transporter.sendMail(mailOptions);
};

module.exports = sendEmail;