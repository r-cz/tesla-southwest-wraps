import { COLORS, heart, parallelStripes, tailStripes, wordmark, type Curve, type Point } from "../livery.ts";
import type { WrapModel } from "./types.ts";

// Template layout (1024x1024, front of the car at the top):
// - Front bumper across the top, hood below it in the center.
// - Each side is unfolded outward from the roof: the left column is the
//   driver side, the right column the passenger side. Within a column the
//   car's front is up, the rocker panel faces the outer edge and the
//   beltline faces the center.
// - Roof rails run down the middle beside the (unpainted) glass roof, ending
//   at the D-pillars, with the liftgate and rear bumper at the bottom. Those
//   stay Bold Blue, like the 737's tail cone.

/** The template's left and right halves mirror around x = MIRROR_X / 2. */
const MIRROR_X = 1019;

/**
 * Leading edge of the tail stripes on the driver side. It rises from the
 * rocker just behind the title, across the rear door and quarter panel, to
 * the window line at the back. It steepens slightly toward the top, like the
 * stripes rising into the 737's tail.
 */
const STRIPE_EDGE: Curve = [
  [40, 602],
  [100, 697],
  [190, 802],
  [300, 872],
];

// Fill toward the rocker and the rear of the car.
const behind = (start: Point, end: Point): Point[] => [
  [end[0], 1100],
  [-100, 1100],
  [-100, start[1]],
];

function driverSide(): string {
  return (
    `<g clip-path="url(#side)">` +
    parallelStripes(STRIPE_EDGE, tailStripes(56, 7), [0, 1], behind) +
    `</g>` +
    // Mirror caps in tail red.
    `<path fill="${COLORS.warmRed}" d="M266 386 L288 362 L338 362 L347 402 L316 412 L286 408 Z"/>`
  );
}

export const modelYPerformance2025: WrapModel = {
  id: "modely-2025-performance",
  name: "Model Y Performance (2025+)",
  width: 1024,
  height: 1024,
  design: () =>
    `<defs><clipPath id="side"><rect x="0" y="330" width="296" height="694"/></clipPath></defs>` +
    `<rect width="1024" height="1024" fill="${COLORS.boldBlue}"/>` +
    // Driver side, then the same artwork mirrored onto the passenger side.
    driverSide() +
    `<g transform="matrix(-1 0 0 1 ${MIRROR_X} 0)">${driverSide()}</g>` +
    // Titles read front-to-back on the driver side and back-to-front on the
    // passenger side, like on the aircraft. The ~6° tilt follows the doors.
    // Each is placed so the door gap runs through the middle of the "w" on
    // the driver side and the open "u" on the passenger side, instead of
    // clipping the thin "t".
    wordmark({ cx: 163, cy: 538, rotate: 95.5, length: 290 }) +
    wordmark({ cx: MIRROR_X - 163, cy: 511, rotate: -95.5, length: 290 }) +
    // The belly heart, moved up to the hood and upright when seen from the front.
    heart({ cx: 510, cy: 215, rotate: 180, size: 120 }),
};
