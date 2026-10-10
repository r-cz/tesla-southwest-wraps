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

/** A stripe's color and its width in template pixels. */
export type Stripe = [fill: string, width: number];

/**
 * The tail stripes as they cross the 737's rear fuselage, front to back:
 * yellow and red bands of equal width, outlined by silver pinstripes.
 */
export function tailStripes(band: number, pinstripe: number): Stripe[] {
  return [
    [COLORS.summitSilver, pinstripe],
    [COLORS.sunriseYellow, band],
    [COLORS.summitSilver, pinstripe],
    [COLORS.warmRed, band],
    [COLORS.summitSilver, pinstripe],
  ];
}

const bezier = ([p0, p1, p2, p3]: Curve, t: number): Point => {
  const u = 1 - t;
  const [a, b, c, d] = [u * u * u, 3 * u * u * t, 3 * u * t * t, t * t * t];
  return [a * p0[0] + b * p1[0] + c * p2[0] + d * p3[0], a * p0[1] + b * p1[1] + c * p2[1] + d * p3[1]];
};

const tangent = ([p0, p1, p2, p3]: Curve, t: number): Point => {
  const u = 1 - t;
  const [a, b, c] = [u * u, 2 * u * t, t * t];
  const dx = a * (p1[0] - p0[0]) + b * (p2[0] - p1[0]) + c * (p3[0] - p2[0]);
  const dy = a * (p1[1] - p0[1]) + b * (p2[1] - p1[1]) + c * (p3[1] - p2[1]);
  const len = Math.hypot(dx, dy) || 1;
  return [dx / len, dy / len];
};

const smoothstep = (x: number) => {
  const t = Math.min(Math.max(x, 0), 1);
  return t * t * (3 - 2 * t);
};

export interface RibbonOptions {
  /**
   * How far along `edge` (0–1) the ribbon reaches full width. It tapers from
   * a point at the start of the curve up to there. 0 means no taper.
   */
  fullAt?: number;
  /**
   * Points that close each band's fill, given where the extended edge starts
   * and ends. They should sit well outside the panels, on the side the
   * stripes stack toward.
   */
  around: (start: Point, end: Point) => Point[];
}

/**
 * Paints `stripes` as a ribbon that follows `edge`. The first stripe starts
 * on the curve and the rest stack beside it, to the right of the direction
 * of travel, keeping their widths around bends. The ribbon runs straight on
 * past both ends of the curve so it leaves the panels cleanly. Bands are
 * painted one over another, finishing with the body color past the last.
 */
export function ribbon(edge: Curve, stripes: Stripe[], { fullAt = 0, around }: RibbonOptions): string {
  const steps = 96;
  const reach = 400;
  const boundary = (offset: number): Point[] => {
    const points: Point[] = [];
    for (let i = 0; i <= steps; i++) {
      const t = i / steps;
      const [x, y] = bezier(edge, t);
      const [tx, ty] = tangent(edge, t);
      const w = offset * (fullAt > 0 ? smoothstep(t / fullAt) : 1);
      points.push([x - ty * w, y + tx * w]);
    }
    const [sx, sy] = tangent(edge, 0);
    const [ex, ey] = tangent(edge, 1);
    const first = points[0]!;
    const last = points[steps]!;
    const start: Point = [first[0] - sx * reach, first[1] - sy * reach];
    const end: Point = [last[0] + ex * reach, last[1] + ey * reach];
    return [start, ...points, end, ...around(start, end)];
  };
  const fill = (offset: number, color: string) =>
    `<path fill="${color}" d="M${boundary(offset)
      .map((p) => pt(p))
      .join(" L")} Z"/>`;

  let offset = 0;
  let svg = "";
  for (const [color, width] of stripes) {
    svg += fill(offset, color);
    offset += width;
  }
  return svg + fill(offset, COLORS.boldBlue);
}
