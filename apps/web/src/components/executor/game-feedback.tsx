"use client";

import { useEffect, useRef, useState } from "react";
import { sfx } from "@/lib/sounds";

export const GAME_MISSION_COMPLETE_EVENT = "family-game:mission-complete";

export function GameFeedback() {
  const [visible, setVisible] = useState(false);
  const [xp, setXp] = useState(0);
  const hideTimerRef = useRef<number | null>(null);

  useEffect(() => {
    const onComplete = (event: Event) => {
      const detail = (event as CustomEvent<{ xp?: number }>).detail;
      setXp(Math.max(1, detail?.xp ?? 1));
      setVisible(true);
      if (hideTimerRef.current) window.clearTimeout(hideTimerRef.current);
      hideTimerRef.current = window.setTimeout(() => {
        setVisible(false);
        hideTimerRef.current = null;
      }, 1500);
    };

    window.addEventListener(GAME_MISSION_COMPLETE_EVENT, onComplete);
    return () => {
      window.removeEventListener(GAME_MISSION_COMPLETE_EVENT, onComplete);
      if (hideTimerRef.current) window.clearTimeout(hideTimerRef.current);
    };
  }, []);

  if (!visible) return null;

  return (
    <div className="game-feedback" aria-live="polite">
      <div className="game-feedback__burst" aria-hidden>
        {Array.from({ length: 18 }, (_, i) => (
          <span key={i} className="game-feedback__particle" />
        ))}
      </div>
      <div className="game-feedback__card">
        <span className="game-feedback__icon" aria-hidden>✨</span>
        <strong>MISSÃO COMPLETA!</strong>
        <span className="game-feedback__xp">+{xp} XP</span>
      </div>
    </div>
  );
}
