import nodemailer from "nodemailer";
import dotenv from "dotenv";
dotenv.config();
// Create transporter with environment-aware configuration and validation.
// Supports:
// 1) SendGrid SMTP via `SENDGRID_API_KEY` (auth user: 'apikey', pass: SENDGRID_API_KEY)
// 2) Gmail SMTP via `EMAIL_USER` + `EMAIL_PASS` (app password)

const createTransporter = () => {
  // SendGrid SMTP fallback if API key provided
  if (process.env.SENDGRID_API_KEY) {
    return nodemailer.createTransport({
      host: "smtp.sendgrid.net",
      port: 587,
      secure: false,
      auth: {
        user: "apikey",
        pass: process.env.SENDGRID_API_KEY,
      },
    });
  }

  // Gmail
  if (process.env.EMAIL_USER && process.env.EMAIL_PASS) {
    return nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS, // Gmail app password
      },
    });
  }

  // If no credentials, produce a helpful error when trying to create a transporter.
  throw new Error(
    "Email transport not configured. Set either SENDGRID_API_KEY or both EMAIL_USER and EMAIL_PASS (Gmail app password)."
  );
};

let transporter;
try {
  transporter = createTransporter();
} catch (err) {
  // Log the configuration error early so server logs show clear guidance.
  console.error("Email transporter configuration error:", err.message);
  // Keep transporter undefined; sendEmail will surface a clear error when used.
}

export const sendEmail = async ({ to, subject, text, html }) => {
  if (!transporter) {
    const msg =
      "Mailer not configured. Set SENDGRID_API_KEY or EMAIL_USER and EMAIL_PASS (Gmail app password).";
    console.error(msg);
    throw new Error(msg);
  }

  const fromAddress =
    process.env.EMAIL_FROM || process.env.EMAIL_USER || "no-reply@example.com";

  try {
    const info = await transporter.sendMail({
      from: fromAddress,
      to,
      subject,
      text,
      html,
    });
    console.log("Email sent:", info.messageId);
    return info;
  } catch (err) {
    // Improve error message for common auth failures
    if (err && err.code === "EAUTH") {
      console.error(
        "Auth error sending email. Check credentials and provider settings.",
        err
      );
    } else {
      console.error("Error sending email:", err);
    }
    throw err;
  }
};
