"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronRight } from "lucide-react";
import { useMemo } from "react";

function formatSegment(segment: string): string {
  if (segment === "dashboard") return "Dashboard";
  if (segment === "workflows") return "Workflows";
  if (segment === "executions") return "Executions";
  if (segment === "new") return "New workflow";

  if (/^[0-9a-f-]{8,}$/i.test(segment)) {
    return `#${segment.slice(0, 8)}`;
  }

  return segment
    .replace(/[-_]+/g, " ")
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

export function Breadcrumbs() {
  const pathname = usePathname();

  const crumbs = useMemo(() => {
    const segments = (pathname || "/").split("/").filter(Boolean);
    const dashboardIndex = segments.indexOf("dashboard");
    const relevant =
      dashboardIndex >= 0 ? segments.slice(dashboardIndex) : segments;

    const items = relevant.map((segment, index) => {
      const href = "/" + relevant.slice(0, index + 1).join("/");
      return {
        label: formatSegment(segment),
        href,
        isLast: index === relevant.length - 1,
      };
    });

    if (items.length === 0) {
      return [{ label: "Dashboard", href: "/dashboard", isLast: true }];
    }

    // If we're at /dashboard (redirects) or want a clear root, keep as-is.
    return items;
  }, [pathname]);

  return (
    <nav aria-label="Breadcrumb" className="min-w-0">
      <ol className="flex items-center gap-1.5 text-xs sm:text-sm">
        {crumbs.map((crumb, index) => (
          <li key={crumb.href} className="flex min-w-0 items-center gap-1.5">
            {index > 0 && (
              <ChevronRight className="h-3.5 w-3.5 shrink-0 text-slate-300" aria-hidden="true" />
            )}
            {crumb.isLast ? (
              <span
                className="truncate font-medium text-slate-900"
                aria-current="page"
                title={crumb.label}
              >
                {crumb.label}
              </span>
            ) : (
              <Link
                href={crumb.href}
                className="truncate text-slate-500 transition-colors hover:text-slate-900"
                title={crumb.label}
              >
                {crumb.label}
              </Link>
            )}
          </li>
        ))}
      </ol>
    </nav>
  );
}