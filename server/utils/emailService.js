const nodemailer = require('nodemailer');

console.log('[Email] Initializing email service with:');
console.log('[Email] HOST:', process.env.EMAIL_HOST);
console.log('[Email] PORT:', process.env.EMAIL_PORT);
console.log('[Email] USER:', process.env.EMAIL_USER);
console.log('[Email] PASS:', process.env.EMAIL_PASS ? '***' : 'NOT SET');

// Create a transporter using SMTP
const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST,
  port: parseInt(process.env.EMAIL_PORT),
  secure: false, // true for 465, false for other ports
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  },
  connectionTimeout: 10000,
  socketTimeout: 10000,
  logger: true,
  debug: true,
  tls: {
    rejectUnauthorized: false
  }
});

// Verify transporter connection on startup
transporter.verify((error, success) => {
  if (error) {
    console.error('[Email] ✗ Transporter verification failed:', error.message);
    console.error('[Email] Full error:', error);
  } else {
    console.log('[Email] ✓ Transporter verified successfully');
  }
});

/**
 * Send an email
 * @param {string} to - Recipient email
 * @param {string} subject - Email subject
 * @param {string} html - Email content in HTML format
 * @returns {Promise} - Nodemailer send mail promise
 */
const sendEmail = async (to, subject, html) => {
  try {
    console.log('[Email] Attempting to send email to:', to);
    console.log('[Email] Subject:', subject);
    
    const mailOptions = {
      from: `"KODESHARE" <${process.env.EMAIL_USER}>`,
      to,
      subject,
      html
    };

    console.log('[Email] Mail options:', { from: mailOptions.from, to: mailOptions.to, subject: mailOptions.subject });
    
    const info = await transporter.sendMail(mailOptions);
    console.log('[Email] ✓ Email sent successfully');
    console.log('[Email] Message ID:', info.messageId);
    console.log('[Email] Response:', info.response);
    return info;
  } catch (error) {
    console.error('[Email] ✗ Error sending email:', error.message);
    console.error('[Email] Error code:', error.code);
    console.error('[Email] Error response:', error.response);
    console.error('[Email] Full error:', error);
    throw error;
  }
};

/**
 * Send OTP email for password reset
 * @param {string} to - Recipient email
 * @param {string} otp - One-time password
 * @param {string} username - User's username
 * @returns {Promise} - Email send promise
 */
const sendOTPEmail = async (to, otp, username) => {
  const subject = 'Password Reset OTP - KODESHARE';
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 5px;">
      <div style="text-align: center; margin-bottom: 20px;">
        <h1 style="color: #64dd17;">KODESHARE</h1>
      </div>
      <div style="padding: 20px; background-color: #f9f9f9; border-radius: 5px;">
        <h2 style="margin-top: 0; color: #333;">Password Reset</h2>
        <p>Hello ${username},</p>
        <p>We received a request to reset your password. Please use the following One-Time Password (OTP) to complete the process:</p>
        <div style="text-align: center; margin: 30px 0;">
          <div style="font-size: 24px; font-weight: bold; letter-spacing: 5px; padding: 15px; background-color: #ccff90; border-radius: 5px; display: inline-block;">${otp}</div>
        </div>
        <p>This OTP is valid for 15 minutes. If you didn't request a password reset, please ignore this email.</p>
        <p>Thank you,<br>The KODESHARE Team</p>
      </div>
      <div style="text-align: center; margin-top: 20px; font-size: 12px; color: #888;">
        <p>This is an automated email. Please do not reply.</p>
      </div>
    </div>
  `;

  return sendEmail(to, subject, html);
};

module.exports = {
  sendEmail,
  sendOTPEmail
};
