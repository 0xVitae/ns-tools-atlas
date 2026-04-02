import { prepare, layout, type PreparedText } from "@chenglou/pretext";

// Match the font used in canvas labels: ~14.4px (Math.max(9, 80 * 0.18))
// Avoid system-ui per pretext docs — use concrete font names
const LABEL_FONT = '14.4px Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif';
const LABEL_FONT_BOLD = '600 14.4px Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif';
const LABEL_LINE_HEIGHT = 18;
const LABEL_MAX_WIDTH = 100; // displaySize + 20 = 100

// Cache prepared texts by name
const preparedCache = new Map<string, PreparedText>();

function getPrepared(name: string, bold = false): PreparedText {
  const key = `${bold ? "b:" : ""}${name}`;
  let p = preparedCache.get(key);
  if (!p) {
    p = prepare(name, bold ? LABEL_FONT_BOLD : LABEL_FONT);
    preparedCache.set(key, p);
  }
  return p;
}

export interface LabelMetrics {
  width: number;
  height: number;
  lineCount: number;
}

/**
 * Measure a project label at the default max width (100px).
 * Returns the height and line count the text would occupy.
 */
export function measureLabel(name: string, maxWidth = LABEL_MAX_WIDTH): LabelMetrics {
  const p = getPrepared(name);
  const result = layout(p, maxWidth, LABEL_LINE_HEIGHT);
  return {
    width: maxWidth,
    height: result.height,
    lineCount: result.lineCount,
  };
}

/**
 * Compute the cell height needed for a project, accounting for actual text wrapping.
 * Returns the total cell height: icon height + gap + label height.
 */
export function measureCellHeight(name: string, maxLabelWidth = LABEL_MAX_WIDTH): number {
  const iconHeight = 80 * 0.72; // 57.6px
  const gap = 4; // mt-1
  const { height: labelHeight } = measureLabel(name, maxLabelWidth);
  return iconHeight + gap + labelHeight;
}

/**
 * Compute optimal cell dimensions for a set of projects.
 * Returns a uniform cell size that accommodates the tallest label.
 */
export function measureCellDimensions(
  projectNames: string[],
  labelMaxWidth = LABEL_MAX_WIDTH,
): { cellWidth: number; cellHeight: number } {
  let maxCellHeight = 0;
  for (const name of projectNames) {
    const h = measureCellHeight(name, labelMaxWidth);
    if (h > maxCellHeight) maxCellHeight = h;
  }
  // Add padding around the cell
  const cellWidth = labelMaxWidth + 15; // label is wider than icon
  const cellHeight = Math.max(105, Math.ceil(maxCellHeight) + 12);
  return { cellWidth, cellHeight };
}

export { LABEL_FONT, LABEL_FONT_BOLD, LABEL_LINE_HEIGHT, LABEL_MAX_WIDTH };
