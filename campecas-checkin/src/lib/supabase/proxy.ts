import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import type { Database } from "./database.types";
import { SUPABASE_ANON_KEY, SUPABASE_URL } from "@/lib/env";

// /laudo: laudo público do cliente (o token é validado no servidor, em public_report()).
const PUBLIC_PATHS = ["/login", "/privacidade", "/laudo"];

/** Renova a sessão a cada requisição e protege as rotas internas. */
export async function updateSession(request: NextRequest) {
  const path = request.nextUrl.pathname;
  // Repassa o caminho para o servidor (usado no redirecionamento da senha provisória).
  const next = () => {
    const headers = new Headers(request.headers);
    headers.set("x-pathname", path);
    return NextResponse.next({ request: { headers } });
  };
  let response = next();

  const supabase = createServerClient<Database>(SUPABASE_URL(), SUPABASE_ANON_KEY(), {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
        response = next();
        cookiesToSet.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
      },
    },
  });

  // Não inserir código entre a criação do cliente e getClaims().
  const { data } = await supabase.auth.getClaims();
  const isAuthenticated = Boolean(data?.claims?.sub);

  const isPublic = PUBLIC_PATHS.some((p) => path === p || path.startsWith(`${p}/`));

  if (!isAuthenticated && !isPublic) {
    if (path.startsWith("/api/")) {
      return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
    }
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    url.search = path !== "/" ? `?next=${encodeURIComponent(path)}` : "";
    return NextResponse.redirect(url);
  }

  if (isAuthenticated && path === "/login") {
    const url = request.nextUrl.clone();
    url.pathname = "/";
    url.search = "";
    return NextResponse.redirect(url);
  }

  return response;
}
