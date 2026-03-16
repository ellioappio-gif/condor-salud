import { NextRequest, NextResponse } from "next/server";
import { listCalendarEvents, createCalendarEvent, refreshAccessToken } from "@/lib/google";
import { checkRateLimit, sanitize, logger } from "@/lib/security/api-guard";
import { decrypt, encrypt } from "@/lib/security/crypto";
import { z } from "zod";

/* ── Helpers: session parsing & token refresh ────────────── */
interface GoogleSession {
  id: string;
  email: string;
  name: string;
  role: string;
  clinicId: string;
  clinicName: string;
  avatarUrl?: string;
  googleAccessToken: string;
  googleRefreshToken?: string;
}

function parseSession(raw: string | undefined): GoogleSession | null {
  if (!raw) return null;
  try {
    return JSON.parse(raw) as GoogleSession;
  } catch {
    return null;
  }
}

/**
 * U-10: Attempt to refresh the access token and update the session cookie.
 * Returns the new plaintext access token, or null if refresh is impossible.
 */
async function tryRefreshToken(session: GoogleSession, res: NextResponse): Promise<string | null> {
  if (!session.googleRefreshToken) return null;
  try {
    const refreshToken = decrypt(session.googleRefreshToken);
    const { access_token } = await refreshAccessToken(refreshToken);
    // Update session cookie with new encrypted access token
    const updatedSession: GoogleSession = {
      ...session,
      googleAccessToken: encrypt(access_token),
    };
    res.cookies.set("condor_google_session", JSON.stringify(updatedSession), {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 7,
      path: "/",
    });
    return access_token;
  } catch (err) {
    logger.error({ err, route: "google/calendar" }, "Token refresh failed");
    return null;
  }
}

/** Map Google Calendar events to our internal format */
function mapEvents(events: Awaited<ReturnType<typeof listCalendarEvents>>) {
  return events.map((e) => ({
    id: e.id,
    title: e.summary,
    description: e.description,
    start: e.start.dateTime || e.start.date,
    end: e.end.dateTime || e.end.date,
    attendees: (e.attendees || []).map((a) => ({
      email: a.email,
      name: a.displayName,
      status: a.responseStatus,
    })),
    meetLink: e.hangoutLink,
    status: e.status,
  }));
}

/** Check if an error is a Google 401 (expired token) */
function isTokenExpired(err: unknown): boolean {
  const msg = err instanceof Error ? err.message : String(err);
  return msg.includes("401") || msg.includes("Unauthorized");
}

/* ── GET: Fetch upcoming calendar events ─────────────────── */
export async function GET(req: NextRequest) {
  // SH-02: Rate limit
  const limited = checkRateLimit(req, "google-calendar", { limit: 15, windowSec: 60 });
  if (limited) return limited;

  try {
    const session = parseSession(req.cookies.get("condor_google_session")?.value);
    if (!session?.googleAccessToken) {
      return NextResponse.json({ error: "Not authenticated with Google" }, { status: 401 });
    }

    let accessToken = decrypt(session.googleAccessToken);

    const { searchParams } = new URL(req.url);
    const days = parseInt(searchParams.get("days") || "7");
    const now = new Date();
    const future = new Date(now.getTime() + days * 24 * 60 * 60 * 1000);

    let events;
    try {
      events = await listCalendarEvents(accessToken, now.toISOString(), future.toISOString());
    } catch (err: unknown) {
      // U-10: If 401, attempt token refresh and retry once
      if (isTokenExpired(err)) {
        const response = NextResponse.json({ error: "refreshing" });
        const newToken = await tryRefreshToken(session, response);
        if (newToken) {
          accessToken = newToken;
          events = await listCalendarEvents(accessToken, now.toISOString(), future.toISOString());
          // Build final response with refreshed cookie
          const finalRes = NextResponse.json({
            events: mapEvents(events),
          });
          // Copy refreshed cookie
          response.cookies.getAll().forEach((c) => {
            finalRes.cookies.set(c.name, c.value);
          });
          return finalRes;
        }
      }
      throw err;
    }

    return NextResponse.json({ events: mapEvents(events) });
  } catch (err) {
    logger.error({ err, route: "google/calendar" }, "Calendar sync error");
    return NextResponse.json({ error: "Failed to fetch calendar events" }, { status: 500 });
  }
}

