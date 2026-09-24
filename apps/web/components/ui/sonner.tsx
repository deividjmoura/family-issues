"use client";

import { Toaster as Sonner, type ToasterProps } from "sonner";

/** Toast do shadcn (Sonner). Disparar com `import { toast } from "sonner"`. */
const Toaster = ({ ...props }: ToasterProps) => {
  return (
    <Sonner
      className="toaster group"
      style={
        {
          "--normal-bg": "var(--popover)",
          "--normal-text": "var(--popover-foreground)",
          "--normal-border": "var(--border)",
        } as React.CSSProperties
      }
      {...props}
    />
  );
};

export { Toaster };
