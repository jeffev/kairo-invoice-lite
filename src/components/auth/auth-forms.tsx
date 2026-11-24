"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

import { SocialButtons } from "@/components/auth/social-buttons";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { authClient, signIn, signUp } from "@/lib/auth-client";
import { safeRedirect } from "@/lib/safe-redirect";

type Providers = { github: boolean; google: boolean };

function Header({ title, subtitle }: { title: string; subtitle: string }) {
  return (
    <div className="grid gap-1 text-center">
      <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
      <p className="text-sm text-muted-foreground">{subtitle}</p>
    </div>
  );
}

function useSubmit() {
  const [pending, setPending] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const run = async (fn: () => Promise<string | null | void>) => {
    setPending(true);
    setError(null);
    try {
      const message = await fn();
      if (message) setError(message);
    } finally {
      setPending(false);
    }
  };
  return { pending, error, run };
}

function FormError({ error }: { error: string | null }) {
  if (!error) return null;
  return (
    <Alert variant="destructive">
      <AlertDescription>{error}</AlertDescription>
    </Alert>
  );
}

export function SignInForm({ providers }: { providers: Providers }) {
  const router = useRouter();
  const next = safeRedirect(useSearchParams().get("next"));
  const { pending, error, run } = useSubmit();

  const onSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    void run(async () => {
      const { error } = await signIn.email({
        email: String(form.get("email")),
        password: String(form.get("password")),
        rememberMe: form.get("remember") === "on",
      });
      if (error) return error.message ?? "Could not sign in.";
      router.push(next);
      router.refresh();
    });
  };

  return (
    <div className="grid gap-6">
      <Header title="Welcome back" subtitle="Sign in to your account to continue" />
      <SocialButtons {...providers} callbackURL={next} />
      <form onSubmit={onSubmit} className="grid gap-4">
        <FormError error={error} />
        <div className="grid gap-2">
          <Label htmlFor="email">Email</Label>
          <Input id="email" name="email" type="email" autoComplete="email" placeholder="you@company.com" required />
        </div>
        <div className="grid gap-2">
          <div className="flex items-center justify-between">
            <Label htmlFor="password">Password</Label>
            <Link href="/forgot-password" className="text-xs text-muted-foreground hover:text-foreground hover:underline">
              Forgot password?
            </Link>
          </div>
          <Input id="password" name="password" type="password" autoComplete="current-password" required />
        </div>
        <label className="flex items-center gap-2 text-sm text-muted-foreground">
          <input type="checkbox" name="remember" defaultChecked className="size-4 accent-[var(--primary)]" />
          Keep me signed in
        </label>
        <Button type="submit" disabled={pending}>
          {pending && <Loader2 className="animate-spin" />}
          Sign in
        </Button>
      </form>
      <p className="text-center text-sm text-muted-foreground">
        Don&apos;t have an account?{" "}
        <Link href="/sign-up" className="font-medium text-foreground underline-offset-4 hover:underline">
          Sign up
        </Link>
      </p>
    </div>
  );
}

