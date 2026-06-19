import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import { type OperatorProfile } from "@/lib/api";
import { resolveServerApiBaseUrl } from "@/lib/server-api-url";
import { AdministracaoClientPage } from "./administracao-client";

const ADMIN_ACCESS_EMAIL = "admin@pdv.local";

export default async function AdministracaoPage() {
  const apiUrl = await resolveServerApiBaseUrl();
  const response = await fetch(`${apiUrl}/operators/me`, {
    headers: {
      cookie: (await cookies()).toString(),
    },
    cache: "no-store",
  });

  if (!response.ok) {
    redirect("/");
  }

  const responseBody = (await response.json()) as { operator?: OperatorProfile } | null;
  const isSystemAdministrator =
    responseBody?.operator?.role === "ADMIN" &&
    responseBody.operator.email.trim().toLowerCase() === ADMIN_ACCESS_EMAIL;

  if (!isSystemAdministrator) {
    redirect("/");
  }

  return <AdministracaoClientPage />;
}
