import Link from "next/link";

import { FlowPilotWordmark } from "./FlowPilotWordmark";

const PRODUCT_LINKS = [
  { label: "How it works", href: "#how-it-works" },
  { label: "Features", href: "#features" },
  { label: "Templates", href: "#templates" },
  { label: "Integrations", href: "#integrations" },
];

const ACCOUNT_LINKS = [
  { label: "Create an account", href: "/register" },
  { label: "Sign in", href: "/login" },
];

const CREATOR_LINKS = [
  { label: "GitHub", href: "https://github.com/boopathiraja26" },
  { label: "LinkedIn", href: "https://linkedin.com/in/boopathi-raja-306523392" },
];

export function LandingFooter() {
  return (
    <footer className="border-t border-ui-border bg-ui-surface text-ui-secondary">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 sm:py-14 lg:px-8">
        <div className="grid gap-10 border-b border-ui-divider pb-10 sm:grid-cols-2 lg:grid-cols-[1.6fr_1fr_1fr_1fr]">
          <div className="max-w-sm">
            <Link href="/" className="inline-flex rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ui-focus" aria-label="FlowPilot home">
              <FlowPilotWordmark theme="dark" size="md" />
            </Link>
            <p className="mt-4 text-sm leading-6 text-ui-secondary">
              Design workflows that connect configured triggers, AI, email, HTTP requests, and execution history.
            </p>
          </div>

          <FooterColumn heading="Explore" links={PRODUCT_LINKS} />
          <FooterColumn heading="Account" links={ACCOUNT_LINKS} />
          <FooterColumn heading="Creator" links={CREATOR_LINKS} external />
        </div>

        <div className="flex flex-col gap-3 pt-5 text-[11px] text-ui-muted sm:flex-row sm:items-center sm:justify-between">
          <span>© {new Date().getFullYear()} FlowPilot</span>
          <span>Visual workflow automation, with every run in view.</span>
        </div>
      </div>
    </footer>
  );
}

function FooterColumn({
  heading,
  links,
  external = false,
}: {
  heading: string;
  links: { label: string; href: string }[];
  external?: boolean;
}) {
  return (
    <nav aria-label={heading}>
      <h2 className="text-[11px] font-semibold uppercase tracking-[0.14em] text-ui-primary">{heading}</h2>
      <ul className="mt-4 space-y-3">
        {links.map((link) => (
          <li key={link.label}>
            {external ? (
              <a
                href={link.href}
                target="_blank"
                rel="noreferrer"
                className="text-xs transition-colors hover:text-ui-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ui-focus"
              >
                {link.label}
              </a>
            ) : link.href.startsWith("#") ? (
              <a
                href={link.href}
                className="text-xs transition-colors hover:text-ui-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ui-focus"
              >
                {link.label}
              </a>
            ) : (
              <Link
                href={link.href}
                className="text-xs transition-colors hover:text-ui-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ui-focus"
              >
                {link.label}
              </Link>
            )}
          </li>
        ))}
      </ul>
    </nav>
  );
}
