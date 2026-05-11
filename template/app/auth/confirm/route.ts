import { type EmailOtpType } from "@supabase/supabase-js";
import { type NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const token = searchParams.get("token");
  const email = searchParams.get("email");
  const type = searchParams.get("type") as EmailOtpType | null;
  const next = searchParams.get("next") ?? "/dashboard";

  // Use the incoming host for the redirect — Next.js dev otherwise
  // normalises 127.0.0.1 → localhost, which sheds the session cookie.
  const redirectUrl = request.nextUrl.clone();
  redirectUrl.search = "";

  if (token && email && type) {
    const supabase = await createClient();
    const { error } = await supabase.auth.verifyOtp({ email, token, type });
    if (!error) {
      redirectUrl.pathname = next;
      return NextResponse.redirect(redirectUrl);
    }
    console.error("verifyOtp failed:", error.message);
  }

  redirectUrl.pathname = "/login";
  redirectUrl.searchParams.set("error", "verify-failed");
  return NextResponse.redirect(redirectUrl);
}
