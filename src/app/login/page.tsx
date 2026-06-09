import { Archive } from "lucide-react";
import { LoginForm } from "@/components/login-form";

export default function LoginPage() {
  return (
    <div className="flex min-h-dvh items-center justify-center px-4 py-12">
      <div className="w-full max-w-sm">
        <div className="mb-8 flex flex-col items-center gap-3 text-center">
          <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-accent text-accent-foreground">
            <Archive className="h-6 w-6" />
          </span>
          <div>
            <h1 className="text-xl font-semibold tracking-tight">Archive</h1>
            <p className="mt-1 text-sm text-muted">
              Your private vault for links & screenshots
            </p>
          </div>
        </div>

        <div className="rounded-card border border-border bg-surface p-6 shadow-sm">
          <LoginForm />
        </div>

        <p className="mt-6 text-center text-xs text-muted">
          Private space — sign-ups are disabled.
        </p>
      </div>
    </div>
  );
}
