"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export async function signInWithMagicLink(formData: FormData) {
  const email = String(formData.get("email") ?? "").trim();
  if (!email) {
    return { error: "Email is required." };
  }

  const supabase = await createClient();
  // The custom magic-link email template (supabase/templates/magic_link.html)
  // bakes in `next=/dashboard`, so emailRedirectTo isn't needed for routing.
  const { error } = await supabase.auth.signInWithOtp({ email });

  if (error) {
    return { error: error.message };
  }

  return { success: true };
}

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login");
}
