import type { Metadata } from "next";

import { LegalPage } from "@/components/marketing/legal-page";
import { siteConfig } from "@/config/site";

export const metadata: Metadata = { title: "Terms of service" };

export default function TermsPage() {
  return (
    <LegalPage
      title="Terms of service"
      updated="October 1, 2026"
      sections={[
        { heading: "1. Acceptance", body: `By creating an account or using ${siteConfig.name} you agree to these terms. If you use the service on behalf of an organization, you accept them on its behalf.` },
        { heading: "2. Accounts", body: "You are responsible for your account credentials and for all activity under your account. Notify us immediately of any unauthorized use." },
        { heading: "3. Subscriptions and credits", body: "Paid plans renew automatically until cancelled. Credits are consumed by AI usage, are non-refundable and have no cash value. Prices may change with 30 days' notice." },
        { heading: "4. Acceptable use", body: "Do not use the service for illegal activity, to generate harmful content, to infringe others' rights, or to attempt to disrupt or reverse engineer the platform." },
        { heading: "5. Your content", body: "You keep all rights to the content you create. You grant us a limited license to store and process it only to provide the service." },
        { heading: "6. Disclaimer", body: "AI output may be inaccurate. The service is provided \"as is\" without warranties of any kind. Review generated content before relying on it." },
        { heading: "7. Contact", body: `Questions about these terms? Email ${siteConfig.supportEmail}.` },
      ]}
    />
  );
}
