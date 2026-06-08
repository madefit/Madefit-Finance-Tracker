import { Resend } from "resend";
import type { DailyReport, NotificationRecipient } from "@/lib/types";
import { buildDailyReportMessage } from "@/lib/reports/daily-report";

export type NotificationResult = {
  recipient: string;
  channel: string;
  ok: boolean;
  message: string;
};

const resend = new Resend(process.env.RESEND_API_KEY);

export async function sendDailyReportNotifications(
  report: DailyReport,
  recipients: NotificationRecipient[],
): Promise<NotificationResult[]> {
  const message = buildDailyReportMessage(report);
  const activeRecipients = recipients.filter((recipient) => recipient.is_active);

  return Promise.all(
    activeRecipients.map(async (recipient) => {
      try {
        if (recipient.channel === "email") {
          await sendEmail(recipient.destination, `Daily Report - ${report.report_date}`, message);
        }
        return { recipient: recipient.recipient_name, channel: recipient.channel, ok: true, message: "Sent" };
      } catch (error) {
        return {
          recipient: recipient.recipient_name,
          channel: recipient.channel,
          ok: false,
          message: error instanceof Error ? error.message : "Notification failed",
        };
      }
    }),
  );
}

async function sendEmail(to: string, subject: string, text: string) {
  if (!process.env.RESEND_API_KEY) {
    console.warn("RESEND_API_KEY is missing. Skipping email notification.");
    return;
  }

  const { error } = await resend.emails.send({
    from: "MadeFit Finance <onboarding@resend.dev>",
    to: [to],
    subject: subject,
    text: text,
  });

  if (error) {
    throw new Error(`Email failed: ${error.message}`);
  }
}
