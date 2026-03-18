import { NextRequest, NextResponse } from "next/server";

// Simple in-memory rate limiter (resets on cold start — fine for Vercel serverless)
const rateLimitMap = new Map<string, { count: number; resetAt: number }>();

function rateLimit(
  key: string,
  maxRequests: number,
  windowMs: number
): boolean {
  const now = Date.now();
  const entry = rateLimitMap.get(key);

  if (!entry || now > entry.resetAt) {
    rateLimitMap.set(key, { count: 1, resetAt: now + windowMs });
    return true;
  }

  if (entry.count >= maxRequests) {
    return false;
  }

  entry.count++;
  return true;
}

// Cleanup stale entries periodically (prevent memory leak)
setInterval(() => {
  const now = Date.now();
  for (const [key, entry] of rateLimitMap) {
    if (now > entry.resetAt) rateLimitMap.delete(key);
  }
}, 60_000);

function getClientIp(request: NextRequest): string {
  return (
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    request.headers.get("x-real-ip") ||
    "unknown"
  );
}

// Rate limit config per route pattern
const RATE_LIMITS: {
  pattern: RegExp;
  maxRequests: number;
  windowMs: number;
}[] = [
  // Public endpoints — strict limits by IP
  { pattern: /^\/api\/waitlist$/, maxRequests: 5, windowMs: 60_000 },
  { pattern: /^\/api\/invite\//, maxRequests: 20, windowMs: 60_000 },
  // Authenticated mutation endpoints — per IP (session check happens in route)
  { pattern: /^\/api\/connections$/, maxRequests: 10, windowMs: 60_000 },
  { pattern: /^\/api\/rate-limited$/, maxRequests: 3, windowMs: 300_000 },
  { pattern: /^\/api\/circles$/, maxRequests: 10, windowMs: 60_000 },
  { pattern: /^\/api\/availability$/, maxRequests: 20, windowMs: 60_000 },
];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Only rate-limit API routes
  if (!pathname.startsWith("/api/")) {
    return NextResponse.next();
  }

  const ip = getClientIp(request);

  for (const { pattern, maxRequests, windowMs } of RATE_LIMITS) {
    if (pattern.test(pathname)) {
      const key = `${ip}:${pattern.source}`;
      if (!rateLimit(key, maxRequests, windowMs)) {
        return NextResponse.json(
          { error: "Too many requests" },
          { status: 429 }
        );
      }
      break;
    }
  }

  // Fallback rate limit for unmatched API routes
  const fallbackKey = `${ip}:api-fallback`;
  if (!rateLimit(fallbackKey, 60, 60_000)) {
    return NextResponse.json(
      { error: "Too many requests" },
      { status: 429 }
    );
  }

  // Add security headers
  const response = NextResponse.next();
  response.headers.set("X-Content-Type-Options", "nosniff");
  response.headers.set("X-Frame-Options", "DENY");
  response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  response.headers.set(
    "Permissions-Policy",
    "camera=(), microphone=(), geolocation=()"
  );
  response.headers.set(
    "Strict-Transport-Security",
    "max-age=31536000; includeSubDomains"
  );
  response.headers.set(
    "Content-Security-Policy",
    "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self' https://fonts.gstatic.com; connect-src 'self'"
  );

  return response;
}

export const config = {
  matcher: ["/api/:path*"],
};
