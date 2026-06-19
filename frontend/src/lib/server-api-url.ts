import { headers } from "next/headers";

import { apiBaseUrl } from "@/lib/api";

const isAbsoluteUrl = (value: string): boolean => /^https?:\/\//i.test(value);

const stripTrailingSlash = (value: string): string =>
  value.endsWith("/") ? value.slice(0, -1) : value;

const firstForwardedValue = (value: string | null): string | null => {
  if (!value) {
    return null;
  }

  return value.split(",")[0]?.trim() || null;
};

const inferProtocol = (host: string): "http" | "https" =>
  host.startsWith("localhost") || host.startsWith("127.0.0.1")
    ? "http"
    : "https";

export const resolveServerApiBaseUrl = async (): Promise<string> => {
  if (isAbsoluteUrl(apiBaseUrl)) {
    return stripTrailingSlash(apiBaseUrl);
  }

  const requestHeaders = await headers();
  const host =
    firstForwardedValue(requestHeaders.get("x-forwarded-host")) ??
    requestHeaders.get("host");

  if (!host) {
    throw new Error(
      "CONFIG_ERROR: Nao foi possivel determinar o host da requisicao no servidor.",
    );
  }

  const protocol =
    firstForwardedValue(requestHeaders.get("x-forwarded-proto")) ??
    inferProtocol(host);

  return stripTrailingSlash(new URL(apiBaseUrl, `${protocol}://${host}`).toString());
};
