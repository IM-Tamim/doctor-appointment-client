import nodemailer from "nodemailer";

/**
 * Gmail SMTP via an App Password (not the account password).
 * Google Account → Security → 2-Step Verification → App Passwords → "Mail".
 *
 * The API server has its own copy of this for booking notifications; password
 * resets have to send from here because Better Auth — which owns the reset
 * token — lives in the Next app.
 */
let transporter = null;

if (process.env.GMAIL_USER && process.env.GMAIL_APP_PASSWORD) {
  transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: process.env.GMAIL_USER,
      pass: process.env.GMAIL_APP_PASSWORD,
    },
    // Serverless functions are killed at ~10s. Without explicit timeouts a
    // host that blocks outbound SMTP leaves this hanging past that limit and
    // the whole reset request dies with no useful error.
    connectionTimeout: 8000,
    greetingTimeout: 8000,
    socketTimeout: 8000,
  });
}

export const isEmailConfigured = () => Boolean(transporter);

/**
 * Never throws. A failed email must not take down the request that triggered
 * it — the caller decides what to tell the user.
 * Returns true only if the message was actually handed to the SMTP server.
 */
export const sendEmail = async ({ to, subject, html }) => {
  if (!transporter) {
    console.warn(`[email skipped — GMAIL_USER/GMAIL_APP_PASSWORD not set] to=${to} subject="${subject}"`);
    return false;
  }
  try {
    await transporter.sendMail({
      from: `DocAppoint <${process.env.GMAIL_USER}>`,
      to,
      subject,
      html,
    });
    return true;
  } catch (err) {
    console.error("Failed to send email:", err.message);
    return false;
  }
};

/** Branded shell so reset mail doesn't look like phishing. */
export const resetPasswordEmail = ({ name, url }) => `
<div style="font-family:system-ui,-apple-system,Segoe UI,sans-serif;max-width:520px;margin:0 auto;padding:32px 24px;color:#17232f">
  <div style="font-size:22px;font-weight:800;letter-spacing:-.02em;margin-bottom:24px">
    <span style="color:#17232f">Doc</span><span style="color:#008e89">Appoint</span>
  </div>
  <h1 style="font-size:19px;margin:0 0 12px">Reset your password</h1>
  <p style="font-size:14px;line-height:1.6;color:#4a5967;margin:0 0 20px">
    Hi ${name || "there"}, we received a request to reset your DocAppoint password.
    Click the button below to choose a new one. This link expires in 1 hour.
  </p>
  <a href="${url}"
     style="display:inline-block;background:#008e89;color:#fff;text-decoration:none;font-weight:700;font-size:14px;padding:12px 24px;border-radius:10px">
    Reset password
  </a>
  <p style="font-size:12px;line-height:1.6;color:#7b8794;margin:24px 0 0">
    If you didn't ask for this, you can safely ignore this email — your password
    won't change until you open the link above and set a new one.
  </p>
  <p style="font-size:12px;color:#9aa5b1;margin:16px 0 0;word-break:break-all">
    Button not working? Paste this into your browser:<br>${url}
  </p>
</div>`;
