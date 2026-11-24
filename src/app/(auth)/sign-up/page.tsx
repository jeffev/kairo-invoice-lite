import type { Metadata } from "next";
import { Suspense } from "react";

import { SignUpForm } from "@/components/auth/auth-forms";
import { features } from "@/lib/env";

export const metadata: Metadata = { title: "Sign up" };

export default function Page() {
  return (
    // useSearchParams() in the form needs a Suspense boundary.
    <Suspense>
      <SignUpForm providers={{ github: features.github, google: features.google }} />
    </Suspense>
  );
}
