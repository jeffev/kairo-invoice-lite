import type { Metadata } from "next";
import { Suspense } from "react";

import { ResetPasswordForm } from "@/components/auth/auth-forms";

export const metadata: Metadata = { title: "Reset password" };

export default function Page() {
  return (
    // useSearchParams() in the form needs a Suspense boundary.
    <Suspense>
      <ResetPasswordForm />
    </Suspense>
  );
}
