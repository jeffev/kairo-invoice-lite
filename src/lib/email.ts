import "server-only";

import { Resend } from "resend";

import { env, features } from "@/lib/env";

const resend = features.email ? new Resend(env.RESEND_API_KEY) : null;

export type EmailAttachment = { filename: string; content: Buffer };

/**
 * Sends an email with Resend. Without RESEND_API_KEY it prints the message to the server
 * console (demo mode) and still returns success, so every flow can be exercised locally.
 */
export async function sendEmail({
  to,
  subject,
  text,
  html,
  replyTo,
  attachments,
}: {
  to: string;
  subject: string;
  text: string;
  html?: string;
  replyTo?: string;
  attachments?: EmailAttachment[];
}) {
  if (!resend) {
    const files = attachments?.map((a) => `${a.filename} (${Math.round(a.content.length / 1024)} KB)`).join(", ");
    console.info(`\n[email] To: ${to}\n[email] Subject: ${subject}${files ? `\n[email] Attachments: ${files}` : ""}\n${text}\n`);
    return { ok: true as const, demo: true as const };
  }
  const { error } = await resend.emails.send({
    from: env.EMAIL_FROM,
    to,
    subject,
    text,
    html,
    replyTo,
    attachments: attachments?.map((a) => ({ filename: a.filename, content: a.content })),
  });
  if (error) {
    console.error("[email] Resend error:", error);
    return { ok: false as const, error: error.message };
  }
  return { ok: true as const, demo: false as const };
}
