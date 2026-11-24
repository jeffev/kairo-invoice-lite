import type { Metadata } from "next";

import { BusinessForm } from "@/components/app/business-form";
import { SettingsForms } from "@/components/app/settings-forms";
import { listInvoices } from "@/lib/invoices";
import { requireWorkspace } from "@/lib/session";

export const metadata: Metadata = { title: "Settings" };

export default async function SettingsPage() {
  const { user, workspace } = await requireWorkspace();
  const invoices = await listInvoices(workspace.id, { limit: 1 });
  return (
    <div className="mx-auto grid w-full max-w-3xl gap-6 p-4 md:p-6">
      <div className="grid gap-1">
        <h1 className="text-2xl font-semibold tracking-tight">Settings</h1>
        <p className="text-sm text-muted-foreground">Your business details, invoice defaults and account.</p>
      </div>
      <BusinessForm values={workspace} hasInvoices={invoices.length > 0} />
      <SettingsForms user={{ name: user.name, email: user.email }} />
    </div>
  );
}
