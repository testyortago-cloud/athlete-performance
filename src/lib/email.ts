import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
  host: 'smtp.gmail.com',
  port: 587,
  secure: false,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

export async function sendPasswordResetEmail(to: string, resetUrl: string) {
  await transporter.sendMail({
    from: `"DJP Athlete" <${process.env.SMTP_USER}>`,
    to,
    subject: 'Reset Your Password — DJP Athlete',
    html: `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 480px; margin: 0 auto; padding: 40px 20px;">
        <h2 style="color: #111; margin-bottom: 8px;">Reset your password</h2>
        <p style="color: #555; font-size: 14px; line-height: 1.6;">
          We received a request to reset your password. Click the button below to choose a new one.
          This link will expire in <strong>1 hour</strong>.
        </p>
        <a href="${resetUrl}" style="display: inline-block; margin: 24px 0; padding: 12px 32px; background: #000; color: #fff; text-decoration: none; border-radius: 6px; font-size: 14px; font-weight: 600;">
          Reset Password
        </a>
        <p style="color: #999; font-size: 12px; line-height: 1.5;">
          If you didn't request this, you can safely ignore this email. Your password won't change.
        </p>
        <hr style="border: none; border-top: 1px solid #eee; margin: 32px 0 16px;" />
        <p style="color: #bbb; font-size: 11px;">DJP Athlete Performance Platform</p>
      </div>
    `,
  });
}
