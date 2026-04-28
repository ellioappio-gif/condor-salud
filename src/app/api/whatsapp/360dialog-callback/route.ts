/**
 * GET /api/whatsapp/360dialog-callback
 *
 * 360dialog redirects to this URL after the Connect popup completes.
 * It appends ?client=<client_id>&channels[0][id]=...&channels[0][waba_id]=...
 *
 * This route simply closes the popup window via a self-closing HTML page
 * and fires a postMessage to the opener so the onboarding page picks it up.
 *
 * Note: the actual credential saving happens in /api/whatsapp/360dialog-connect
 * (called by the onboarding page after receiving the postMessage).
 */

import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);

  // 360dialog passes channel info as query params
  const clientId = searchParams.get("client") ?? "";
  const channels: { id: string; waba_id: string; apiKey: string }[] = [];

  // Support both ?channels[0][id]=... and ?channel_id= formats
  let i = 0;
  while (searchParams.has(`channels[${i}][id]`)) {
    channels.push({
      id: searchParams.get(`channels[${i}][id]`) ?? "",
      waba_id: searchParams.get(`channels[${i}][waba_id]`) ?? "",
      apiKey: searchParams.get(`channels[${i}][api_key]`) ?? "",
    });
    i++;
  }

  // Also handle simpler flat format
  if (channels.length === 0 && searchParams.has("channel_id")) {
    channels.push({
      id: searchParams.get("channel_id") ?? "",
      waba_id: searchParams.get("waba_id") ?? "",
      apiKey: searchParams.get("api_key") ?? "",
    });
  }

  const payload = JSON.stringify({ type: "permissions", client: { id: clientId, channels } });

  // Self-closing page that postMessages back to the opener
  const html = `<!DOCTYPE html>
<html>
<head><title>Conectando WhatsApp…</title></head>
<body>
<script>
  try {
    const payload = ${payload};
    if (window.opener) {
      window.opener.postMessage(payload, "*");
    }
  } catch(e) {}
  // Close popup after a short delay
  setTimeout(() => window.close(), 500);
</script>
<p style="font-family:sans-serif;text-align:center;padding:2rem;color:#555">
  Conectando WhatsApp Business… podés cerrar esta ventana.
</p>
</body>
</html>`;

  return new NextResponse(html, {
    headers: { "Content-Type": "text/html; charset=utf-8" },
  });
}
