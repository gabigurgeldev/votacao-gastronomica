import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/supabase/auth-helpers";
import { createSupabaseAdminClient } from "@/lib/supabase/server";
import { formatCPF, formatPhone } from "@/lib/cpf";
import type { Voter } from "@/lib/supabase/types";

function escapeCsvCell(value: string): string {
  return `"${value.replace(/"/g, '""')}"`;
}

export async function GET() {
  try {
    await requireAdmin();
  } catch {
    return new NextResponse("Não autorizado.", { status: 401 });
  }

  const admin = createSupabaseAdminClient();
  const { data, error } = await admin
    .from("voters")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    return new NextResponse(error.message, { status: 500 });
  }

  const rows = (data ?? []) as Voter[];
  const header = ["Nome", "E-mail", "Telefone", "CPF", "IP", "Data de cadastro"]
    .map(escapeCsvCell)
    .join(";");

  const lines = rows.map((v) =>
    [
      v.name,
      v.email,
      formatPhone(v.phone),
      formatCPF(v.cpf),
      v.ip_address ?? "",
      new Date(v.created_at).toLocaleString("pt-BR"),
    ]
      .map((c) => escapeCsvCell(c))
      .join(";"),
  );

  const body = "\ufeff" + [header, ...lines].join("\r\n");
  const filename = `votantes-${new Date().toISOString().slice(0, 10)}.csv`;

  return new NextResponse(body, {
    status: 200,
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
}
