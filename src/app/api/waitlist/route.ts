import { NextResponse } from "next/server";

// TODO: Replace with Supabase insert when DB is connected
// import { createClient } from "@supabase/supabase-js";

const waitlist: string[] = [];

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { email } = body;

    if (!email || typeof email !== "string") {
      return NextResponse.json(
        { error: "Email es requerido" },
        { status: 400 }
      );
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: "Email inválido" },
        { status: 400 }
      );
    }

    // TODO: Replace with Supabase
    // const supabase = createClient(
    //   process.env.NEXT_PUBLIC_SUPABASE_URL!,
    //   process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    // );
    // const { error } = await supabase.from("waitlist").insert({ email });
    // if (error?.code === "23505") {
    //   return NextResponse.json({ message: "Ya estás en la lista" }, { status: 200 });
    // }

    waitlist.push(email);

    return NextResponse.json(
      { message: "¡Listo! Te contactamos pronto.", count: waitlist.length },
      { status: 201 }
    );
  } catch {
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}
