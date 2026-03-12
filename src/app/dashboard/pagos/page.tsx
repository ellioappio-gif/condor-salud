import { redirect } from "next/navigation";

export default function PagosRedirect() {
  redirect("/dashboard/configuracion/pagos");
}
