"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";

export function CopyInvite({ code }: { code: string }) {
  const [copied, setCopied] = useState(false);

  async function copy() {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // fallback
      const ta = document.createElement("textarea");
      ta.value = code;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand("copy");
      document.body.removeChild(ta);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }

  return (
    <span className="inline-flex items-center gap-2">
      <code className="rounded bg-muted px-1.5 py-0.5 font-mono text-foreground">
        {code}
      </code>
      <Button type="button" size="sm" variant="secondary" onClick={copy}>
        {copied ? "Copiado!" : "Copiar"}
      </Button>
    </span>
  );
}
