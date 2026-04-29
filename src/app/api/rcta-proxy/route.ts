import { NextRequest, NextResponse } from "next/server";

const RCTA_BASE = "https://app.rcta.me";

// Headers to strip from upstream that block iframe embedding
const STRIP_HEADERS = new Set([
  "x-frame-options",
  "content-security-policy",
  "content-security-policy-report-only",
]);

// Rewrite HTML so all relative + absolute rcta.me URLs go through this proxy
function rewriteHtml(html: string, proxyBase: string): string {
  // Rewrite absolute rcta.me URLs
  html = html.replace(
    /https:\/\/app\.rcta\.me\//g,
    `${proxyBase}?url=${encodeURIComponent(RCTA_BASE + "/")}`,
  );
  // Rewrite src/href attributes that start with /
  html = html.replace(
    /(src|href|action)="\/([^"]*?)"/g,
    (_, attr, path) => `${attr}="${proxyBase}?url=${encodeURIComponent(RCTA_BASE + "/" + path)}"`,
  );
  return html;
}

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const target = searchParams.get("url");

  if (!target) {
    return NextResponse.redirect(
      `${req.nextUrl.origin}/api/rcta-proxy?url=${encodeURIComponent(RCTA_BASE)}`,
    );
  }

  // Only proxy rcta.me
  if (!target.startsWith(RCTA_BASE)) {
    return new NextResponse("Forbidden", { status: 403 });
  }

  try {
    // Forward cookies so sessions are maintained
    const upstreamRes = await fetch(target, {
      headers: {
        "User-Agent": req.headers.get("user-agent") ?? "Mozilla/5.0",
        Cookie: req.headers.get("cookie") ?? "",
        Accept: req.headers.get("accept") ?? "text/html,*/*",
        "Accept-Language": "es-AR,es;q=0.9",
        Referer: RCTA_BASE,
      },
      redirect: "follow",
    });

    const contentType = upstreamRes.headers.get("content-type") ?? "";

    // Build response headers, stripping frame-blocking ones
    const resHeaders = new Headers();
    upstreamRes.headers.forEach((value, key) => {
      if (!STRIP_HEADERS.has(key.toLowerCase())) {
        resHeaders.set(key, value);
      }
    });

    // Forward Set-Cookie so login sessions persist
    const setCookie = upstreamRes.headers.get("set-cookie");
    if (setCookie) resHeaders.set("set-cookie", setCookie);

    // For HTML: rewrite internal links through proxy
    if (contentType.includes("text/html")) {
      const text = await upstreamRes.text();
      const proxyBase = `${req.nextUrl.origin}/api/rcta-proxy`;
      const rewritten = rewriteHtml(text, proxyBase);
      resHeaders.set("content-type", "text/html; charset=utf-8");
      return new NextResponse(rewritten, {
        status: upstreamRes.status,
        headers: resHeaders,
      });
    }

    // For everything else (JS, CSS, images): stream as-is
    const body = await upstreamRes.arrayBuffer();
    return new NextResponse(body, {
      status: upstreamRes.status,
      headers: resHeaders,
    });
  } catch (err) {
    console.error("[rcta-proxy] error:", err);
    return new NextResponse("Proxy error", { status: 502 });
  }
}

export async function POST(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const target = searchParams.get("url");

  if (!target || !target.startsWith(RCTA_BASE)) {
    return new NextResponse("Forbidden", { status: 403 });
  }

  try {
    const body = await req.text();
    const upstreamRes = await fetch(target, {
      method: "POST",
      headers: {
        "User-Agent": req.headers.get("user-agent") ?? "Mozilla/5.0",
        Cookie: req.headers.get("cookie") ?? "",
        "Content-Type": req.headers.get("content-type") ?? "application/x-www-form-urlencoded",
        Accept: req.headers.get("accept") ?? "*/*",
        Referer: RCTA_BASE,
      },
      body,
      redirect: "follow",
    });

    const resHeaders = new Headers();
    upstreamRes.headers.forEach((value, key) => {
      if (!STRIP_HEADERS.has(key.toLowerCase())) {
        resHeaders.set(key, value);
      }
    });

    const setCookie = upstreamRes.headers.get("set-cookie");
    if (setCookie) resHeaders.set("set-cookie", setCookie);

    const contentType = upstreamRes.headers.get("content-type") ?? "";
    if (contentType.includes("text/html")) {
      const text = await upstreamRes.text();
      const proxyBase = `${req.nextUrl.origin}/api/rcta-proxy`;
      const rewritten = rewriteHtml(text, proxyBase);
      resHeaders.set("content-type", "text/html; charset=utf-8");
      return new NextResponse(rewritten, { status: upstreamRes.status, headers: resHeaders });
    }

    const respBody = await upstreamRes.arrayBuffer();
    return new NextResponse(respBody, { status: upstreamRes.status, headers: resHeaders });
  } catch (err) {
    console.error("[rcta-proxy] POST error:", err);
    return new NextResponse("Proxy error", { status: 502 });
  }
}
