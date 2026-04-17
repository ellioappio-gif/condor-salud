"use client";

import { usePathname } from "next/navigation";
import dynamic from "next/dynamic";

const Chatbot = dynamic(() => import("@/components/Chatbot"), { ssr: false });

/** Renders Cora chatbot only on public pages — hidden on /dashboard and /paciente */
export default function ChatbotGuard() {
  const pathname = usePathname();
  if (pathname.startsWith("/dashboard") || pathname.startsWith("/paciente")) {
    return null;
  }
  return <Chatbot />;
}
