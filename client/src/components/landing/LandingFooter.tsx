"use client";

import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { FlowPilotWordmark } from "./FlowPilotWordmark";

export function LandingFooter() {
  return (
    <footer className="border-t border-[#163A46] bg-[#101C2C] py-16 text-slate-400 text-xs">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-10 pb-12 border-b border-white/10">
          {/* Brand Col with FlowPilot Wordmark Only */}
          <div className="md:col-span-2 flex flex-col justify-between">
            <div>
              <Link href="/" className="inline-block" aria-label="FlowPilot Home">
                <FlowPilotWordmark theme="light" size="lg" />
              </Link>
              <p className="mt-4 text-xs text-slate-400 max-w-sm leading-relaxed">
                Visual workflow automation powered by Gemini AI, transactional SMTP emails, custom webhooks,
                and execution history.
              </p>
            </div>

            <div className="mt-6 flex items-center gap-2 text-[11px] font-mono text-slate-400">
              <span className="h-2 w-2 rounded-full bg-teal-400" />
              <span>FlowPilot Automation Platform</span>
            </div>
          </div>

          {/* Col 1: Product Navigation */}
          <div>
            <h4 className="text-xs font-semibold uppercase tracking-wider text-white mb-3 font-mono">
              Product
            </h4>
            <ul className="space-y-2.5">
              <li>
                <a href="#features" className="hover:text-white transition-colors">
                  Visual Builder
                </a>
              </li>
              <li>
                <a href="#workflow-showcase" className="hover:text-white transition-colors">
                  Interactive Showcase
                </a>
              </li>
              <li>
                <a href="#use-cases" className="hover:text-white transition-colors">
                  Use Cases
                </a>
              </li>
            </ul>
          </div>

          {/* Col 2: Solutions */}
          <div>
            <h4 className="text-xs font-semibold uppercase tracking-wider text-white mb-3 font-mono">
              Use Cases
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
            </ul>
          </div>

          {/* Col 3: Access */}
          <div>
            <h4 className="text-xs font-semibold uppercase tracking-wider text-white mb-3 font-mono">
              Account
            </h4>
            <ul className="space-y-2.5">
              <li>
                <Link href="/register" prefetch={true} className="hover:text-white transition-colors font-medium text-teal-400">
                  Start Building Free
                </Link>
              </li>
              <li>
                <Link href="/login" prefetch={true} className="hover:text-white transition-colors">
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
                  <span>Repository</span>
                  <ArrowUpRight className="h-3 w-3" />
                </a>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-[11px] text-slate-500 font-mono">
          <div>
            © {new Date().getFullYear()} FlowPilot. All rights reserved.
          </div>
          <div className="flex items-center gap-6">
            <span>Visual Workflow Automation Platform</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
