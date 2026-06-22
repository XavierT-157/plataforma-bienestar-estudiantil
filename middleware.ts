import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

export async function middleware(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet: { name: string; value: string; options: CookieOptions }[]) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          supabaseResponse = NextResponse.next({
            request,
          });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Proteger rutas de dashboard
  if (
    request.nextUrl.pathname.startsWith("/dashboard/estudiante") ||
    request.nextUrl.pathname.startsWith("/dashboard/consejero")
  ) {
    if (!user) {
      const url = request.nextUrl.clone();
      url.pathname = "/login";
      return NextResponse.redirect(url);
    }

    // Verificar rol del usuario
    const userRole = user.user_metadata?.role;

    if (
      request.nextUrl.pathname.startsWith("/dashboard/estudiante") &&
      userRole !== "estudiante"
    ) {
      const url = request.nextUrl.clone();
      url.pathname = "/dashboard/consejero";
      return NextResponse.redirect(url);
    }

    if (
      request.nextUrl.pathname.startsWith("/dashboard/consejero") &&
      userRole !== "consejero"
    ) {
      const url = request.nextUrl.clone();
      url.pathname = "/dashboard/estudiante";
      return NextResponse.redirect(url);
    }
  }

  return supabaseResponse;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
