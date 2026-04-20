import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import type { UserRole } from "./types";

/**
 * Middleware Supabase: atualiza sessão e aplica guards por rota.
 * - /admin/*       → requer role=admin
 * - /jurado/*      → requer role=jurado
 * - /admin/login   → público (formulário de entrada)
 */
export async function updateSession(request: NextRequest) {
  let response = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return request.cookies.get(name)?.value;
        },
        set(name: string, value: string, options: CookieOptions) {
          response.cookies.set({ name, value, ...options });
        },
        remove(name: string, options: CookieOptions) {
          response.cookies.set({ name, value: "", ...options });
        },
      },
    },
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const pathname = request.nextUrl.pathname;
  
  // Buscar role da tabela profiles (mais confiável)
  let role: UserRole | null = null;
  if (user) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();
    role = (profile?.role as UserRole) || (user?.app_metadata?.role as UserRole) || null;
  }

  const isAdminRoute = pathname.startsWith("/admin") && pathname !== "/admin/login";
  const isJuryRoute = pathname.startsWith("/jurado");

  if (isAdminRoute && role !== "admin") {
    const url = request.nextUrl.clone();
    url.pathname = "/admin/login";
    return NextResponse.redirect(url);
  }

  if (isJuryRoute && role !== "jurado") {
    const url = request.nextUrl.clone();
    url.pathname = "/admin/login";
    return NextResponse.redirect(url);
  }

  // Se já está logado e tenta acessar /admin/login, redireciona pelo role
  if (pathname === "/admin/login" && user) {
    const url = request.nextUrl.clone();
    url.pathname = role === "admin" ? "/admin/dashboard" : "/jurado/dashboard";
    return NextResponse.redirect(url);
  }

  return response;
}
