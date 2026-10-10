import { COLORS, heart, ribbon, tailStripes, wordmark, type Curve, type Point } from "../livery.ts";
import type { WrapModel } from "./types.ts";

// Template layout (1024x1024, front of the car at the top):
// - Front bumper across the top, hood below it in the center.
// - Each side is unfolded outward from the roof: the left column is the
//   driver side, the right column the passenger side. Within a column the
//   car's front is up, the rocker panel faces the outer edge and the
//   beltline faces the center.
// - Roof rails run down the middle beside the (unpainted) glass roof, ending
//   at the D-pillars, with the liftgate and rear bumper at the bottom. On the
//   car the liftgate panel is the strip between the rear window and the
//   light bar, and its ends wrap around the corners above the tail lights.

/** The template's left and right halves mirror around x = MIRROR_X / 2. */
const MIRROR_X = 1019;

/**
 * Leading edge of the tail stripes on the driver side, like the stripes on
 * the 737 that start low on the fuselage and curve up into the tail. They
 * taper out of a point low on the doors, under the end of the title, run
 * back along the bottom of the rear door, then curve up over the rear wheel
 * to the window line.
 */
const SWOOP: Curve = [
  [96, 545],
  [92, 720],
  [150, 790],
  [300, 830],
];

// Fill toward the rocker and the rear of the car.
const behind = (start: Point, end: Point): Point[] => [
  [end[0], 1100],
  [-100, 1100],
  [-100, start[1]],
];

/**
 * Bottom edge of the liftgate panel, against the light bar, running from the
 * passenger side to the driver side so the stripes stack upward. It sags
 * toward the middle in the template but is straight on the car.
 */
const LIFTGATE_BOTTOM: Curve = [
  [690, 918],
  [570, 935],
  [450, 935],
  [330, 919],
];

// Fill up toward the rear window.
const above = (start: Point, end: Point): Point[] => [
  [end[0], 800],
  [start[0], 800],
];

function driverSide(): string {
  return (
    `<g clip-path="url(#side)">` +
    ribbon(SWOOP, tailStripes(40, 6), { fullAt: 0.55, around: behind }) +
    `</g>` +
    // Mirror caps in tail red.
    `<path fill="${COLORS.warmRed}" d="M266 386 L288 362 L338 362 L347 402 L316 412 L286 408 Z"/>`
  );
}

function liftgate(): string {
  // The side stripes wrap around the back above the light bar, red lowest
  // and yellow above it, in the order they reach the rear corners.
  return (
    `<g clip-path="url(#liftgate)">` + ribbon(LIFTGATE_BOTTOM, tailStripes(15, 3).reverse(), { around: above }) + `</g>`
  );
}

export const modelYPerformance2025: WrapModel = {
  id: "modely-2025-performance",
  name: "Model Y Performance (2025+)",
  width: 1024,
  height: 1024,
  design: () =>
    `<defs>` +
    `<clipPath id="side"><rect x="0" y="330" width="296" height="694"/></clipPath>` +
    `<clipPath id="liftgate"><rect x="353" y="860" width="314" height="75"/></clipPath>` +
    `</defs>` +
    `<rect width="1024" height="1024" fill="${COLORS.boldBlue}"/>` +
    // Driver side, then the same artwork mirrored onto the passenger side.
    driverSide() +
    `<g transform="matrix(-1 0 0 1 ${MIRROR_X} 0)">${driverSide()}</g>` +
    liftgate() +
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
