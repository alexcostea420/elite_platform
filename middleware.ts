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
  const { url, anonKey } = getSupabaseConfig();
  const pathname = request.nextUrl.pathname;
  const search = request.nextUrl.search;
  const hostRole = getHostRole(request.nextUrl.hostname);

  // Host-based redirects (no auth needed)
  if (hostRole === "marketing") {
    if (pathname.startsWith("/admin")) {
      return NextResponse.redirect(getAbsoluteHostUrl("admin", `${pathname}${search}`));
    }
    if (isMemberFacingPath(pathname)) {
      return NextResponse.redirect(getAbsoluteHostUrl("app", `${pathname}${search}`));
    }
  }

  if (hostRole === "app" && pathname === "/") {
    const redirectUrl = request.nextUrl.clone();
    redirectUrl.pathname = "/dashboard";
    redirectUrl.search = "";
    return NextResponse.redirect(redirectUrl);
  }

  if (hostRole === "app" && pathname.startsWith("/admin")) {
    return NextResponse.redirect(getAbsoluteHostUrl("admin", `${pathname}${search}`));
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

  // Create Supabase client with proper cookie handling
  let response = NextResponse.next({ request });

  const supabase = createServerClient(url, anonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        // Update request cookies for downstream
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
        // Create fresh response with updated request
        response = NextResponse.next({ request });
        // Set cookies on response so they reach the browser
        cookiesToSet.forEach(({ name, value, options }) => {
          response.cookies.set(name, value, options);
        });
      },
    },
  });

  // IMPORTANT: Always call getUser() to refresh the session
  // This must happen BEFORE any redirects so cookies are set
  const { data: { user } } = await supabase.auth.getUser();

  // Logged-in user on marketing landing page → redirect to dashboard
  if (user && hostRole === "marketing" && pathname === "/") {
    return createRedirectWithCookies(response, getAbsoluteHostUrl("app", "/dashboard"));
  }

  // Admin role check
  if (hostRole === "admin" && pathname.startsWith("/admin")) {
    if (!user) {
      return createRedirect(request, response, "/login", pathname);
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

  // Bot protected paths
  const botProtectedPaths = ["/bots/subscribe", "/bots/dashboard", "/bots/admin"];
  const isBotProtected = botProtectedPaths.some((p) => pathname.startsWith(p));

  if (!user && isBotProtected) {
    return createRedirect(request, response, "/login", pathname);
  }

  // Dashboard/admin auth check
  if (!user && (pathname.startsWith("/dashboard") || pathname.startsWith("/admin"))) {
    return createRedirect(request, response, "/login", pathname);
  }

  // Redirect logged-in users away from login/signup
  if (user && (pathname === "/login" || pathname === "/signup")) {
    const redirectUrl = request.nextUrl.clone();
    redirectUrl.pathname = hostRole === "admin" ? "/admin/videos" : "/dashboard";
    redirectUrl.search = "";
    return createRedirectWithCookies(response, redirectUrl.toString());
  }

  return response;
}

/**
 * Create a redirect that preserves the session cookies from the Supabase refresh.
 * Without this, redirects lose the refreshed cookies and users get logged out.
 */
function createRedirect(request: NextRequest, response: NextResponse, loginPath: string, nextPath: string) {
  const redirectUrl = request.nextUrl.clone();
  redirectUrl.pathname = loginPath;
  redirectUrl.searchParams.set("next", nextPath);
  return createRedirectWithCookies(response, redirectUrl.toString());
}

function createRedirectWithCookies(response: NextResponse, url: string) {
  const redirect = NextResponse.redirect(url);
  // Copy refreshed session cookies to the redirect response
  response.cookies.getAll().forEach((cookie) => {
    redirect.cookies.set(cookie.name, cookie.value);
  });
  return redirect;
}

export const config = {
  matcher: ["/", "/dashboard/:path*", "/admin/:path*", "/bots/:path*", "/invite/:path*", "/login", "/signup", "/upgrade/:path*"],
};
