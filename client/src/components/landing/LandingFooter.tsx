"use client";

import Link from "next/link";
import { Workflow, ArrowUpRight } from "lucide-react";

export function LandingFooter() {
  return (
    <footer className="border-t border-slate-800/80 bg-slate-950 py-16 text-slate-400 text-xs">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-10 pb-12 border-b border-slate-800/80">
          {/* Brand Col */}
          <div className="md:col-span-2 flex flex-col justify-between">
            <div>
              <Link href="/" className="flex items-center gap-2.5">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-600 text-white shadow-sm">
                  <Workflow className="h-4 w-4" />
                </div>
                <span className="text-base font-bold text-white tracking-tight">FlowPilot</span>
              </Link>
              <p className="mt-3 text-xs text-slate-400 max-w-sm leading-relaxed">
                Visual workflow automation powered by Gemini AI, transactional SMTP emails, custom webhooks,
                and execution telemetry.
              </p>
            </div>

            <div className="mt-6 flex items-center gap-2 text-[11px] font-mono text-slate-400">
              <span className="h-2 w-2 rounded-full bg-emerald-400" />
              <span>All Systems Operational</span>
              <span className="text-slate-600">•</span>
              <span>API v1.0 Live</span>
            </div>
          </div>

          {/* Col 1: Product */}
          <div>
            <h4 className="text-xs font-semibold uppercase tracking-wider text-white mb-3 font-mono">
              Product
            </h4>
            <ul className="space-y-2.5">
              <li>
                <a href="#features" className="hover:text-white transition-colors">
                  Visual DAG Builder
                </a>
              </li>
              <li>
                <a href="#interactive-pipeline" className="hover:text-white transition-colors">
                  Interactive Pipeline
                </a>
              </li>
              <li>
                <a href="#how-it-works" className="hover:text-white transition-colors">
                  How It Works
                </a>
              </li>
              <li>
                <a href="#reliability" className="hover:text-white transition-colors">
                  Execution Telemetry
                </a>
              </li>
            </ul>
          </div>

          {/* Col 2: Solutions */}
          <div>
            <h4 className="text-xs font-semibold uppercase tracking-wider text-white mb-3 font-mono">
              Solutions
            </h4>
            <ul className="space-y-2.5">
              <li>
                <a href="#use-cases" className="hover:text-white transition-colors">
                  Lead Qualification
                </a>
              </li>
              <li>
                <a href="#use-cases" className="hover:text-white transition-colors">
                  Employee Onboarding
                </a>
              </li>
              <li>
                <a href="#use-cases" className="hover:text-white transition-colors">
                  Customer Activation
                </a>
              </li>
              <li>
                <a href="#use-cases" className="hover:text-white transition-colors">
                  Incident Escalation
                </a>
              </li>
            </ul>
          </div>

          {/* Col 3: Account & Access */}
          <div>
            <h4 className="text-xs font-semibold uppercase tracking-wider text-white mb-3 font-mono">
              Access
            </h4>
            <ul className="space-y-2.5">
              <li>
                <Link href="/register" className="hover:text-white transition-colors font-medium text-blue-400">
                  Create Account Free
                </Link>
              </li>
              <li>
                <Link href="/login" className="hover:text-white transition-colors">
                  Sign In
                </Link>
              </li>
              <li>
                <a
                  href="https://github.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 hover:text-white transition-colors"
                >
                  <span>GitHub Repository</span>
                  <ArrowUpRight className="h-3 w-3" />
                </a>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-[11px] text-slate-500 font-mono">
          <div>
            © {new Date().getFullYear()} FlowPilot Technologies Inc. All rights reserved.
          </div>
          <div className="flex items-center gap-6">
            <span>Deterministic Execution Engine</span>
            <span>GDPR & SOC2 Ready</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
