import type { ReactNode } from "react";
import type { AppNotification } from "@/lib/actions/notifications";
import { SideMenu } from "@/components/layout/side-menu";

export function AppHeader({
  title,
  subtitle,
  badge,
  notifications = [],
  createLabel = "Nova missão",
}: {
  title: string;
  subtitle?: ReactNode;
  badge?: string;
  notifications?: AppNotification[];
  createLabel?: string;
}) {
  return (
    <header className="flex flex-wrap items-start justify-between gap-3 border-b border-border pb-5">
      <div className="min-w-0 flex-1 space-y-1">
        {badge && (
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            {badge}
          </p>
        )}
        <h1 className="truncate text-2xl font-bold tracking-tight sm:text-3xl">
          {title}
        </h1>
        {subtitle && (
          <div className="text-sm text-muted-foreground">{subtitle}</div>
        )}
      </div>
      <SideMenu notifications={notifications} createLabel={createLabel} />
    </header>
  );
}
