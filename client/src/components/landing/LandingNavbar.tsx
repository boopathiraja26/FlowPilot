"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Workflow, ArrowRight, Menu, X } from "lucide-react";

interface LandingNavbarProps {
  onReplayAnimation?: () => void;
}

export function LandingNavbar({ onReplayAnimation }: LandingNavbarProps) {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isMobileMenuOpen) {
        setIsMobileMenuOpen(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isMobileMenuOpen]);

  const navLinks = [
    { label: "Features", href: "#features" },
    { label: "How It Works", href: "#how-it-works" },
    { label: "Interactive Pipeline", href: "#interactive-pipeline" },
    { label: "Use Cases", href: "#use-cases" },
    { label: "Reliability & Observability", href: "#reliability" },
  ];

  return (
    <header
      className={`sticky top-0 z-40 w-full transition-all duration-200 ${
        isScrolled
          ? "border-b border-slate-800/80 bg-slate-950/80 backdrop-blur-md shadow-sm"
          : "border-b border-transparent bg-transparent"
      }`}
    >
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Brand */}
        <div className="flex items-center gap-6">
          <Link
            href="/"
            className="group flex items-center gap-2.5 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 rounded-lg p-1"
          >
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-blue-600 to-indigo-700 text-white shadow-sm ring-1 ring-white/20 transition-transform duration-200 group-hover:scale-105">
              <Workflow className="h-5 w-5" />
            </div>
            <div className="flex flex-col">
              <div className="flex items-center gap-1.5">
                <span className="text-base font-bold tracking-tight text-white">
                  FlowPilot
                </span>
                <span className="rounded bg-blue-500/10 px-1.5 py-0.2 text-[10px] font-semibold text-blue-400 border border-blue-500/20">
                  v2.4
                </span>
              </div>
              <span className="text-[10px] text-slate-400 font-mono tracking-tight leading-none">
                AI Workflow Engine
              </span>
            </div>
          </Link>

          {/* Desktop Navigation */}
          <nav
            aria-label="Main Navigation"
            className="hidden lg:flex items-center gap-6 text-xs font-medium text-slate-300"
          >
            {navLinks.map((link) => (
              <a
                key={link.href}
                href={link.href}
                className="transition-colors hover:text-white"
              >
                {link.label}
              </a>
            ))}
          </nav>
        </div>

        {/* Right CTA cluster */}
        <div className="flex items-center gap-3">
          {onReplayAnimation && (
            <button
              onClick={onReplayAnimation}
              className="hidden md:inline-flex items-center gap-1.5 rounded-lg border border-slate-800 bg-slate-900/60 px-2.5 py-1.5 text-[11px] font-medium text-slate-400 transition-colors hover:bg-slate-800 hover:text-slate-200"
              title="Replay opening sequence"
            >
              <span>Replay Intro</span>
            </button>
          )}

          <Link
            href="/login"
            className="hidden sm:inline-flex items-center justify-center rounded-lg px-3.5 py-2 text-xs font-semibold text-slate-300 transition-colors hover:bg-slate-900 hover:text-white focus-visible:ring-2 focus-visible:ring-blue-500"
          >
            Sign In
          </Link>

          <Link
            href="/register"
            className="inline-flex items-center justify-center gap-1.5 rounded-lg bg-blue-600 px-4 py-2 text-xs font-semibold text-white shadow-sm transition-all hover:bg-blue-500 hover:shadow active:scale-[0.98] focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950"
          >
            <span>Start Building</span>
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>

          {/* Mobile hamburger button */}
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            aria-label={isMobileMenuOpen ? "Close menu" : "Open menu"}
            aria-expanded={isMobileMenuOpen}
            className="flex lg:hidden h-9 w-9 items-center justify-center rounded-lg border border-slate-800 bg-slate-900/60 text-slate-400 hover:text-white hover:bg-slate-800"
          >
            {isMobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer */}
      {isMobileMenuOpen && (
        <div className="lg:hidden border-b border-slate-800 bg-slate-950/95 backdrop-blur-xl px-4 py-6 transition-all duration-200">
          <nav className="flex flex-col gap-3">
            {navLinks.map((link) => (
              <a
                key={link.href}
                href={link.href}
                onClick={() => setIsMobileMenuOpen(false)}
                className="rounded-md px-3 py-2 text-sm font-medium text-slate-300 hover:bg-slate-900 hover:text-white"
              >
                {link.label}
              </a>
            ))}
            <div className="mt-4 pt-4 border-t border-slate-800 flex flex-col gap-2">
              <Link
                href="/login"
                onClick={() => setIsMobileMenuOpen(false)}
                className="w-full text-center rounded-lg border border-slate-800 bg-slate-900/60 py-2.5 text-sm font-semibold text-slate-200"
              >
                Sign In
              </Link>
              <Link
                href="/register"
                onClick={() => setIsMobileMenuOpen(false)}
                className="w-full text-center rounded-lg bg-blue-600 py-2.5 text-sm font-semibold text-white shadow"
              >
                Start Building Free
              </Link>
            </div>
          </nav>
        </div>
      )}
    </header>
  );
}
