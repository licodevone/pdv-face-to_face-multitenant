import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import { type OperatorProfile } from "@/lib/api";
import { resolveServerApiBaseUrl } from "@/lib/server-api-url";
import { OperatorsManagementClientPage } from "./operators-management-client";

export default async function OperatorsManagementPage() {
  const apiUrl = await resolveServerApiBaseUrl();
  const response = await fetch(`${apiUrl}/operators/me`, {
    headers: {
      cookie: (await cookies()).toString(),
    },
    cache: "no-store",
  });

  if (!response.ok) {
    redirect("/perfil");
  }

  const responseBody = (await response.json()) as { operator?: OperatorProfile } | null;

  if (responseBody?.operator?.role !== "ADMIN") {
    redirect("/perfil");
  }

  return <OperatorsManagementClientPage />;
}
