"use client";

import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";
import { type CubPose, SabreCub } from "./sabre-cub";

const CUB_WIDTH = 120;
const CUB_HEIGHT = 94;
const EDGE_MARGIN = 12;
/** Keeps the cub clear of the prompt input docked at the bottom. */
const BOTTOM_SAFE_ZONE = 140;
const SPEED_PX_PER_SECOND = 70;
const MIN_PAUSE_MS = 1600;
const MAX_PAUSE_MS = 4500;
const JUMP_DURATION_MS = 700;
/** Chance of a playful hop while resting between walks. */
const HOP_CHANCE = 0.35;

type Point = { x: number; y: number };

function randomBetween(min: number, max: number) {
  return min + Math.random() * (max - min);
}

/**
 * Roams a playful, animated cub inside its nearest positioned ancestor.
 * Mount it inside the chat pane so it never wanders over the sidebar.
 */
export function RoamingMascot({ className }: { className?: string }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [position, setPosition] = useState<Point | null>(null);
  const [transitionMs, setTransitionMs] = useState(0);
  const [isFacingLeft, setIsFacingLeft] = useState(false);
  const [pose, setPose] = useState<CubPose>("idle");
  const [isJumping, setIsJumping] = useState(false);
  const positionRef = useRef<Point>({ x: 0, y: 0 });
  const timersRef = useRef<ReturnType<typeof setTimeout>[]>([]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const schedule = (fn: () => void, ms: number) => {
      timersRef.current.push(setTimeout(fn, ms));
    };

    const bounds = () => ({
      maxX: Math.max(EDGE_MARGIN, container.clientWidth - CUB_WIDTH - EDGE_MARGIN),
      maxY: Math.max(EDGE_MARGIN, container.clientHeight - CUB_HEIGHT - BOTTOM_SAFE_ZONE),
    });

    const start: Point = { x: bounds().maxX - EDGE_MARGIN * 2, y: bounds().maxY };
    positionRef.current = start;
    setPosition(start);

    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const doJump = () => {
      setIsJumping(true);
      schedule(() => setIsJumping(false), JUMP_DURATION_MS);
    };

    const roam = () => {
      const { maxX, maxY } = bounds();
      const target: Point = {
        x: randomBetween(EDGE_MARGIN, maxX),
        y: randomBetween(EDGE_MARGIN, maxY),
      };
      const from = positionRef.current;
      const distance = Math.hypot(target.x - from.x, target.y - from.y);
      const duration = Math.max(900, (distance / SPEED_PX_PER_SECOND) * 1000);

      setIsFacingLeft(target.x < from.x);
      setTransitionMs(duration);
      setPose("walking");
      setPosition(target);
      positionRef.current = target;

      schedule(() => {
        setPose("idle");
        const pause = randomBetween(MIN_PAUSE_MS, MAX_PAUSE_MS);
        if (Math.random() < HOP_CHANCE) {
          schedule(doJump, pause * 0.4);
        }
        schedule(roam, pause);
      }, duration);
    };

    schedule(roam, 1400);

    return () => {
      for (const timer of timersRef.current) clearTimeout(timer);
      timersRef.current = [];
    };
  }, []);

  const handleJump = () => {
    if (isJumping) return;
    setIsJumping(true);
    timersRef.current.push(setTimeout(() => setIsJumping(false), JUMP_DURATION_MS));
  };

  return (
    <div
      aria-hidden
      className={cn("pointer-events-none absolute inset-0 z-30 overflow-hidden", className)}
      ref={containerRef}
    >
      {position && (
        <div
          className="absolute top-0 left-0 transition-transform ease-in-out will-change-transform"
          style={{
            transform: `translate(${position.x}px, ${position.y}px)`,
            transitionDuration: `${transitionMs}ms`,
          }}
        >
          <button
            className="pointer-events-auto block cursor-pointer"
            onClick={handleJump}
            tabIndex={-1}
            type="button"
          >
            <div
              style={{
                animation: isJumping ? `mascot-jump ${JUMP_DURATION_MS}ms ease-in-out` : undefined,
              }}
            >
              <div
                className={cn("transition-transform duration-300", isFacingLeft && "-scale-x-100")}
              >
                <SabreCub className="w-[120px] drop-shadow-md" pose={pose} />
              </div>
            </div>
          </button>
        </div>
      )}
    </div>
  );
}
