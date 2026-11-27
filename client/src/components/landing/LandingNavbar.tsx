"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { ArrowRight, Menu, X } from "lucide-react";
import { FlowPilotWordmark } from "./FlowPilotWordmark";

export function LandingNavbar() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    handleScroll();
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
    { label: "How it works", href: "#how-it-works" },
    { label: "Templates", href: "#templates" },
    { label: "Integrations", href: "#integrations" },
    { label: "FAQ", href: "#questions" },
  ];

  return (
    <header
      className={`landing-navbar sticky top-0 z-40 w-full transition-all duration-300 ${
        isScrolled ? "is-scrolled border-b border-ui-border bg-ui-bg/95 backdrop-blur-md" : "is-top border-b border-white/10 bg-[#0b3032]"
      }`}
    >
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <div className="flex items-center gap-8">
          <Link
            href="/"
            className="group flex items-center rounded-lg focus:outline-none focus-visible:ring-2 focus-visible:ring-ui-focus"
            aria-label="FlowPilot Home"
          >
            <FlowPilotWordmark theme={isScrolled ? "dark" : "light"} size="md" />
          </Link>

          <nav
            aria-label="Main Navigation"
            className={`hidden items-center gap-6 text-sm font-medium md:flex ${isScrolled ? "text-ui-secondary" : "text-white/70"}`}
          >
            {navLinks.map((link) => (
              <a
                key={link.href}
                href={link.href}
                className={`transition-colors ${isScrolled ? "hover:text-ui-primary" : "hover:text-white"}`}
              >
                {link.label}
              </a>
            ))}
          </nav>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/login"
            prefetch={true}
            className={`hidden min-h-10 items-center justify-center rounded-lg px-4 py-2 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ui-focus sm:inline-flex ${isScrolled ? "text-ui-primary hover:text-ui-accent" : "text-white/80 hover:text-white"}`}
          >
            Sign In
          </Link>

          <Link
            href="/register"
            prefetch={true}
            className="inline-flex min-h-10 items-center justify-center gap-1.5 rounded-lg bg-[#f3c568] px-4 py-2 text-sm font-semibold text-[#173333] transition-colors hover:bg-[#ffda86] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#f3c568] focus-visible:ring-offset-2 focus-visible:ring-offset-[#0b3032]"
          >
            <span>Start building</span>
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>

          <button
            type="button"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            aria-label={isMobileMenuOpen ? "Close menu" : "Open menu"}
            aria-expanded={isMobileMenuOpen}
            aria-controls="landing-mobile-navigation"
            className={`flex h-10 w-10 items-center justify-center rounded-lg border focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ui-focus md:hidden ${isScrolled ? "border-ui-border bg-ui-surface text-ui-secondary hover:bg-ui-subtle hover:text-ui-primary" : "border-white/20 bg-white/[0.06] text-white/80 hover:bg-white/10 hover:text-white"}`}
          >
            {isMobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {isMobileMenuOpen && (
        <div
          id="landing-mobile-navigation"
          className={`border-b px-4 py-6 md:hidden ${isScrolled ? "border-ui-border bg-ui-surface" : "border-white/10 bg-[#0b3032]"}`}
        >
          <nav className="flex flex-col gap-3">
            {navLinks.map((link) => (
              <a
                key={link.href}
                href={link.href}
                onClick={() => setIsMobileMenuOpen(false)}
                className={`rounded-lg px-3 py-2 text-sm font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ui-focus ${isScrolled ? "text-ui-secondary hover:bg-ui-subtle hover:text-ui-primary" : "text-white/75 hover:bg-white/[0.06] hover:text-white"}`}
              >
                {link.label}
              </a>
            ))}
            <div className={`mt-4 flex flex-col gap-2 border-t pt-4 ${isScrolled ? "border-ui-divider" : "border-white/10"}`}>
              <Link
                href="/login"
                prefetch={true}
                onClick={() => setIsMobileMenuOpen(false)}
                className={`min-h-11 w-full rounded-lg border py-2.5 text-center text-sm font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ui-focus ${isScrolled ? "border-ui-border bg-ui-surface text-ui-primary" : "border-white/20 bg-white/[0.06] text-white"}`}
              >
                Sign In
              </Link>
              <Link
                href="/register"
                prefetch={true}
                onClick={() => setIsMobileMenuOpen(false)}
                className="min-h-11 w-full rounded-lg bg-[#f3c568] py-2.5 text-center text-sm font-semibold text-[#173333] hover:bg-[#ffda86] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#f3c568]"
              >
                Start building
              </Link>
            </div>
          </nav>
        </div>
      )}
    </header>
  );
}
