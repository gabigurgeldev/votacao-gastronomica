"use server";

import { createSupabaseServerClient } from "./server";

/**
 * Garante que o usuário atual é admin. Lança erro se não.
 */
export async function requireAdmin() {
  const supabase = createSupabaseServerClient();
  const { data } = await supabase.auth.getUser();

  if (!data.user) {
    throw new Error("Acesso negado.");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", data.user.id)
    .single();

  const role = profile?.role || data.user.app_metadata?.role;

  if (role !== "admin") {
    throw new Error("Acesso negado.");
  }

  return { supabase, user: data.user };
}

/**
 * Garante que existe um usuário autenticado (qualquer role).
 */
export async function requireUser() {
  const supabase = createSupabaseServerClient();
  const { data } = await supabase.auth.getUser();

  if (!data.user) {
    throw new Error("Usuário não autenticado.");
  }

  return { supabase, user: data.user };
}

/**
 * Retorna o role do usuário atual (ou null se anônimo).
 */
export async function getCurrentRole(): Promise<string | null> {
  const supabase = createSupabaseServerClient();
  const { data } = await supabase.auth.getUser();

  if (!data.user) return null;

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", data.user.id)
    .single();

  return profile?.role || data.user.app_metadata?.role || null;
}
