import { COLORS, heart, regionBeyond, wordmark, type Curve, type Point } from "../livery.ts";
import type { WrapModel } from "./types.ts";

// Template layout (1024x1024, front of the car at the top):
// - Front bumper across the top, hood below it in the center.
// - Each side is unfolded outward from the roof: the left column is the
//   driver side, the right column the passenger side. Within a column the
//   car's front is up, the rocker panel faces the outer edge and the
//   beltline faces the center.
// - Roof rails run down the middle beside the (unpainted) glass roof, ending
//   at the D-pillars, with the liftgate and rear bumper at the bottom.

/** The template's left and right halves mirror around x = MIRROR_X / 2. */
const MIRROR_X = 1019;

/** Where the stripes fan out from: the rocker, near the front of the rear door. */
const TIP: Point = [74, 610];

const sweep = (p1: Point, p2: Point, p3: Point): Curve => [TIP, p1, p2, p3];

// Fill toward the rocker and the rear of the car.
const behind = (start: Point, end: Point): Point[] => [
  [end[0], 1100],
  [-100, 1100],
  [-100, start[1]],
];
// Fill toward the rocker only.
const below = (start: Point, end: Point): Point[] => [
  [-100, end[1]],
  [-100, start[1]],
];

/**
 * The rear-fuselage swoosh on the driver side, painted front to back. Like on
 * the 737, every stripe fans out of one point low on the body: the yellow
 * and red sweep up to the beltline, while the trailing silver and blue run
 * low to the rear bumper, leaving a red wedge that fills the top of the rear
 * quarter like the tail fin.
 */
const SWOOSH: [Curve, string, typeof behind][] = [
  [sweep([96, 665], [165, 760], [340, 805]), COLORS.summitSilver, behind],
  [sweep([94, 671], [165, 770], [340, 817]), COLORS.sunriseYellow, behind],
  [sweep([89, 699], [165, 827], [340, 874]), COLORS.summitSilver, behind],
  [sweep([87, 705], [165, 837], [340, 886]), COLORS.warmRed, behind],
  [sweep([82, 725], [118, 885], [175, 1100]), COLORS.summitSilver, below],
  [sweep([80, 731], [111, 891], [168, 1100]), COLORS.boldBlue, below],
];

function driverSide(): string {
  return (
    `<g clip-path="url(#side)">` +
    SWOOSH.map(([curve, fill, around]) => regionBeyond(curve, fill, around)).join("") +
    `</g>` +
    // D-pillar: the swoosh carries on over the top of the car into the red.
    `<rect x="296" y="811" width="66" height="160" fill="${COLORS.warmRed}"/>` +
    `<rect x="296" y="811" width="66" height="34" fill="${COLORS.summitSilver}"/>` +
    `<rect x="296" y="811" width="66" height="28" fill="${COLORS.sunriseYellow}"/>` +
    `<rect x="296" y="811" width="66" height="7" fill="${COLORS.summitSilver}"/>` +
    // Mirror caps in tail red.
    `<path fill="${COLORS.warmRed}" d="M266 386 L288 362 L338 362 L347 402 L316 412 L286 408 Z"/>`
  );
}

function rear(): string {
  return (
    // The liftgate carries the red of the tail fin...
    `<rect x="350" y="866" width="320" height="68" fill="${COLORS.warmRed}"/>` +
    // ...and the rear bumper stays blue below a silver separator.
    `<rect x="390" y="934" width="246" height="10" fill="${COLORS.summitSilver}"/>`
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
    rear() +
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
