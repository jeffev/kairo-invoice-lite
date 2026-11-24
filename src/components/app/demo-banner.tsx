import { FlaskConical } from "lucide-react";

/** Tells the developer that emails are printed to the console until RESEND_API_KEY is set. */
export function DemoBanner({ email }: { email: boolean }) {
  if (email) return null;
  return (
    <div className="flex items-center gap-2 border-b bg-amber-500/10 px-4 py-2 text-xs text-amber-800 dark:text-amber-300">
      <FlaskConical className="size-3.5 shrink-0" />
      <span>
        Demo mode: emails are printed to the server console. Set RESEND_API_KEY in <code>.env</code> to send them.
      </span>
    </div>
  );
}
