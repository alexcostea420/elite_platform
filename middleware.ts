import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

import { getAbsoluteHostUrl, getHostRole, isMemberFacingPath } from "@/lib/utils/host-routing";

function getSupabaseConfig() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !anonKey) {
    throw new Error(
      "Supabase environment variables are missing. Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY.",
    );
  }

  return { url, anonKey };
}

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({ request });
  const { url, anonKey } = getSupabaseConfig();
  const pathname = request.nextUrl.pathname;
  const search = request.nextUrl.search;
  const hostRole = getHostRole(request.nextUrl.hostname);

  if (hostRole === "marketing") {
    if (pathname.startsWith("/admin")) {
      return NextResponse.redirect(getAbsoluteHostUrl("admin", `${pathname}${search}`));
    }

    if (isMemberFacingPath(pathname)) {
      return NextResponse.redirect(getAbsoluteHostUrl("app", `${pathname}${search}`));
    }
  }

  if (hostRole === "app") {
    if (pathname === "/") {
      const redirectUrl = request.nextUrl.clone();
      redirectUrl.pathname = "/dashboard";
      redirectUrl.search = "";
      return NextResponse.redirect(redirectUrl);
    }

    if (pathname.startsWith("/admin")) {
      return NextResponse.redirect(getAbsoluteHostUrl("admin", `${pathname}${search}`));
    }
  }

  if (hostRole === "admin") {
    if (pathname === "/") {
      const redirectUrl = request.nextUrl.clone();
      redirectUrl.pathname = "/admin/videos";
      redirectUrl.search = "";
      return NextResponse.redirect(redirectUrl);
    }

    if (pathname.startsWith("/dashboard") || pathname === "/upgrade") {
      return NextResponse.redirect(getAbsoluteHostUrl("app", `${pathname}${search}`));
    }
  }

  const supabase = createServerClient(url, anonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
        response = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) => {
          response.cookies.set(name, value, options);
        });
      },
    },
  });

  let user = null;
  try {
    const { data } = await supabase.auth.getUser();
    user = data.user;
  } catch {
    // If Supabase is unreachable, allow public pages through but block protected ones.
    if (pathname.startsWith("/dashboard") || pathname.startsWith("/admin")) {
      const redirectUrl = request.nextUrl.clone();
      redirectUrl.pathname = "/login";
      redirectUrl.searchParams.set("next", pathname);
      return NextResponse.redirect(redirectUrl);
    }
    return response;
  }

  if (hostRole === "admin" && pathname.startsWith("/admin")) {
    if (!user) {
      const redirectUrl = request.nextUrl.clone();
      redirectUrl.pathname = "/login";
      redirectUrl.searchParams.set("next", pathname);
      return NextResponse.redirect(redirectUrl);
    }

    try {
      const { data: profile } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", user.id)
        .maybeSingle();

      if (profile?.role !== "admin") {
        return NextResponse.redirect(getAbsoluteHostUrl("app", "/dashboard"));
      }
    } catch {
      return NextResponse.redirect(getAbsoluteHostUrl("app", "/dashboard"));
    }
  }

  // /bots is public, but /bots/subscribe, /bots/dashboard, /bots/admin need auth
  const botProtectedPaths = ["/bots/subscribe", "/bots/dashboard", "/bots/admin"];
  const isBotProtected = botProtectedPaths.some((p) => pathname.startsWith(p));

  if (!user && isBotProtected) {
    const redirectUrl = request.nextUrl.clone();
    redirectUrl.pathname = "/login";
    redirectUrl.searchParams.set("next", pathname);
    return NextResponse.redirect(redirectUrl);
  }

  if (!user && (pathname.startsWith("/dashboard") || pathname.startsWith("/admin"))) {
    const redirectUrl = request.nextUrl.clone();
    redirectUrl.pathname = "/login";
    redirectUrl.searchParams.set("next", pathname);
    return NextResponse.redirect(redirectUrl);
  }

  if (user && (pathname === "/login" || pathname === "/signup")) {
    const redirectUrl = request.nextUrl.clone();
    redirectUrl.pathname = hostRole === "admin" ? "/admin/videos" : "/dashboard";
    redirectUrl.search = "";
    return NextResponse.redirect(redirectUrl);
  }

  return response;
}

export const config = {
  matcher: ["/", "/dashboard/:path*", "/admin/:path*", "/bots/:path*", "/invite/:path*", "/login", "/signup", "/upgrade/:path*"],
};
