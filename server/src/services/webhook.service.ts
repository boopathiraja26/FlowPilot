import axios from "axios";

export interface WebhookRequest {
  url: string;
  method?: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
  headers?: Record<string, string>;
  body?: unknown;
}

export async function executeWebhook({
  url,
  method = "POST",
  headers = {},
  body,
}: WebhookRequest) {
  const response = await axios({
    url,
    method,
    headers,
    data: body,
    timeout: 10000,
  });

  return response.data;
}