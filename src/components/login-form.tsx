"use client";

import { useActionState } from "react";
import { Loader2 } from "lucide-react";
import { signIn, type SignInState } from "@/lib/auth-actions";
import { Button, Input, Label } from "./ui";

const empty: SignInState = {};

export function LoginForm() {
  const [state, formAction, pending] = useActionState(signIn, empty);

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <div>
        <Label htmlFor="email">Email</Label>
        <Input
          id="email"
          name="email"
          type="email"
          inputMode="email"
          autoComplete="email"
          placeholder="you@example.com"
          required
          autoFocus
        />
      </div>
      <div>
        <Label htmlFor="password">Password</Label>
        <Input
          id="password"
          name="password"
          type="password"
          autoComplete="current-password"
          placeholder="••••••••"
          required
        />
      </div>

      {state.error && <p className="text-sm text-danger">{state.error}</p>}

      <Button type="submit" disabled={pending} className="mt-1">
        {pending && <Loader2 className="h-4 w-4 animate-spin" />}
        Sign in
      </Button>
    </form>
  );
}
