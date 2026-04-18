import { NextRequest, NextResponse } from "next/server";
import {
  getAllSeatPlans,
  getDoctorPlan,
  upgradeToPlan,
  type SeatPlanId,
} from "@/lib/services/seat-billing";
import { billingPlanSchema } from "@/lib/validations/schemas";

/**
 * GET /api/billing/plans
 * Returns all seat plan definitions with features and pricing.
 */
export async function GET() {
  const plans = getAllSeatPlans();
  return NextResponse.json({ plans });
}

/**
 * POST /api/billing/plans
 * Get current plan for a specific doctor.
 * Body: { doctorId: string }
 */
export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as { doctorId?: string };
    const parsed = billingPlanSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Datos inválidos", details: parsed.error.flatten().fieldErrors },
        { status: 400 },
      );
    }
    if (!body.doctorId) {
      return NextResponse.json({ error: "doctorId is required" }, { status: 400 });
    }

    const record = await getDoctorPlan(body.doctorId);
    const plan = getAllSeatPlans().find((p) => p.id === record.plan);

    return NextResponse.json({ record, plan });
  } catch (err) {
    return NextResponse.json({ error: "Failed to get plan" }, { status: 500 });
  }
}
