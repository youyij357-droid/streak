"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/config";

export async function signInAdmin(formData: FormData) {
  if (!isSupabaseConfigured()) {
    redirect("/admin/login?error=supabase-env-missing");
  }

  const email = String(formData.get("email") ?? "");
  const password = String(formData.get("password") ?? "");
  const nextPath = String(formData.get("next") ?? "/admin");

  if (!email || !password) {
    redirect("/admin/login?error=missing-credentials");
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    redirect("/admin/login?error=invalid-login");
  }

  redirect(nextPath.startsWith("/") ? nextPath : "/admin");
}

export async function signOutAdmin() {
  if (isSupabaseConfigured()) {
    const supabase = await createClient();
    await supabase.auth.signOut();
  }

  redirect("/admin/login");
}
