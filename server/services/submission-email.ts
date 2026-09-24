/**
 * Submission Email Service — sends notifications for all user-submitted
 * intake forms (access requests, consultation requests, partnership,
 * sponsorship, event applications, and general inquiries) to
 * hello@yalla-hack.com so they can be tracked and followed up.
 */

import { sendEmail } from "../email";
import { sanitizeString } from "../_core/security";
import { ENV } from "../_core/env";

const SUBMISSION_TO = "hello@yalla-hack.com";
const SUBJECT_PREFIX = "[DJAC Intake]";

interface SubmissionBase {
  type: string;
  senderName: string;
  senderEmail: string;
  organizationName: string;
}

interface AccessRequestSubmission extends SubmissionBase {
  type: "access_request";
  useCase?: string;
  preferredLocale?: string;
}

interface ConsultationSubmission extends SubmissionBase {
  type: "consultation";
  topic?: string;
  jurisdictions?: string[];
  summary?: string;
  vendorName?: string;
  techStackSummary?: string;
}

interface PartnershipSubmission extends SubmissionBase {
  type: "partnership";
  partnershipType: string;
  proposalSummary: string;
  expectedBudget?: string;
  timeline?: string;
}

interface SponsorshipSubmission extends SubmissionBase {
  type: "sponsorship";
  sponsorshipTier: string;
  sponsorshipAmount?: string;
  benefitsRequired?: string;
  eventName?: string;
}

interface EventApplicationSubmission extends SubmissionBase {
  type: "event_application";
  eventName: string;
  eventDate?: string;
  role: string;
  experience?: string;
  availability?: string;
}

interface GeneralInquirySubmission extends SubmissionBase {
  type: "general_inquiry";
  subject: string;
  message: string;
  priority?: string;
}

type Submission =
  | AccessRequestSubmission
  | ConsultationSubmission
  | PartnershipSubmission
  | SponsorshipSubmission
  | EventApplicationSubmission
  | GeneralInquirySubmission;

function buildHtmlTable(fields: [string, string][]): string {
  return fields
    .map(
      ([label, value]) =>
        `<tr><td style="padding:8px 12px;border-bottom:1px solid #eee;font-weight:600;width:30%;">${sanitizeString(label)}</td><td style="padding:8px 12px;border-bottom:1px solid #eee;">${sanitizeString(value)}</td></tr>`
    )
    .join("");
}

function buildHtml(fields: Submission): string {
  const rows: [string, string][] = [
    ["Submission Type", sanitizeString(fields.type)],
    ["Sender Name", sanitizeString(fields.senderName)],
    ["Sender Email", sanitizeString(fields.senderEmail)],
    ["Organization", sanitizeString(fields.organizationName)],
  ];

  const extraFields = Object.entries(fields)
    .filter(
      ([key]) =>
        !["type", "senderName", "senderEmail", "organizationName"].includes(key)
    )
    .filter(([, value]) => value !== undefined && value !== "")
    .map(
      ([key, value]) =>
        [
          key.replace(/([A-Z])/g, " $1").replace(/^./, s => s.toUpperCase()),
          String(value),
        ] as [string, string]
    );

  rows.push(...extraFields);

  return `<!DOCTYPE html><html><body style="margin:0;padding:20px;font-family:Arial,sans-serif;background:#f9f9f9;"><div style="max-width:600px;margin:0 auto;background:#fff;padding:24px;border-radius:8px;box-shadow:0 2px 8px rgba(0,0,0,0.1);"><h2 style="color:#1a1a2e;margin-bottom:16px;border-bottom:2px solid #e94560;padding-bottom:8px;">${SUBJECT_PREFIX} ${sanitizeString(fields.type.replace(/_/g, " ").replace(/\b\w/g, c => c.toUpperCase()))}</h2><table style="width:100%;border-collapse:collapse;">${buildHtmlTable(rows)}</table><p style="margin-top:20px;font-size:12px;color:#888;">This submission was automatically forwarded to hello@yalla-hack.com. The team will respond within 2 business days.</p></div></body></html>`;
}

export async function sendSubmissionNotification(
  submission: Submission
): Promise<boolean> {
  try {
    const subject = `${SUBJECT_PREFIX} ${submission.type.replace(/_/g, " ").replace(/\b\w/g, c => c.toUpperCase())} from ${submission.senderName}`;
    const html = buildHtml(submission);
    const text = Object.entries(submission)
      .filter(([, v]) => v !== undefined && v !== "")
      .map(([k, v]) => `${k}: ${v}`)
      .join("\n");

    await sendEmail({
      to: SUBMISSION_TO,
      subject,
      html,
      text,
      from: ENV.smtpFrom || "DJAC by Yalla Hack <hello@yalla-hack.com>",
      replyTo: submission.senderEmail,
    });
    return true;
  } catch {
    return false;
  }
}

export async function sendPartnershipNotification(
  senderName: string,
  senderEmail: string,
  organizationName: string,
  partnershipType: string,
  proposalSummary: string,
  expectedBudget?: string,
  timeline?: string
): Promise<boolean> {
  return sendSubmissionNotification({
    type: "partnership",
    senderName,
    senderEmail,
    organizationName,
    partnershipType,
    proposalSummary,
    expectedBudget,
    timeline,
  });
}

export async function sendSponsorshipNotification(
  senderName: string,
  senderEmail: string,
  organizationName: string,
  sponsorshipTier: string,
  sponsorshipAmount?: string,
  benefitsRequired?: string,
  eventName?: string
): Promise<boolean> {
  return sendSubmissionNotification({
    type: "sponsorship",
    senderName,
    senderEmail,
    organizationName,
    sponsorshipTier,
    sponsorshipAmount,
    benefitsRequired,
    eventName,
  });
}

export async function sendEventApplicationNotification(
  senderName: string,
  senderEmail: string,
  organizationName: string,
  eventName: string,
  eventDate: string,
  role: string,
  experience?: string,
  availability?: string
): Promise<boolean> {
  return sendSubmissionNotification({
    type: "event_application",
    senderName,
    senderEmail,
    organizationName,
    eventName,
    eventDate,
    role,
    experience,
    availability,
  });
}

export async function sendGeneralInquiryNotification(
  senderName: string,
  senderEmail: string,
  organizationName: string,
  subject: string,
  message: string,
  priority?: string
): Promise<boolean> {
  return sendSubmissionNotification({
    type: "general_inquiry",
    senderName,
    senderEmail,
    organizationName,
    subject,
    message,
    priority,
  });
}
