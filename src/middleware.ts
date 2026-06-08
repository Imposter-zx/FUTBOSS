import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const RATE_LIMIT_REQUESTS = Number(process.env.RATE_LIMIT_REQUESTS) || 100;
const RATE_LIMIT_WINDOW_MS =
  Number(process.env.RATE_LIMIT_WINDOW_MS) || 60000;

const protectedRoutes = ["/dashboard", "/profile", "/settings"];
const adminRoutes = ["/admin"];
const authRoutes = ["/auth/login", "/auth/register"];

function getLocale(request: NextRequest): string {
  const acceptLanguage = request.headers.get("accept-language");
  if (!acceptLanguage) return "en";
  const locales = ["en", "fr", "ar", "es", "de", "it", "pt", "nl"];
  const preferred = acceptLanguage.split(",")[0]?.split("-")[0] ?? "en";
  return locales.includes(preferred) ? preferred : "en";
}

function getTheme(request: NextRequest): "dark" | "light" {
  const cookieTheme = request.cookies.get("theme")?.value;
  if (cookieTheme === "light" || cookieTheme === "dark") return cookieTheme;
  const prefersDark = request.headers.get("sec-ch-prefers-color-scheme");
  return prefersDark === "light" ? "light" : "dark";
}

export default withAuth(
  function middleware(request: NextRequest) {
    const url = request.nextUrl;
    const pathname = url.pathname;
    const token = (request as any).nextauth.token;

    const locale = getLocale(request);
    const theme = getTheme(request);

    const response = NextResponse.next();

    response.cookies.set("locale", locale, {
      httpOnly: true,
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 365,
    });

    response.cookies.set("theme", theme, {
      httpOnly: true,
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 365,
    });

    response.headers.set("X-Locale", locale);
    response.headers.set("X-Theme", theme);
    response.headers.set(
      "X-RateLimit-Limit",
      String(RATE_LIMIT_REQUESTS)
    );
    response.headers.set(
      "X-RateLimit-Remaining",
      String(RATE_LIMIT_REQUESTS - 1)
    );

    if (
      adminRoutes.some((route) => pathname.startsWith(route)) &&
      token?.role !== "ADMIN"
    ) {
      return NextResponse.redirect(new URL("/auth/login", request.url));
    }

    if (
      authRoutes.some((route) => pathname.startsWith(route)) &&
      token
    ) {
      return NextResponse.redirect(new URL("/dashboard", request.url));
    }

    return response;
  },
  {
    callbacks: {
      authorized: ({ token, req }) => {
        const pathname = req.nextUrl.pathname;

        if (authRoutes.some((route) => pathname.startsWith(route))) {
          return true;
        }

        if (protectedRoutes.some((route) => pathname.startsWith(route))) {
          return !!token;
        }

        if (adminRoutes.some((route) => pathname.startsWith(route))) {
          return token?.role === "ADMIN";
        }

        return true;
      },
    },
    secret: process.env.NEXTAUTH_SECRET,
  }
);

export const config = {
  matcher: [
    "/((?!api|_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt|images).*)",
  ],
};
