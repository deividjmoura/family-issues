import { signOut } from "@/lib/actions/auth";
import { Button } from "@/components/ui/button";
import type { ReactNode } from "react";

export function AppHeader({
  title,
  subtitle,
  badge,
}: {
  title: string;
  subtitle?: ReactNode;
  badge?: string;
}) {
  return (
    <header className="flex flex-wrap items-start justify-between gap-4 border-b border-border pb-6">
      <div className="space-y-1">
        {badge && (
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            {badge}
          </p>
        )}
        <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">{title}</h1>
        {subtitle && (
          <div className="text-sm text-muted-foreground">{subtitle}</div>
        )}
      </div>
      <form action={signOut}>
        <Button type="submit" variant="secondary" size="sm">
          Sair
        </Button>
      </form>
    </header>
  );
}
