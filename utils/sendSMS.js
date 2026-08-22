// ============================================
// NIRMANMITRA - SMS SERVICE (Fast2SMS / QuickSMS)
// ============================================

const sendSMS = async ({ phone, otp }) => {
  try {
    // Mobile number se +91 ya non-digits clean karein
    const cleanPhone = phone.replace(/[^0-9]/g, '').slice(-10);

    // Agar FAST2SMS_API_KEY available ho toh SMS trigger karein
    if (process.env.FAST2SMS_API_KEY) {
      const response = await fetch('https://www.fast2sms.com/dev/bulkV2', {
        method: 'POST',
        headers: {
          'authorization': process.env.FAST2SMS_API_KEY,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          route: 'otp',
          variables_values: otp,
          numbers: cleanPhone
        })
      });

      const data = await response.json();
      console.log('📱 SMS Gateway Response:', data);
    } else {
      // Development mode me console me print karega
      console.log(`📱 [DEV SMS LOG] To: ${cleanPhone} | OTP: ${otp}`);
    }
  } catch (err) {
    console.error('❌ SMS Sending Error:', err.message);
  }
};

module.exports = sendSMS;