"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { authClient } from "@/lib/auth-client";

function usePending() {
  const [pending, setPending] = React.useState(false);
  const run = async (fn: () => Promise<void>) => {
    setPending(true);
    try {
      await fn();
    } finally {
      setPending(false);
    }
  };
  return [pending, run] as const;
}

export function SettingsForms({ user }: { user: { name: string; email: string } }) {
  const router = useRouter();
  const [savingProfile, runProfile] = usePending();
  const [savingPassword, runPassword] = usePending();
  const [deleting, runDelete] = usePending();
  const [deletePassword, setDeletePassword] = React.useState("");

  return (
    <>
      <Card>
        <form
          className="grid gap-6"
          onSubmit={(e) => {
            e.preventDefault();
            const name = String(new FormData(e.currentTarget).get("name")).trim();
            void runProfile(async () => {
              const { error } = await authClient.updateUser({ name });
              if (error) return void toast.error(error.message ?? "Could not update your profile");
              toast.success("Profile updated");
              router.refresh();
            });
          }}
        >
          <CardHeader>
            <CardTitle>Profile</CardTitle>
            <CardDescription>Your sign-in details.</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4">
            <div className="grid gap-2">
              <Label htmlFor="name">Name</Label>
              <Input id="name" name="name" defaultValue={user.name} required />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" value={user.email} disabled />
            </div>
          </CardContent>
          <CardFooter className="justify-end border-t">
            <Button type="submit" disabled={savingProfile}>
              {savingProfile && <Loader2 className="animate-spin" />}
              Save
            </Button>
          </CardFooter>
        </form>
      </Card>

      <Card>
        <form
          className="grid gap-6"
          onSubmit={(e) => {
            e.preventDefault();
            const formEl = e.currentTarget;
            const form = new FormData(formEl);
            const newPassword = String(form.get("new"));
            if (newPassword !== String(form.get("confirm"))) return void toast.error("New passwords don't match");
            void runPassword(async () => {
              const { error } = await authClient.changePassword({
                currentPassword: String(form.get("current")),
                newPassword,
                revokeOtherSessions: true,
              });
              if (error) return void toast.error(error.message ?? "Could not change your password");
              formEl.reset();
              toast.success("Password changed. Other devices were signed out.");
            });
          }}
        >
          <CardHeader>
            <CardTitle>Password</CardTitle>
            <CardDescription>Changing it signs you out on other devices.</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4">
            <div className="grid gap-2">
              <Label htmlFor="current">Current password</Label>
              <Input id="current" name="current" type="password" autoComplete="current-password" required />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="grid gap-2">
                <Label htmlFor="new">New password</Label>
                <Input id="new" name="new" type="password" autoComplete="new-password" minLength={8} required />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="confirm">Confirm new password</Label>
                <Input id="confirm" name="confirm" type="password" autoComplete="new-password" minLength={8} required />
              </div>
            </div>
          </CardContent>
          <CardFooter className="justify-end border-t">
            <Button type="submit" disabled={savingPassword}>
              {savingPassword && <Loader2 className="animate-spin" />}
              Change password
            </Button>
          </CardFooter>
        </form>
      </Card>

      <Card className="ring-destructive/30">
        <CardHeader>
          <CardTitle>Delete account</CardTitle>
          <CardDescription>
            Permanently delete your account, business, clients and invoices. This cannot be undone.
          </CardDescription>
        </CardHeader>
        <CardFooter>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="destructive">Delete my account</Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Delete your account?</AlertDialogTitle>
                <AlertDialogDescription>
                  All of your invoices, clients and items will be removed immediately. Enter your password to confirm.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <Input
                type="password"
                placeholder="Your password"
                value={deletePassword}
                onChange={(e) => setDeletePassword(e.target.value)}
                autoComplete="current-password"
              />
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction
                  disabled={!deletePassword || deleting}
                  onClick={(e) => {
                    e.preventDefault();
                    void runDelete(async () => {
                      const { error } = await authClient.deleteUser({ password: deletePassword });
                      if (error) return void toast.error(error.message ?? "Could not delete your account");
                      toast.success("Your account was deleted");
                      router.push("/");
                      router.refresh();
                    });
                  }}
                >
                  {deleting && <Loader2 className="animate-spin" />}
                  Delete account
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </CardFooter>
      </Card>
    </>
  );
}
