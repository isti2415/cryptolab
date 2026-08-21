import { describe, expect, it } from 'vitest';
import {
  describeCells,
  describeGrid,
  describeLookup,
  inferUnit,
} from './describe';

describe('describeCells', () => {
  it('groups bits so they can be followed by ear', () => {
    expect(
      describeCells('Round key 1', '011010110011'.split(''), {
        groupEvery: 6,
        unit: 'bits',
      }),
    ).toBe('Round key 1, 12 bits: 011010 110011');
  });

  it('does not group when there is nothing to gain', () => {
    expect(describeCells('L', ['1', '0', '1'], { groupEvery: 6 })).toBe(
      'L, 3 values: 1 0 1',
    );
  });

  it('truncates a long run rather than reciting it', () => {
    const out = describeCells('block', Array(200).fill('1'), { max: 8 });
    expect(out).toContain('200 values');
    expect(out).toContain('and 192 more');
  });

  it('handles no label and no values', () => {
    expect(describeCells(undefined, [])).toBe('empty');
    expect(describeCells('x', ['7'])).toBe('x, 1 value: 7');
  });
});

describe('describeGrid', () => {
  it('reads a matrix row by row', () => {
    expect(describeGrid('K', [[3, 3], [2, 5]])).toBe(
      'K, 2 by 2 grid: row 1, 3 3; row 2, 2 5',
    );
  });

  it('uses supplied row labels', () => {
    expect(describeGrid('s', [[1, 2]], ['s₀'])).toContain('s₀, 1 2');
  });
});

describe('describeLookup', () => {
  it('states the coordinate and the value it yields', () => {
    expect(describeLookup('S', 'E', '3', '9A')).toBe(
      'S: row E, column 3, gives 9A',
    );
  });
});

describe('inferUnit', () => {
  it('calls bits bits, and hex hex', () => {
    expect(inferUnit(['0', '1', '1'])).toBe('bits');
    expect(inferUnit(['FD', '05', '8D'])).toBe('bytes');
    expect(inferUnit(['A', 'B', '3'])).toBe('hex digits');
    expect(inferUnit(['12', 'zz'])).toBe('values');
  });

  it('is singular for one cell', () => {
    expect(inferUnit(['1'])).toBe('bit');
    expect(inferUnit(['FD'])).toBe('byte');
  });

  it('does not mislabel hex digits as bits', () => {
    // The DES key-schedule regression: a row of hex nibbles announced as bits.
    expect(inferUnit('0123456789ABCDEF'.split(''))).toBe('hex digits');
  });
});
