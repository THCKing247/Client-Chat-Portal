import nodemailer from "nodemailer";

const smtpHost = process.env.SMTP_HOST;
const smtpPort = Number(process.env.SMTP_PORT || 587);
const smtpUser = process.env.SMTP_USER;
const smtpPassword = process.env.SMTP_PASSWORD;
const smtpFrom = process.env.SMTP_FROM || smtpUser || "noreply@example.com";

let transporter: nodemailer.Transporter | null = null;

if (smtpHost && smtpUser && smtpPassword) {
  transporter = nodemailer.createTransport({
    host: smtpHost,
    port: smtpPort,
    secure: smtpPort === 465,
    auth: {
      user: smtpUser,
      pass: smtpPassword,
    },
  });
}

export async function sendWelcomeEmail(
  to: string,
  firstName: string,
  loginUrl: string
): Promise<void> {
  if (!transporter) {
    console.warn("SMTP not configured, skipping welcome email");
    return;
  }

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        body {
          font-family: Arial, sans-serif;
          line-height: 1.6;
          color: #333;
        }
        .container {
          max-width: 600px;
          margin: 0 auto;
          padding: 20px;
        }
        .header {
          background: linear-gradient(135deg, #06b6d4 0%, #3b82f6 100%);
          color: white;
          padding: 30px;
          text-align: center;
          border-radius: 8px 8px 0 0;
        }
        .content {
          background: #f9fafb;
          padding: 30px;
          border-radius: 0 0 8px 8px;
        }
        .button {
          display: inline-block;
          padding: 12px 24px;
          background: #06b6d4;
          color: white;
          text-decoration: none;
          border-radius: 6px;
          margin: 20px 0;
        }
        .footer {
          text-align: center;
          margin-top: 20px;
          color: #6b7280;
          font-size: 12px;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>Welcome to Your Account!</h1>
        </div>
        <div class="content">
          <p>Hi ${firstName},</p>
          <p>Your account has been successfully created. You can now log in to access the portal.</p>
          <p style="text-align: center;">
            <a href="${loginUrl}" class="button">Login to Portal</a>
          </p>
          <p>Or copy and paste this URL into your browser:</p>
          <p style="word-break: break-all; color: #06b6d4;">${loginUrl}</p>
          <p>If you have any questions, please contact your administrator.</p>
        </div>
        <div class="footer">
          <p>This is an automated message. Please do not reply to this email.</p>
        </div>
      </div>
    </body>
    </html>
  `;

  const text = `
Hi ${firstName},

Your account has been successfully created. You can now log in to access the portal.

Login URL: ${loginUrl}

If you have any questions, please contact your administrator.

This is an automated message. Please do not reply to this email.
  `;

  try {
    await transporter.sendMail({
      from: smtpFrom,
      to,
      subject: "Your Account Has Been Created",
      text,
      html,
    });
    console.log(`Welcome email sent to ${to}`);
  } catch (error) {
    console.error(`Failed to send welcome email to ${to}:`, error);
    throw error;
  }
}