// SH-05: Zod schema for calendar event creation
const calendarEventSchema = z.object({
  patientName: z.string().min(1).max(200),
  patientEmail: z.string().email().optional(),
  doctorName: z.string().max(200).optional(),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  startTime: z.string().regex(/^\d{2}:\d{2}$/),
  endTime: z
    .string()
    .regex(/^\d{2}:\d{2}$/)
    .optional(),
  type: z.string().max(100).optional(),
});

/* ── POST: Create a new calendar event (appointment) ─────── */
export async function POST(req: NextRequest) {
  // SH-02: Rate limit
  const limited = checkRateLimit(req, "google-calendar", { limit: 10, windowSec: 60 });
  if (limited) return limited;

  try {
    const session = parseSession(req.cookies.get("condor_google_session")?.value);
    if (!session?.googleAccessToken) {
      return NextResponse.json({ error: "Not authenticated with Google" }, { status: 401 });
    }

    let accessToken = decrypt(session.googleAccessToken);

    const rawBody = await req.json();
    // SH-05: Validate with Zod
    const parsed = calendarEventSchema.safeParse(rawBody);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Datos inválidos", details: parsed.error.flatten().fieldErrors },
        { status: 400 },
      );
    }

    const { patientName, patientEmail, doctorName, date, startTime, endTime, type } = parsed.data;
    // Sanitize string inputs
    const cleanPatientName = sanitize(patientName, 200);
    const cleanDoctorName = doctorName ? sanitize(doctorName, 200) : undefined;

    const eventPayload = {
      summary: `Turno: ${cleanPatientName} — ${type || "Consulta"}`,
      description: [
        `Paciente: ${cleanPatientName}`,
        `Profesional: ${cleanDoctorName || "Sin asignar"}`,
        `Tipo: ${type || "Consulta médica"}`,
        "",
        "Turno agendado desde Cóndor Salud.",
        "Centro Médico Sur — Av. San Martín 1520, CABA",
      ].join("\n"),
      start: { dateTime: `${date}T${startTime}:00-03:00` },
      end: { dateTime: `${date}T${endTime || incrementTime(startTime, 30)}:00-03:00` },
      attendees: patientEmail ? [{ email: patientEmail }] : undefined,
      reminders: {
        useDefault: false,
        overrides: [
          { method: "popup", minutes: 60 },
          { method: "email", minutes: 1440 }, // 24h before
        ],
      },
    };

    let event;
    try {
      event = await createCalendarEvent(accessToken, eventPayload);
    } catch (err: unknown) {
      // U-10: If 401, attempt token refresh and retry once
      if (isTokenExpired(err)) {
        const response = NextResponse.json({ error: "refreshing" });
        const newToken = await tryRefreshToken(session, response);
        if (newToken) {
          accessToken = newToken;
          event = await createCalendarEvent(accessToken, eventPayload);
          const finalRes = NextResponse.json({
            success: true,
            eventId: event.id,
            meetLink: event.hangoutLink,
          });
          response.cookies.getAll().forEach((c) => {
            finalRes.cookies.set(c.name, c.value);
          });
          return finalRes;
        }
      }
      throw err;
    }

    return NextResponse.json({
      success: true,
      eventId: event.id,
      meetLink: event.hangoutLink,
    });
  } catch (err) {
    logger.error({ err, route: "google/calendar" }, "Calendar create error");
    return NextResponse.json({ error: "Failed to create calendar event" }, { status: 500 });
  }
}

function incrementTime(time: string, minutes: number): string {
  const parts = time.split(":").map(Number);
  const h = parts[0] ?? 0;
  const m = parts[1] ?? 0;
  const total = h * 60 + m + minutes;
  return `${String(Math.floor(total / 60)).padStart(2, "0")}:${String(total % 60).padStart(2, "0")}`;
}
