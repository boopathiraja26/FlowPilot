import { LandingNavbar } from "@/components/landing/LandingNavbar";
import { HeroSection } from "@/components/landing/HeroSection";
import { AutomationJourney } from "@/components/landing/AutomationJourney";
import { CoreCapabilities } from "@/components/landing/CoreCapabilities";
import { TemplateLibrarySection } from "@/components/landing/TemplateLibrarySection";
import { IntegrationsSection } from "@/components/landing/IntegrationsSection";
import { FaqSection } from "@/components/landing/FaqSection";
import { FinalCta } from "@/components/landing/FinalCta";
import { LandingFooter } from "@/components/landing/LandingFooter";

export default function LandingPage() {
  return (
    <div className="landing-page relative flex min-h-screen flex-col overflow-x-clip bg-ui-bg font-sans text-ui-primary">
      <LandingNavbar />
      <main className="flex-1">
        <HeroSection />
        <AutomationJourney />
        <CoreCapabilities />
        <TemplateLibrarySection />
        <IntegrationsSection />
        <FaqSection />
        <FinalCta />
      </main>
      <LandingFooter />
    </div>
  );
}
