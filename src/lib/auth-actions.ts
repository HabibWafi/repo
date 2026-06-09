"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";

const signInSchema = z.object({
  email: z.string().trim().email("Enter a valid email"),
  password: z.string().min(1, "Enter your password"),
});

export type SignInState = { error?: string };

/** Sign in with email + password. There is intentionally no sign-up flow. */
export async function signIn(
  _prev: SignInState,
  formData: FormData
): Promise<SignInState> {
  const parsed = signInSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  // Surface a clear message if the Supabase env vars never made it into the
  // build/runtime — otherwise this looks like a wrong password.
  if (
    !process.env.NEXT_PUBLIC_SUPABASE_URL ||
    !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  ) {
    return {
      error:
        "Config error: Supabase URL/key missing. Check the Vercel environment variables and redeploy.",
    };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword(parsed.data);

  if (error) {
    // Show the real reason (e.g. "Invalid login credentials",
    // "Email not confirmed", "Invalid API key", network errors) instead of a
    // generic message, so misconfiguration is diagnosable.
    console.error("signIn failed:", error.status, error.code, error.message);
    return { error: error.message || "Sign in failed" };
  }

  redirect("/");
}
