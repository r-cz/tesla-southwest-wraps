import { HEART_BANDS, HEART_BOX, HEART_OUTLINE_PATH, WORDMARK_BOX, WORDMARK_PATH } from "./southwest-logo.ts";

/**
 * Southwest "Heart" livery palette (2014–present). Bold Blue covers the whole
 * fuselage; the tail and rear-fuselage swoosh are Sunrise Yellow, Warm Red and
 * Bold Blue, each separated by a thin Summit Silver stripe.
 */
export const COLORS = {
  boldBlue: "#304CB2",
  warmRed: "#E61C23",
  sunriseYellow: "#FFBF27",
  summitSilver: "#CCCCCC",
  white: "#FFFFFF",
} as const;

export type Point = readonly [x: number, y: number];

/** A cubic Bézier curve: start, two control points, end. */
export type Curve = readonly [Point, Point, Point, Point];

const fmt = (n: number) => Number(n.toFixed(2)).toString();
const pt = ([x, y]: Point) => `${fmt(x)} ${fmt(y)}`;

/** Gradients used by {@link heart}. Include once in the SVG `<defs>`. */
export function heartDefs(): string {
  return HEART_BANDS.map(
    ({ id, gradient: g, stops }) =>
      `<linearGradient id="${id}" gradientUnits="userSpaceOnUse" x1="${g.x1}" y1="${g.y1}" x2="${g.x2}" y2="${g.y2}">` +
      stops.map(([offset, color]) => `<stop offset="${offset}" stop-color="${color}"/>`).join("") +
      `</linearGradient>`,
  ).join("");
}

interface Placement {
  /** Center of the mark in template pixels. */
  cx: number;
  cy: number;
  /** Clockwise rotation in degrees. 0 is upright. */
  rotate?: number;
}

/** The "Southwest" title, scaled so it spans `length` pixels. */
export function wordmark({
  cx,
  cy,
  rotate = 0,
  length,
  fill = COLORS.white,
}: Placement & { length: number; fill?: string }): string {
  const scale = length / WORDMARK_BOX.width;
  const ox = WORDMARK_BOX.x + WORDMARK_BOX.width / 2;
  const oy = WORDMARK_BOX.y + WORDMARK_BOX.height / 2;
  return `<path fill="${fill}" d="${WORDMARK_PATH}" transform="translate(${fmt(cx)} ${fmt(cy)}) rotate(${fmt(rotate)}) scale(${fmt(scale)}) translate(${fmt(-ox)} ${fmt(-oy)})"/>`;
}

/** The tri-color heart with its silver outline, scaled to `size` pixels wide. */
export function heart({ cx, cy, rotate = 0, size }: Placement & { size: number }): string {
  const scale = size / HEART_BOX.width;
  const ox = HEART_BOX.x + HEART_BOX.width / 2;
  const oy = HEART_BOX.y + HEART_BOX.height / 2;
  return (
    `<g transform="translate(${fmt(cx)} ${fmt(cy)}) rotate(${fmt(rotate)}) scale(${fmt(scale)}) translate(${fmt(-ox)} ${fmt(-oy)})">` +
    `<path fill="${COLORS.summitSilver}" d="${HEART_OUTLINE_PATH}"/>` +
    HEART_BANDS.map(({ id, path }) => `<path fill="url(#${id})" d="${path}"/>`).join("") +
    `</g>`
  );
}

/**
 * Fills everything on one side of `curve` with `fill`. The curve is extended
 * straight out of both ends by `reach` pixels, then the shape is closed
 * through the `around` points, which should sit well outside the panels on
 * the side to be filled. Painting successive curves on top of each other
 * builds up the livery's swoosh of stripes.
 */
export function regionBeyond(
  curve: Curve,
  fill: string,
  around: (start: Point, end: Point) => Point[],
  reach = 400,
): string {
  const [p0, p1, p2, p3] = curve;
  const extend = (from: Point, toward: Point): Point => {
    const dx = from[0] - toward[0];
    const dy = from[1] - toward[1];
    const len = Math.hypot(dx, dy) || 1;
    return [from[0] + (dx / len) * reach, from[1] + (dy / len) * reach];
  };
  const start = extend(p0, p1);
  const end = extend(p3, p2);
  const close = around(start, end)
    .map((p) => ` L${pt(p)}`)
    .join("");
  return `<path fill="${fill}" d="M${pt(start)} L${pt(p0)} C${pt(p1)} ${pt(p2)} ${pt(p3)} L${pt(end)}${close} Z"/>`;
}
