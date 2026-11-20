"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { ArrowRight, Menu, X } from "lucide-react";
import { FlowPilotWordmark } from "./FlowPilotWordmark";

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
    { label: "How It Works", href: "#workflow-showcase" },
    { label: "Use Cases", href: "#use-cases" },
  ];

  return (
    <header
      className={`sticky top-0 z-40 w-full transition-all duration-200 ${
        isScrolled
          ? "border-b border-slate-200/80 bg-white/90 backdrop-blur-md shadow-xs"
          : "border-b border-transparent bg-transparent"
      }`}
    >
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Brand with Typography Wordmark */}
        <div className="flex items-center gap-8">
          <Link
            href="/"
            className="group flex items-center focus:outline-none focus-visible:ring-2 focus-visible:ring-[#0D9488] rounded-lg"
            aria-label="FlowPilot Home"
          >
            <FlowPilotWordmark theme="dark" size="md" />
          </Link>

          {/* Desktop Navigation */}
          <nav
            aria-label="Main Navigation"
            className="hidden md:flex items-center gap-6 text-sm font-medium text-[#4A5E6D]"
          >
            {navLinks.map((link) => (
              <a
                key={link.href}
                href={link.href}
                className="transition-colors hover:text-[#17252F]"
              >
                {link.label}
              </a>
            ))}
          </nav>
        </div>

        {/* Right Action CTAs */}
        <div className="flex items-center gap-3">
          {onReplayAnimation && (
            <button
              type="button"
              onClick={onReplayAnimation}
              className="hidden md:inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-[#4A5E6D] shadow-xs transition-colors hover:bg-slate-50 hover:text-[#17252F]"
              title="Replay opening sequence"
            >
              <span>Replay Intro</span>
            </button>
          )}

          <Link
            href="/login"
            prefetch={true}
            className="hidden sm:inline-flex items-center justify-center rounded-lg px-4 py-2 text-sm font-semibold text-[#17252F] hover:text-[#0D9488] transition-colors focus-visible:ring-2 focus-visible:ring-[#0D9488]"
          >
            Sign In
          </Link>

          <Link
            href="/register"
            prefetch={true}
            className="inline-flex items-center justify-center gap-1.5 rounded-xl bg-[#0D9488] px-4 py-2 text-sm font-semibold text-white shadow-xs transition-all hover:bg-[#0F766E] active:scale-[0.98] focus-visible:ring-2 focus-visible:ring-[#0D9488]"
          >
            <span>Get Started</span>
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>

          {/* Mobile Menu Hamburger */}
          <button
            type="button"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            aria-label={isMobileMenuOpen ? "Close menu" : "Open menu"}
            aria-expanded={isMobileMenuOpen}
            className="flex md:hidden h-9 w-9 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600 hover:text-[#17252F] hover:bg-slate-50"
          >
            {isMobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer */}
      {isMobileMenuOpen && (
        <div className="md:hidden border-b border-slate-200 bg-white/95 backdrop-blur-xl px-4 py-6 shadow-lg">
          <nav className="flex flex-col gap-3">
            {navLinks.map((link) => (
              <a
                key={link.href}
                href={link.href}
                onClick={() => setIsMobileMenuOpen(false)}
                className="rounded-lg px-3 py-2 text-sm font-medium text-[#4A5E6D] hover:bg-slate-100 hover:text-[#17252F]"
              >
                {link.label}
              </a>
            ))}
            <div className="mt-4 pt-4 border-t border-slate-200 flex flex-col gap-2">
              <Link
                href="/login"
                prefetch={true}
                onClick={() => setIsMobileMenuOpen(false)}
                className="w-full text-center rounded-xl border border-slate-200 bg-slate-50 py-2.5 text-sm font-semibold text-[#17252F]"
              >
                Sign In
              </Link>
              <Link
                href="/register"
                prefetch={true}
                onClick={() => setIsMobileMenuOpen(false)}
                className="w-full text-center rounded-xl bg-[#0D9488] py-2.5 text-sm font-semibold text-white shadow-xs"
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
