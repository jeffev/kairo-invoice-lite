import type { Metadata } from "next";

import { LegalPage } from "@/components/marketing/legal-page";
import { siteConfig } from "@/config/site";

export const metadata: Metadata = { title: "Privacy policy" };

export default function PrivacyPage() {
  return (
    <LegalPage
      title="Privacy policy"
      updated="October 1, 2026"
      sections={[
        { heading: "What we collect", body: "Your name, email address, authentication data, billing status, and the conversations you create in the app." },
        { heading: "How we use it", body: "To provide and improve the service, send invoices and account emails and prevent abuse. We never sell your data." },
        { heading: "AI processing", body: "Messages you send are processed by our AI provider (Anthropic) to generate replies. They are not used to train models." },
        { heading: "Payments", body: "Invoices are paid outside the app, using the payment details printed on each invoice. We never handle card numbers." },
        { heading: "Data retention", body: "You can delete conversations at any time and delete your account from Settings, which removes your data from our systems." },
        { heading: "Contact", body: `For privacy requests, email ${siteConfig.supportEmail}.` },
      ]}
    />
  );
}
