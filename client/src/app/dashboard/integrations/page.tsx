"use client";

import { FormEvent, useEffect, useState } from "react";
import { KeyRound, Mail, ShieldCheck, Unplug } from "lucide-react";

import { DashboardShell } from "@/components/layout/DashboardShell";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { api } from "@/lib/api";

type Provider = "GEMINI" | "SMTP";

interface IntegrationStatus {
  provider: Provider;
  connected: boolean;
  updatedAt: string | null;
}

const initialStatuses: IntegrationStatus[] = [
  { provider: "GEMINI", connected: false, updatedAt: null },
  { provider: "SMTP", connected: false, updatedAt: null },
];

export default function IntegrationsPage() {
  const [statuses, setStatuses] = useState(initialStatuses);
  const [isLoading, setIsLoading] = useState(true);
  const [savingProvider, setSavingProvider] = useState<Provider | null>(null);
  const [disconnectingProvider, setDisconnectingProvider] =
    useState<Provider | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [geminiApiKey, setGeminiApiKey] = useState("");
  const [smtpHost, setSmtpHost] = useState("");
  const [smtpPort, setSmtpPort] = useState("587");
  const [smtpUser, setSmtpUser] = useState("");
  const [smtpPassword, setSmtpPassword] = useState("");
  const [smtpFrom, setSmtpFrom] = useState("");

  useEffect(() => {
    let cancelled = false;

    async function loadStatuses() {
      try {
        const response = await api.get("/integrations");
        const integrations = response.data?.data?.integrations;
        if (!Array.isArray(integrations)) {
          throw new Error("Unexpected integrations response");
        }
        if (!cancelled) setStatuses(integrations as IntegrationStatus[]);
      } catch {
        if (!cancelled) {
          setError("Could not load integration status. Please refresh and try again.");
        }
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    }

    void loadStatuses();
    return () => {
      cancelled = true;
    };
  }, []);

  function updateStatus(updated: IntegrationStatus) {
    setStatuses((current) =>
      current.map((status) =>
        status.provider === updated.provider ? updated : status
      )
    );
  }

  async function saveCredentials(
    event: FormEvent<HTMLFormElement>,
    provider: Provider,
    credentials: Record<string, string | number>
  ) {
    event.preventDefault();
    setError(null);
    setNotice(null);
    setSavingProvider(provider);

    try {
      const response = await api.put(`/integrations/${provider}`, credentials);
      updateStatus(response.data.data.integration as IntegrationStatus);
      setNotice(`${provider === "GEMINI" ? "Gemini" : "SMTP"} credentials saved.`);
      if (provider === "GEMINI") {
        setGeminiApiKey("");
      } else {
        setSmtpPassword("");
      }
    } catch {
      setError("Credentials could not be saved. Check the fields and try again.");
    } finally {
      setSavingProvider(null);
    }
  }

  async function disconnect(provider: Provider) {
    setError(null);
    setNotice(null);
    setDisconnectingProvider(provider);

    try {
      const response = await api.delete(`/integrations/${provider}`);
      updateStatus(response.data.data.integration as IntegrationStatus);
      setNotice(`${provider === "GEMINI" ? "Gemini" : "SMTP"} credentials removed.`);
    } catch {
      setError("The integration could not be disconnected. Please try again.");
    } finally {
      setDisconnectingProvider(null);
    }
  }

  function statusFor(provider: Provider) {
    return statuses.find((status) => status.provider === provider);
  }

  function confirmDisconnect(provider: Provider) {
    if (
      typeof window !== "undefined" &&
      window.confirm("Remove the saved credentials for this integration?")
    ) {
      void disconnect(provider);
    }
  }

  return (
    <DashboardShell>
      <div className="mx-auto max-w-5xl space-y-6">
        <header className="border-b border-slate-200 pb-5">
          <h1 className="text-2xl font-extrabold tracking-tight text-slate-900">
            Integrations
          </h1>
          <p className="mt-1 max-w-2xl text-sm text-slate-500">
            Add your own Gemini and SMTP credentials for workflow steps. Secrets are write-only and are never shown after saving.
          </p>
        </header>

        {error && (
          <p role="alert" className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700">
            {error}
          </p>
        )}
        {notice && (
          <p role="status" className="rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-700">
            {notice}
          </p>
        )}

        {isLoading ? (
          <div className="rounded-2xl border border-slate-200 bg-white p-6 text-sm text-slate-500">
            Loading integration status…
          </div>
        ) : (
          <div className="grid gap-5 lg:grid-cols-2">
            <section className="min-w-0 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
              <div className="mb-5 flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-violet-50 text-violet-700">
                    <KeyRound className="h-5 w-5" />
                  </span>
                  <div>
                    <h2 className="font-bold text-slate-900">Google Gemini</h2>
                    <p className="text-xs text-slate-500">AI workflow steps and generation</p>
                  </div>
                </div>
                <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${
                  statusFor("GEMINI")?.connected
                    ? "bg-emerald-50 text-emerald-700"
                    : "bg-slate-100 text-slate-600"
                }`}>
                  {statusFor("GEMINI")?.connected ? "Saved" : "Not connected"}
                </span>
              </div>
              <form
                className="space-y-4"
                onSubmit={(event) =>
                  void saveCredentials(event, "GEMINI", { apiKey: geminiApiKey })
                }
              >
                <Input
                  id="gemini-api-key"
                  label="API key"
                  type="password"
                  autoComplete="new-password"
                  value={geminiApiKey}
                  onChange={(event) => setGeminiApiKey(event.target.value)}
                  placeholder="Enter a new key to save or replace"
                  required
                />
                <div className="flex flex-wrap items-center gap-3">
                  <Button type="submit" isLoading={savingProvider === "GEMINI"}>
                    Save credentials
                  </Button>
                  {statusFor("GEMINI")?.connected && (
                    <Button
                      type="button"
                      variant="outline"
                      isLoading={disconnectingProvider === "GEMINI"}
                      onClick={() => confirmDisconnect("GEMINI")}
                    >
                      <Unplug className="h-4 w-4" />
                      Disconnect
                    </Button>
                  )}
                  {statusFor("GEMINI")?.updatedAt && (
                    <span className="text-xs text-slate-500">
                      Updated {new Date(statusFor("GEMINI")!.updatedAt!).toLocaleDateString()}
                    </span>
                  )}
                </div>
              </form>
            </section>

            <section className="min-w-0 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
              <div className="mb-5 flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-700">
                    <Mail className="h-5 w-5" />
                  </span>
                  <div>
                    <h2 className="font-bold text-slate-900">SMTP email</h2>
                    <p className="text-xs text-slate-500">Email workflow steps</p>
                  </div>
                </div>
                <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${
                  statusFor("SMTP")?.connected
                    ? "bg-emerald-50 text-emerald-700"
                    : "bg-slate-100 text-slate-600"
                }`}>
                  {statusFor("SMTP")?.connected ? "Saved" : "Not connected"}
                </span>
              </div>
              <form
                className="space-y-4"
                onSubmit={(event) =>
                  void saveCredentials(event, "SMTP", {
                    host: smtpHost,
                    port: Number(smtpPort),
                    user: smtpUser,
                    pass: smtpPassword,
                    from: smtpFrom,
                  })
                }
              >
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <Input id="smtp-host" label="SMTP host" value={smtpHost} onChange={(event) => setSmtpHost(event.target.value)} placeholder="smtp.example.com" required />
                  <Input id="smtp-port" label="Port" type="number" min="1" max="65535" value={smtpPort} onChange={(event) => setSmtpPort(event.target.value)} required />
                  <Input id="smtp-user" label="Username" autoComplete="username" value={smtpUser} onChange={(event) => setSmtpUser(event.target.value)} required />
                  <Input id="smtp-password" label="Password" type="password" autoComplete="new-password" value={smtpPassword} onChange={(event) => setSmtpPassword(event.target.value)} required />
                  <Input id="smtp-from" label="From address" type="email" value={smtpFrom} onChange={(event) => setSmtpFrom(event.target.value)} placeholder="automation@example.com" required className="sm:col-span-2" />
                </div>
                <div className="flex flex-wrap items-center gap-3">
                  <Button type="submit" isLoading={savingProvider === "SMTP"}>
                    Save credentials
                  </Button>
                  {statusFor("SMTP")?.connected && (
                    <Button
                      type="button"
                      variant="outline"
                      isLoading={disconnectingProvider === "SMTP"}
                      onClick={() => confirmDisconnect("SMTP")}
                    >
                      <Unplug className="h-4 w-4" />
                      Disconnect
                    </Button>
                  )}
                  {statusFor("SMTP")?.updatedAt && (
                    <span className="text-xs text-slate-500">
                      Updated {new Date(statusFor("SMTP")!.updatedAt!).toLocaleDateString()}
                    </span>
                  )}
                </div>
              </form>
            </section>
          </div>
        )}

        <div className="flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
          <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0" />
          <p>
            Credentials are encrypted on the server. Without a saved user credential, FlowPilot uses the server environment configuration. Never put secrets in workflow steps or commit them to the repository.
          </p>
        </div>
      </div>
    </DashboardShell>
  );
}
