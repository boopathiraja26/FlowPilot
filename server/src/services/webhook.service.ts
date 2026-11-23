import dns from "dns";
import net from "net";
import axios from "axios";

import { env } from "../config/env";
import { ApiError } from "../middleware/errorHandler";

export interface WebhookRequest {
  url: string;
  method?: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
  headers?: Record<string, string>;
  body?: unknown;
}

const ALLOWED_METHODS = new Set(["GET", "POST", "PUT", "PATCH", "DELETE"]);
const BLOCKED_HOSTNAMES = new Set([
  "localhost",
  "localhost.localdomain",
  "metadata.google.internal",
  "metadata",
  "instance-data",
]);

function isPrivateOrUnsafeIpv4(ip: string): boolean {
  const parts = ip.split(".").map((p) => Number(p));
  if (parts.length !== 4 || parts.some((n) => !Number.isInteger(n) || n < 0 || n > 255)) {
    return true;
  }
  const [a, b] = parts;
  if (a === 0) return true; // 0.0.0.0/8
  if (a === 10) return true; // 10.0.0.0/8
  if (a === 100 && b >= 64 && b <= 127) return true; // 100.64.0.0/10 carrier-grade NAT
  if (a === 127) return true; // loopback
  if (a === 169 && b === 254) return true; // link-local / cloud metadata range
  if (a === 172 && b >= 16 && b <= 31) return true; // 172.16.0.0/12
  if (a === 192 && b === 168) return true; // 192.168.0.0/16
  if (a === 192 && b === 0 && (parts[2] === 0 || parts[2] === 2)) return true; // 192.0.0.0/24, 192.0.2.0/24
  if (a === 198 && (b === 18 || b === 19)) return true; // benchmark
  if (a === 198 && b === 51 && parts[2] === 100) return true; // documentation
  if (a === 203 && b === 0 && parts[2] === 113) return true; // documentation
  if (a >= 224) return true; // multicast/reserved/broadcast
  return false;
}

function isPrivateOrUnsafeIpv6(ip: string): boolean {
  const normalized = ip.toLowerCase();
  if (normalized === "::" || normalized === "::1") return true; // unspecified/loopback
  if (normalized.startsWith("fc") || normalized.startsWith("fd")) return true; // unique local fc00::/7
  if (normalized.startsWith("fe8") || normalized.startsWith("fe9") || normalized.startsWith("fea") || normalized.startsWith("feb")) return true; // fe80::/10 link-local
  if (normalized.startsWith("ff")) return true; // multicast
  if (normalized.startsWith("::ffff:")) {
    const mapped = normalized.slice("::ffff:".length);
    if (net.isIP(mapped) === 4) return isPrivateOrUnsafeIpv4(mapped);
  }
  return false;
}

function isLoopbackIp(ip: string): boolean {
  if (net.isIP(ip) === 4) return ip.startsWith("127.");
  return ip.toLowerCase() === "::1";
}

function isUnsafeResolvedIp(ip: string): boolean {
  const version = net.isIP(ip);
  if (version === 4) {
    if (isLoopbackIp(ip)) return env.isProduction; // allow local receivers in dev/test only
    return isPrivateOrUnsafeIpv4(ip);
  }
  if (version === 6) {
    if (isLoopbackIp(ip)) return env.isProduction;
    return isPrivateOrUnsafeIpv6(ip);
  }
  return true;
}

async function assertSafeWebhookDestination(rawUrl: string): Promise<string> {
  let parsed: URL;
  try {
    parsed = new URL(rawUrl);
  } catch {
    throw new ApiError(400, "Outgoing webhook URL is invalid. Configure a valid http(s) destination URL.");
  }

  if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
    throw new ApiError(400, "Outgoing webhook URL must use http or https.");
  }

  if (parsed.username || parsed.password) {
    throw new ApiError(400, "Outgoing webhook URLs must not include embedded credentials.");
  }

  const hostname = parsed.hostname.toLowerCase();
  if (BLOCKED_HOSTNAMES.has(hostname)) {
    if (hostname === "localhost" || hostname === "localhost.localdomain") {
      if (env.isProduction) {
        throw new ApiError(400, "Outgoing webhook URL cannot target localhost in production.");
      }
    } else {
      throw new ApiError(400, "Outgoing webhook URL targets a blocked internal hostname.");
    }
  }

  const directIpVersion = net.isIP(hostname);
  if (directIpVersion) {
    if (isUnsafeResolvedIp(hostname)) {
      throw new ApiError(400, "Outgoing webhook URL targets a private, loopback, or otherwise unsafe network address.");
    }
    return parsed.toString();
  }

  let records: Array<{ address: string; family: number }> = [];
  try {
    records = await dns.promises.lookup(hostname, { all: true, verbatim: true });
  } catch {
    throw new ApiError(400, "Outgoing webhook hostname could not be resolved. Check the destination URL.");
  }

  if (!records.length) {
    throw new ApiError(400, "Outgoing webhook hostname did not resolve to any address.");
  }

  for (const record of records) {
    if (isUnsafeResolvedIp(record.address)) {
      throw new ApiError(
        400,
        "Outgoing webhook URL resolves to a private, loopback, or otherwise unsafe network address."
      );
    }
  }

  return parsed.toString();
}

export async function executeWebhook({
  url,
  method = "POST",
  headers = {},
  body,
}: WebhookRequest) {
  const normalizedMethod = method.toUpperCase();
  if (!ALLOWED_METHODS.has(normalizedMethod)) {
    throw new ApiError(400, `Outgoing webhook method "${method}" is not supported.`);
  }

  const safeUrl = await assertSafeWebhookDestination(url);

  try {
    const response = await axios({
      url: safeUrl,
      method: normalizedMethod as WebhookRequest["method"],
      headers,
      data: normalizedMethod === "GET" ? undefined : body,
      timeout: 10000,
      maxRedirects: 0,
      validateStatus: (status) => status >= 200 && status < 400,
      // avoid proxy env surprises in SSRF-sensitive path; direct request only
      proxy: false,
    });

    if (response.status >= 300 && response.status < 400) {
      throw new ApiError(400, "Outgoing webhook redirects are not allowed.");
    }

    return response.data;
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }

    if (axios.isAxiosError(error)) {
      if (error.code === "ECONNABORTED") {
        throw new ApiError(502, "Outgoing webhook request timed out.");
      }
      if (error.response) {
        const status = error.response.status;
        const safeMessage = `Outgoing webhook request failed with HTTP ${status}.`;
        throw new ApiError(status >= 400 && status < 500 ? 400 : 502, safeMessage, {
          httpStatus: status,
        });
      }
      if (error.request) {
        throw new ApiError(502, "Outgoing webhook request failed before receiving a response.");
      }
    }

    throw new ApiError(502, "Outgoing webhook request failed.");
  }
}