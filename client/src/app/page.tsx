"use client";

import { useState, useEffect } from "react";
import { OpeningAnimation } from "@/components/landing/OpeningAnimation";
import { LandingNavbar } from "@/components/landing/LandingNavbar";
import { HeroSection } from "@/components/landing/HeroSection";
import { ProductShowcase } from "@/components/landing/ProductShowcase";
import { CoreCapabilities } from "@/components/landing/CoreCapabilities";
import { HowItWorks } from "@/components/landing/HowItWorks";
import { UseCasesSection } from "@/components/landing/UseCasesSection";
import { ReliabilitySection } from "@/components/landing/ReliabilitySection";
import { FinalCta } from "@/components/landing/FinalCta";
import { LandingFooter } from "@/components/landing/LandingFooter";

export default function LandingPage() {
  const [mounted, setMounted] = useState(false);
  const [showAnimation, setShowAnimation] = useState(false);
  const [forceReplay, setForceReplay] = useState(false);

  useEffect(() => {
    setMounted(true);
    // Check if intro has already been shown in this session or reduced-motion is requested
    const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let alreadySeen = false;
    try {
      alreadySeen = sessionStorage.getItem("flowpilot_intro_seen") === "true";
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
    <div className="relative min-h-screen bg-slate-950 text-slate-100 selection:bg-blue-600/30 selection:text-white flex flex-col">
      {/* Signature Opening Animation ("From Manual Work to Automated Flow") */}
      {mounted && showAnimation && (
        <OpeningAnimation
          onComplete={handleAnimationComplete}
          forcePlay={forceReplay}
        />
      )}

      {/* Global Navigation */}
      <LandingNavbar onReplayAnimation={handleReplayAnimation} />

      {/* Main Content Sections */}
      <main className="flex-1">
        {/* Hero Section with Live Workflow Studio preview */}
        <HeroSection />

        {/* Interactive Pipeline Showcase: Data Cascade Demonstration */}
        <ProductShowcase />

        {/* Core Capabilities: Editorial Bento Grid */}
        <CoreCapabilities />

        {/* How FlowPilot Works: 4-Step Lifecycle */}
        <HowItWorks />

        {/* Real-World Use Cases: Interactive Multi-Tab Scenarios */}
        <UseCasesSection />

        {/* Reliability, Telemetry & Feature Matrix */}
        <ReliabilitySection />

        {/* Conversion CTA */}
        <FinalCta />
      </main>

      {/* Comprehensive Footer */}
      <LandingFooter />
    </div>
  );
}
