import { NextRequest, NextResponse } from "next/server";
import { getDoctors, getDoctorReviews, getDirectorioKPIs } from "@/lib/services/directorio";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const resource = searchParams.get("resource") || "doctors";

  try {
    switch (resource) {
      case "doctors": {
        const filters = {
          specialty: searchParams.get("specialty") || undefined,
          location: searchParams.get("location") || undefined,
          financiador: searchParams.get("financiador") || undefined,
          search: searchParams.get("search") || undefined,
        };
        return NextResponse.json(await getDoctors(filters));
      }
      case "reviews": {
        const doctorId = searchParams.get("doctorId") || "";
        return NextResponse.json(await getDoctorReviews(doctorId));
      }
      case "kpis":
        return NextResponse.json(await getDirectorioKPIs());
      default:
        return NextResponse.json({ error: "Unknown resource" }, { status: 400 });
    }
  } catch (error) {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
