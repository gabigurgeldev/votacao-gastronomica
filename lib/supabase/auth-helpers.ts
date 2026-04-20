"use server";

import { createSupabaseServerClient } from "./server";

/**
 * Verifica se o usuário atual é admin
 * Busca na tabela profiles primeiro, fallback para app_metadata
 */
export async function requireAdmin() {
  const supabase = createSupabaseServerClient();
  const { data } = await supabase.auth.getUser();
  
  if (!data.user) {
    throw new Error("Acesso negado.");
  }
  
  // Buscar role na tabela profiles
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
 * Verifica se o usuário atual é jurado
 */
export async function requireJury() {
  const supabase = createSupabaseServerClient();
  const { data } = await supabase.auth.getUser();
  
  if (!data.user) {
    throw new Error("Acesso negado.");
  }
  
  // Buscar role na tabela profiles
  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", data.user.id)
    .single();
  
  const role = profile?.role || data.user.app_metadata?.role;
  
  if (role !== "jurado") {
    throw new Error("Acesso negado.");
  }
  
  return { supabase, user: data.user };
}

/**
 * Retorna a role do usuário atual
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
