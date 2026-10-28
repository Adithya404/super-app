"use client";

import { cn } from "@/lib/utils";

export type CubPose = "idle" | "walking";

const FUR = "#EFE9DE";
const FUR_DARK = "#DFD6C4";
const BELLY = "#F8F4EB";
const STRIPE = "#8B7BD8";
const EAR_INNER = "#A78BFA";
const NOSE = "#8B5CF6";
const EYE = "#3D2E85";
const MOUTH = "#6D5BA8";
const BLUSH = "#C4B5FD";

interface SabreCubProps {
  pose?: CubPose;
  className?: string;
}

/**
 * Hand-drawn sabre-toothed tiger cub (side view, facing right) with
 * independently animated tail, legs, head, and blinking eyes.
 */
export function SabreCub({ pose = "idle", className }: SabreCubProps) {
  const isWalking = pose === "walking";

  const nearLegClass = cn(
    "origin-top [transform-box:fill-box]",
    isWalking && "[animation:cub-leg-swing_0.5s_ease-in-out_infinite]",
  );
  const farLegClass = cn(
    "origin-top [transform-box:fill-box]",
    isWalking && "[animation-delay:-0.25s] [animation:cub-leg-swing_0.5s_ease-in-out_infinite]",
  );

  return (
    <svg
      aria-hidden
      className={cn("mascot-animated block", className)}
      viewBox="0 0 140 110"
      xmlns="http://www.w3.org/2000/svg"
    >
      <title>Sabre the cub</title>

      {/* ground shadow */}
      <ellipse cx="72" cy="105" fill="#000" opacity="0.1" rx="38" ry="4.5" />

      {/* tail */}
      <g
        className={cn(
          "origin-bottom-right [transform-box:fill-box]",
          isWalking
            ? "[animation:cub-tail-wag_0.5s_ease-in-out_infinite]"
            : "[animation:cub-tail-wag_2.2s_ease-in-out_infinite]",
        )}
      >
        <path
          d="M 34 76 Q 12 72 14 46"
          fill="none"
          stroke={FUR}
          strokeLinecap="round"
          strokeWidth="9"
        />
        <path
          d="M 16.5 58 Q 15.2 53 15.6 49"
          fill="none"
          stroke={STRIPE}
          strokeLinecap="round"
          strokeWidth="9"
        />
        <circle cx="14.5" cy="46" fill={STRIPE} r="5.5" />
      </g>

      {/* far legs */}
      <rect className={farLegClass} fill={FUR_DARK} height="26" rx="5.5" width="11" x="40" y="76" />
      <rect className={farLegClass} fill={FUR_DARK} height="26" rx="5.5" width="11" x="74" y="76" />

      {/* body */}
      <g
        className={cn(
          "origin-bottom [transform-box:fill-box]",
          isWalking
            ? "[animation:cub-body-bob_0.25s_ease-in-out_infinite]"
            : "[animation:cub-breathe_3s_ease-in-out_infinite]",
        )}
      >
        <ellipse cx="66" cy="68" fill={FUR} rx="32" ry="24" />
        <ellipse cx="74" cy="76" fill={BELLY} rx="15" ry="12" />
        <path
          d="M 48 48 q 3 8 0 15"
          fill="none"
          stroke={STRIPE}
          strokeLinecap="round"
          strokeWidth="5"
        />
        <path
          d="M 60 45 q 3 9 0 17"
          fill="none"
          stroke={STRIPE}
          strokeLinecap="round"
          strokeWidth="5"
        />
        <path
          d="M 72 46 q 3 8 0 15"
          fill="none"
          stroke={STRIPE}
          strokeLinecap="round"
          strokeWidth="5"
        />
      </g>

      {/* near legs */}
      <rect className={nearLegClass} fill={FUR} height="26" rx="5.5" width="11" x="52" y="78" />
      <rect className={nearLegClass} fill={FUR} height="26" rx="5.5" width="11" x="86" y="78" />

      {/* head */}
      <g
        className={cn(
          "origin-bottom [transform-box:fill-box]",
          isWalking
            ? "[animation:cub-head-bob_0.5s_ease-in-out_infinite]"
            : "[animation:cub-head-bob_3s_ease-in-out_infinite]",
        )}
      >
        {/* ears */}
        <circle cx="122" cy="22" fill={FUR_DARK} r="9" />
        <circle cx="122" cy="22" fill={EAR_INNER} r="4.5" />
        <circle cx="90" cy="20" fill={FUR} r="10" />
        <circle cx="90" cy="20" fill={EAR_INNER} r="5" />

        <circle cx="106" cy="42" fill={FUR} r="26" />

        {/* hair tuft + forehead stripes */}
        <path d="M 101 17 q 4.5 -7 9 0 z" fill={FUR} />
        <path d="M 100 23 v 6" stroke={STRIPE} strokeLinecap="round" strokeWidth="3.5" />
        <path d="M 107 21 v 8" stroke={STRIPE} strokeLinecap="round" strokeWidth="3.5" />
        <path d="M 114 23 v 6" stroke={STRIPE} strokeLinecap="round" strokeWidth="3.5" />

        {/* eyes (blink) */}
        <g className="origin-center [animation:cub-blink_4.2s_linear_infinite] [transform-box:fill-box]">
          <ellipse cx="96" cy="42" fill={EYE} rx="5" ry="6.5" />
          <circle cx="97.6" cy="39.6" fill="#fff" r="1.8" />
          <circle cx="94.6" cy="44.2" fill="#fff" opacity="0.9" r="0.9" />
          <ellipse cx="116" cy="42" fill={EYE} rx="5" ry="6.5" />
          <circle cx="117.6" cy="39.6" fill="#fff" r="1.8" />
          <circle cx="114.6" cy="44.2" fill="#fff" opacity="0.9" r="0.9" />
        </g>

        {/* muzzle, nose, smile, fangs */}
        <ellipse cx="106" cy="56" fill={BELLY} rx="11" ry="8" />
        <path d="M 103 51.5 L 109 51.5 L 106 55.5 Z" fill={NOSE} />
        <path
          d="M 101.5 57.5 q 4.5 4 9 0"
          fill="none"
          stroke={MOUTH}
          strokeLinecap="round"
          strokeWidth="1.4"
        />
        <path d="M 99.5 58.8 L 101.8 65 L 104.2 59.6 Z" fill="#fff" />
        <path d="M 108 59.6 L 110.4 65 L 112.7 58.8 Z" fill="#fff" />

        {/* blush */}
        <circle cx="89" cy="52" fill={BLUSH} opacity="0.55" r="3.2" />
        <circle cx="123" cy="52" fill={BLUSH} opacity="0.55" r="3.2" />
      </g>
    </svg>
  );
}