export function SignUpForm({ providers }: { providers: Providers }) {
  const router = useRouter();
  const { pending, error, run } = useSubmit();

  const onSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    void run(async () => {
      const { error } = await signUp.email({
        name: String(form.get("name")),
        email: String(form.get("email")),
        password: String(form.get("password")),
      });
      if (error) return error.message ?? "Could not create your account.";
      toast.success("Welcome aboard! Your free credits are ready.");
      router.push("/dashboard");
      router.refresh();
    });
  };

  return (
    <div className="grid gap-6">
      <Header title="Create your account" subtitle="Start free — no credit card required" />
      <SocialButtons {...providers} callbackURL="/dashboard" />
      <form onSubmit={onSubmit} className="grid gap-4">
        <FormError error={error} />
        <div className="grid gap-2">
          <Label htmlFor="name">Full name</Label>
          <Input id="name" name="name" autoComplete="name" placeholder="Alex Morgan" required />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="email">Email</Label>
          <Input id="email" name="email" type="email" autoComplete="email" placeholder="you@company.com" required />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="password">Password</Label>
          <Input id="password" name="password" type="password" autoComplete="new-password" minLength={8} required />
          <p className="text-xs text-muted-foreground">At least 8 characters.</p>
        </div>
        <Button type="submit" disabled={pending}>
          {pending && <Loader2 className="animate-spin" />}
          Create account
        </Button>
        <p className="text-center text-xs text-muted-foreground">
          By signing up you agree to our{" "}
          <Link href="/terms" className="underline">Terms</Link> and{" "}
          <Link href="/privacy" className="underline">Privacy Policy</Link>.
        </p>
      </form>
      <p className="text-center text-sm text-muted-foreground">
        Already have an account?{" "}
        <Link href="/sign-in" className="font-medium text-foreground underline-offset-4 hover:underline">
          Sign in
        </Link>
      </p>
    </div>
  );
}

export function ForgotPasswordForm() {
  const [sent, setSent] = React.useState(false);
  const { pending, error, run } = useSubmit();

  const onSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const email = String(new FormData(e.currentTarget).get("email"));
    void run(async () => {
      const { error } = await authClient.requestPasswordReset({ email, redirectTo: "/reset-password" });
      if (error) return error.message ?? "Could not send the reset email.";
      setSent(true);
    });
  };

  return (
    <div className="grid gap-6">
      <Header title="Forgot your password?" subtitle="We'll email you a link to choose a new one" />
      {sent ? (
        <Alert>
          <AlertDescription>
            If an account exists for that email, a reset link is on its way. Check your inbox (and spam folder).
          </AlertDescription>
        </Alert>
      ) : (
        <form onSubmit={onSubmit} className="grid gap-4">
          <FormError error={error} />
          <div className="grid gap-2">
            <Label htmlFor="email">Email</Label>
            <Input id="email" name="email" type="email" autoComplete="email" required />
          </div>
          <Button type="submit" disabled={pending}>
            {pending && <Loader2 className="animate-spin" />}
            Send reset link
          </Button>
        </form>
      )}
      <p className="text-center text-sm text-muted-foreground">
        <Link href="/sign-in" className="font-medium text-foreground underline-offset-4 hover:underline">
          Back to sign in
        </Link>
      </p>
    </div>
  );
}

export function ResetPasswordForm() {
  const router = useRouter();
  const params = useSearchParams();
  const token = params.get("token");
  const { pending, error, run } = useSubmit();

  if (!token || params.get("error")) {
    return (
      <div className="grid gap-6">
        <Header title="Link expired" subtitle="This password reset link is invalid or has expired." />
        <Button asChild>
          <Link href="/forgot-password">Request a new link</Link>
        </Button>
      </div>
    );
  }

  const onSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    const newPassword = String(form.get("password"));
    if (newPassword !== String(form.get("confirm"))) {
      void run(async () => "Passwords don't match.");
      return;
    }
    void run(async () => {
      const { error } = await authClient.resetPassword({ newPassword, token });
      if (error) return error.message ?? "Could not reset your password.";
      toast.success("Password updated. You can sign in now.");
      router.push("/sign-in");
    });
  };

  return (
    <div className="grid gap-6">
      <Header title="Choose a new password" subtitle="Make it at least 8 characters long" />
      <form onSubmit={onSubmit} className="grid gap-4">
        <FormError error={error} />
        <div className="grid gap-2">
          <Label htmlFor="password">New password</Label>
          <Input id="password" name="password" type="password" autoComplete="new-password" minLength={8} required />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="confirm">Confirm password</Label>
          <Input id="confirm" name="confirm" type="password" autoComplete="new-password" minLength={8} required />
        </div>
        <Button type="submit" disabled={pending}>
          {pending && <Loader2 className="animate-spin" />}
          Update password
        </Button>
      </form>
    </div>
  );
}
