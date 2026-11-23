import { NextResponse, type NextRequest } from "next/server";
import { auth } from "./lib/auth";

export async function proxy(request: NextRequest) {
  const session = await auth.api.getSession({
    headers: request.headers,
  });

  const { pathname } = request.nextUrl;
  const isAuthPage = pathname === "/sinin" || pathname === "/sinup";

  if (!session) {
    let response: NextResponse;

    if (isAuthPage) {
      response = NextResponse.next();
    } else {
      const signInUrl = new URL("/sinin", request.url);
      signInUrl.searchParams.set("redirect", pathname);
      response = NextResponse.redirect(signInUrl);
    }

    for (const cookie of request.cookies.getAll()) {
      if (/^(?:__Secure-|__Host-)?better-auth\./.test(cookie.name)) {
        response.cookies.delete(cookie.name);
      }
    }

    return response;
  }

  const role = session.user.role;

  const dashboardPaths: Record<string, string> = {
    admin: "/dashboard/admin",
    staff: "/dashboard/staff",
    customer: "/dashboard/coustomer",
  };

  const dashboardPath = dashboardPaths[role];

  if (!dashboardPath) {
    const isDashboardPage =
      pathname === "/dashboard" || pathname.startsWith("/dashboard/");
    return isAuthPage || isDashboardPage
      ? NextResponse.redirect(new URL("/", request.url))
      : NextResponse.next();
  }

  if (isAuthPage || pathname === "/dashboard" || pathname === "/dashboard/") {
    return NextResponse.redirect(new URL(dashboardPath, request.url));
  }

  const dashboardSection = pathname.split("/")[2];
  if (
    dashboardSection &&
    Object.prototype.hasOwnProperty.call(dashboardPaths, dashboardSection) &&
    dashboardPath !== `/dashboard/${dashboardSection}`
  ) {
    return NextResponse.redirect(new URL(dashboardPath, request.url));
  }

  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-authenticated-role", role);
  return NextResponse.next({
    request: {
      headers: requestHeaders,
    },
  });
}

export const config = {
  matcher: ["/dashboard/:path*", "/sinin", "/sinup"],
};