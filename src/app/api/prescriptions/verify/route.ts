import { NextRequest, NextResponse } from "next/server";
import * as rxService from "@/lib/services/prescription-qr";

// GET /api/prescriptions/verify?token=xxx — Public prescription verification
export async function GET(request: NextRequest) {
  const token = request.nextUrl.searchParams.get("token");

  if (!token) {
    return NextResponse.json({ error: "token is required" }, { status: 400 });
  }

  const prescription = await rxService.verifyPrescription(token);

  if (!prescription) {
    return NextResponse.json({ error: "Prescription not found" }, { status: 404 });
  }

  return NextResponse.json({ prescription, valid: prescription.status === "active" });
}
