/**
 * Email Service — sends transactional emails via SMTP.
 *
 * Templates are rendered on the server using React (no React Email package
 * dependency — we inline the HTML rendering). For production, swap to React
 * Email (@react-email/components) for full MJML-like responsive templates.
 *
 * Usage:
 *   import { emailService } from "./email/service";
 *   await emailService.sendWelcome(user, org);
 */

import { createTransport } from "nodemailer";
import type { User } from "../../drizzle/schema";
import type { Organization } from "../../drizzle/schema";

const FROM = "DJAC by Yalla Hack <hello@yalla-hack.com>";
const REPLY_TO = "hello@yalla-hack.com";

let transporter: ReturnType<typeof createTransport> | null = null;

function getTransporter() {
  if (transporter) return transporter;

  const host = process.env.SMTP_HOST;
  const port = parseInt(process.env.SMTP_PORT || "587", 10);
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;

  if (!host || !user || !pass) {
    console.warn("[Email] SMTP not configured — emails will be logged only.");
    return null;
  }

  transporter = createTransport({
    host,
    port,
    secure: port === 465,
    auth: { user, pass },
  });
  return transporter;
}

function baseTemplate(content: string) {
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<style>
  body { font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif; background: #f8fafc; margin: 0; padding: 0; }
  .container { max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 12px; overflow: hidden; }
  .header { background: linear-gradient(135deg, #0891b2, #7c3aed); padding: 32px; }
  .header-logo { color: #fff; font-size: 24px; font-weight: 700; margin: 0; }
  .header-sub { color: rgba(255,255,255,0.85); font-size: 14px; margin: 4px 0 0; }
  .content { padding: 32px; }
  .content h2 { font-size: 20px; color: #0f172a; margin: 0 0 16px; }
  .content p { font-size: 14px; color: #334155; line-height: 1.6; margin: 0 0 12px; }
  .btn { display: inline-block; background: #0891b2; color: #fff !important; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: 600; font-size: 14px; margin: 16px 0; }
  .footer { padding: 16px 32px; border-top: 1px solid #e2e8f0; font-size: 12px; color: #64748b; }
  .footer p { margin: 0 0 4px; }
  .steps { margin: 16px 0; padding: 0; list-style: none; }
  .steps li { padding: 6px 0; font-size: 14px; color: #334155; }
  .steps li::before { content: "✓ "; color: #22c55e; font-weight: 700; }
</style>
</head>
<body style="padding: 24px 0;">
<div class="container">
  <div class="header">
    <h1 class="header-logo">Yalla Hack</h1>
    <p class="header-sub">DJAC Compliance Platform</p>
  </div>
  <div class="content">
    ${content}
  </div>
  <div class="footer">
    <p><strong>Yalla Hack</strong> · hello@yalla-hack.com</p>
    <p>DJAC — Multi-jurisdiction compliance across 29 jurisdictions</p>
  </div>
</div>
</body>
</html>`;
}

export const emailService = {
  async sendWelcome(user: User, org: Organization) {
    const html = baseTemplate(`
      <h2>Welcome to DJAC, ${user.name || "there"}!</h2>
      <p>Your organization <strong>${org.name}</strong> is now set up on DJAC — the multi-jurisdiction compliance platform covering 29 jurisdictions across APAC, EMEA, and the Americas.</p>
      <p>Here&rsquo;s what to do next:</p>
      <ol class="steps">
        <li>Complete your onboarding — select frameworks and objectives</li>
        <li>Add your first vendor for AI-powered compliance assessment</li>
        <li>Explore the Compliance Framework Library</li>
        <li>Set up deadline tracking for regulatory obligations</li>
      </ol>
      <a href="${process.env.APP_URL || "https://app.yalla-hack.ae"}/dashboard" class="btn">Launch Dashboard →</a>
      <p style="margin-top: 16px; font-size: 12px; color: #94a3b8;">Need help? Reply to this email or visit our support center.</p>
    `);
    return send(user, "Welcome to DJAC", html, "welcome");
  },

  async sendVerification(user: User, token: string) {
    const url = `${process.env.APP_URL || "https://app.yalla-hack.ae"}/verify?token=${token}`;
    const html = baseTemplate(`
      <h2>Verify Your Email</h2>
      <p>Please verify your email address to activate your DJAC account.</p>
      <a href="${url}" class="btn">Verify Email →</a>
      <p style="margin-top: 16px; font-size: 12px; color: #94a3b8;">This link expires in 24 hours. If you didn&rsquo;t create an account, you can ignore this email.</p>
    `);
    return send(user, "Verify Your Email — DJAC", html, "verify-email");
  },

  async sendPasswordReset(user: User, token: string) {
    const url = `${process.env.APP_URL || "https://app.yalla-hack.ae"}/reset-password?token=${token}`;
    const html = baseTemplate(`
      <h2>Reset Your Password</h2>
      <p>You requested a password reset for your DJAC account.</p>
      <a href="${url}" class="btn">Reset Password →</a>
      <p style="margin-top: 16px; font-size: 12px; color: #94a3b8;">This link expires in 1 hour. If you didn&rsquo;t request this, please ignore this email.</p>
    `);
    return send(user, "Reset Your Password — DJAC", html, "password-reset");
  },

  async sendTeamInvite(inviter: User, inviteeEmail: string, org: Organization) {
    const url = `${process.env.APP_URL || "https://app.yalla-hack.ae"}/accept-invite?org=${org.id}`;
    const html = baseTemplate(`
      <h2>You're Invited to DJAC</h2>
      <p><strong>${inviter.name || "A team member"}</strong> has invited you to join <strong>${org.name}</strong> on DJAC.</p>
      <p>DJAC helps your team manage compliance across 29 jurisdictions with AI-powered assessments, deadline tracking, and automated reporting.</p>
      <a href="${url}" class="btn">Accept Invitation →</a>
    `);
    return sendTo(
      inviteeEmail,
      `You're Invited to Join ${org.name} — DJAC`,
      html,
      "team-invite"
    );
  },
};

async function send(
  user: User,
  subject: string,
  html: string,
  template: string
) {
  const email = user.email;
  if (!email) return;
  const t = getTransporter();
  if (!t) {
    console.info(`[Email] ${template} to ${email}: ${subject}`);
    return;
  }
  try {
    await t.sendMail({
      from: FROM,
      to: email,
      replyTo: REPLY_TO,
      subject,
      html,
    });
  } catch (e) {
    console.error(`[Email] Failed to send ${template}:`, e);
  }
}

async function sendTo(
  email: string,
  subject: string,
  html: string,
  template: string
) {
  const t = getTransporter();
  if (!t) {
    console.info(`[Email] ${template} to ${email}: ${subject}`);
    return;
  }
  try {
    await t.sendMail({
      from: FROM,
      to: email,
      replyTo: REPLY_TO,
      subject,
      html,
    });
  } catch (e) {
    console.error(`[Email] Failed to send ${template}:`, e);
  }
}
