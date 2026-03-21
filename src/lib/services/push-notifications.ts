// ─── Push Notification Service ───────────────────────────────
// Web Push notifications via the Web Push Protocol (VAPID).
// Falls back gracefully when VAPID keys are not configured.
//
// Requires:
//   VAPID_PUBLIC_KEY  — base64-encoded VAPID public key
//   VAPID_PRIVATE_KEY — base64-encoded VAPID private key
//   VAPID_SUBJECT     — mailto: or URL identifier

import webpush from "web-push";
import { logger } from "@/lib/logger";

// ─── Configuration ───────────────────────────────────────────

const VAPID_PUBLIC_KEY = process.env.VAPID_PUBLIC_KEY || "";
const VAPID_PRIVATE_KEY = process.env.VAPID_PRIVATE_KEY || "";
const VAPID_SUBJECT = process.env.VAPID_SUBJECT || "mailto:soporte@condorsalud.com";

let configured = false;
if (VAPID_PUBLIC_KEY && VAPID_PRIVATE_KEY) {
  webpush.setVapidDetails(VAPID_SUBJECT, VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY);
  configured = true;
}

// ─── Types ───────────────────────────────────────────────────

export interface PushSubscriptionRecord {
  endpoint: string;
  keys: {
    p256dh: string;
    auth: string;
  };
}

export interface PushPayload {
  title: string;
  body: string;
  icon?: string;
  badge?: string;
  url?: string; // click action URL
  tag?: string; // collapse key
}

// ─── Public API ──────────────────────────────────────────────

/**
 * Send a push notification to a single subscription.
 * Returns true if sent successfully, false otherwise.
 */
export async function sendPushNotification(
  subscription: PushSubscriptionRecord,
  payload: PushPayload,
): Promise<boolean> {
  if (!configured) {
    logger.warn("Web Push not configured — VAPID keys missing");
    return false;
  }

  try {
    await webpush.sendNotification(
      {
        endpoint: subscription.endpoint,
        keys: subscription.keys,
      },
      JSON.stringify({
        title: payload.title,
        body: payload.body,
        icon: payload.icon || "/logos/condor-icon-192.png",
        badge: payload.badge || "/logos/condor-badge-72.png",
        data: { url: payload.url || "/paciente/turnos" },
        tag: payload.tag,
      }),
    );
    logger.info({ endpoint: subscription.endpoint.slice(0, 50) }, "Push notification sent");
    return true;
  } catch (err) {
    const error = err as { statusCode?: number };
    if (error.statusCode === 410 || error.statusCode === 404) {
      logger.info("Push subscription expired/unsubscribed — should remove");
    } else {
      logger.error({ err }, "Push notification send failed");
    }
    return false;
  }
}

/**
 * Send a push notification to multiple subscriptions.
 * Skips expired/failed subscriptions gracefully.
 */
export async function sendPushToMany(
  subscriptions: PushSubscriptionRecord[],
  payload: PushPayload,
): Promise<{ sent: number; failed: number }> {
  if (!configured || subscriptions.length === 0) {
    return { sent: 0, failed: 0 };
  }

  let sent = 0;
  let failed = 0;

  await Promise.allSettled(
    subscriptions.map(async (sub) => {
      const ok = await sendPushNotification(sub, payload);
      if (ok) sent++;
      else failed++;
    }),
  );

  return { sent, failed };
}

// ─── Booking-specific push helpers ───────────────────────────

export async function pushBookingConfirmed(
  subscriptions: PushSubscriptionRecord[],
  booking: { doctor: string; date: string; time: string },
): Promise<void> {
  await sendPushToMany(subscriptions, {
    title: "Turno confirmado",
    body: `Tu turno con ${booking.doctor} el ${booking.date} a las ${booking.time} fue confirmado.`,
    url: "/paciente/turnos",
    tag: "booking-confirmed",
  });
}

export async function pushBookingCancelled(
  subscriptions: PushSubscriptionRecord[],
  booking: { doctor: string; date: string },
): Promise<void> {
  await sendPushToMany(subscriptions, {
    title: "Turno cancelado",
    body: `Tu turno con ${booking.doctor} el ${booking.date} fue cancelado.`,
    url: "/paciente/turnos",
    tag: "booking-cancelled",
  });
}

export async function pushBookingReminder(
  subscriptions: PushSubscriptionRecord[],
  booking: { doctor: string; time: string },
): Promise<void> {
  await sendPushToMany(subscriptions, {
    title: "Recordatorio de turno",
    body: `Mañana tenés turno con ${booking.doctor} a las ${booking.time}. ¡No te olvides!`,
    url: "/paciente/turnos",
    tag: "booking-reminder",
  });
}

// ─── Availability check ──────────────────────────────────────

export function isPushConfigured(): boolean {
  return configured;
}

export function getVapidPublicKey(): string {
  return VAPID_PUBLIC_KEY;
}
