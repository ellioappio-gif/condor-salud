import { NextRequest, NextResponse } from "next/server";
import { exchangeCodeForTokens, getGoogleUserInfo } from "@/lib/google";
import { logger } from "@/lib/security/api-guard";

/** Validate redirect target to prevent open-redirect attacks */
function safeRedirect(target: string | null): string {
  if (!target) return "/dashboard";
  // Only allow relative paths starting with /
  if (!target.startsWith("/") || target.startsWith("//")) return "/dashboard";
  // Block protocol-relative URLs and data/javascript schemes
  if (/^\/[\\@]/.test(target)) return "/dashboard";
  return target;
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const code = searchParams.get("code");
    const state = searchParams.get("state");
    const error = searchParams.get("error");

    if (error) {
      logger.warn({ error, route: "auth/google/callback" }, "OAuth error response");
      return NextResponse.redirect(
        new URL(`/auth/login?error=${encodeURIComponent(error)}`, req.url),
      );
    }

    if (!code) {
      return NextResponse.redirect(new URL("/auth/login?error=missing_code", req.url));
    }

    const origin = new URL(req.url).origin;
    const redirectUri = `${origin}/api/auth/google/callback`;

    // Exchange code for tokens
    const tokens = await exchangeCodeForTokens(code, redirectUri);

    // Get user info from Google
    const googleUser = await getGoogleUserInfo(tokens.access_token);

    // Build session data (do NOT store raw tokens in the readable cookie)
    const sessionData = {
      id: `google-${googleUser.sub}`,
      email: googleUser.email,
      name: googleUser.name,
      role: "admin" as const,
      clinicId: "clinic-001",
      clinicName: "Centro Médico Sur",
      avatarUrl: googleUser.picture,
      googleAccessToken: tokens.access_token,
      googleRefreshToken: tokens.refresh_token,
    };

    // Validated redirect — prevents open redirect
    const redirect = safeRedirect(state);
    const response = NextResponse.redirect(new URL(redirect, req.url));

    // Set session cookie (httpOnly for security)
    response.cookies.set("condor_google_session", JSON.stringify(sessionData), {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 7, // 7 days
      path: "/",
    });

    // Public cookie — NEVER include tokens
    response.cookies.set(
      "condor_google_user",
      JSON.stringify({
        id: sessionData.id,
        email: sessionData.email,
        name: sessionData.name,
        avatarUrl: sessionData.avatarUrl,
      }),
      {
        httpOnly: false,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        maxAge: 60 * 60 * 24 * 7,
        path: "/",
      },
    );

    logger.info({ userId: sessionData.id }, "Google OAuth login success");
    return response;
  } catch (err) {
    logger.error({ err, route: "auth/google/callback" }, "Google OAuth callback error");
    return NextResponse.redirect(new URL("/auth/login?error=oauth_failed", req.url));
  }
}
