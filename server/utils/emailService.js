const nodemailer = require('nodemailer');

// Create a transporter using SMTP
const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST,
  port: process.env.EMAIL_PORT,
  secure: false, // true for 465, false for other ports
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
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
    const mailOptions = {
      from: `"Codeghar" <${process.env.EMAIL_USER}>`,
      to,
      subject,
      html
    };

    const info = await transporter.sendMail(mailOptions);
    console.log('Email sent:', info.messageId);
    return info;
  } catch (error) {
    console.error('Error sending email:', error);
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
  const subject = 'Password Reset OTP - Codeghar';
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 5px;">
      <div style="text-align: center; margin-bottom: 20px;">
        <h1 style="color: #64dd17;">Codeghar</h1>
      </div>
      <div style="padding: 20px; background-color: #f9f9f9; border-radius: 5px;">
        <h2 style="margin-top: 0; color: #333;">Password Reset</h2>
        <p>Hello ${username},</p>
        <p>We received a request to reset your password. Please use the following One-Time Password (OTP) to complete the process:</p>
        <div style="text-align: center; margin: 30px 0;">
          <div style="font-size: 24px; font-weight: bold; letter-spacing: 5px; padding: 15px; background-color: #ccff90; border-radius: 5px; display: inline-block;">${otp}</div>
        </div>
        <p>This OTP is valid for 15 minutes. If you didn't request a password reset, please ignore this email.</p>
        <p>Thank you,<br>The Codeghar Team</p>
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
