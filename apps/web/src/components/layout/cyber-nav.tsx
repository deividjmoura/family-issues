"use client";

import { useEffect, useState } from "react";

export function CyberNav({ title = "MISSION CONTROL" }: { title?: string }) {
  const [clock, setClock] = useState("00:00:00");

  useEffect(() => {
    function tick() {
      const now = new Date();
      setClock(
        [now.getHours(), now.getMinutes(), now.getSeconds()]
          .map((n) => String(n).padStart(2, "0"))
          .join(":"),
      );
    }
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);

  return (
    <div className="cyber-nav-wrap">
      <div className="cyber-nav">
        <span className="cyber-nav__title">{title}</span>
        <span className="cyber-nav__clock" suppressHydrationWarning>
          {clock}
        </span>
      </div>
      <div className="cyber-nav-bottom" aria-hidden />
    </div>
  );
}
