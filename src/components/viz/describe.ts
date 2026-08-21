/**
 * Turning a grid of cells into a sentence.
 *
 * The values a walkthrough shows — round key bytes, S-box coordinates, matrix
 * entries — were all present in the DOM, but as a bare run of one-character
 * spans. A screen reader read a DES round key as forty-eight separate
 * announcements of "1" and "0" with nothing to say which key it was or where in
 * it you had got to, which is worse than useless: it is unusable *and* it takes
 * a long time to sit through.
 *
 * So the cells become decorative (`aria-hidden`) and the container carries one
 * label built here instead. The grouping matters as much as the digits: bits
 * read back in bytes are followable, and forty-eight in a row are not.
 */

/**
 * What the cells actually are, from the cells themselves.
 *
 * `BitField` is used for bits in DES's key schedule and for hex nibbles and
 * bytes elsewhere, so a hardcoded "bits" would announce "8 bits: 0 1 2 3 4 5 6
 * 7" over a row of hex digits. Naming the unit wrongly in a teaching tool is
 * worse than not naming it.
 */
export function inferUnit(values: string[]): string {
  if (values.length === 0) return 'values';
  const every = (re: RegExp) => values.every((v) => re.test(v));
  if (every(/^[01]$/)) return values.length === 1 ? 'bit' : 'bits';
  if (every(/^[0-9a-fA-F]{2}$/)) return values.length === 1 ? 'byte' : 'bytes';
  if (every(/^[0-9a-fA-F]$/)) return values.length === 1 ? 'hex digit' : 'hex digits';
  return values.length === 1 ? 'value' : 'values';
}

/** Chunk `values` into groups of `groupEvery`, joined for speech. */
function grouped(values: string[], groupEvery?: number): string {
  if (!groupEvery || groupEvery < 2 || values.length <= groupEvery) {
    return values.join(' ');
  }
  const chunks: string[] = [];
  for (let i = 0; i < values.length; i += groupEvery) {
    chunks.push(values.slice(i, i + groupEvery).join(''));
  }
  return chunks.join(' ');
}

/**
 * A label for a row of cells, e.g.
 * `"Round key 1, 48 bits: 000110 110000 …"`.
 *
 * Long rows are truncated: past a point the reader wants the shape and the
 * first few values, not a recitation, and the full run is still on screen and
 * in the page for anyone who wants to walk it cell by cell.
 */
export function describeCells(
  label: string | undefined,
  values: string[],
  options: { groupEvery?: number; unit?: string; max?: number } = {},
): string {
  const { groupEvery, unit, max = 64 } = options;
  const name = label?.trim() ? `${label.trim()}, ` : '';
  const count = `${values.length} ${unit ?? (values.length === 1 ? 'value' : 'values')}`;
  if (values.length === 0) return `${name}empty`;
  const shown = values.slice(0, max);
  const body = grouped(shown, groupEvery);
  const more = values.length > max ? `, and ${values.length - max} more` : '';
  return `${name}${count}: ${body}${more}`;
}

/** Describes one cell being read out of a lookup table. */
export function describeLookup(
  corner: string | undefined,
  rowHeader: string,
  colHeader: string,
  value: string,
): string {
  const table = corner?.trim() ? `${corner.trim()}: ` : '';
  return `${table}row ${rowHeader}, column ${colHeader}, gives ${value}`;
}

/**
 * A label for a grid, read row by row:
 * `"K, 2 by 2 grid: row 1, 3 3; row 2, 2 5"`.
 */
export function describeGrid(
  label: string | undefined,
  rows: (string | number)[][],
  rowLabels?: string[],
): string {
  const name = label?.trim() ? `${label.trim()}, ` : '';
  if (rows.length === 0) return `${name}empty`;
  const shape = `${rows.length} by ${rows[0]?.length ?? 0} grid`;
  const body = rows
    .map((row, r) => `${rowLabels?.[r] ?? `row ${r + 1}`}, ${row.join(' ')}`)
    .join('; ');
  return `${name}${shape}: ${body}`;
}
