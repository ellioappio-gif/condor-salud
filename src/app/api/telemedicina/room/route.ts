import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { patientName, consultationId } = body;

    // Daily.co video room creation
    const apiKey = process.env.DAILY_API_KEY;
    if (!apiKey) {
      // Return a mock room when no API key configured
      return NextResponse.json({
        url: `https://condorsalud.daily.co/room-${Date.now()}`,
        name: `room-${Date.now()}`,
        mock: true,
      });
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
    return NextResponse.json({
      url: room.url,
      name: room.name,
      mock: false,
    });
  } catch (error) {
    console.error("Video room creation error:", error);
    return NextResponse.json({ error: "Failed to create video room" }, { status: 500 });
  }
}
