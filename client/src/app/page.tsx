"use client";

import { useState, useEffect } from "react";
import { OpeningAnimation } from "@/components/landing/OpeningAnimation";
import { LandingNavbar } from "@/components/landing/LandingNavbar";
import { HeroSection } from "@/components/landing/HeroSection";
import { ScrollShowcase } from "@/components/landing/ScrollShowcase";
import { CoreCapabilities } from "@/components/landing/CoreCapabilities";
import { UseCasesSection } from "@/components/landing/UseCasesSection";
import { FinalCta } from "@/components/landing/FinalCta";
import { LandingFooter } from "@/components/landing/LandingFooter";

export default function LandingPage() {
  const [mounted, setMounted] = useState(false);
  const [showAnimation, setShowAnimation] = useState(false);
  const [forceReplay, setForceReplay] = useState(false);

  useEffect(() => {
    setMounted(true);
    // Check if user requested reduced-motion or has already seen intro in this session
    const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let alreadySeen = false;
    try {
      alreadySeen = sessionStorage.getItem("flowpilot_intro_seen_v3") === "true";
    } catch {
      alreadySeen = false;
    }

    if (!prefersReducedMotion && !alreadySeen) {
      setShowAnimation(true);
    }
  }, []);

  const handleAnimationComplete = () => {
    setShowAnimation(false);
    setForceReplay(false);
  };

  const handleReplayAnimation = () => {
    setForceReplay(true);
    setShowAnimation(true);
  };

  return (
    <div className="relative min-h-screen bg-[#F8FAF8] text-[#17252F] selection:bg-[#0D9488]/20 selection:text-[#101C2C] flex flex-col font-sans">
      {/* Signature Opening Experience ("From manual work to automated flow") */}
      {mounted && showAnimation && (
        <OpeningAnimation
          onComplete={handleAnimationComplete}
          forcePlay={forceReplay}
        />
      )}

      {/* Sticky Wordmark Navigation */}
      <LandingNavbar onReplayAnimation={handleReplayAnimation} />

      {/* Main Editorial Sections */}
      <main className="flex-1">
        {/* 1. Hero Section with Interactive Dag Preview */}
        <HeroSection />

        {/* 2. Signature Pinned Horizontal Scroll Showcase (BUILD -> AUTOMATE -> MONITOR) */}
        <ScrollShowcase />

        {/* 3. Concise Core Capabilities Bento Grid */}
        <CoreCapabilities />

        {/* 4. Real-World Practical Automation Example (Employee Onboarding) */}
        <UseCasesSection />

        {/* 5. Final Conversion CTA */}
        <FinalCta />
      </main>

      {/* 6. Premium Footer with FlowPilot Wordmark */}
      <LandingFooter />
    </div>
  );
}
