import { NextRequest, NextResponse } from "next/server";
import { checkRateLimit, sanitizeBody, logger } from "@/lib/security/api-guard";
import { requireAuth } from "@/lib/security/require-auth";

export async function POST(req: NextRequest) {
  const auth = await requireAuth(req);
  if (auth.error) return auth.error;

  // ── Rate limit: 5 req / 60s per IP ──
  const limited = checkRateLimit(req, "telemedicina-room", { limit: 5, windowSec: 60 });
  if (limited) return limited;

  try {
    const rawBody = await req.json();
    const body = sanitizeBody(rawBody);
    const { patientName, consultationId } = body;

    // Daily.co video room creation
    const apiKey = process.env.DAILY_API_KEY;
    if (!apiKey) {
      // ── Mock mode: no real video connection ──
      logger.warn(
        { route: "telemedicina/room", patientName, consultationId },
        "DAILY_API_KEY not set — returning mock room URL. Video calls will NOT work. " +
          "Set DAILY_API_KEY in env to enable real telemedicine rooms.",
      );
      return NextResponse.json(
        {
          url: `https://condorsalud.daily.co/room-${Date.now()}`,
          name: `room-${Date.now()}`,
          mock: true,
          warning:
            "Modo demo — sin conexión real a video. Configure DAILY_API_KEY para habilitar telemedicina.",
        },
        {
          status: 200,
          headers: { "X-Condor-Mock": "true" },
        },
      );
    }

    const res = await fetch("https://api.daily.co/v1/rooms", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        properties: {
          enable_screenshare: true,
          enable_recording: "cloud",
          exp: Math.floor(Date.now() / 1000) + 3600, // 1 hour
          max_participants: 4,
        },
      }),
    });

    if (!res.ok) {
      throw new Error(`Daily.co API error: ${res.status}`);
    }

    const room = await res.json();
    logger.info({ roomName: room.name, patientName, consultationId }, "Video room created");
    return NextResponse.json({
      url: room.url,
      name: room.name,
      mock: false,
    });
  } catch (err) {
    logger.error({ err, route: "telemedicina/room" }, "Video room creation error");
    return NextResponse.json({ error: "Failed to create video room" }, { status: 500 });
  }
}
