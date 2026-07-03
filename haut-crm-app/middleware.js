import { NextResponse } from "next/server";

// Simple site-wide password protection using HTTP Basic Auth.
// Username and password are read from environment variables — never hardcoded here.
export function middleware(request) {
  const user = process.env.APP_USERNAME || "haut";
  const pass = process.env.APP_PASSWORD;

  // If no password is configured, don't lock anyone out accidentally —
  // but this means the app is unprotected, so make sure APP_PASSWORD is set in Vercel.
  if (!pass) {
    return NextResponse.next();
  }

  const authHeader = request.headers.get("authorization");

  if (authHeader) {
    const encoded = authHeader.split(" ")[1] || "";
    const decoded = Buffer.from(encoded, "base64").toString();
    const [suppliedUser, suppliedPass] = decoded.split(":");
    if (suppliedUser === user && suppliedPass === pass) {
      return NextResponse.next();
    }
  }

  return new NextResponse("Authentication required", {
    status: 401,
    headers: { "WWW-Authenticate": 'Basic realm="Haut CGI Client Ledger"' },
  });
}

// Protect every route, including the API.
export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
